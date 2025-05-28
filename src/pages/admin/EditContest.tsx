import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Home, ChevronRight, Loader2, Trophy, Calendar, Clock, Target, Users, BookOpen, CheckCircle, AlertCircle, FileText, Settings, Lock, Edit3, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '../../services/api';

interface ContestFormData {
  name: string;
  description: string;
  start_time: string;
  end_time: string;
}

interface Contest {
  id: string;
  course_id: string;
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  status: "not_started" | "in_progress" | "ended";
  created_at: string;
  problems?: any[];
}

interface Course {
  id: string;
  name: string;
  description?: string;
}

const EditContest = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [contest, setContest] = useState<Contest | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ContestFormData>();

  useEffect(() => {
    if (id) {
      loadContestData();
    }
  }, [id]);

  const loadContestData = async () => {
    try {
      setLoading(true);
      
      const contestData = await apiService.getContest(id!) as Contest;
      setContest(contestData);
      
      // Load course data
      const courseData = await apiService.getCourse(contestData.course_id) as Course;
      setCourse(courseData);
      
      // Set form values
      setValue('name', contestData.name);
      setValue('description', contestData.description || '');
      
      // Format datetime for input (remove timezone info to preserve local time)
      const formatDateTimeForInput = (dateTimeString: string) => {
        const date = new Date(dateTimeString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      
      setValue('start_time', formatDateTimeForInput(contestData.start_time));
      setValue('end_time', formatDateTimeForInput(contestData.end_time));
      
    } catch (error) {
      console.error('Error loading contest data:', error);
      toast({
        title: "Error",
        description: "Failed to load contest data",
        variant: "destructive"
      });
      navigate('/admin/contests');
    } finally {
      setLoading(false);
    }
  };

  const getContestStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now < start) return 'not_started';
    if (now > end) return 'ended';
    return 'in_progress';
  };

  const canEditTimes = () => {
    if (!contest) return false;
    const status = getContestStatus(contest.start_time, contest.end_time);
    return status === 'not_started';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_started':
        return <Badge className="bg-yellow-100 text-yellow-800">🟡 Upcoming</Badge>;
      case 'in_progress':
        return <Badge className="bg-green-100 text-green-800">🟢 Active</Badge>;
      case 'ended':
        return <Badge className="bg-red-100 text-red-800">🔴 Ended</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const onSubmit = async (data: ContestFormData) => {
    if (!contest) return;

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
      
      const updateData: any = {
        name: data.name,
        description: data.description,
      };

      // Only include time fields if contest hasn't started
      if (canEditTimes()) {
        updateData.start_time = formatDateTimePreserveLocal(data.start_time);
        updateData.end_time = formatDateTimePreserveLocal(data.end_time);
      }

      await apiService.updateContest(contest.id, updateData);
      
      toast({
        title: "Success",
        description: "Contest updated successfully"
      });
      
      navigate('/admin/contests');
    } catch (error) {
      console.error('Error updating contest:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update contest",
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
      navigate('/admin/contests');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading contest data...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!contest || !course) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Contest not found</h2>
            <p className="text-gray-600 mb-4">The contest you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => navigate('/admin/contests')}>
              Back to Contests
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const contestStatus = getContestStatus(contest.start_time, contest.end_time);
  const isReadOnly = !canEditTimes();

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
                  {isReadOnly ? <Eye className="h-8 w-8" /> : <Edit3 className="h-8 w-8" />}
                  <h1 className="text-4xl font-bold">
                    {isReadOnly ? '👁️ View Contest' : '✏️ Edit Contest'}
                  </h1>
                </div>
                <p className="text-orange-100 text-lg mb-4">
                  {isReadOnly 
                    ? 'View contest details and information'
                    : 'Modify contest details and settings'
                  }
                </p>
                <div className="flex items-center space-x-4">
                  {getStatusBadge(contestStatus)}
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {course.name}
                  </Badge>
                  {isReadOnly && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      <Lock className="h-3 w-3 mr-1" />
                      Read Only
                    </Badge>
                  )}
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                  {isReadOnly ? <Eye className="h-16 w-16 text-orange-200" /> : <Edit3 className="h-16 w-16 text-orange-200" />}
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
              <span className="text-gray-900 font-medium">{isReadOnly ? 'View' : 'Edit'} Contest</span>
            </div>
          </CardContent>
        </Card>

        {/* Status Information */}
        {isReadOnly && (
          <Card className="shadow-lg border-0 border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Lock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-900">Limited Editing</p>
                  <p className="text-sm text-amber-800">
                    {contestStatus === 'in_progress' 
                      ? 'Contest is currently active. Only name and description can be modified.'
                      : 'Contest has ended. Only name and description can be modified.'
                    }
                  </p>
                </div>
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
              <p className="text-gray-600 text-sm mt-1">
                {isReadOnly ? 'View contest details and schedule' : 'Modify contest details and schedule'}
              </p>
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
                <Label className="text-sm font-semibold text-gray-700">Course</Label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{course.name}</span>
                    <Badge variant="outline" className="text-xs">Read Only</Badge>
                  </div>
                  {course.description && (
                    <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                  )}
                </div>
                <p className="text-xs text-gray-500">Course cannot be changed after contest creation</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="start_time" className="text-sm font-semibold text-gray-700">Start Time *</Label>
                    {!canEditTimes() && <Lock className="h-3 w-3 text-gray-400" />}
                  </div>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    {...register('start_time', { required: 'Start time is required' })}
                    className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    disabled={!canEditTimes()}
                  />
                  {errors.start_time && (
                    <p className="text-sm text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                      {errors.start_time.message}
                    </p>
                  )}
                  {!canEditTimes() && (
                    <p className="text-xs text-amber-600">Cannot modify start time after contest begins</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="end_time" className="text-sm font-semibold text-gray-700">End Time *</Label>
                    {!canEditTimes() && <Lock className="h-3 w-3 text-gray-400" />}
                  </div>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    {...register('end_time', { required: 'End time is required' })}
                    className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    disabled={!canEditTimes()}
                  />
                  {errors.end_time && (
                    <p className="text-sm text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                      {errors.end_time.message}
                    </p>
                  )}
                  {!canEditTimes() && (
                    <p className="text-xs text-amber-600">Cannot modify end time after contest begins</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contest Problems Summary */}
          {contest.problems && contest.problems.length > 0 && (
            <Card className="shadow-lg border-0 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-900">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <span>Contest Questions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                    <div className="text-2xl font-bold text-blue-600">{contest.problems.length}</div>
                    <div className="text-sm text-blue-800">Total Questions</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                    <div className="text-2xl font-bold text-blue-600">
                      {contest.problems.reduce((sum: number, p: any) => sum + (p.marks || 1), 0)}
                    </div>
                    <div className="text-sm text-blue-800">Total Marks</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round((contest.problems.reduce((sum: number, p: any) => sum + (p.marks || 1), 0) / contest.problems.length) * 10) / 10}
                    </div>
                    <div className="text-sm text-blue-800">Average Marks</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Questions cannot be modified after contest creation. To change questions, create a new contest.
                  </p>
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
              {isReadOnly ? 'Back' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button 
                type="submit" 
                className="px-8 bg-orange-600 hover:bg-orange-700 flex items-center space-x-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating Contest...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Update Contest</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditContest; 