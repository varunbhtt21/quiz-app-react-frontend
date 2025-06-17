import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Tag, Plus, Search, Edit, Trash2, Palette, Users, 
  Filter, SortAsc, SortDesc, Eye, MoreHorizontal, Sparkles,
  TrendingUp, Hash, Calendar, Clock, FileText, ChevronDown, ArrowUpDown, Layers, Copy, RefreshCw,
  Brain, Camera, CheckCircle, ImageIcon, ExternalLink, X, MessageSquare
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import Layout from '../../components/common/Layout';
import { apiService, QuestionResponse, QuestionType, ScoringType } from '../../services/api';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface TagData {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  question_count?: number; // Updated from mcq_count to be inclusive
}

const TagManagement = () => {
  const navigate = useNavigate();
  const [tags, setTags] = useState<TagData[]>([]);
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<TagData | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'question_count'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  const [newTag, setNewTag] = useState({
    name: '',
    description: '',
    color: '#6366F1'
  });

  useEffect(() => {
    loadTags();
    loadAllQuestions(); // Load all questions by default
  }, []);

  const loadAllQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const questionData = await apiService.getQuestions(0, 1000) as QuestionResponse[];
      setQuestions(questionData);
    } catch (error: any) {
      toast({
        title: "Error Loading Questions",
        description: error.message || "Failed to load questions.",
        variant: "destructive"
      });
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTags(0, 1000, searchQuery) as TagData[];
      setTags(response);
      
      // Load questions for the filtered tags when there's a search query
      if (searchQuery && response.length > 0) {
        loadQuestionsForTags(response);
        setSelectedTag(null); // Clear selected tag when searching
      } else if (!searchQuery && !selectedTag) {
        // Load all questions when no search and no tag selected
        loadAllQuestions();
      }
    } catch (error: any) {
      toast({
        title: "Error Loading Tags",
        description: error.message || "Failed to load tags. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionsForTags = async (filteredTags: TagData[]) => {
    try {
      setLoadingQuestions(true);
      const tagIds = filteredTags.map(tag => tag.id).join(',');
      const questionData = await apiService.getQuestions(0, 1000, undefined, tagIds) as QuestionResponse[];
      setQuestions(questionData);
    } catch (error: any) {
      toast({
        title: "Error Loading Questions",
        description: error.message || "Failed to load questions for these tags.",
        variant: "destructive"
      });
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const loadQuestionsForSpecificTag = async (tag: TagData) => {
    try {
      setLoadingQuestions(true);
      const questionData = await apiService.getQuestions(0, 1000, undefined, tag.id) as QuestionResponse[];
      setQuestions(questionData);
      setSelectedTag(tag);
    } catch (error: any) {
      toast({
        title: "Error Loading Questions",
        description: error.message || `Failed to load questions for tag "${tag.name}".`,
        variant: "destructive"
      });
      setQuestions([]);
      setSelectedTag(null);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleTagClick = (tag: TagData) => {
    if (selectedTag?.id === tag.id) {
      // If clicking the same tag, deselect it and show all questions
      setSelectedTag(null);
      loadAllQuestions();
    } else {
      // Load questions for the clicked tag
      loadQuestionsForSpecificTag(tag);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadTags();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);



  const handleCreateTag = async () => {
    if (!newTag.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Tag name is required to create a new tag.",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiService.createTag({
        name: newTag.name.trim(),
        description: newTag.description.trim() || undefined,
        color: newTag.color
      });

      setNewTag({
        name: '',
        description: '',
        color: '#6366F1'
      });
      setIsCreateDialogOpen(false);
      loadTags();

      toast({
        title: "Success! 🎉",
        description: `Tag "${newTag.name}" has been created successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create tag. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag || !newTag.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Tag name is required to update the tag.",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiService.updateTag(editingTag.id, {
        name: newTag.name.trim(),
        description: newTag.description.trim() || undefined,
        color: newTag.color
      });

      setEditingTag(null);
      setNewTag({
        name: '',
        description: '',
        color: '#6366F1'
      });
      loadTags();

      toast({
        title: "Updated Successfully! ✨",
        description: `Tag "${newTag.name}" has been updated.`,
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update tag. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTag = async (tag: TagData) => {
    try {
      await apiService.deleteTag(tag.id);
      loadTags();

      toast({
        title: "Deleted Successfully",
        description: `Tag "${tag.name}" has been removed.`,
      });
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete tag. Please try again.",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (tag: TagData) => {
    setEditingTag(tag);
    setNewTag({
      name: tag.name,
      description: tag.description || '',
      color: tag.color
    });
  };

  const closeDialog = () => {
    setEditingTag(null);
    setIsCreateDialogOpen(false);
    setNewTag({
      name: '',
      description: '',
      color: '#6366F1'
    });
  };

  const getCorrectOptionsCount = (correctOptions: string[]) => {
    return Array.isArray(correctOptions) ? correctOptions.length : 1;
  };

  const getScoringTypeDisplay = (scoringType?: ScoringType) => {
    switch (scoringType) {
      case ScoringType.MANUAL:
        return { label: 'Manual', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case ScoringType.KEYWORD_BASED:
        return { label: 'Keyword', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case ScoringType.AUTO:
        return { label: 'Auto', color: 'bg-green-50 text-green-700 border-green-200' };
      default:
        return { label: 'Manual', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };

  const handleDeleteQuestion = async (questionId: string, questionTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${questionTitle}"?`)) {
      return;
    }

    try {
      await apiService.deleteQuestion(questionId);
      // Reload questions to reflect the deletion
      if (searchQuery && tags.length > 0) {
        loadQuestionsForTags(tags);
      }
      toast({
        title: "Success",
        description: `Question "${questionTitle}" has been deleted.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete question.",
        variant: "destructive"
      });
    }
  };

  const sortedTags = [...tags].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'created_at':
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
      case 'question_count':
        aValue = a.question_count || 0;
        bValue = b.question_count || 0;
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const colorOptions = [
    { color: '#6366F1', name: 'Indigo' },
    { color: '#8B5CF6', name: 'Purple' },
    { color: '#06B6D4', name: 'Cyan' },
    { color: '#10B981', name: 'Emerald' },
    { color: '#84CC16', name: 'Lime' },
    { color: '#F59E0B', name: 'Amber' },
    { color: '#F97316', name: 'Orange' },
    { color: '#EF4444', name: 'Red' },
    { color: '#EC4899', name: 'Pink' },
    { color: '#14B8A6', name: 'Teal' },
    { color: '#3B82F6', name: 'Blue' },
    { color: '#6B7280', name: 'Gray' }
  ];

  const getTagStats = () => {
    const totalQuestions = tags.reduce((sum, tag) => sum + (tag.question_count || 0), 0);
    const avgQuestionsPerTag = tags.length > 0 ? Math.round(totalQuestions / tags.length) : 0;
    return { totalTags: tags.length, totalQuestions, avgQuestionsPerTag };
  };

  const stats = getTagStats();

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-3xl p-8 lg:p-12 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                    <Tag className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold">Tag Management</h1>
                    <p className="text-indigo-100 text-lg">
                      Organize your question bank with intelligent tagging
                    </p>
                  </div>
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4 lg:gap-6 mt-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Hash className="h-5 w-5 text-indigo-200" />
                      <span className="text-sm text-indigo-200">Total Tags</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.totalTags}</div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="h-5 w-5 text-indigo-200" />
                      <span className="text-sm text-indigo-200">Tagged Questions</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.totalQuestions}</div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-indigo-200" />
                      <span className="text-sm text-indigo-200">Avg per Tag</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.avgQuestionsPerTag}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-3">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="lg"
                      className="bg-white text-indigo-600 hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Create New Tag
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
                      <DialogHeader>
                        <DialogTitle className="text-white text-xl flex items-center gap-3">
                          <div className="bg-white/20 p-2 rounded-lg">
                            <Tag className="h-5 w-5" />
                          </div>
                          Create New Tag
                        </DialogTitle>
                      </DialogHeader>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="tag-name" className="text-sm font-semibold text-gray-700">
                          Tag Name *
                        </Label>
                        <Input
                          id="tag-name"
                          placeholder="Enter a descriptive tag name..."
                          value={newTag.name}
                          onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                          className="h-12 text-base"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="tag-description" className="text-sm font-semibold text-gray-700">
                          Description
                        </Label>
                        <Textarea
                          id="tag-description"
                          placeholder="Add an optional description to help others understand this tag..."
                          value={newTag.description}
                          onChange={(e) => setNewTag(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="text-base"
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Choose Color
                        </Label>
                        
                        <div className="grid grid-cols-6 gap-3">
                          {colorOptions.map(({ color, name }) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewTag(prev => ({ ...prev, color }))}
                              className={`group relative w-full h-12 rounded-xl transition-all duration-200 ${
                                newTag.color === color ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                              }`}
                              style={{ backgroundColor: color }}
                              title={name}
                            >
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors" />
                              {newTag.color === color && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-3 h-3 bg-white rounded-full" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                          <Input
                            type="color"
                            value={newTag.color}
                            onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                            className="w-16 h-12 p-1 border-2"
                          />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-2">Live Preview:</p>
                            <Badge 
                              style={{ backgroundColor: newTag.color, color: 'white' }} 
                              className="text-white text-base px-4 py-2"
                            >
                              {newTag.name || 'Your Tag Name'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                      <Button variant="outline" onClick={closeDialog} className="px-6">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateTag}
                        disabled={!newTag.name.trim()}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-6"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Tag
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  variant="outline" 
                  onClick={loadTags}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search tags by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-base border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-12 px-4 border-gray-200 hover:border-indigo-300">
                      <Layers className="h-4 w-4 mr-2" />
                      Sort: {sortBy.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setSortBy('name')}>
                      <Hash className="h-4 w-4 mr-2" />
                      Name
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('created_at')}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Date Created
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('question_count')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Question Count
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="h-12 px-4 border-gray-200 hover:border-indigo-300"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tags Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Tag className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <p className="mt-4 text-gray-600 text-lg">Loading your tags...</p>
          </div>
        ) : sortedTags.length === 0 ? (
          <Card className="overflow-hidden border-0 shadow-xl">
            <CardContent className="text-center py-20">
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                  <Tag className="h-12 w-12 text-indigo-500" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Plus className="h-4 w-4 text-white" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {searchQuery ? 'No matching tags found' : 'No tags yet'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchQuery 
                  ? 'Try adjusting your search terms or create a new tag.'
                  : 'Get started by creating your first tag to organize your question bank.'
                }
              </p>
              
              {!searchQuery && (
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)} 
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Create Your First Tag
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sortedTags.map((tag) => (
              <div
                key={tag.id}
                className="group relative"
              >
                {/* Mini Bubble-like Tag Card - Clickable */}
                <div 
                  className={`relative overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 bg-white border cursor-pointer ${
                    selectedTag?.id === tag.id 
                      ? 'ring-2 ring-offset-1 shadow-md scale-105' 
                      : ''
                  }`}
                  style={{ 
                    borderColor: tag.color
                  }}
                  onClick={() => handleTagClick(tag)}
                >
                  {/* Thin Colored Header Strip */}
                  <div 
                    className={`w-full ${selectedTag?.id === tag.id ? 'h-1' : 'h-0.5'}`}
                    style={{ backgroundColor: tag.color }}
                  />
                  
                  {/* Compact Content */}
                  <div className="px-3 py-2">
                    {/* Tag Name and Menu in one line */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        style={{ backgroundColor: tag.color, color: 'white' }}
                        className="text-white text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                      >
                        {tag.name}
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4 p-0 hover:bg-gray-100 rounded-full shrink-0"
                            onClick={(e) => e.stopPropagation()} // Prevent tag click when clicking menu
                          >
                            <MoreHorizontal className="h-2.5 w-2.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => openEditDialog(tag)}>
                            <Edit className="h-3 w-3 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-3 w-3 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600">
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                    <Trash2 className="h-5 w-5 text-red-600" />
                                  </div>
                                  Delete Tag "{tag.name}"
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-base leading-relaxed">
                                  Are you sure you want to permanently delete this tag? 
                                  {tag.question_count && tag.question_count > 0 && (
                                    <span className="block mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                                      <strong className="text-red-800">
                                        ⚠️ This will remove the tag from {tag.question_count} question{tag.question_count > 1 ? 's' : ''}.
                                      </strong>
                                    </span>
                                  )}
                                  <span className="block mt-2 text-sm text-gray-500">
                                    This action cannot be undone.
                                  </span>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTag(tag)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Tag
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {/* Compact Description (only if exists and short) */}
                    {tag.description && tag.description.length < 50 && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {tag.description}
                      </p>
                    )}
                    
                    {/* Minimal Stats */}
                    <div className="flex items-center justify-between mt-1.5 text-xs">
                      <div className="flex items-center gap-1 text-gray-500">
                        <FileText className="h-2.5 w-2.5" />
                        <span className="font-medium text-xs">{tag.question_count || 0}</span>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        {new Date(tag.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Hover Overlay for selected state */}
                  <div 
                    className={`absolute inset-0 transition-opacity duration-200 rounded-xl ${
                      selectedTag?.id === tag.id 
                        ? 'opacity-10' 
                        : 'opacity-0 group-hover:opacity-5'
                    }`}
                    style={{ backgroundColor: tag.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Questions Table - Always show */}
          <Card className="overflow-hidden border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Brain className="h-6 w-6 text-indigo-600" />
                    {selectedTag ? (
                      <>
                        Questions tagged with 
                        <Badge
                          style={{ backgroundColor: selectedTag.color, color: 'white' }}
                          className="text-white ml-2"
                        >
                          {selectedTag.name}
                        </Badge>
                      </>
                    ) : searchQuery && sortedTags.length > 0 ? (
                      'Questions with Selected Tags'
                    ) : (
                      'All Questions'
                    )}
                  </CardTitle>
                  <p className="text-gray-600 text-sm mt-1">
                    {loadingQuestions ? 'Loading questions...' : `Found ${questions.length} question${questions.length !== 1 ? 's' : ''} ${selectedTag ? `with tag "${selectedTag.name}"` : searchQuery && sortedTags.length > 0 ? 'with the selected tags' : 'in the system'}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedTag && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedTag(null);
                        loadAllQuestions(); // Load all questions when clearing selection
                      }}
                      className="hover:bg-red-50 hover:border-red-300 text-red-600"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Selection
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/admin/mcq')}
                    className="hover:bg-indigo-50 hover:border-indigo-300"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View All Questions
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {loadingQuestions ? (
                <div className="flex items-center justify-center py-16">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-indigo-600" />
                    </div>
                  </div>
                  <span className="ml-3 text-gray-600">Loading questions...</span>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No questions found</h3>
                  <p className="text-gray-500">
                    {selectedTag 
                      ? `No questions are tagged with "${selectedTag.name}".`
                      : searchQuery && sortedTags.length > 0
                      ? 'No questions are tagged with the selected tags.'
                      : 'No questions available in the system.'
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700">Question</TableHead>
                        <TableHead className="font-semibold text-gray-700">Image</TableHead>
                        <TableHead className="font-semibold text-gray-700">Type</TableHead>
                        <TableHead className="font-semibold text-gray-700">Created</TableHead>
                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questions.map((question) => {
                        const correctOptionsCount = question.question_type === QuestionType.MCQ ? 
                          getCorrectOptionsCount(question.correct_options || []) : 0;
                        const scoringDisplay = question.question_type === QuestionType.LONG_ANSWER ? 
                          getScoringTypeDisplay(question.scoring_type) : null;
                        
                        return (
                          <TableRow key={question.id} className="hover:bg-gray-50">
                            <TableCell className="max-w-md">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    question.question_type === QuestionType.MCQ 
                                      ? 'bg-indigo-100' 
                                      : 'bg-purple-100'
                                  }`}>
                                    {question.question_type === QuestionType.MCQ ? (
                                      <CheckCircle className="h-4 w-4 text-indigo-600" />
                                    ) : (
                                      <MessageSquare className="h-4 w-4 text-purple-600" />
                                    )}
                                  </div>
                                  <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{question.title}</h4>
                                </div>
                                <p className="text-gray-600 text-xs line-clamp-2 ml-10">{question.description}</p>
                                <div className="ml-10">
                                  <Badge variant="outline" className="text-xs text-gray-500">
                                    ID: {question.id.slice(0, 8)}...
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <div className="flex items-center justify-center">
                                {question.image_url && question.image_url.trim() ? (
                                  <div className="flex items-center space-x-1 text-green-600">
                                    <ImageIcon className="h-4 w-4" />
                                    <span className="text-xs">Has Image</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1 text-gray-400">
                                    <Camera className="h-4 w-4" />
                                    <span className="text-xs">No Image</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              {question.question_type === QuestionType.MCQ ? (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    correctOptionsCount > 1 
                                      ? 'border-orange-300 text-orange-700 bg-orange-50' 
                                      : 'border-blue-300 text-blue-700 bg-blue-50'
                                  }`}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {correctOptionsCount > 1 ? 'Multiple Choice' : 'Single Choice'}
                                  <br />
                                  <span className="text-xs opacity-75">
                                    {correctOptionsCount} correct option{correctOptionsCount > 1 ? 's' : ''}
                                  </span>
                                </Badge>
                              ) : (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs border-purple-300 text-purple-700 bg-purple-50"
                                >
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  Long Answer
                                  <br />
                                  <span className="text-xs opacity-75">
                                    {question.max_word_count ? `Max ${question.max_word_count} words` : 'No limit'}
                                  </span>
                                </Badge>
                              )}
                              {scoringDisplay && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs mt-1 ${scoringDisplay.color}`}
                                >
                                  {scoringDisplay.label} Scoring
                                </Badge>
                              )}
                            </TableCell>
                            
                            <TableCell>
                              <div className="flex items-center space-x-1 text-gray-500">
                                <Calendar className="h-3 w-3" />
                                <span className="text-xs">
                                  {new Date(question.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {new Date(question.created_at).toLocaleTimeString()}
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-1">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">
                                    Active
                                  </Badge>
                                </div>
                                
                                {question.explanation && (
                                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                                    Has explanation
                                  </Badge>
                                )}
                                
                                <div className="flex flex-wrap gap-1 max-w-32">
                                  {question.tags?.map((tag) => (
                                    <Badge
                                      key={tag.id}
                                      style={{ backgroundColor: tag.color, color: 'white' }}
                                      className="text-white text-xs px-1.5 py-0.5"
                                    >
                                      {tag.name}
                                    </Badge>
                                  ))}
                                  
                                  {question.needs_tags && (
                                    <Badge variant="destructive" className="text-xs">
                                      Needs Tags
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <div className="flex items-center justify-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/admin/questions/edit/${question.id}`)}
                                  className="hover:bg-blue-50 hover:border-blue-300"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteQuestion(question.id, question.title)}
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

        {/* Edit Dialog */}
        <Dialog open={!!editingTag} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
              <DialogHeader>
                <DialogTitle className="text-white text-xl flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Edit className="h-5 w-5" />
                  </div>
                  Edit Tag
                </DialogTitle>
              </DialogHeader>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="edit-tag-name" className="text-sm font-semibold text-gray-700">
                  Tag Name *
                </Label>
                <Input
                  id="edit-tag-name"
                  placeholder="Enter a descriptive tag name..."
                  value={newTag.name}
                  onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                  className="h-12 text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-tag-description" className="text-sm font-semibold text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="edit-tag-description"
                  placeholder="Add an optional description..."
                  value={newTag.description}
                  onChange={(e) => setNewTag(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="text-base"
                />
              </div>
              
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Choose Color
                </Label>
                
                <div className="grid grid-cols-6 gap-3">
                  {colorOptions.map(({ color, name }) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTag(prev => ({ ...prev, color }))}
                      className={`group relative w-full h-12 rounded-xl transition-all duration-200 ${
                        newTag.color === color ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={name}
                    >
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors" />
                      {newTag.color === color && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <Input
                    type="color"
                    value={newTag.color}
                    onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                    className="w-16 h-12 p-1 border-2"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">Live Preview:</p>
                    <Badge 
                      style={{ backgroundColor: newTag.color, color: 'white' }} 
                      className="text-white text-base px-4 py-2"
                    >
                      {newTag.name || 'Your Tag Name'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <Button variant="outline" onClick={closeDialog} className="px-6">
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTag}
                disabled={!newTag.name.trim()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-6"
              >
                <Edit className="h-4 w-4 mr-2" />
                Update Tag
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default TagManagement;