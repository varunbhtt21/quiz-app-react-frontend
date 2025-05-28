import React, { useState, useEffect } from 'react';
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
import { ArrowLeft, Save, Search, Home, ChevronRight, Loader2, Trophy, Calendar, Clock, Target, Users, BookOpen, CheckCircle, AlertCircle, FileText, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '../../services/api';

interface ContestFormData {
  name: string;
  description: string;
  course_id: string;
  start_time: string;
  end_time: string;
}

interface MCQProblem {
  id: string;
  title: string;
  description: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_options: string[];
}

interface Course {
  id: string;
  name: string;
  description?: string;
}

interface SelectedProblem {
  problem_id: string;
  marks: number;
  problem: MCQProblem;
}

const CreateContest = () => {
  const navigate = useNavigate();
  const [selectedProblems, setSelectedProblems] = useState<SelectedProblem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [mcqProblems, setMcqProblems] = useState<MCQProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ContestFormData>();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [coursesData, mcqData] = await Promise.all([
        apiService.getCourses(0, 1000) as Promise<Course[]>,
        apiService.getMCQs(0, 1000) as Promise<MCQProblem[]>
      ]);
      
      setCourses(coursesData);
      setMcqProblems(mcqData);
      
      if (coursesData.length === 0) {
        toast({
          title: "No Courses Available",
          description: "Please create a course first before creating contests.",
          variant: "destructive"
        });
      }
      
      if (mcqData.length === 0) {
        toast({
          title: "No MCQ Problems Available",
          description: "Please create MCQ problems first before creating contests.",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load courses and MCQ problems",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMCQs = mcqProblems.filter(mcq =>
    mcq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mcq.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProblemSelect = (problem: MCQProblem, selected: boolean) => {
    if (selected) {
      setSelectedProblems([...selectedProblems, { 
        problem_id: problem.id, 
        marks: 1, 
        problem 
      }]);
    } else {
      setSelectedProblems(selectedProblems.filter(p => p.problem_id !== problem.id));
    }
  };

  const updateProblemMarks = (problemId: string, marks: number) => {
    setSelectedProblems(selectedProblems.map(p => 
      p.problem_id === problemId ? { ...p, marks } : p
    ));
  };

  const totalMarks = selectedProblems.reduce((sum, p) => sum + p.marks, 0);

  const onSubmit = async (data: ContestFormData) => {
    if (selectedProblems.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one problem",
        variant: "destructive"
      });
      return;
    }

    const startTime = new Date(data.start_time);
    const endTime = new Date(data.end_time);
    
    if (startTime >= endTime) {
      toast({
        title: "Error",
        description: "Start time must be before end time",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const formatDateTimePreserveLocal = (dateTimeLocal: string) => {
        const formatted = dateTimeLocal.includes(':') && dateTimeLocal.split(':').length === 2 
          ? dateTimeLocal + ':00' 
          : dateTimeLocal;
        return formatted + '.000Z';
      };
      
      const contestData = {
        name: data.name,
        description: data.description,
        start_time: formatDateTimePreserveLocal(data.start_time),
        end_time: formatDateTimePreserveLocal(data.end_time),
        problems: selectedProblems.map(p => ({
          problem_id: p.problem_id,
          marks: p.marks
        }))
      };

      await apiService.createContest(contestData, data.course_id);
      
      toast({
        title: "Success",
        description: "Contest created successfully"
      });
      
      navigate('/admin/contests');
    } catch (error) {
      console.error('Error creating contest:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create contest",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/admin/dashboard');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading courses and MCQ problems...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-red-600 to-pink-700 rounded-2xl p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Trophy className="h-8 w-8" />
                  <h1 className="text-4xl font-bold">🏆 Create New Contest</h1>
                </div>
                <p className="text-orange-100 text-lg mb-4">
                  Design and schedule engaging quiz competitions for your students
                </p>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Calendar className="h-3 w-3 mr-1" />
                    Scheduled Assessment
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Target className="h-3 w-3 mr-1" />
                    Performance Tracking
                  </Badge>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                  <Trophy className="h-16 w-16 text-orange-200" />
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        </div>

        {/* Breadcrumb Navigation */}
        <Card className="shadow-sm border-0 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/admin/dashboard')}
                className="p-0 h-auto font-normal hover:text-orange-600"
              >
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
              <ChevronRight className="h-4 w-4" />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/admin/contests')}
                className="p-0 h-auto font-normal hover:text-orange-600"
              >
                Contests
              </Button>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 font-medium">Create Contest</span>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Help Information */}
        <Card className="shadow-lg border-0 border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-900">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Settings className="h-5 w-5 text-orange-600" />
              </div>
              <span>Contest Setup Guidelines</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-3">
                <h4 className="font-semibold text-orange-900 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Timing & Schedule
                </h4>
                <ul className="space-y-2 text-orange-800">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-2"></div>
                    Set clear start and end times
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-2"></div>
                    Allow sufficient time for completion
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-2"></div>
                    Consider student time zones
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-2"></div>
                    Test timing with sample runs
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-orange-900 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Question Selection
                </h4>
                <ul className="space-y-2 text-orange-800">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-2"></div>
                    Mix difficulty levels appropriately
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-2"></div>
                    Ensure questions match course content
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-2"></div>
                    Set fair marking schemes
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-2"></div>
                    Review all selected questions
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-orange-900 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Best Practices
                </h4>
                <ul className="space-y-2 text-orange-800">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-2"></div>
                    Provide clear instructions
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-2"></div>
                    Announce contests in advance
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-2"></div>
                    Monitor during contest time
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-2"></div>
                    Review results and feedback
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Show warnings if no data available */}
        {courses.length === 0 && (
          <Card className="shadow-lg border-0 border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-900">No courses available</p>
                  <p className="text-sm text-amber-800">You need to create a course before setting up contests.</p>
                </div>
                <Button 
                  variant="outline" 
                  className="ml-auto border-amber-300 text-amber-700 hover:bg-amber-100"
                  onClick={() => navigate('/admin/courses')}
                >
                  Create Course
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {mcqProblems.length === 0 && (
          <Card className="shadow-lg border-0 border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-900">No questions available</p>
                  <p className="text-sm text-amber-800">You need to create MCQ questions before setting up contests.</p>
                </div>
                <Button 
                  variant="outline" 
                  className="ml-auto border-amber-300 text-amber-700 hover:bg-amber-100"
                  onClick={() => navigate('/admin/mcq')}
                >
                  Create Questions
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Enhanced Contest Details Form */}
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center space-x-2 text-xl">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                <span>Contest Information</span>
              </CardTitle>
              <p className="text-gray-600 text-sm mt-1">Define the basic details and schedule for your contest</p>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Contest Name *</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Contest name is required' })}
                  placeholder="e.g., Programming Fundamentals Quiz"
                  className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
                {errors.name && (
                  <p className="text-sm text-red-600 flex items-center">
                    <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="e.g., Test your understanding of basic programming concepts including variables, loops, and functions."
                  rows={4}
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 resize-none"
                />
                <p className="text-xs text-gray-500">Optional description to help students understand the contest scope</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="course_id" className="text-sm font-semibold text-gray-700">Course *</Label>
                <select
                  id="course_id"
                  {...register('course_id', { required: 'Course selection is required' })}
                  className="w-full h-12 p-3 border border-gray-300 rounded-md focus:border-orange-500 focus:ring-orange-500"
                  disabled={courses.length === 0}
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
                {errors.course_id && (
                  <p className="text-sm text-red-600 flex items-center">
                    <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                    {errors.course_id.message}
                  </p>
                )}
                <p className="text-xs text-gray-500">Only students enrolled in this course can participate</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="start_time" className="text-sm font-semibold text-gray-700">Start Time *</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    {...register('start_time', { required: 'Start time is required' })}
                    className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                  {errors.start_time && (
                    <p className="text-sm text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                      {errors.start_time.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="end_time" className="text-sm font-semibold text-gray-700">End Time *</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    {...register('end_time', { required: 'End time is required' })}
                    className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                  {errors.end_time && (
                    <p className="text-sm text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                      {errors.end_time.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Problem Selection */}
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center space-x-2 text-xl">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-orange-600" />
                </div>
                <span>Select Questions</span>
              </CardTitle>
              <p className="text-gray-600 text-sm mt-1">Choose questions from your question bank and set their marks</p>
              <div className="flex items-center space-x-2 mt-4">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search questions by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {mcqProblems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-4">No MCQ questions available.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/admin/mcq')}
                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    Create Questions First
                  </Button>
                </div>
              ) : filteredMCQs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No questions match your search criteria.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMCQs.map((mcq) => {
                    const isSelected = selectedProblems.some(p => p.problem_id === mcq.id);
                    const selectedProblem = selectedProblems.find(p => p.problem_id === mcq.id);

                    return (
                      <div key={mcq.id} className={`border rounded-lg p-6 transition-all ${isSelected ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="flex items-start space-x-4">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => 
                              handleProblemSelect(mcq, checked as boolean)
                            }
                            className="mt-1 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-2">{mcq.title}</h4>
                            <p className="text-sm text-gray-600 mb-3">{mcq.description}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center space-x-2">
                                <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">A</span>
                                <span>{mcq.option_a}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">B</span>
                                <span>{mcq.option_b}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">C</span>
                                <span>{mcq.option_c}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">D</span>
                                <span>{mcq.option_d}</span>
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-orange-200">
                              <Label className="text-sm font-medium">Marks:</Label>
                              <Input
                                type="number"
                                min="1"
                                max="10"
                                value={selectedProblem?.marks || 1}
                                onChange={(e) => 
                                  updateProblemMarks(mcq.id, parseInt(e.target.value) || 1)
                                }
                                className="w-20 h-8 text-center border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Selected Problems Summary */}
          {selectedProblems.length > 0 && (
            <Card className="shadow-lg border-0 border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-900">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <span>Contest Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-white rounded-lg border border-green-100">
                    <div className="text-2xl font-bold text-green-600">{selectedProblems.length}</div>
                    <div className="text-sm text-green-800">Questions Selected</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-green-100">
                    <div className="text-2xl font-bold text-green-600">{totalMarks}</div>
                    <div className="text-sm text-green-800">Total Marks</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-green-100">
                    <div className="text-2xl font-bold text-green-600">{Math.round(totalMarks / selectedProblems.length * 10) / 10}</div>
                    <div className="text-sm text-green-800">Average Marks</div>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="font-semibold text-green-900 mb-3">Selected Questions:</h4>
                  <div className="space-y-2">
                    {selectedProblems.map((p) => (
                      <div key={p.problem_id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-green-100">
                        <span className="font-medium text-gray-900">{p.problem.title}</span>
                        <Badge className="bg-green-100 text-green-800">{p.marks} marks</Badge>
                      </div>
                    ))}
                  </div>
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
              className="px-6 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="px-8 bg-orange-600 hover:bg-orange-700 flex items-center space-x-2"
              disabled={submitting || courses.length === 0 || mcqProblems.length === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Contest...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Create Contest</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateContest;
