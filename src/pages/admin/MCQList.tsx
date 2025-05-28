import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, FileText, Brain, Target, Calendar, Filter, Download, RefreshCw, BookOpen, CheckCircle, Clock, TrendingUp, Upload, FileSpreadsheet, AlertCircle, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '../../services/api';

interface MCQProblem {
  id: string;
  title: string;
  description: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_options: string;
  explanation?: string;
  created_at: string;
  updated_at: string;
}

interface ImportResult {
  total_rows: number;
  successful: number;
  failed: number;
  errors: string[];
  created_problems: { id: string; title: string; correct_options: string[] }[];
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

  useEffect(() => {
    loadMCQs();
  }, []);

  const loadMCQs = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMCQs(0, 1000, searchTerm || undefined) as MCQProblem[];
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
  }, [searchTerm]);

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

  const filteredMcqs = mcqs.filter(mcq =>
    mcq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mcq.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recentMcqs = mcqs.filter(mcq => {
    const createdDate = new Date(mcq.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdDate > weekAgo;
  }).length;

  const getCorrectOptionsCount = (correctOptions: string) => {
    try {
      return JSON.parse(correctOptions).length;
    } catch {
      return 1;
    }
  };

  const multipleAnswerQuestions = mcqs.filter(mcq => getCorrectOptionsCount(mcq.correct_options) > 1).length;

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
                  <p className="text-sm font-medium text-gray-600 mb-1">With Explanations</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {mcqs.filter(mcq => mcq.explanation && mcq.explanation.trim()).length}
                  </p>
                  <p className="text-xs text-gray-500">Have explanations</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-50">
                  <Target className="h-6 w-6 text-orange-600" />
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
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between mb-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  Showing {filteredMcqs.length} of {mcqs.length} questions
                </span>
              </div>
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
                            <div className="space-y-1">
                              <Badge 
                                className={`${
                                  correctOptionsCount > 1 
                                    ? 'bg-purple-100 text-purple-800 border-purple-200' 
                                    : 'bg-blue-100 text-blue-800 border-blue-200'
                                } border font-medium`}
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
                              <Badge 
                                className="bg-green-100 text-green-800 border-green-200 border font-medium"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                              {hasExplanation && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <BookOpen className="h-3 w-3 mr-1" />
                                  Has explanation
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

        {/* Import Results Modal */}
        {showImportResult && importResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    {importResult.successful > 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span>Import Results</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowImportResult(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{importResult.total_rows}</div>
                    <div className="text-sm text-blue-800">Total Rows</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{importResult.successful}</div>
                    <div className="text-sm text-green-800">Successful</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                    <div className="text-sm text-red-800">Failed</div>
                  </div>
                </div>

                {/* Successfully Created Questions */}
                {importResult.created_problems.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Successfully Created Questions ({importResult.created_problems.length})
                    </h3>
                    <div className="bg-green-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                      {importResult.created_problems.map((problem, index) => (
                        <div key={problem.id} className="flex items-center justify-between py-2 border-b border-green-200 last:border-b-0">
                          <span className="text-green-800 truncate">{problem.title}</span>
                          <Badge className="bg-green-100 text-green-800">
                            {problem.correct_options.join(', ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {importResult.errors.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Errors ({importResult.errors.length})
                    </h3>
                    <div className="bg-red-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="py-2 border-b border-red-200 last:border-b-0">
                          <span className="text-red-800 text-sm">{error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instructions for next steps */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Next Steps:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Successfully imported questions are now available in your question bank</li>
                    <li>• Review and fix any errors in your CSV file before re-importing</li>
                    <li>• You can now use these questions in contests and assessments</li>
                  </ul>
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
      </div>
    </Layout>
  );
};

export default MCQList;
