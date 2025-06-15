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
import { Checkbox } from '@/components/ui/checkbox';
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
  duplicates: number;
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
  const [bulkDeleting, setBulkDeleting] = useState(false);
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

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuestions(questions.map(q => q.id));
    } else {
      setSelectedQuestions([]);
    }
  };

  const handleSelectQuestion = (questionId: string, checked: boolean) => {
    if (checked) {
      setSelectedQuestions(prev => [...prev, questionId]);
    } else {
      setSelectedQuestions(prev => prev.filter(id => id !== questionId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuestions.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select questions to delete",
        variant: "destructive"
      });
      return;
    }

    const selectedTitles = questions
      .filter(q => selectedQuestions.includes(q.id))
      .map(q => q.title)
      .slice(0, 3);
    
    const displayTitles = selectedTitles.join(', ') + 
      (selectedQuestions.length > 3 ? ` and ${selectedQuestions.length - 3} more` : '');

    if (!confirm(`Are you sure you want to delete ${selectedQuestions.length} question(s)?\n\n${displayTitles}\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      setBulkDeleting(true);
      
      // Delete questions in parallel for better performance
      const deletePromises = selectedQuestions.map(id => apiService.deleteQuestion(id));
      await Promise.all(deletePromises);
      
      toast({
        title: "Success",
        description: `Successfully deleted ${selectedQuestions.length} question(s)`
      });
      
      setSelectedQuestions([]);
      loadQuestions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete some questions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setBulkDeleting(false);
    }
  };

  const isAllSelected = questions.length > 0 && selectedQuestions.length === questions.length;
  const isIndeterminate = selectedQuestions.length > 0 && selectedQuestions.length < questions.length;

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

  const renderQuestionCard = (question: QuestionResponse) => {
    const typeDisplay = getQuestionTypeDisplay(question.question_type);
    const scoringDisplay = getScoringTypeDisplay(question.scoring_type);
    const TypeIcon = typeDisplay.icon;
    const isSelected = selectedQuestions.includes(question.id);

    return (
      <div 
        key={question.id}
        className={`group relative bg-white rounded-xl border transition-all duration-200 hover:shadow-lg hover:border-blue-200 ${
          isSelected ? 'border-blue-300 shadow-md bg-blue-50/30' : 'border-gray-200'
        }`}
      >
        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl"></div>
        )}

        <div className="p-6">
          <div className="flex items-start space-x-4">
            {/* Selection Checkbox */}
            <div className="flex-shrink-0 pt-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => handleSelectQuestion(question.id, checked as boolean)}
                className="border-2 border-gray-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
              />
            </div>

            {/* Question Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  {/* Question Header */}
                  <div className="flex items-center space-x-3 mb-2">
                    <Badge className={`${typeDisplay.color} shadow-sm border-0 font-medium`}>
                      <TypeIcon className="h-3 w-3 mr-1.5" />
                      {typeDisplay.label}
                    </Badge>
                    {question.needs_tags && (
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Needs Tags
                      </Badge>
                    )}
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(question.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Question Title & Description */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-900 transition-colors">
                    {question.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-4">
                    {question.description}
                  </p>
                </div>

                {/* Question Image */}
                <div className="flex-shrink-0 ml-4">
                  {question.image_url ? (
                    <div className="relative group/image">
                      <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 group-hover/image:border-blue-300 transition-colors">
                        <img
                          src={`${API_SERVER_URL}${question.image_url}`}
                          alt="Question"
                          className="w-16 h-16 object-cover group-hover/image:scale-110 transition-transform duration-200"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover/image:opacity-100 transition-opacity rounded-full shadow-lg"
                        onClick={() => handleRemoveImage(question.id)}
                        title="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Question Details Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  {/* Question Type Details */}
                  <div className="flex items-center space-x-2">
                    {question.question_type === QuestionType.MCQ ? (
                      <>
                        <div className="p-1.5 bg-emerald-100 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {getCorrectOptionsCount(question.correct_options || [])} Correct Answer{getCorrectOptionsCount(question.correct_options || []) > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-gray-500">Multiple Choice</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                          <MessageSquare className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Max {question.max_word_count || 'Unlimited'} Words
                          </p>
                          <p className="text-xs text-gray-500">
                            {scoringDisplay ? `${scoringDisplay.label} Scoring` : 'Long Answer'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex items-center space-x-2">
                    <TagIcon className="h-4 w-4 text-gray-400" />
                    <div className="flex flex-wrap gap-1">
                      {question.tags && question.tags.length > 0 ? (
                        <>
                          {question.tags.slice(0, 3).map((tag) => (
                            <Button
                              key={tag.id}
                              variant="ghost"
                              className="h-auto p-0 hover:bg-transparent"
                              onClick={() => handleQuickTagAssignment(question)}
                              title="Click to manage tags"
                            >
                              <Badge 
                                variant="secondary" 
                                className="text-xs hover:opacity-80 transition-opacity cursor-pointer"
                                style={{ 
                                  backgroundColor: tag.color + '20', 
                                  color: tag.color,
                                  borderColor: tag.color + '40'
                                }}
                              >
                                {tag.name}
                              </Badge>
                            </Button>
                          ))}
                          {question.tags.length > 3 && (
                            <Button
                              variant="ghost"
                              className="h-auto p-0 hover:bg-transparent"
                              onClick={() => handleQuickTagAssignment(question)}
                              title="Click to see all tags"
                            >
                              <Badge variant="outline" className="text-xs hover:bg-gray-100 transition-colors cursor-pointer">
                                +{question.tags.length - 3}
                              </Badge>
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => handleQuickTagAssignment(question)}
                          title="Click to assign tags"
                        >
                          <Badge 
                            variant="outline" 
                            className="text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer border-dashed"
                          >
                            <TagIcon className="h-3 w-3 mr-1" />
                            No tags
                          </Badge>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  {/* Image Upload */}
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
                    className="border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 rounded-lg transition-all duration-200"
                    title={question.image_url ? "Change image" : "Add image"}
                  >
                    {uploadingImage === question.id ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                    ) : (
                      <Camera className="h-3 w-3" />
                    )}
                  </Button>

                  {/* Tag Assignment */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickTagAssignment(question)}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 rounded-lg transition-all duration-200"
                    title="Assign Tags"
                  >
                    <TagIcon className="h-3 w-3" />
                  </Button>

                  {/* Edit */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/questions/${question.id}/edit`)}
                    className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-lg transition-all duration-200"
                    title="Edit Question"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced tabular row rendering
  const renderQuestionRow = (question: QuestionResponse) => {
    const typeDisplay = getQuestionTypeDisplay(question.question_type);
    const scoringDisplay = getScoringTypeDisplay(question.scoring_type);
    const TypeIcon = typeDisplay.icon;
    const isSelected = selectedQuestions.includes(question.id);

    return (
      <TableRow 
        key={question.id} 
        className={`group transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/20 border-b border-gray-100 ${
          isSelected ? 'bg-gradient-to-r from-blue-50/50 to-indigo-50/30 shadow-sm border-l-4 border-l-blue-500' : ''
        }`}
      >
        {/* Selection Column */}
        <TableCell className="w-12 pl-6 py-4">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => handleSelectQuestion(question.id, checked as boolean)}
            className="border-2 border-gray-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 transition-colors"
          />
        </TableCell>

        {/* Question Details Column */}
        <TableCell className="py-4">
          <div className="space-y-3">
            {/* Header with Type Badge and Status */}
            <div className="flex items-center space-x-3">
              <Badge className={`${typeDisplay.color} shadow-sm border-0 font-medium px-2 py-1`}>
                <TypeIcon className="h-3 w-3 mr-1.5" />
                {typeDisplay.label}
              </Badge>
              {question.needs_tags && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Needs Tags
                </Badge>
              )}
            </div>
            
            {/* Question Title */}
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-900 transition-colors leading-tight">
              {question.title}
            </h3>
            
            {/* Question Description */}
            <p className="text-sm text-gray-600 leading-relaxed">
              {question.description.length > 100 
                ? `${question.description.substring(0, 100)}...` 
                : question.description}
            </p>
          </div>
        </TableCell>
        
        {/* Type & Answers Column */}
        <TableCell className="py-4">
          <div className="space-y-3">
            {question.question_type === QuestionType.MCQ ? (
              <>
                {/* MCQ Details */}
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {getCorrectOptionsCount(question.correct_options || [])} Correct
                    </p>
                    <p className="text-xs text-emerald-600">
                      {getCorrectOptionsCount(question.correct_options || []) > 1 ? 'Multi-select' : 'Single-select'}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                  Multiple Choice
                </Badge>
              </>
            ) : (
              <>
                {/* Long Answer Details */}
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MessageSquare className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {question.max_word_count || 'Unlimited'} Words
                    </p>
                    <p className="text-xs text-purple-600">
                      {scoringDisplay ? `${scoringDisplay.label} Scoring` : 'Manual Review'}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                  Long Answer
                </Badge>
              </>
            )}
          </div>
        </TableCell>
        
        {/* Tags Column */}
        <TableCell className="py-4">
          <div className="space-y-2">
            {question.tags && question.tags.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {question.tags.slice(0, 3).map((tag) => (
                    <Button
                      key={tag.id}
                      variant="ghost"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => handleQuickTagAssignment(question)}
                      title="Click to manage tags"
                    >
                      <Badge 
                        variant="secondary" 
                        className="text-xs hover:opacity-80 transition-all duration-200 cursor-pointer hover:scale-105"
                        style={{ 
                          backgroundColor: tag.color + '20', 
                          color: tag.color,
                          borderColor: tag.color + '40'
                        }}
                      >
                        {tag.name}
                      </Badge>
                    </Button>
                  ))}
                  {question.tags.length > 3 && (
                    <Button
                      variant="ghost"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => handleQuickTagAssignment(question)}
                      title={`Click to see all ${question.tags.length} tags`}
                    >
                      <Badge 
                        variant="outline" 
                        className="text-xs hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        +{question.tags.length - 3}
                      </Badge>
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {question.tags.length} tag{question.tags.length > 1 ? 's' : ''} assigned
                </p>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="h-auto p-0 hover:bg-transparent w-full"
                  onClick={() => handleQuickTagAssignment(question)}
                  title="Click to assign tags"
                >
                  <Badge 
                    variant="outline" 
                    className="text-xs text-gray-500 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all duration-200 cursor-pointer border-dashed w-full justify-center"
                  >
                    <TagIcon className="h-3 w-3 mr-1" />
                    Assign Tags
                  </Badge>
                </Button>
                <p className="text-xs text-amber-600 font-medium">
                  Required for contests
                </p>
              </>
            )}
          </div>
        </TableCell>
        
        {/* Image Column */}
        <TableCell className="py-4">
          <div className="flex flex-col items-center space-y-2">
            {question.image_url ? (
              <div className="relative group/image">
                <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 group-hover/image:border-blue-300 transition-colors shadow-sm">
                  <img
                    src={`${API_SERVER_URL}${question.image_url}`}
                    alt="Question"
                    className="w-12 h-12 object-cover group-hover/image:scale-110 transition-transform duration-200"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-1 -right-1 w-5 h-5 p-0 opacity-0 group-hover/image:opacity-100 transition-opacity rounded-full shadow-lg"
                  onClick={() => handleRemoveImage(question.id)}
                  title="Remove image"
                >
                  <X className="h-2 w-2" />
                </Button>
              </div>
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center group-hover:border-blue-300 transition-colors">
                <ImageIcon className="h-5 w-5 text-gray-400" />
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
              className="border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 rounded-lg transition-all duration-200 text-xs px-2 py-1"
              title={question.image_url ? "Change image" : "Add image"}
            >
              {uploadingImage === question.id ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
              ) : (
                <Camera className="h-3 w-3" />
              )}
            </Button>
          </div>
        </TableCell>
        
        {/* Created Column */}
        <TableCell className="py-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <Clock className="h-3 w-3 text-gray-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {new Date(question.created_at).toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(question.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        </TableCell>
        
        {/* Actions Column */}
        <TableCell className="pr-6 py-4">
          <div className="flex items-center justify-center space-x-2 opacity-60 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickTagAssignment(question)}
                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md"
                title="Assign Tags"
              >
                <TagIcon className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/questions/${question.id}/edit`)}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md"
                title="Edit Question"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Enhanced Header Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 -translate-x-32"></div>
            
            <div className="relative p-8 lg:p-12">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
                    <div className="relative p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                      <Brain className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
                      Question Bank
                    </h1>
                    <p className="text-blue-100 text-lg">
                      Create, manage, and organize your question library
                    </p>
                    <div className="flex items-center space-x-4 mt-3">
                      <div className="flex items-center space-x-2 text-blue-100">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm">Live Updates</span>
                      </div>
                      <div className="flex items-center space-x-2 text-blue-100">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">Last updated: {new Date().toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={() => navigate('/admin/questions/create')}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Question
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/admin/tags')}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm transition-all duration-300"
                    size="lg"
                  >
                    <TagIcon className="h-5 w-5 mr-2" />
                    Manage Tags
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 mb-1">Total Questions</p>
                    <p className="text-3xl font-bold text-blue-900 mb-2">{questions.length}</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300"></div>
                    <div className="relative p-3 bg-blue-600 rounded-full group-hover:scale-110 transition-transform duration-300">
                      <Brain className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="group bg-gradient-to-br from-emerald-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-700 mb-1">MCQ Questions</p>
                    <p className="text-3xl font-bold text-emerald-900 mb-2">{mcqQuestions.length}</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-emerald-200 rounded-full h-2">
                        <div 
                          className="bg-emerald-600 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${questions.length > 0 ? (mcqQuestions.length / questions.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-emerald-600 font-medium">
                        {questions.length > 0 ? Math.round((mcqQuestions.length / questions.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-600/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300"></div>
                    <div className="relative p-3 bg-emerald-600 rounded-full group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="group bg-gradient-to-br from-purple-50 to-violet-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700 mb-1">Long Answer</p>
                    <p className="text-3xl font-bold text-purple-900 mb-2">{longAnswerQuestions.length}</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-purple-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${questions.length > 0 ? (longAnswerQuestions.length / questions.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-purple-600 font-medium">
                        {questions.length > 0 ? Math.round((longAnswerQuestions.length / questions.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-600/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300"></div>
                    <div className="relative p-3 bg-purple-600 rounded-full group-hover:scale-110 transition-transform duration-300">
                      <MessageSquare className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="group bg-gradient-to-br from-amber-50 to-orange-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-700 mb-1">Need Tags</p>
                    <p className="text-3xl font-bold text-amber-900 mb-2">
                      {questions.filter(q => q.needs_tags).length}
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-amber-200 rounded-full h-2">
                        <div 
                          className="bg-amber-600 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${questions.length > 0 ? (questions.filter(q => q.needs_tags).length / questions.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-amber-600 font-medium">
                        {questions.length > 0 ? Math.round((questions.filter(q => q.needs_tags).length / questions.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-amber-600/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300"></div>
                    <div className="relative p-3 bg-amber-600 rounded-full group-hover:scale-110 transition-transform duration-300">
                      <TagIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Filters and Search */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Search and Quick Actions */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        placeholder="Search questions by title, description, or content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-4 py-3 w-full sm:w-80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-sm bg-gray-50/50 focus:bg-white transition-all duration-200"
                      />
                      {searchTerm && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchTerm('')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    <Select value={questionTypeFilter} onValueChange={(value) => setQuestionTypeFilter(value as QuestionType | 'all')}>
                      <SelectTrigger className="w-full sm:w-52 border-gray-200 focus:border-blue-500 rounded-xl bg-gray-50/50 focus:bg-white transition-all duration-200">
                        <SelectValue placeholder="All question types" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-0 shadow-xl">
                        <SelectItem value="all" className="rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span>All Types</span>
                          </div>
                        </SelectItem>
                        <SelectItem value={QuestionType.MCQ} className="rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span>MCQ Only</span>
                          </div>
                        </SelectItem>
                        <SelectItem value={QuestionType.LONG_ANSWER} className="rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span>Long Answer Only</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant={showNeedsTags ? "default" : "outline"}
                      onClick={() => setShowNeedsTags(!showNeedsTags)}
                      className={`w-full sm:w-auto rounded-xl transition-all duration-200 ${
                        showNeedsTags 
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg' 
                          : 'border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300'
                      }`}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Need Tags
                      {questions.filter(q => q.needs_tags).length > 0 && (
                        <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                          {questions.filter(q => q.needs_tags).length}
                        </Badge>
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      onClick={handleDownloadTemplate}
                      className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 rounded-xl transition-all duration-200"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Template
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={importing}
                      className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 rounded-xl transition-all duration-200 disabled:opacity-50"
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
                      className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all duration-200 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>

                {/* Active Filters Display */}
                {(searchTerm || questionTypeFilter !== 'all' || showNeedsTags) && (
                  <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-500 font-medium">Active filters:</span>
                    {searchTerm && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                        Search: "{searchTerm}"
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchTerm('')}
                          className="ml-1 h-4 w-4 p-0 hover:bg-blue-200 rounded-full"
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </Badge>
                    )}
                    {questionTypeFilter !== 'all' && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                        Type: {questionTypeFilter === QuestionType.MCQ ? 'MCQ' : 'Long Answer'}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setQuestionTypeFilter('all')}
                          className="ml-1 h-4 w-4 p-0 hover:bg-purple-200 rounded-full"
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </Badge>
                    )}
                    {showNeedsTags && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                        Need Tags Only
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowNeedsTags(false)}
                          className="ml-1 h-4 w-4 p-0 hover:bg-amber-200 rounded-full"
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setQuestionTypeFilter('all');
                        setShowNeedsTags(false);
                      }}
                      className="text-gray-500 hover:text-gray-700 text-xs"
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Questions Table */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-xl">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <List className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-gray-900">Questions Library</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs bg-white/50">
                        {questions.length} total
                      </Badge>
                      {selectedQuestions.length > 0 && (
                        <Badge className="text-xs bg-blue-500 text-white animate-pulse">
                          {selectedQuestions.length} selected
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardTitle>
                {selectedQuestions.length > 0 && (
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedQuestions([])}
                      className="text-gray-600 hover:text-gray-800 border-gray-200 hover:bg-gray-50 rounded-lg transition-all duration-200"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear Selection
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleBulkDelete}
                      disabled={bulkDeleting}
                      className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {bulkDeleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Selected ({selectedQuestions.length})</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col justify-center items-center py-16">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
                  </div>
                  <p className="mt-4 text-gray-600 font-medium">Loading questions...</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-30"></div>
                    <div className="relative p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full inline-block">
                      <Brain className="h-16 w-16 text-blue-500" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No questions found</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    {searchTerm || questionTypeFilter !== 'all' || showNeedsTags 
                      ? "No questions match your current filters. Try adjusting your search criteria."
                      : "Your question library is empty. Get started by creating your first question or importing from a CSV file."
                    }
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={() => navigate('/admin/questions/create')}
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      size="lg"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Create Question
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                      size="lg"
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      Import Questions
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-0">
                  {/* Selection Helper */}
                  {questions.length > 0 && selectedQuestions.length === 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <HelpCircle className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="text-sm text-blue-800">
                          <strong>Pro Tip:</strong> Use checkboxes to select multiple questions for bulk operations. 
                          Click the header checkbox to select all questions at once.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Bulk Selection Header */}
                  {questions.length > 0 && (
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            className={`${isIndeterminate ? "data-[state=checked]:bg-blue-600" : ""} border-2 border-gray-300 data-[state=checked]:border-blue-600`}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedQuestions.length > 0 
                                ? `${selectedQuestions.length} question${selectedQuestions.length > 1 ? 's' : ''} selected`
                                : 'Select questions for bulk operations'
                              }
                            </p>
                            <p className="text-xs text-gray-500">
                              Click checkbox to select all • Individual selection available on each question
                            </p>
                          </div>
                        </div>
                      </div>
                      {selectedQuestions.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedQuestions([])}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Clear Selection
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            disabled={bulkDeleting}
                          >
                            {bulkDeleting ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                            ) : (
                              <Trash2 className="h-3 w-3 mr-1" />
                            )}
                            Delete ({selectedQuestions.length})
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Enhanced Tabular Layout */}
                  <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
                    <Table>
                      <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50/30 sticky top-0 z-10">
                        <TableRow className="border-b-2 border-gray-200 hover:bg-gray-50/80">
                          <TableHead className="w-12 pl-6 py-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 flex items-center justify-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              </div>
                              <span className="text-xs font-medium text-gray-600">Select</span>
                            </div>
                          </TableHead>
                          <TableHead className="font-bold text-gray-800 py-4 min-w-[300px]">
                            <div className="flex items-center space-x-2">
                              <Brain className="h-4 w-4 text-blue-600" />
                              <span>Question Details</span>
                            </div>
                          </TableHead>
                          <TableHead className="font-bold text-gray-800 py-4 min-w-[150px]">
                            <div className="flex items-center space-x-2">
                              <Target className="h-4 w-4 text-emerald-600" />
                              <span>Type & Answers</span>
                            </div>
                          </TableHead>
                          <TableHead className="font-bold text-gray-800 py-4 min-w-[200px]">
                            <div className="flex items-center space-x-2">
                              <TagIcon className="h-4 w-4 text-purple-600" />
                              <span>Tags</span>
                            </div>
                          </TableHead>
                          <TableHead className="font-bold text-gray-800 py-4 w-20">
                            <div className="flex items-center space-x-2">
                              <ImageIcon className="h-4 w-4 text-orange-600" />
                              <span>Image</span>
                            </div>
                          </TableHead>
                          <TableHead className="font-bold text-gray-800 py-4 w-32">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-600" />
                              <span>Created</span>
                            </div>
                          </TableHead>
                          <TableHead className="font-bold text-gray-800 py-4 w-32 pr-6">
                            <div className="flex items-center space-x-2">
                              <Edit className="h-4 w-4 text-indigo-600" />
                              <span>Actions</span>
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {questions.map(renderQuestionRow)}
                      </TableBody>
                    </Table>
                  </div>
                </div>
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

      {/* Enhanced Import Result Modal */}
      <Dialog open={showImportResult} onOpenChange={setShowImportResult}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="border-b bg-gradient-to-r from-blue-50 to-green-50 pb-4">
            <div className="flex items-center space-x-3">
              {importResult && importResult.successful > 0 ? (
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              ) : (
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              )}
              <div>
                <DialogTitle className="text-xl font-bold">Import Results</DialogTitle>
                {importResult && (
                  <p className="text-sm text-gray-600 font-normal mt-1">
                    {importResult.successful > 0 
                      ? `Successfully processed ${importResult.successful} out of ${importResult.total_rows} questions`
                      : `Import failed - ${importResult.failed} errors found`
                    }
                  </p>
                )}
              </div>
            </div>
          </DialogHeader>
          
          {importResult && (
            <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
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
              {importResult.created_problems && importResult.created_problems.length > 0 && (
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
            </div>
          )}
          
          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t flex justify-end">
            <Button 
              onClick={() => setShowImportResult(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              Close
            </Button>
          </div>
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