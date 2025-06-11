import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Trash2, FileText, Brain, Target, Calendar, Filter, Download, RefreshCw, BookOpen, CheckCircle, Clock, TrendingUp, Upload, FileSpreadsheet, AlertCircle, X, Camera, ImageIcon, Trash, Tag as TagIcon, MessageSquare, AlignLeft, List, HelpCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService, QuestionType, ScoringType, QuestionResponse } from '../../services/api';
import { API_SERVER_URL } from '../../config/api';
import TagSelector from '../../components/tags/TagSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

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
  errors: string[];
  created_problems: { id: string; title: string; correct_options?: string[] }[];
}

const QuestionList = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showImportResult, setShowImportResult] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [showNeedsTags, setShowNeedsTags] = useState(false);
  const [questionTypeFilter, setQuestionTypeFilter] = useState<QuestionType | 'all'>('all');

  // Quick tag assignment modal state
  const [showQuickTagModal, setShowQuickTagModal] = useState(false);
  const [selectedQuestionForTagging, setSelectedQuestionForTagging] = useState<QuestionResponse | null>(null);
  const [selectedTagsForAssignment, setSelectedTagsForAssignment] = useState<Tag[]>([]);
  const [savingTags, setSavingTags] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const typeFilter = questionTypeFilter === 'all' ? undefined : questionTypeFilter;
      const data = await apiService.getQuestions(
        0, 
        1000, 
        searchTerm || undefined, 
        undefined, 
        undefined, 
        undefined, 
        showNeedsTags || undefined, 
        typeFilter
      ) as QuestionResponse[];
      setQuestions(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadQuestions();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, showNeedsTags, questionTypeFilter]);

  const getCorrectOptionsCount = (correctOptions: string[]) => {
    return Array.isArray(correctOptions) ? correctOptions.length : 1;
  };

  const getQuestionTypeDisplay = (questionType: QuestionType) => {
    switch (questionType) {
      case QuestionType.MCQ:
        return { label: 'MCQ', icon: CheckCircle, color: 'bg-blue-100 text-blue-800' };
      case QuestionType.LONG_ANSWER:
        return { label: 'Long Answer', icon: MessageSquare, color: 'bg-green-100 text-green-800' };
      default:
        return { label: 'Unknown', icon: HelpCircle, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getScoringTypeDisplay = (scoringType?: ScoringType) => {
    if (!scoringType) return null;
    
    switch (scoringType) {
      case ScoringType.MANUAL:
        return { label: 'Manual', color: 'bg-yellow-100 text-yellow-800' };
      case ScoringType.KEYWORD_BASED:
        return { label: 'Keyword', color: 'bg-purple-100 text-purple-800' };
      case ScoringType.AUTO:
        return { label: 'Auto', color: 'bg-green-100 text-green-800' };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.deleteQuestion(id);
      toast({
        title: "Success",
        description: "Question deleted successfully"
      });
      loadQuestions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete question",
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
      link.setAttribute('download', `question_import_template_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "CSV template downloaded successfully"
      });
      
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
        loadQuestions(); // Refresh the question list
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

  const handleQuickImageUpload = async (questionId: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingImage(questionId);
      await apiService.uploadQuestionImage(questionId, file);
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
      loadQuestions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(null);
    }
  };

  const handleRemoveImage = async (questionId: string) => {
    if (!confirm('Are you sure you want to remove this image?')) {
      return;
    }

    try {
      await apiService.removeQuestionImage(questionId);
      toast({
        title: "Success",
        description: "Image removed successfully"
      });
      loadQuestions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove image",
        variant: "destructive"
      });
    }
  };

  const handleQuickTagAssignment = (question: QuestionResponse) => {
    setSelectedQuestionForTagging(question);
    setSelectedTagsForAssignment(question.tags || []);
    setShowQuickTagModal(true);
  };

  const handleSaveQuickTags = async () => {
    if (!selectedQuestionForTagging) return;

    try {
      setSavingTags(true);
      await apiService.updateQuestion(selectedQuestionForTagging.id, {
        tag_ids: selectedTagsForAssignment.map(tag => tag.id)
      });
      
      toast({
        title: "Success",
        description: "Tags updated successfully"
      });
      
      loadQuestions();
      handleCloseQuickTagModal();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tags",
        variant: "destructive"
      });
    } finally {
      setSavingTags(false);
    }
  };

  const handleCloseQuickTagModal = () => {
    setShowQuickTagModal(false);
    setSelectedQuestionForTagging(null);
    setSelectedTagsForAssignment([]);
  };

  const mcqQuestions = questions.filter(q => q.question_type === QuestionType.MCQ);
  const longAnswerQuestions = questions.filter(q => q.question_type === QuestionType.LONG_ANSWER);

  const renderQuestionRow = (question: QuestionResponse) => {
    const typeDisplay = getQuestionTypeDisplay(question.question_type);
    const scoringDisplay = getScoringTypeDisplay(question.scoring_type);
    const TypeIcon = typeDisplay.icon;

    return (
      <TableRow key={question.id} className="hover:bg-gray-50">
        <TableCell className="font-medium">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Badge className={typeDisplay.color}>
                <TypeIcon className="h-3 w-3 mr-1" />
                {typeDisplay.label}
              </Badge>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {question.title}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {question.description.length > 100 
                  ? `${question.description.substring(0, 100)}...` 
                  : question.description}
              </p>
            </div>
          </div>
        </TableCell>
        
        <TableCell>
          {question.question_type === QuestionType.MCQ ? (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {getCorrectOptionsCount(question.correct_options || [])} correct
              </Badge>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Max words:</span>
                <Badge variant="outline" className="text-xs">
                  {question.max_word_count || 'N/A'}
                </Badge>
              </div>
              {scoringDisplay && (
                <Badge className={`text-xs ${scoringDisplay.color}`}>
                  {scoringDisplay.label} scoring
                </Badge>
              )}
            </div>
          )}
        </TableCell>
        
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {question.tags && question.tags.length > 0 ? (
              question.tags.slice(0, 2).map((tag) => (
                <Badge 
                  key={tag.id} 
                  variant="secondary" 
                  className="text-xs"
                  style={{ 
                    backgroundColor: tag.color + '20', 
                    color: tag.color,
                    borderColor: tag.color + '40'
                  }}
                >
                  {tag.name}
                </Badge>
              ))
            ) : (
              <Badge variant="outline" className="text-xs text-gray-500">
                No tags
              </Badge>
            )}
            {question.tags && question.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{question.tags.length - 2}
              </Badge>
            )}
          </div>
        </TableCell>
        
        <TableCell>
          <div className="flex items-center space-x-2">
            {question.image_url && (
              <div className="relative group">
                <img
                  src={`${API_SERVER_URL}${question.image_url}`}
                  alt="Question"
                  className="w-8 h-8 object-cover rounded border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-1 -right-1 w-4 h-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveImage(question.id)}
                >
                  <X className="h-2 w-2" />
                </Button>
              </div>
            )}
            
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleQuickImageUpload(question.id, file);
              }}
              className="hidden"
              id={`image-upload-${question.id}`}
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById(`image-upload-${question.id}`)?.click()}
              disabled={uploadingImage === question.id}
            >
              {uploadingImage === question.id ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
              ) : (
                <Camera className="h-3 w-3" />
              )}
            </Button>
          </div>
        </TableCell>
        
        <TableCell>
          <span className="text-sm text-gray-500">
            {new Date(question.created_at).toLocaleDateString()}
          </span>
        </TableCell>
        
        <TableCell>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickTagAssignment(question)}
            >
              <TagIcon className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/questions/${question.id}/edit`)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(question.id, question.title)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <div className="p-3 bg-blue-100 rounded-xl mr-4">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
                Question Management
              </h1>
              <p className="text-gray-600 mt-1">Manage MCQ and Long Answer questions</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => navigate('/admin/questions/create')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Question
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Questions</p>
                    <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
                  </div>
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">MCQ Questions</p>
                    <p className="text-2xl font-bold text-blue-600">{mcqQuestions.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Long Answer</p>
                    <p className="text-2xl font-bold text-green-600">{longAnswerQuestions.length}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Need Tags</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {questions.filter(q => q.needs_tags).length}
                    </p>
                  </div>
                  <TagIcon className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search questions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  
                  <Select value={questionTypeFilter} onValueChange={(value) => setQuestionTypeFilter(value as QuestionType | 'all')}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="All question types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value={QuestionType.MCQ}>MCQ Only</SelectItem>
                      <SelectItem value={QuestionType.LONG_ANSWER}>Long Answer Only</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant={showNeedsTags ? "default" : "outline"}
                    onClick={() => setShowNeedsTags(!showNeedsTags)}
                    className="w-full sm:w-auto"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Need Tags
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleDownloadTemplate}
                    className="w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Template
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    className="w-full sm:w-auto"
                  >
                    {importing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                      </>
                    )}
                  </Button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <Button
                    variant="outline"
                    onClick={loadQuestions}
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions Table */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <List className="h-5 w-5 mr-2" />
                Questions ({questions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No questions found</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating your first question.</p>
                  <div className="mt-6">
                    <Button onClick={() => navigate('/admin/questions/create')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Question
                    </Button>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map(renderQuestionRow)}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Tag Assignment Modal */}
      <Dialog open={showQuickTagModal} onOpenChange={setShowQuickTagModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Tags</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Question</Label>
              <p className="text-sm text-gray-600 mt-1">
                {selectedQuestionForTagging?.title}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Tags</Label>
              <TagSelector
                selectedTags={selectedTagsForAssignment}
                onTagsChange={setSelectedTagsForAssignment}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCloseQuickTagModal}>
                Cancel
              </Button>
              <Button onClick={handleSaveQuickTags} disabled={savingTags}>
                {savingTags ? 'Saving...' : 'Save Tags'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Result Modal */}
      <Dialog open={showImportResult} onOpenChange={setShowImportResult}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Results</DialogTitle>
          </DialogHeader>
          {importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{importResult.total_rows}</p>
                  <p className="text-sm text-gray-600">Total Rows</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{importResult.successful}</p>
                  <p className="text-sm text-gray-600">Successful</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                  <p className="text-sm text-gray-600">Failed</p>
                </div>
              </div>
              
              {importResult.errors.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-red-600">Errors</Label>
                  <div className="mt-2 space-y-1">
                    {importResult.errors.slice(0, 5).map((error, index) => (
                      <p key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </p>
                    ))}
                    {importResult.errors.length > 5 && (
                      <p className="text-sm text-gray-500">
                        And {importResult.errors.length - 5} more errors...
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button onClick={() => setShowImportResult(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Instructions Modal */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>CSV Import Instructions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Template Format</h4>
              <p className="text-sm text-gray-600 mt-1">
                The CSV template contains the following columns for question import:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                <li><strong>title:</strong> Question title (required)</li>
                <li><strong>description:</strong> Question description (required)</li>
                <li><strong>question_type:</strong> Either "mcq" or "long_answer" (required)</li>
                <li><strong>option_a, option_b, option_c, option_d:</strong> Answer options (required for MCQ)</li>
                <li><strong>correct_options:</strong> Correct answer letters separated by commas (required for MCQ)</li>
                <li><strong>max_word_count:</strong> Maximum words for long answer (required for Long Answer)</li>
                <li><strong>scoring_type:</strong> "manual", "keyword_based", or "auto" (required for Long Answer)</li>
                <li><strong>sample_answer:</strong> Sample answer text (optional for Long Answer)</li>
                <li><strong>keywords_for_scoring:</strong> Keywords separated by commas (optional, for keyword scoring)</li>
                <li><strong>explanation:</strong> Answer explanation (optional)</li>
                <li><strong>tag_names:</strong> Tag names separated by commas (optional)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium">Important Notes</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                <li>All rows with missing required fields will be skipped</li>
                <li>For MCQ questions, correct_options should contain valid letters (A, B, C, D)</li>
                <li>For Long Answer questions, max_word_count must be a positive number</li>
                <li>Keywords for scoring should be separated by commas</li>
                <li>Tags will be created automatically if they don't exist</li>
                <li>Maximum file size: 10MB</li>
              </ul>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => setShowInstructions(false)}>
                Got it
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default QuestionList; 