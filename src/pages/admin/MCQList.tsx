import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, FileText, Brain, Target, Calendar, Filter, Download, RefreshCw, BookOpen, CheckCircle, Clock, TrendingUp, Upload, FileSpreadsheet, AlertCircle, X, Camera, ImageIcon, Trash, Tag as TagIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '../../services/api';
import { API_SERVER_URL } from '../../config/api';
import TagSelector from '../../components/tags/TagSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface MCQProblem {
  id: string;
  title: string;
  description: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_options: string[];
  explanation?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  tags?: Array<{ id: string; name: string; color: string }>;
  needs_tags?: boolean;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface ImportResult {
  total_rows: number;
  successful: number;
  failed: number;
  duplicates: number;
  errors: string[];
  created_problems: { 
    id: string; 
    title: string; 
    correct_options: string[];
    needs_tags?: boolean;
    tags?: number;
  }[];
}

const MCQList = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mcqs, setMcqs] = useState<MCQProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMcqs, setSelectedMcqs] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showImportResult, setShowImportResult] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [showNeedsTags, setShowNeedsTags] = useState(false);

  // Quick tag assignment modal state
  const [showQuickTagModal, setShowQuickTagModal] = useState(false);
  const [selectedMcqForTagging, setSelectedMcqForTagging] = useState<MCQProblem | null>(null);
  const [selectedTagsForAssignment, setSelectedTagsForAssignment] = useState<Tag[]>([]);
  const [savingTags, setSavingTags] = useState(false);

  useEffect(() => {
    loadMCQs();
  }, []);

  const loadMCQs = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMCQs(0, 1000, searchTerm || undefined, undefined, undefined, undefined, showNeedsTags || undefined) as MCQProblem[];
      setMcqs(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load MCQs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadMCQs();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, showNeedsTags]);

  const getCorrectOptionsCount = (correctOptions: string[]) => {
    return Array.isArray(correctOptions) ? correctOptions.length : 1;
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.deleteMCQ(id);
      toast({
        title: "Success",
        description: "MCQ deleted successfully"
      });
      loadMCQs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete MCQ",
        variant: "destructive"
      });
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await apiService.downloadMCQTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mcq_import_template_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "CSV template downloaded successfully"
      });
      
      // Show instructions after successful download
      setShowInstructions(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleBulkImport(file);
    }
  };

  const handleBulkImport = async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      toast({
        title: "Error",
        description: "Please select a CSV file (.csv)",
        variant: "destructive"
      });
      return;
    }

    try {
      setImporting(true);
      const result = await apiService.bulkImportMCQs(file) as ImportResult;
      setImportResult(result);
      setShowImportResult(true);
      
      if (result.successful > 0) {
        loadMCQs(); // Refresh the MCQ list
        toast({
          title: "Import Completed",
          description: `Successfully imported ${result.successful} questions${result.failed > 0 ? ` (${result.failed} failed)` : ''}`
        });
      } else {
        toast({
          title: "Import Failed",
          description: "No questions were imported. Please check the file format and data.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import questions",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleQuickImageUpload = async (mcqId: string, file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Please select a valid image file (JPG, PNG, or GIF)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingImage(mcqId);
      
      // Show uploading toast
      toast({
        title: "Uploading...",
        description: "Please wait while we upload your image",
      });
      
      await apiService.uploadMCQImage(mcqId, file);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
      
      // Refresh the list to show the new image
      loadMCQs();
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(null);
    }
  };

  const handleRemoveImage = async (mcqId: string) => {
    if (!confirm("Are you sure you want to remove this image?")) {
      return;
    }

    try {
      await apiService.removeMCQImage(mcqId);
      toast({
        title: "Success",
        description: "Image removed successfully"
      });
      loadMCQs(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove image",
        variant: "destructive"
      });
    }
  };

  // Quick tag assignment functions
  const handleQuickTagAssignment = (mcq: MCQProblem) => {
    setSelectedMcqForTagging(mcq);
    setSelectedTagsForAssignment(mcq.tags || []);
    setShowQuickTagModal(true);
  };

  const handleSaveQuickTags = async () => {
    if (!selectedMcqForTagging || selectedTagsForAssignment.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one tag.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSavingTags(true);
      
      const tagIds = selectedTagsForAssignment.map(tag => tag.id);
      
      await apiService.updateMCQ(selectedMcqForTagging.id, {
        tag_ids: tagIds
      });

      // Update the local state
      setMcqs(prevMcqs => 
        prevMcqs.map(mcq => 
          mcq.id === selectedMcqForTagging.id 
            ? { 
                ...mcq, 
                tags: selectedTagsForAssignment,
                needs_tags: false // Mark as no longer needing tags
              }
            : mcq
        )
      );

      setShowQuickTagModal(false);
      setSelectedMcqForTagging(null);
      setSelectedTagsForAssignment([]);

      toast({
        title: "Success",
        description: `Tags assigned to "${selectedMcqForTagging.title}" successfully!`,
      });
    } catch (error: any) {
      console.error('Error assigning tags:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign tags",
        variant: "destructive"
      });
    } finally {
      setSavingTags(false);
    }
  };

  const handleCloseQuickTagModal = () => {
    setShowQuickTagModal(false);
    setSelectedMcqForTagging(null);
    setSelectedTagsForAssignment([]);
  };

  const multipleAnswerQuestions = mcqs.filter(mcq => getCorrectOptionsCount(mcq.correct_options) > 1).length;
  const questionsWithImages = mcqs.filter(mcq => mcq.image_url && mcq.image_url.trim()).length;
  const questionsNeedingTags = mcqs.filter(mcq => mcq.needs_tags === true).length;
  const recentMcqs = mcqs.filter(mcq => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(mcq.created_at) > weekAgo;
  }).length;

  // Filter MCQs based on search and tag status
  const filteredMcqs = mcqs.filter(mcq => {
    const matchesSearch = !searchTerm || 
      mcq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mcq.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTagFilter = !showNeedsTags || mcq.needs_tags === true;
    
    return matchesSearch && matchesTagFilter;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 rounded-2xl p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="h-8 w-8" />
                  <h1 className="text-4xl font-bold">🧠 Question Bank</h1>
                </div>
                <p className="text-green-100 text-lg mb-4">
                  Manage your MCQ library and build comprehensive assessments
                </p>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <FileText className="h-3 w-3 mr-1" />
                    {mcqs.length} Total Questions
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {recentMcqs} Added This Week
                  </Badge>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                  <Brain className="h-16 w-16 text-green-200" />
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        </div>

        {/* Tag Assignment Reminder Banner */}
        {questionsNeedingTags > 0 && !showNeedsTags && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-900">
                      {questionsNeedingTags} question{questionsNeedingTags > 1 ? 's' : ''} need{questionsNeedingTags === 1 ? 's' : ''} tag assignment
                    </p>
                    <p className="text-sm text-red-700">
                      Questions without tags cannot be used in contests. Click "Need Tags Only" to assign tags.
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowNeedsTags(true)}
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Show Questions Needing Tags
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate('/admin/tags')}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Manage Tags
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Questions</p>
                  <p className="text-3xl font-bold text-gray-900">{mcqs.length}</p>
                  <p className="text-xs text-gray-500">Available in bank</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Multiple Choice</p>
                  <p className="text-3xl font-bold text-green-600">{multipleAnswerQuestions}</p>
                  <p className="text-xs text-gray-500">Multi-answer questions</p>
                </div>
                <div className="p-3 rounded-xl bg-green-50">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Recent Additions</p>
                  <p className="text-3xl font-bold text-purple-600">{recentMcqs}</p>
                  <p className="text-xs text-gray-500">Added this week</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Need Tags</p>
                  <p className="text-3xl font-bold text-red-600">
                    {questionsNeedingTags}
                  </p>
                  <p className="text-xs text-gray-500">Require tag assignment</p>
                </div>
                <div className="p-3 rounded-xl bg-red-50">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Question Bank Management */}
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">📚 Question Library</CardTitle>
                <p className="text-gray-600 text-sm mt-1">Manage and organize your MCQ questions</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  onClick={loadMCQs}
                  className="hover:bg-blue-50 hover:border-blue-300"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="hover:bg-green-50 hover:border-green-300"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Download CSV Template
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="hover:bg-purple-50 hover:border-purple-300"
                >
                  {importing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Bulk Import
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => navigate('/admin/mcq/create')} 
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Enhanced Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search questions by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <Button
                variant={showNeedsTags ? "default" : "outline"}
                onClick={() => setShowNeedsTags(!showNeedsTags)}
                className={`h-11 ${showNeedsTags ? 'bg-red-600 hover:bg-red-700 text-white' : 'hover:bg-red-50 hover:border-red-300 text-red-600'}`}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                {showNeedsTags ? 'Show All' : 'Need Tags Only'}
                {questionsNeedingTags > 0 && !showNeedsTags && (
                  <Badge className="ml-2 bg-red-100 text-red-800 border-red-200">
                    {questionsNeedingTags}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between mb-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  Showing {filteredMcqs.length} of {mcqs.length} questions
                  {showNeedsTags && (
                    <span className="text-red-600 ml-1">(needing tags only)</span>
                  )}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {showNeedsTags && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowNeedsTags(false)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-100"
                  >
                    Show all questions
                  </Button>
                )}
                {searchTerm && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSearchTerm('')}
                    className="text-green-600 hover:text-green-700 hover:bg-green-100"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            </div>

            {filteredMcqs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Brain className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-3">
                  {searchTerm ? 'No questions found' : 'No questions yet'}
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {searchTerm 
                    ? 'Try adjusting your search terms to find what you\'re looking for.' 
                    : 'Start building your question bank by creating your first MCQ question.'
                  }
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => navigate('/admin/mcq/create')}
                    className="px-6 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Question
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold">Question</TableHead>
                      <TableHead className="font-semibold">Image</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Created</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMcqs.map((mcq) => {
                      const correctOptionsCount = getCorrectOptionsCount(mcq.correct_options);
                      const hasExplanation = mcq.explanation && mcq.explanation.trim();
                      
                      return (
                        <TableRow key={mcq.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-start space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-semibold text-sm">Q</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-medium text-gray-900 truncate">{mcq.title}</h4>
                                  <p className="text-sm text-gray-600 line-clamp-2">{mcq.description}</p>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <Badge variant="outline" className="text-xs">
                                      ID: {mcq.id.slice(0, 8)}...
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {mcq.image_url ? (
                                <div className="flex items-center space-x-2">
                                  <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                                    <img 
                                      src={mcq.image_url.startsWith('http') ? mcq.image_url : `${API_SERVER_URL}${mcq.image_url}`} 
                                      alt={mcq.title} 
                                      className="w-full h-full object-cover" 
                                    />
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRemoveImage(mcq.id)}
                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                    <input
                                    id={`image-upload-${mcq.id}`}
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                      console.log('File selected:', file);
                                        if (file) {
                                        console.log('Starting upload for MCQ:', mcq.id);
                                          handleQuickImageUpload(mcq.id, file);
                                        // Reset the input value to allow uploading the same file again
                                        e.target.value = '';
                                        }
                                      }}
                                      disabled={uploadingImage === mcq.id}
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                                      disabled={uploadingImage === mcq.id}
                                    onClick={() => {
                                      const input = document.getElementById(`image-upload-${mcq.id}`) as HTMLInputElement;
                                      input?.click();
                                    }}
                                    >
                                      {uploadingImage === mcq.id ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                                      ) : (
                                        <Camera className="h-3 w-3" />
                                      )}
                                    </Button>
                                  <span className="text-xs text-gray-500">No image</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge 
                                className={`${
                                  correctOptionsCount > 1 
                                    ? 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 hover:border-purple-300' 
                                    : 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 hover:border-blue-300'
                                } border font-medium transition-colors cursor-default`}
                              >
                                {correctOptionsCount > 1 ? 'Multi-Choice' : 'Single Choice'}
                              </Badge>
                              <div className="text-xs text-gray-500">
                                {correctOptionsCount} correct option{correctOptionsCount > 1 ? 's' : ''}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center text-gray-900">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(mcq.created_at).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(mcq.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {mcq.needs_tags ? (
                                <Button
                                  variant="ghost"
                                  className="h-auto p-0 hover:bg-transparent"
                                  onClick={() => handleQuickTagAssignment(mcq)}
                                  title="Click to assign tags"
                                >
                                  <Badge 
                                    className="bg-red-100 text-red-800 border-red-200 border font-medium hover:bg-red-200 cursor-pointer transition-colors"
                                  >
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Needs Tags
                                  </Badge>
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  className="h-auto p-0 hover:bg-transparent"
                                  onClick={() => handleQuickTagAssignment(mcq)}
                                  title="Click to manage tags"
                                >
                                  <Badge 
                                    className="bg-green-100 text-green-800 border-green-200 border font-medium hover:bg-green-200 hover:border-green-300 transition-colors cursor-pointer"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </Badge>
                                </Button>
                              )}
                              {hasExplanation && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <BookOpen className="h-3 w-3 mr-1" />
                                  Has explanation
                                </div>
                              )}
                              {mcq.tags && mcq.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {mcq.tags.slice(0, 2).map((tag) => (
                                    <Button
                                      key={tag.id}
                                      variant="ghost"
                                      className="h-auto p-0 hover:bg-transparent"
                                      onClick={() => handleQuickTagAssignment(mcq)}
                                      title="Click to manage tags"
                                    >
                                      <Badge
                                        style={{ backgroundColor: tag.color, color: 'white' }}
                                        className="text-xs text-white hover:opacity-80 transition-opacity cursor-pointer"
                                      >
                                        {tag.name}
                                      </Badge>
                                    </Button>
                                  ))}
                                  {mcq.tags.length > 2 && (
                                    <Button
                                      variant="ghost"
                                      className="h-auto p-0 hover:bg-transparent"
                                      onClick={() => handleQuickTagAssignment(mcq)}
                                      title="Click to manage all tags"
                                    >
                                      <Badge variant="outline" className="text-xs hover:bg-gray-100 transition-colors cursor-pointer">
                                        +{mcq.tags.length - 2}
                                      </Badge>
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/admin/mcq/edit/${mcq.id}`)}
                                className="hover:bg-blue-50 hover:border-blue-300"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(mcq.id, mcq.title)}
                                className="hover:bg-red-50 hover:border-red-300 text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Import Results Modal */}
        {showImportResult && importResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-green-50 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-3">
                    {importResult.successful > 0 ? (
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    ) : (
                      <div className="p-2 bg-red-100 rounded-full">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      </div>
                    )}
                    <div>
                      <span className="text-xl font-bold">Import Results</span>
                      <p className="text-sm text-gray-600 font-normal mt-1">
                        {importResult.successful > 0 
                          ? `Successfully processed ${importResult.successful} out of ${importResult.total_rows} questions`
                          : `Import failed - ${importResult.failed} errors found`
                        }
                      </p>
                    </div>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowImportResult(false)}
                    className="hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-0 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Summary Statistics */}
                <div className="p-6 border-b bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                      <div className="text-3xl font-bold text-blue-600 mb-1">{importResult.total_rows}</div>
                      <div className="text-sm text-blue-800 font-medium">Total Rows Processed</div>
                      <div className="text-xs text-gray-500 mt-1">From CSV file</div>
                  </div>
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                      <div className="text-3xl font-bold text-green-600 mb-1">{importResult.successful}</div>
                      <div className="text-sm text-green-800 font-medium">Successfully Imported</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {importResult.total_rows > 0 ? `${Math.round((importResult.successful / importResult.total_rows) * 100)}% success rate` : '0% success rate'}
                  </div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                      <div className="text-3xl font-bold text-amber-600 mb-1">{importResult.duplicates || 0}</div>
                      <div className="text-sm text-amber-800 font-medium">Duplicates Skipped</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {importResult.duplicates > 0 ? 'Already exist in database' : 'No duplicates found'}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                      <div className="text-3xl font-bold text-red-600 mb-1">{importResult.failed}</div>
                      <div className="text-sm text-red-800 font-medium">Failed to Import</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {importResult.failed > 0 ? 'See errors below' : 'No errors'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Successfully Created Questions */}
                {importResult.created_problems.length > 0 && (
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-green-800 flex items-center">
                        <div className="p-1 bg-green-100 rounded-full mr-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        Successfully Imported Questions
                        <Badge className="ml-3 bg-green-100 text-green-800">
                          {importResult.created_problems.length} questions
                        </Badge>
                    </h3>
                      <div className="text-sm text-gray-500">
                        All questions need tags before use in contests
                      </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg border border-green-200">
                      <div className="max-h-64 overflow-y-auto">
                        <div className="divide-y divide-green-200">
                      {importResult.created_problems.map((problem, index) => (
                            <div key={problem.id} className="p-4 hover:bg-green-100 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Badge variant="outline" className="text-xs bg-white">
                                      #{index + 1}
                                    </Badge>
                                    <span className="text-sm font-medium text-green-900 truncate">
                                      {problem.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-4 text-xs text-green-700">
                                    <span className="flex items-center">
                                      <span className="font-medium">Correct Answer(s):</span>
                                      <Badge className="ml-1 bg-green-200 text-green-800 text-xs">
                            {problem.correct_options.join(', ')}
                          </Badge>
                                    </span>
                                    <span className="flex items-center">
                                      <AlertCircle className="h-3 w-3 mr-1 text-amber-500" />
                                      Needs Tags
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                  <Badge 
                                    variant={problem.correct_options.length > 1 ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {problem.correct_options.length > 1 ? 'Multi-Answer' : 'Single Answer'}
                                  </Badge>
                                </div>
                              </div>
                        </div>
                      ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Errors Section */}
                {importResult.errors.length > 0 && (
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-red-800 flex items-center">
                        <div className="p-1 bg-red-100 rounded-full mr-3">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        </div>
                        Import Errors
                        <Badge className="ml-3 bg-red-100 text-red-800">
                          {importResult.errors.length} errors
                        </Badge>
                    </h3>
                      <div className="text-sm text-gray-500">
                        Fix these issues and re-import
                      </div>
                    </div>
                    
                    <div className="bg-red-50 rounded-lg border border-red-200">
                      <div className="max-h-64 overflow-y-auto">
                        <div className="divide-y divide-red-200">
                      {importResult.errors.map((error, index) => (
                            <div key={index} className="p-4 hover:bg-red-100 transition-colors">
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-red-800">
                                      {index + 1}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-red-800 font-medium break-words">
                                    {error}
                                  </p>
                                  {error.includes('Row') && (
                                    <p className="text-xs text-red-600 mt-1">
                                      Check your CSV file for this specific row and fix the issue
                                    </p>
                                  )}
                                </div>
                              </div>
                        </div>
                      ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Steps and Instructions */}
                <div className="p-6">
                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                      <div className="p-1 bg-blue-100 rounded-full mr-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      Next Steps & Important Information
                    </h4>
                    <div className="space-y-3 text-sm text-blue-700">
                      {importResult.successful > 0 && (
                        <div className="bg-blue-100 rounded p-3">
                          <p className="font-medium text-blue-800 mb-2">✅ Successfully Imported Questions:</p>
                          <ul className="space-y-1 ml-4">
                            <li>• {importResult.successful} questions are now in your question bank</li>
                            <li>• All imported questions are marked as "Needs Tags"</li>
                            <li>• Use the "Need Tags Only" filter to find and tag these questions</li>
                  </ul>
                        </div>
                      )}

                      {importResult.duplicates > 0 && (
                        <div className="bg-amber-100 rounded p-3">
                          <p className="font-medium text-amber-800 mb-2">🔄 Duplicate Questions Detected:</p>
                          <ul className="space-y-1 ml-4 text-amber-700">
                            <li>• {importResult.duplicates} questions were skipped as they already exist</li>
                            <li>• Duplicates are detected by matching title, description, and all options</li>
                            <li>• This prevents creating identical questions in your database</li>
                            <li>• Only unique questions are imported to maintain data integrity</li>
                          </ul>
                        </div>
                      )}
                      
                      <div className="bg-blue-100 rounded p-3">
                        <p className="font-medium text-blue-800 mb-2">⚠️ Important Requirements:</p>
                        <ul className="space-y-1 ml-4 text-blue-700">
                          <li>• Questions <strong>MUST have tags</strong> before they can be used in contests</li>
                          <li>• Untagged questions will not appear in contest question selection</li>
                          <li>• Assign relevant tags to categorize and organize your questions</li>
                        </ul>
                      </div>

                      {importResult.errors.length > 0 && (
                        <div className="bg-red-100 rounded p-3">
                          <p className="font-medium text-red-800 mb-2">❌ Fix Errors and Re-import:</p>
                          <ul className="space-y-1 ml-4 text-red-700">
                            <li>• Review the error messages above</li>
                            <li>• Fix issues in your CSV file</li>
                            <li>• Re-upload the corrected file</li>
                            <li>• Only failed rows need to be re-imported</li>
                          </ul>
                        </div>
                      )}

                      <div className="bg-green-100 rounded p-3">
                        <p className="font-medium text-green-800 mb-2">🎯 Quick Actions:</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setShowImportResult(false);
                              setShowNeedsTags(true);
                            }}
                            className="bg-white hover:bg-green-50 border-green-300 text-green-700"
                          >
                            View Questions Needing Tags
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate('/admin/tags')}
                            className="bg-white hover:bg-blue-50 border-blue-300 text-blue-700"
                          >
                            Manage Tags
                          </Button>
                          {importResult.errors.length > 0 && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={handleDownloadTemplate}
                              className="bg-white hover:bg-purple-50 border-purple-300 text-purple-700"
                            >
                              Download Template
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t flex justify-end">
                  <Button 
                    onClick={() => setShowImportResult(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CSV Instructions Modal */}
        {showInstructions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <CardHeader className="border-b bg-gradient-to-r from-green-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <span>CSV Import Instructions</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInstructions(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Step-by-step instructions */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                      How to Use the CSV Template
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                        <div>
                          <p className="font-medium text-blue-900">Open the downloaded CSV file</p>
                          <p className="text-sm text-blue-700">The file contains sample questions to show the expected format</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                        <div>
                          <p className="font-medium text-green-900">Replace sample data with your questions</p>
                          <p className="text-sm text-green-700">Keep the column headers unchanged</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                        <div>
                          <p className="font-medium text-purple-900">Save and upload the file</p>
                          <p className="text-sm text-purple-700">Use the "Bulk Import" button to upload your completed file</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Requirements
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• <strong>Title:</strong> Question title (required)</li>
                      <li>• <strong>Description:</strong> Question text (required)</li>
                      <li>• <strong>Options:</strong> All four options A, B, C, D must be provided</li>
                      <li>• <strong>Correct Options:</strong> Use A, B, C, or D. For multiple answers, use "A,C" format</li>
                      <li>• <strong>Explanation:</strong> Optional detailed explanation</li>
                      <li>• <strong>Tags:</strong> Not required during import - but questions MUST have tags to be used in contests</li>
                    </ul>
                  </div>

                  {/* Tips */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">💡 Tips for Success</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Remove all sample data before adding your questions</li>
                      <li>• Each row represents one question</li>
                      <li>• For multiple correct answers, separate with commas: "A,C"</li>
                      <li>• Use quotes around text with commas: "Which are fruits, apples or oranges?"</li>
                      <li>• Questions with same titles will be treated as duplicates</li>
                    </ul>
                  </div>

                  {/* Sample format */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">📋 Expected Format</h4>
                    <div className="bg-white p-3 rounded border font-mono text-sm overflow-x-auto">
                      <div className="font-bold border-b pb-1 mb-2">title,description,option_a,option_b,option_c,option_d,correct_options,explanation</div>
                      <div>What is 2+2?,Basic math,3,4,5,6,B,Simple addition</div>
                      <div>Prime numbers,Select all primes,2,4,5,6,"A,C",Prime numbers are...</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Tag Assignment Modal */}
        {showQuickTagModal && selectedMcqForTagging && (
          <Dialog open={showQuickTagModal} onOpenChange={handleCloseQuickTagModal}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <TagIcon className="h-5 w-5 text-blue-600" />
                  Assign Tags to Question
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Question Preview */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{selectedMcqForTagging.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{selectedMcqForTagging.description}</p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      ID: {selectedMcqForTagging.id.slice(0, 8)}...
                    </Badge>
                  </div>
                </div>

                {/* Tag Selector */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Select Tags <span className="text-red-500">*</span>
                  </Label>
                  <TagSelector
                    selectedTags={selectedTagsForAssignment}
                    onTagsChange={setSelectedTagsForAssignment}
                    placeholder="Search and select tags for this question..."
                    required={true}
                    maxTags={10}
                    allowCreate={true}
                  />
                  <p className="text-xs text-gray-500">
                    Questions must have at least one tag to be used in contests.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleCloseQuickTagModal}
                  disabled={savingTags}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveQuickTags}
                  disabled={savingTags || selectedTagsForAssignment.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {savingTags ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <TagIcon className="h-4 w-4 mr-2" />
                      Assign Tags
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
};

export default MCQList;
