import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Home, ChevronRight, Brain, FileText, CheckCircle, Target, Lightbulb, HelpCircle, BookOpen, Edit3, List, Image as ImageIcon, X, Tag, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '../../services/api';
import TagSelector from '../../components/tags/TagSelector';

interface MCQFormData {
  title: string;
  description: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  explanation?: string;
  image?: File;
}

interface TagData {
  id: string;
  name: string;
  color: string;
  description?: string;
}

const CreateMCQ = () => {
  const navigate = useNavigate();
  const [correctOptions, setCorrectOptions] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<TagData[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<MCQFormData>();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Image size should be less than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setValue('image', file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setValue('image', undefined);
  };

  const onSubmit = async (data: MCQFormData) => {
    if (correctOptions.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one correct option",
        variant: "destructive"
      });
      return;
    }

    try {
      // First create the MCQ without image
      const mcqData = {
        title: data.title,
        description: data.description,
        option_a: data.option_a,
        option_b: data.option_b,
        option_c: data.option_c,
        option_d: data.option_d,
        correct_options: correctOptions,
        explanation: data.explanation || undefined,
        tag_ids: selectedTags.map(tag => tag.id)
      };
      
      const createdMCQ = await apiService.createMCQ(mcqData);
      
      // If there's an image, upload it
      if (data.image) {
        try {
          await apiService.uploadMCQImage(createdMCQ.id, data.image);
        } catch (imageError) {
          // MCQ is created but image upload failed
          toast({
            title: "Partial Success",
            description: "MCQ created successfully, but image upload failed. You can add the image later by editing the question.",
            variant: "destructive"
          });
          navigate('/admin/mcq');
          return;
        }
      }
      
      toast({
        title: "Success",
        description: data.image ? "MCQ created successfully with image" : "MCQ created successfully"
      });
      
      navigate('/admin/mcq');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create MCQ",
        variant: "destructive"
      });
    }
  };

  const handleCorrectOptionChange = (option: string, checked: boolean) => {
    if (checked) {
      setCorrectOptions([...correctOptions, option]);
    } else {
      setCorrectOptions(correctOptions.filter(opt => opt !== option));
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/admin/dashboard');
    }
  };

  const getOptionIcon = (option: string) => {
    const icons = { A: '🅰️', B: '🅱️', C: '🅾️', D: '🔷' };
    return icons[option as keyof typeof icons] || option;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Home className="h-4 w-4" />
            <span>Admin</span>
            <ChevronRight className="h-4 w-4" />
            <span>MCQ Management</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-green-600 font-medium">Create Question</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6 space-y-8">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={handleBack}
                className="hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <div className="p-3 bg-green-100 rounded-xl mr-4">
                    <Brain className="h-8 w-8 text-green-600" />
                  </div>
                  Create New Question
                </h1>
                <p className="text-gray-600 mt-1">Design engaging multiple-choice questions for your students</p>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-blue-200 rounded-lg">
                    <Target className="h-5 w-5 text-blue-700" />
                  </div>
                  <h3 className="font-semibold text-blue-900">Clear Objectives</h3>
                </div>
                <ul className="space-y-2 text-blue-800 text-sm">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                    Define learning outcomes
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                    Use precise language
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                    Test specific knowledge
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-purple-200 rounded-lg">
                    <HelpCircle className="h-5 w-5 text-purple-700" />
                  </div>
                  <h3 className="font-semibold text-purple-900">Question Design</h3>
                </div>
                <ul className="space-y-2 text-purple-800 text-sm">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-2"></div>
                    Ask one thing at a time
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-2"></div>
                    Avoid negative phrasing
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-2"></div>
                    Include context when needed
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-900 flex items-center">
                    <List className="h-4 w-4 mr-2" />
                    Answer Options
                  </h4>
                  <ul className="space-y-2 text-green-800">
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></div>
                      Make all options plausible
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></div>
                      Keep options similar in length
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></div>
                      Avoid "all of the above"
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></div>
                      Support multiple correct answers
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Form */}
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center space-x-2 text-xl">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <span>Question Details</span>
              </CardTitle>
              <p className="text-gray-600 text-sm mt-1">Create a comprehensive multiple-choice question</p>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Title Field */}
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Question Title *</Label>
                  <Input
                    id="title"
                    {...register('title', { required: 'Title is required' })}
                    placeholder="e.g., Basic Programming Concepts"
                    className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                      {errors.title.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">A brief, descriptive title for your question</p>
                </div>

                {/* Description Field */}
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Question Description *</Label>
                  <Textarea
                    id="description"
                    {...register('description', { required: 'Description is required' })}
                    placeholder="e.g., Which of the following is the correct syntax for declaring a variable in Python?"
                    rows={4}
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500 resize-none"
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                      {errors.description.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">The main question text that students will see</p>
                </div>

                {/* Tags Section */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center">
                      <Tag className="h-4 w-4 mr-2" />
                      Tags *
                    </Label>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      Strongly recommended
                    </span>
                  </div>
                  <TagSelector
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                    placeholder="Search and select tags for this question..."
                    required={false}
                    maxTags={5}
                    allowCreate={true}
                  />
                  <p className="text-xs text-gray-500 flex items-center">
                    <Tag className="h-3 w-3 mr-1" />
                    Tags help organize and filter questions in your question bank. Add them now or assign later.
                  </p>
                </div>

                {/* Image Upload Field */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="image" className="text-sm font-semibold text-gray-700">Question Image</Label>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">Optional</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Supported formats: JPG, PNG, GIF (max 5MB)
                        </p>
                      </div>
                      {imagePreview && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeImage}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                    {imagePreview && (
                      <div className="relative w-full max-w-md mx-auto">
                        <img
                          src={imagePreview}
                          alt="Question preview"
                          className="w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Answer Options */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-semibold text-gray-700">Answer Options *</Label>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      All four options required
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { key: 'option_a', label: 'A', placeholder: 'Enter option A' },
                      { key: 'option_b', label: 'B', placeholder: 'Enter option B' },
                      { key: 'option_c', label: 'C', placeholder: 'Enter option C' },
                      { key: 'option_d', label: 'D', placeholder: 'Enter option D' }
                    ].map(({ key, label, placeholder }) => (
                      <div key={key} className="space-y-3">
                        <Label htmlFor={key} className="text-sm font-medium text-gray-700 flex items-center">
                          <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold mr-2">
                            {label}
                          </span>
                          Option {label} *
                        </Label>
                        <Input
                          id={key}
                          {...register(key as keyof MCQFormData, { required: `Option ${label} is required` })}
                          placeholder={placeholder}
                          className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                        />
                        {errors[key as keyof MCQFormData] && (
                          <p className="text-sm text-red-600 flex items-center">
                            <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                            {errors[key as keyof MCQFormData]?.message}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Correct Options Selection */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-semibold text-gray-700">Correct Options *</Label>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      Select one or more
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['A', 'B', 'C', 'D'].map((option) => (
                      <div key={option} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <Checkbox
                          id={`correct_${option}`}
                          checked={correctOptions.includes(option)}
                          onCheckedChange={(checked) => 
                            handleCorrectOptionChange(option, checked as boolean)
                          }
                          className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                        />
                        <Label htmlFor={`correct_${option}`} className="flex items-center cursor-pointer">
                          <span className="text-lg mr-2">{getOptionIcon(option)}</span>
                          <span className="font-medium">Option {option}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                  {correctOptions.length === 0 && (
                    <p className="text-sm text-amber-600 flex items-center bg-amber-50 p-3 rounded-lg">
                      <span className="w-1 h-1 bg-amber-600 rounded-full mr-2"></span>
                      Please select at least one correct option
                    </p>
                  )}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <strong>Selected:</strong> {correctOptions.length > 0 ? correctOptions.join(', ') : 'None'}
                      {correctOptions.length > 1 && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">Multi-Answer</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Explanation Field */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="explanation" className="text-sm font-semibold text-gray-700">Explanation</Label>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">Optional</span>
                  </div>
                  <Textarea
                    id="explanation"
                    {...register('explanation')}
                    placeholder="e.g., In Python, variables are declared by simply assigning a value. The syntax 'variable_name = value' is correct."
                    rows={4}
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500 resize-none"
                  />
                  <p className="text-xs text-gray-500 flex items-center">
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Help students understand why the answer is correct (recommended)
                  </p>
                </div>

                {/* Question Preview */}
                {(watch('title') || watch('description')) && (
                  <Card className="bg-gray-50 border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Eye className="h-5 w-5 mr-2 text-gray-600" />
                        Question Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {watch('title') && (
                          <h3 className="font-semibold text-gray-900">{watch('title')}</h3>
                        )}
                        {watch('description') && (
                          <p className="text-gray-700">{watch('description')}</p>
                        )}
                        {selectedTags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedTags.map((tag) => (
                              <Badge
                                key={tag.id}
                                style={{ backgroundColor: tag.color, color: 'white' }}
                                className="text-white"
                              >
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Enhanced Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className="px-6 hover:bg-gray-50"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="px-8 bg-green-600 hover:bg-green-700 flex items-center space-x-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating Question...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Create Question</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CreateMCQ;
