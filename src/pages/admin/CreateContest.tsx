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
import { ArrowLeft, Save, Search, Home, ChevronRight, Loader2 } from 'lucide-react';
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
      
      // Load courses and MCQ problems in parallel
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

    // Validate time range
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
      
      const contestData = {
        name: data.name,
        description: data.description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
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
    // Check if there's history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback to dashboard if no history
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
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin/dashboard')}
            className="p-0 h-auto font-normal"
          >
            <Home className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <ChevronRight className="h-4 w-4" />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin/contests')}
            className="p-0 h-auto font-normal"
          >
            Contests
          </Button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Create Contest</span>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Create New Contest</h1>
        </div>

        {/* Show warnings if no data available */}
        {courses.length === 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-yellow-800">
                <span className="font-medium">⚠️ No courses available.</span>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-yellow-800 underline"
                  onClick={() => navigate('/admin/courses')}
                >
                  Create a course first
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {mcqProblems.length === 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-yellow-800">
                <span className="font-medium">⚠️ No MCQ problems available.</span>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-yellow-800 underline"
                  onClick={() => navigate('/admin/mcq')}
                >
                  Create MCQ problems first
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contest Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Contest Name *</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Contest name is required' })}
                  placeholder="Enter contest name"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Enter contest description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course_id">Course *</Label>
                <select
                  id="course_id"
                  {...register('course_id', { required: 'Course selection is required' })}
                  className="w-full p-2 border border-gray-300 rounded-md"
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
                  <p className="text-sm text-red-600">{errors.course_id.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    {...register('start_time', { required: 'Start time is required' })}
                  />
                  {errors.start_time && (
                    <p className="text-sm text-red-600">{errors.start_time.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time *</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    {...register('end_time', { required: 'End time is required' })}
                  />
                  {errors.end_time && (
                    <p className="text-sm text-red-600">{errors.end_time.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Select Problems</CardTitle>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search problems..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {mcqProblems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No MCQ problems available.</p>
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/admin/mcq')}
                    className="mt-2"
                  >
                    Create MCQ problems first
                  </Button>
                </div>
              ) : filteredMCQs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No problems match your search criteria.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMCQs.map((mcq) => {
                    const isSelected = selectedProblems.some(p => p.problem_id === mcq.id);
                    const selectedProblem = selectedProblems.find(p => p.problem_id === mcq.id);

                    return (
                      <div key={mcq.id} className="border rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => 
                              handleProblemSelect(mcq, checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{mcq.title}</h4>
                            <p className="text-sm text-gray-600">{mcq.description}</p>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                              <span>A) {mcq.option_a}</span>
                              <span>B) {mcq.option_b}</span>
                              <span>C) {mcq.option_c}</span>
                              <span>D) {mcq.option_d}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="flex items-center space-x-2">
                              <Label className="text-sm">Marks:</Label>
                              <Input
                                type="number"
                                min="1"
                                max="10"
                                value={selectedProblem?.marks || 1}
                                onChange={(e) => 
                                  updateProblemMarks(mcq.id, parseInt(e.target.value) || 1)
                                }
                                className="w-20"
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

          {selectedProblems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Problems Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Total Problems:</strong> {selectedProblems.length}
                  </p>
                  <p className="text-sm">
                    <strong>Total Marks:</strong> {totalMarks}
                  </p>
                  <div className="text-sm">
                    <strong>Problems:</strong>
                    <ul className="mt-1 space-y-1">
                      {selectedProblems.map((p) => (
                        <li key={p.problem_id} className="flex justify-between">
                          <span>{p.problem.title}</span>
                          <span>{p.marks} marks</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={handleBack}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex items-center space-x-2"
              disabled={submitting || courses.length === 0 || mcqProblems.length === 0}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{submitting ? 'Creating...' : 'Create Contest'}</span>
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateContest;
