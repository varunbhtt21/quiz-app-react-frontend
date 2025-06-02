import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Tag, Search, Palette } from 'lucide-react';
import { apiService } from '../../services/api';
import { toast } from '@/hooks/use-toast';

interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  mcq_count?: number;
}

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  placeholder?: string;
  required?: boolean;
  maxTags?: number;
  allowCreate?: boolean;
  className?: string;
}

const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onTagsChange,
  placeholder = "Search and select tags...",
  required = true,
  maxTags = 10,
  allowCreate = true,
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim() && showSuggestions) {
        fetchSuggestions(searchQuery.trim());
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, showSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string) => {
    try {
      setLoading(true);
      const response = await apiService.getTagSuggestions(query, 10) as Tag[];
      
      // Filter out already selected tags
      const filteredSuggestions = response.filter(
        (tag: Tag) => !selectedTags.some(selected => selected.id === tag.id)
      );
      
      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Error fetching tag suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTagSelect = (tag: Tag) => {
    if (selectedTags.length >= maxTags) {
      toast({
        title: "Maximum tags reached",
        description: `You can only select up to ${maxTags} tags.`,
        variant: "destructive"
      });
      return;
    }

    if (!selectedTags.some(selected => selected.id === tag.id)) {
      onTagsChange([...selectedTags, tag]);
    }
    
    setSearchQuery('');
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleTagRemove = (tagId: string) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) {
      toast({
        title: "Error",
        description: "Tag name is required.",
        variant: "destructive"
      });
      return;
    }

    try {
      const created = await apiService.createTag({
        name: newTag.name.trim(),
        description: newTag.description.trim() || undefined,
        color: newTag.color
      }) as Tag;

      // Add the new tag to selected tags
      handleTagSelect(created);
      
      // Reset form
      setNewTag({
        name: '',
        description: '',
        color: '#3B82F6'
      });
      setIsCreateDialogOpen(false);

      toast({
        title: "Success",
        description: `Tag "${created.name}" created successfully!`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create tag",
        variant: "destructive"
      });
    }
  };

  const colorOptions = [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
    '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1',
    '#14B8A6', '#F43F5E', '#8B5A2B', '#6B7280', '#DC2626'
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              style={{ backgroundColor: tag.color, color: 'white' }}
              className="text-white px-3 py-1 flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <Tag className="h-3 w-3" />
              {tag.name}
              <button
                type="button"
                onClick={() => handleTagRemove(tag.id)}
                className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10 pr-16"
            disabled={selectedTags.length >= maxTags}
          />
          {allowCreate && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-blue-100"
                    disabled={selectedTags.length >= maxTags}
                  >
                    <Plus className="h-4 w-4 text-blue-600" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5 text-blue-600" />
                      Create New Tag
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="tag-name">Tag Name *</Label>
                      <Input
                        id="tag-name"
                        placeholder="Enter tag name..."
                        value={newTag.name}
                        onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tag-description">Description</Label>
                      <Textarea
                        id="tag-description"
                        placeholder="Optional description..."
                        value={newTag.description}
                        onChange={(e) => setNewTag(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Color
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewTag(prev => ({ ...prev, color }))}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              newTag.color === color ? 'border-gray-800 scale-110' : 'border-gray-300 hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          type="color"
                          value={newTag.color}
                          onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                          className="w-12 h-8 p-1 border rounded"
                        />
                        <Badge style={{ backgroundColor: newTag.color, color: 'white' }} className="text-white">
                          {newTag.name || 'Preview'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateTag}
                      disabled={!newTag.name.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Tag
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto"
          >
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm">Searching...</p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="py-2">
                {suggestions.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagSelect(tag)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        style={{ backgroundColor: tag.color, color: 'white' }}
                        className="text-white"
                      >
                        {tag.name}
                      </Badge>
                      {tag.description && (
                        <span className="text-sm text-gray-500 truncate max-w-xs">
                          {tag.description}
                        </span>
                      )}
                    </div>
                    {tag.mcq_count !== undefined && (
                      <span className="text-xs text-gray-400 group-hover:text-gray-600">
                        {tag.mcq_count} MCQs
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : searchQuery.trim() ? (
              <div className="p-4 text-center text-gray-500">
                <Tag className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No tags found</p>
                {allowCreate && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewTag(prev => ({ ...prev, name: searchQuery.trim() }));
                      setIsCreateDialogOpen(true);
                      setShowSuggestions(false);
                    }}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create "{searchQuery.trim()}"
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {required && selectedTags.length === 0 ? (
            <span className="text-red-500">At least one tag is required</span>
          ) : (
            `${selectedTags.length} of ${maxTags} tags selected`
          )}
        </span>
        {allowCreate && (
          <span className="text-xs">
            Press <Plus className="h-3 w-3 inline" /> to create new tags
          </span>
        )}
      </div>
    </div>
  );
};

export default TagSelector; 