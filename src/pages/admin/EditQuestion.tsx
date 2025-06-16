import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Save, Home, ChevronRight, Brain, FileText, CheckCircle, Target, Lightbulb, HelpCircle, BookOpen, Edit3, List, Image as ImageIcon, X, Tag, Eye, MessageSquare, AlignLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService, QuestionType, ScoringType, QuestionResponse } from '../../services/api';
import { API_SERVER_URL } from '../../config/api';
import TagSelector from '../../components/tags/TagSelector';

interface QuestionFormData {
  title: string;
  description: string;
  question_type: QuestionType;
  explanation?: string;
  
  // MCQ-specific fields
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  
  // Long Answer specific fields
  max_word_count?: number;
  sample_answer?: string;
  scoring_type?: ScoringType;
  keywords_for_scoring?: string;
  
  image?: File;
}

interface TagData {
  id: string;
  name: string;
  color: string;
  description?: string;
}

const EditQuestion = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<QuestionResponse | null>(null);
  const [correctOptions, setCorrectOptions] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<TagData[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.MCQ);
  const [scoringKeywords, setScoringKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue, reset } = useForm<QuestionFormData>();

  useEffect(() => {
    if (id) {
      loadQuestion();
    }
  }, [id]);

  const loadQuestion = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const questionData = await apiService.getQuestion(id);
      setQuestion(questionData);
      setQuestionType(questionData.question_type);
      
      // Set form values
      reset({
        title: questionData.title,
        description: questionData.description,
        question_type: questionData.question_type,
        explanation: questionData.explanation || '',
        option_a: questionData.option_a || '',
        option_b: questionData.option_b || '',
        option_c: questionData.option_c || '',
        option_d: questionData.option_d || '',
        max_word_count: questionData.max_word_count || 200,
        sample_answer: questionData.sample_answer || '',
        scoring_type: questionData.scoring_type || ScoringType.MANUAL,
        keywords_for_scoring: questionData.keywords_for_scoring?.join(', ') || ''
      });
      
      // Set correct options for MCQ
      if (questionData.question_type === QuestionType.MCQ && questionData.correct_options) {
        setCorrectOptions(questionData.correct_options);
      }
      
      // Set scoring keywords for Long Answer
      if (questionData.question_type === QuestionType.LONG_ANSWER && questionData.keywords_for_scoring) {
        setScoringKeywords(questionData.keywords_for_scoring);
      }
      
      // Set tags
      if (questionData.tags) {
        setSelectedTags(questionData.tags);
      }
      
      // Set image preview
      if (questionData.image_url) {
        setImagePreview(questionData.image_url.startsWith('http') ? questionData.image_url : `${API_SERVER_URL}${questionData.image_url}`);
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load question",
        variant: "destructive"
      });
      navigate('/admin/questions');
    } finally {
      setLoading(false);
    }
  };

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

  const removeImage = async () => {
    if (!id) return;
    
    if (question?.image_url) {
      // Remove existing image from server
      try {
        await apiService.removeQuestionImage(id);
        setImagePreview(null);
        toast({
          title: "Success",
          description: "Image removed successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to remove image",
          variant: "destructive"
        });
      }
    } else {
      // Just remove preview for new image
      setImagePreview(null);
      setValue('image', undefined);
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !scoringKeywords.includes(keywordInput.trim())) {
      const newKeywords = [...scoringKeywords, keywordInput.trim()];
      setScoringKeywords(newKeywords);
      setValue('keywords_for_scoring', newKeywords.join(', '));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    const newKeywords = scoringKeywords.filter(k => k !== keyword);
    setScoringKeywords(newKeywords);
    setValue('keywords_for_scoring', newKeywords.join(', '));
  };

  const onSubmit = async (data: QuestionFormData) => {
    if (!id) return;
    
    // Validation based on question type
    if (questionType === QuestionType.MCQ) {
      if (correctOptions.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one correct option",
          variant: "destructive"
        });
        return;
      }
      
      if (!data.option_a || !data.option_b || !data.option_c || !data.option_d) {
        toast({
          title: "Error",
          description: "All four options (A, B, C, D) are required for MCQ questions",
          variant: "destructive"
        });
        return;
      }
    } else {
      // Long Answer validation
      if (!data.max_word_count || data.max_word_count < 10) {
        toast({
          title: "Error",
          description: "Maximum word count must be at least 10 words",
          variant: "destructive"
        });
        return;
      }
      
      if (data.scoring_type === ScoringType.KEYWORD_BASED && scoringKeywords.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one keyword for keyword-based scoring",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      // Prepare question data
      const questionData: any = {
        title: data.title,
        description: data.description,
        explanation: data.explanation || undefined,
        tag_ids: selectedTags.map(tag => tag.id)
      };

      // Add type-specific fields
      if (questionType === QuestionType.MCQ) {
        questionData.option_a = data.option_a;
        questionData.option_b = data.option_b;
        questionData.option_c = data.option_c;
        questionData.option_d = data.option_d;
        questionData.correct_options = correctOptions;
      } else {
        questionData.max_word_count = data.max_word_count;
        questionData.sample_answer = data.sample_answer;
        questionData.scoring_type = data.scoring_type;
        if (data.scoring_type === ScoringType.KEYWORD_BASED) {
          questionData.keywords_for_scoring = scoringKeywords;
        }
      }
      
      await apiService.updateQuestion(id, questionData);
      
      // If there's a new image, upload it
      if (data.image) {
        try {
          await apiService.uploadQuestionImage(id, data.image);
        } catch (imageError) {
          toast({
            title: "Partial Success",
            description: "Question updated successfully, but image upload failed.",
            variant: "destructive"
          });
          navigate('/admin/questions');
          return;
        }
      }
      
      toast({
        title: "Success",
        description: `${questionType === QuestionType.MCQ ? 'MCQ' : 'Long Answer'} question updated successfully${data.image ? ' with new image' : ''}`
      });
      
      navigate('/admin/questions');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update question",
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
      navigate('/admin/questions');
    }
  };

  const getOptionIcon = (option: string) => {
    const icons = { A: '🅰️', B: '🅱️', C: '🅾️', D: '🔷' };
    return icons[option as keyof typeof icons] || option;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!question) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-gray-900">Question not found</h1>
            <p className="text-gray-600 mt-2">The question you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/admin/questions')} className="mt-4">
              Back to Questions
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Home className="h-4 w-4" />
            <span>Admin</span>
            <ChevronRight className="h-4 w-4" />
            <span>Question Management</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-blue-600 font-medium">Edit Question</span>
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
                  <div className="p-3 bg-blue-100 rounded-xl mr-4">
                    <Edit3 className="h-8 w-8 text-blue-600" />
                  </div>
                  Edit Question
                </h1>
                <p className="text-gray-600 mt-1">Update your {questionType === QuestionType.MCQ ? 'MCQ' : 'Long Answer'} question</p>
              </div>
            </div>
            
            <Badge className={questionType === QuestionType.MCQ ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
              {questionType === QuestionType.MCQ ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  MCQ
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Long Answer
                </>
              )}
            </Badge>
          </div>

          {/* Main Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Basic Information */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-gray-800">
                  <FileText className="h-6 w-6 mr-2 text-blue-600" />
                  Question Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700 flex items-center">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Question Title *
                  </Label>
                  <Input
                    id="title"
                    {...register('title', { required: 'Question title is required' })}
                    placeholder="Enter a clear and concise question title..."
                    className="w-full"
                  />
                  {errors.title && <p className="text-red-600 text-sm">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700 flex items-center">
                    <AlignLeft className="h-4 w-4 mr-2" />
                    Question Description *
                  </Label>
                  <Textarea
                    id="description"
                    {...register('description', { required: 'Question description is required' })}
                    placeholder="Write the detailed question description. Be clear and specific about what you're asking..."
                    className="min-h-[120px] resize-y"
                  />
                  {errors.description && <p className="text-red-600 text-sm">{errors.description.message}</p>}
                </div>

                {/* Image Upload Section */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Question Image (Optional)
                  </Label>
                  
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Question preview"
                        className="w-full max-w-md h-auto rounded-lg border border-gray-300"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={removeImage}
                        className="absolute top-2 right-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">Click to upload an image</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* MCQ-specific fields */}
            {questionType === QuestionType.MCQ && (
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl text-gray-800">
                    <CheckCircle className="h-6 w-6 mr-2 text-blue-600" />
                    Answer Options
                  </CardTitle>
                  <p className="text-sm text-gray-600">Update the four answer choices and correct option(s)</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {['A', 'B', 'C', 'D'].map((option, index) => (
                    <div key={option} className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getOptionIcon(option)}</span>
                          <Label className="text-sm font-medium text-gray-700">
                            Option {option}
                          </Label>
                        </div>
                        <Checkbox
                          checked={correctOptions.includes(option)}
                          onCheckedChange={(checked) => handleCorrectOptionChange(option, !!checked)}
                          className="ml-auto"
                        />
                        <Label className="text-sm text-gray-600">Correct</Label>
                      </div>
                      <Input
                        {...register(`option_${option.toLowerCase()}` as keyof QuestionFormData, { 
                          required: `Option ${option} is required` 
                        })}
                        placeholder={`Enter option ${option}...`}
                        className="w-full"
                      />
                      {errors[`option_${option.toLowerCase()}` as keyof QuestionFormData] && (
                        <p className="text-red-600 text-sm">
                          {errors[`option_${option.toLowerCase()}` as keyof QuestionFormData]?.message}
                        </p>
                      )}
                    </div>
                  ))}
                  
                  {correctOptions.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <CheckCircle className="inline h-4 w-4 mr-1" />
                        Correct answer(s): {correctOptions.join(', ')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Long Answer specific fields */}
            {questionType === QuestionType.LONG_ANSWER && (
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl text-gray-800">
                    <MessageSquare className="h-6 w-6 mr-2 text-green-600" />
                    Long Answer Configuration
                  </CardTitle>
                  <p className="text-sm text-gray-600">Update settings for long answer responses</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="max_word_count" className="text-sm font-medium text-gray-700">
                        Maximum Word Count *
                      </Label>
                      <Input
                        id="max_word_count"
                        type="number"
                        min="10"
                        max="2000"
                        {...register('max_word_count', { 
                          required: 'Maximum word count is required',
                          min: { value: 10, message: 'Minimum 10 words required' },
                          max: { value: 2000, message: 'Maximum 2000 words allowed' }
                        })}
                        placeholder="200"
                        className="w-full"
                      />
                      {errors.max_word_count && <p className="text-red-600 text-sm">{errors.max_word_count.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scoring_type" className="text-sm font-medium text-gray-700">
                        Scoring Method *
                      </Label>
                      <Select 
                        value={watch('scoring_type')} 
                        onValueChange={(value) => setValue('scoring_type', value as ScoringType)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select scoring method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ScoringType.MANUAL}>Manual Review</SelectItem>
                          <SelectItem value={ScoringType.KEYWORD_BASED}>Keyword-based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sample_answer" className="text-sm font-medium text-gray-700">
                      Sample Answer (Optional)
                    </Label>
                    <Textarea
                      id="sample_answer"
                      {...register('sample_answer')}
                      placeholder="Provide a sample answer to guide students and help with scoring..."
                      className="min-h-[100px] resize-y"
                    />
                  </div>

                  {/* Keyword-based scoring configuration */}
                  {watch('scoring_type') === ScoringType.KEYWORD_BASED && (
                    <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Label className="text-sm font-medium text-blue-800">
                        Scoring Keywords
                      </Label>
                      <p className="text-sm text-blue-700">
                        Add keywords that should appear in correct answers. Each keyword found will contribute to the score.
                      </p>
                      
                      <div className="flex space-x-2">
                        <Input
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          placeholder="Enter a keyword..."
                          className="flex-1"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addKeyword();
                            }
                          }}
                        />
                        <Button type="button" onClick={addKeyword} variant="outline">
                          Add
                        </Button>
                      </div>
                      
                      {scoringKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {scoringKeywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center">
                              {keyword}
                              <X 
                                className="h-3 w-3 ml-1 cursor-pointer" 
                                onClick={() => removeKeyword(keyword)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Explanation and Tags */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-gray-800">
                  <Lightbulb className="h-6 w-6 mr-2 text-yellow-600" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="explanation" className="text-sm font-medium text-gray-700 flex items-center">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Explanation (Optional)
                  </Label>
                  <Textarea
                    id="explanation"
                    {...register('explanation')}
                    placeholder="Provide a detailed explanation of the correct answer. This will be shown to students after they complete the question..."
                    className="min-h-[100px] resize-y"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center">
                    <Tag className="h-4 w-4 mr-2" />
                    Tags (Optional)
                  </Label>
                  <TagSelector
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                  />
                  <p className="text-xs text-gray-500">
                    Add tags to categorize and organize your questions
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="px-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-8 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Question
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditQuestion; 