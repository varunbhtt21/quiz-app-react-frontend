import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import StatusBadge from '../../components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  Loader2, 
  Calendar, 
  Clock, 
  Users, 
  Target, 
  Trophy, 
  BookOpen,
  Play,
  Pause,
  Square,
  TrendingUp,
  Award,
  FileText,
  Timer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  FileSpreadsheet,
  ArrowRight,
  Circle,
  Info
} from 'lucide-react';
import { apiService } from '../../services/api';
import { toast } from '@/hooks/use-toast';
import { API_SERVER_URL } from '../../config/api';

interface ContestProblem {
  id: string;
  question_type: string;
  title: string;
  description: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  marks: number;
  order_index: number;
  image_url?: string;
  correct_options: string[];
  explanation?: string;
}

interface ContestSubmission {
  id: string;
  student_email?: string;
  student_name?: string;
  total_score?: number;
  max_possible_score?: number;
  percentage?: number;
  submitted_at?: string;
  time_taken_seconds?: number;
}

interface Contest {
  id: string;
  name: string;
  description?: string;
  course_name?: string;
  start_time: string;
  end_time: string;
  status: "not_started" | "in_progress" | "ended";
  problem_count?: number;
  max_possible_score?: number;
  is_active: boolean;
}

const ContestDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [contest, setContest] = useState<Contest | null>(null);
  const [submissions, setSubmissions] = useState<ContestSubmission[]>([]);
  const [problems, setProblems] = useState<ContestProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Preview Modal States
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [currentPreviewQuestion, setCurrentPreviewQuestion] = useState(0);

  useEffect(() => {
    if (id) {
      loadContestData();
    }
  }, [id]);

  const loadContestData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch contest details and submissions in parallel
      const [contestData, submissionsData] = await Promise.all([
        apiService.getContest(id),
        apiService.getContestSubmissions(id).catch(() => ({ submissions: [] })) // Handle case where no submissions exist
      ]);

      // Type the contest data properly
      const typedContestData = contestData as any;
      
      // Extract problems from contest data
      setProblems(typedContestData.problems || []);

      // Get course name if course_id exists
      let courseName = 'Unknown Course';
      if (typedContestData.course_id) {
        try {
          const courseData = await apiService.getCourse(typedContestData.course_id) as any;
          courseName = courseData.name || 'Unknown Course';
        } catch (error) {
          console.warn('Could not fetch course name:', error);
        }
      }

      setContest({
        id: typedContestData.id,
        name: typedContestData.name,
        description: typedContestData.description,
        course_name: courseName,
        start_time: typedContestData.start_time,
        end_time: typedContestData.end_time,
        status: typedContestData.status,
        problem_count: typedContestData.problem_count,
        max_possible_score: typedContestData.max_possible_score,
        is_active: typedContestData.is_active
      });

      // Handle submissions data structure
      const typedSubmissionsData = submissionsData as any;
      
      let submissionsArray: any[] = [];
      
      if (Array.isArray(typedSubmissionsData)) {
        submissionsArray = typedSubmissionsData;
      } else if (typedSubmissionsData && Array.isArray(typedSubmissionsData.submissions)) {
        submissionsArray = typedSubmissionsData.submissions;
      } else if (typedSubmissionsData && typedSubmissionsData.submissions) {
        // Handle case where submissions might be an object or other structure
        submissionsArray = [];
      }
      
      // Validate and clean submissions data
      const cleanedSubmissions = submissionsArray
        .filter(sub => sub && typeof sub === 'object' && sub.id)
        .map(sub => ({
          id: sub.id,
          student_email: sub.student_email || sub.email || 'No email',
          student_name: sub.student_name || sub.name || sub.student_email?.split('@')[0] || 'Student',
          total_score: Number(sub.total_score) || 0,
          max_possible_score: Number(sub.max_possible_score) || 0,
          percentage: Number(sub.percentage) || 0,
          submitted_at: sub.submitted_at || sub.created_at || null,
          time_taken_seconds: Number(sub.time_taken_seconds) || 0
        }));
      
      setSubmissions(cleanedSubmissions);
    } catch (error) {
      console.error('Error loading contest data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load contest data');
      toast({
        title: "Error",
        description: "Failed to load contest details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  const getContestStatus = (startTime: string, endTime: string): "not_started" | "in_progress" | "ended" => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now < start) return "not_started";
    if (now >= start && now <= end) return "in_progress";
    return "ended";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <Play className="h-4 w-4" />;
      case 'ended':
        return <Square className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-emerald-600 bg-emerald-50';
    if (percentage >= 80) return 'text-green-600 bg-green-50';
    if (percentage >= 70) return 'text-blue-600 bg-blue-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    if (percentage >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getPerformanceStats = () => {
    if (submissions.length === 0) return { excellent: 0, good: 0, average: 0, poor: 0 };
    
    const stats = { excellent: 0, good: 0, average: 0, poor: 0 };
    submissions.forEach(sub => {
      const percentage = sub.percentage || 0;
      if (percentage >= 80) stats.excellent++;
      else if (percentage >= 70) stats.good++;
      else if (percentage >= 50) stats.average++;
      else stats.poor++;
    });
    
    return stats;
  };

  const getProblemStatistics = () => {
    if (!problems.length || !submissions.length) return [];
    
    return problems.map(problem => {
      // For now, we'll show basic stats. In a real implementation, 
      // you'd need to fetch individual submission answers to calculate correct answers
      const submissionCount = submissions.length;
      const correctCount = Math.floor(submissionCount * 0.7); // Placeholder - would need actual answer analysis
      
      return {
        ...problem,
        submissionCount,
        correctCount,
        correctPercentage: submissionCount > 0 ? (correctCount / submissionCount) * 100 : 0
      };
    });
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'single_choice': return 'Single Choice';
      case 'multiple_choice': return 'Multiple Choice';
      case 'long_answer': return 'Long Answer';
      default: return type;
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'single_choice': return <Target className="h-4 w-4 text-blue-600" />;
      case 'multiple_choice': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'long_answer': return <FileText className="h-4 w-4 text-purple-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleExportResults = async (format: 'excel' | 'csv' = 'excel') => {
    if (!id) {
      toast({
        title: "Error",
        description: "Contest ID not found",
        variant: "destructive"
      });
      return;
    }

    if (submissions.length === 0) {
      toast({
        title: "No Data",
        description: "No submissions available to export",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiService.exportResults(id, format);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contest_results_${contest.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `Results exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: `Failed to export results as ${format.toUpperCase()}`,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Loading Contest</h3>
              <p className="text-gray-500">Fetching contest details and submissions...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !contest) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Contest Not Found</h2>
              <p className="text-gray-600 leading-relaxed">
                {error || "The contest you're looking for doesn't exist or you don't have access to it."}
              </p>
            </div>
            <Button 
              onClick={() => navigate('/admin/contests')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contests
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const averageScore = submissions.length > 0 
    ? submissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / submissions.length 
    : 0;

  const status = getContestStatus(contest.start_time, contest.end_time);
  const performanceStats = getPerformanceStats();

  return (
    <Layout>
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="space-y-4">
        <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/contests')}
              className="hover:bg-gray-50 border-gray-200"
            >
            <ArrowLeft className="h-4 w-4" />
          </Button>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {contest.name}
                </h1>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(status)}
                  <StatusBadge status={status} />
                </div>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                {contest.description || 'No description available'}
              </p>
            </div>
          </div>

          {/* Course and Active Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-lg">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">{contest.course_name}</span>
            </div>
            <Badge 
              variant={contest.is_active ? "default" : "secondary"}
              className={contest.is_active ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-gray-100 text-gray-600"}
            >
              {contest.is_active ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Disabled
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Total Questions</p>
                  <p className="text-3xl font-bold text-blue-900">{contest.problem_count || 0}</p>
                  <p className="text-xs text-blue-700 mt-1">Available problems</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-200/50">
                  <Target className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Submissions</p>
                  <p className="text-3xl font-bold text-green-900">{submissions.length}</p>
                  <p className="text-xs text-green-700 mt-1">Student attempts</p>
                </div>
                <div className="p-3 rounded-xl bg-green-200/50">
                  <Users className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">Max Score</p>
                  <p className="text-3xl font-bold text-purple-900">{contest.max_possible_score || 0}</p>
                  <p className="text-xs text-purple-700 mt-1">Points possible</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-200/50">
                  <Trophy className="h-6 w-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 mb-1">Average Score</p>
                  <p className="text-3xl font-bold text-orange-900">{averageScore.toFixed(1)}%</p>
                  <p className="text-xs text-orange-700 mt-1">Class performance</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-200/50">
                  <TrendingUp className="h-6 w-6 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contest Information */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                <span>Contest Schedule</span>
              </CardTitle>

            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-500">
                  <Play className="h-4 w-4" />
                  <span>Start Time</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(contest.start_time).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-500">
                  <Square className="h-4 w-4" />
                  <span>End Time</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(contest.end_time).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-500">
                  <Timer className="h-4 w-4" />
                  <span>Duration</span>
              </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDuration(contest.start_time, contest.end_time)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Contest Button */}
        {problems.length > 0 && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Preview Contest</h3>
                    <p className="text-gray-600">
                      Experience the contest from a student's perspective with answers and explanations
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowPreviewModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Contest
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Problems Section */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-gray-600" />
                <span>Contest Problems</span>
                <Badge variant="secondary" className="ml-2">{problems.length}</Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {problems.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Problems Found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  This contest doesn't have any problems configured yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-900">Problem</TableHead>
                      <TableHead className="font-semibold text-gray-900">Type</TableHead>
                      <TableHead className="font-semibold text-gray-900">Marks</TableHead>
                      <TableHead className="font-semibold text-gray-900">Submissions</TableHead>
                      <TableHead className="font-semibold text-gray-900">Correct Answers</TableHead>
                      <TableHead className="font-semibold text-gray-900">Success Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getProblemStatistics().map((problem, index) => (
                      <TableRow key={problem.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900 line-clamp-2">
                              {problem.title || `Problem ${index + 1}`}
                            </div>
                            {problem.description && (
                              <div className="text-sm text-gray-500 line-clamp-1">
                                {problem.description.substring(0, 100)}...
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getQuestionTypeIcon(problem.question_type)}
                            <span className="text-sm font-medium">
                              {getQuestionTypeLabel(problem.question_type)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                            {problem.marks} pts
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold text-gray-900">
                              {problem.submissionCount}
                            </span>
                            <span className="text-gray-500">
                              / {submissions.length}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="font-semibold text-green-700">
                              {problem.correctCount}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Badge 
                              className={`${
                                problem.correctPercentage >= 80 
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : problem.correctPercentage >= 60
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                  : 'bg-red-100 text-red-800 border-red-200'
                              } font-medium`}
                            >
                              {problem.correctPercentage.toFixed(1)}%
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Overview */}
        {submissions.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                <Award className="h-5 w-5 text-gray-600" />
                <span>Performance Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">{performanceStats.excellent}</div>
                  <div className="text-sm text-emerald-700 font-medium">Excellent (80%+)</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{performanceStats.good}</div>
                  <div className="text-sm text-blue-700 font-medium">Good (70-79%)</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{performanceStats.average}</div>
                  <div className="text-sm text-yellow-700 font-medium">Average (50-69%)</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{performanceStats.poor}</div>
                  <div className="text-sm text-red-700 font-medium">Below Average (&lt;50%)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submissions Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                <FileText className="h-5 w-5 text-gray-600" />
                <span>Student Submissions</span>
                <Badge variant="secondary" className="ml-2">{submissions.length}</Badge>
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="hover:bg-green-50 hover:border-green-300"
                    disabled={submissions.length === 0}
                    title={submissions.length === 0 ? "No submissions available to export" : "Export contest results"}
                  >
                <Download className="h-4 w-4 mr-2" />
                Export Results
                    <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExportResults('excel')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export to Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportResults('csv')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export to CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {submissions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Submissions Yet</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Students haven't submitted their responses for this contest yet. Check back later or remind students about the deadline.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-900">Student</TableHead>
                      <TableHead className="font-semibold text-gray-900">Email</TableHead>
                      <TableHead className="font-semibold text-gray-900">Score</TableHead>
                      <TableHead className="font-semibold text-gray-900">Grade</TableHead>
                      <TableHead className="font-semibold text-gray-900">Time Taken</TableHead>
                      <TableHead className="font-semibold text-gray-900">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                    {submissions.map((submission) => {
                      const studentName = submission.student_name || 'Unknown Student';
                      const studentEmail = submission.student_email || 'No email';
                      const totalScore = submission.total_score || 0;
                      const maxScore = submission.max_possible_score || 0;
                      const percentage = submission.percentage || 0;
                      const timeTaken = submission.time_taken_seconds || 0;
                      const submittedAt = submission.submitted_at;
                      
                      return (
                        <TableRow key={submission.id} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {studentName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-medium text-gray-900">{studentName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-gray-600">{studentEmail}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-900">
                                {totalScore}
                              </span>
                              <span className="text-gray-500">/ {maxScore}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={`${getGradeColor(percentage)} border-0 font-medium`}
                            >
                              {percentage.toFixed(1)}%
                            </Badge>
                          </TableCell>
                    <TableCell>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">{formatTime(timeTaken)}</span>
                            </div>
                    </TableCell>
                    <TableCell>
                            {submittedAt ? (
                              <span className="text-gray-600 text-sm">
                                {new Date(submittedAt).toLocaleDateString()} at{' '}
                                {new Date(submittedAt).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                      </span>
                            ) : (
                              <span className="text-gray-400 text-sm">No date</span>
                            )}
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
      </div>

      {/* Contest Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Contest Preview - {contest?.name}
            </DialogTitle>
          </DialogHeader>
          
          {problems.length > 0 && (
            <div className="space-y-6 mt-6">
              {/* Question Navigation Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Question {currentPreviewQuestion + 1} of {problems.length}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Admin Preview - All correct answers and explanations are visible
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      <Award className="h-4 w-4 mr-1" />
                      {problems[currentPreviewQuestion]?.marks} marks
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      {getQuestionTypeLabel(problems[currentPreviewQuestion]?.question_type)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Question Content */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* Question Title and Description */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 leading-relaxed">
                        {problems[currentPreviewQuestion]?.title}
                      </h3>
                      <div className="prose prose-gray max-w-none">
                        <p className="text-gray-700 text-lg leading-relaxed">
                          {problems[currentPreviewQuestion]?.description}
                        </p>
                      </div>
                    </div>

                    {/* Question Image */}
                    {problems[currentPreviewQuestion]?.image_url && (
                      <div className="flex justify-center">
                        <img
                          src={
                            problems[currentPreviewQuestion].image_url.startsWith('http') 
                              ? problems[currentPreviewQuestion].image_url 
                              : `${API_SERVER_URL}${problems[currentPreviewQuestion].image_url}`
                          }
                          alt="Question image"
                          className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                          style={{ maxHeight: '400px' }}
                        />
                      </div>
                    )}

                    {/* Options (for MCQ) */}
                    {problems[currentPreviewQuestion]?.question_type !== 'long_answer' && (
                      <div className="space-y-4">
                        {[
                          { key: 'A', text: problems[currentPreviewQuestion]?.option_a },
                          { key: 'B', text: problems[currentPreviewQuestion]?.option_b },
                          { key: 'C', text: problems[currentPreviewQuestion]?.option_c },
                          { key: 'D', text: problems[currentPreviewQuestion]?.option_d }
                        ].filter(option => option.text).map((option) => {
                          const isCorrect = problems[currentPreviewQuestion]?.correct_options?.includes(option.key);
                          
                          return (
                            <div 
                              key={option.key} 
                              className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                                isCorrect 
                                  ? 'border-green-500 bg-green-50' 
                                  : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="flex items-start space-x-4">
                                <div className={`flex-shrink-0 w-8 h-8 border-2 rounded-full flex items-center justify-center font-bold text-sm ${
                                  isCorrect 
                                    ? 'border-green-500 bg-green-500 text-white'
                                    : 'border-gray-300 text-gray-600'
                                }`}>
                                  {isCorrect ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                  ) : (
                                    option.key
                                  )}
                                </div>
                                <div className="flex-1">
                                  <Label className={`text-base leading-relaxed ${
                                    isCorrect ? 'text-green-900 font-medium' : 'text-gray-900'
                                  }`}>
                                    <span className="font-semibold mr-2">{option.key})</span>
                                    {option.text}
                                  </Label>
                                  {isCorrect && (
                                    <div className="mt-2">
                                      <Badge className="bg-green-100 text-green-800 border-green-200">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Correct Answer
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Long Answer Template (for Long Answer questions) */}
                    {problems[currentPreviewQuestion]?.question_type === 'long_answer' && (
                      <div className="space-y-4">
                        <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                          <div className="flex items-center space-x-2 mb-3">
                            <FileText className="h-5 w-5 text-gray-500" />
                            <span className="font-medium text-gray-700">Long Answer Response Area</span>
                          </div>
                          <Textarea
                            placeholder="Students would write their detailed answer here..."
                            className="min-h-[120px] bg-white"
                            disabled
                          />
                          <p className="text-sm text-gray-500 mt-2">
                            This question requires manual review and grading by instructors.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Correct Answer Section */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-bold text-green-900">Correct Answer</span>
                      </div>
                      <div className="prose prose-green max-w-none">
                        <p className="text-green-800 leading-relaxed">
                          {problems[currentPreviewQuestion]?.question_type === 'long_answer' 
                            ? 'This is a long answer question that requires manual evaluation by instructors.'
                            : problems[currentPreviewQuestion]?.correct_options?.map(opt => `Option ${opt}`).join(', ') || 'No correct answer specified'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Explanation Section */}
                    {problems[currentPreviewQuestion]?.explanation && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex items-center space-x-2 mb-3">
                          <Info className="h-5 w-5 text-blue-600" />
                          <span className="font-bold text-blue-900">Explanation</span>
                        </div>
                        <div className="prose prose-blue max-w-none">
                          <p className="text-blue-800 leading-relaxed">
                            {problems[currentPreviewQuestion].explanation}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Navigation Controls */}
              <div className="flex justify-between items-center pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPreviewQuestion(Math.max(0, currentPreviewQuestion - 1))}
                  disabled={currentPreviewQuestion === 0}
                  className="px-6 py-3"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous Question
                </Button>

                <div className="flex items-center space-x-4">
                  {/* Question Numbers */}
                  <div className="flex space-x-1">
                    {problems.slice(0, 10).map((_, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant={index === currentPreviewQuestion ? "default" : "outline"}
                        className={`w-8 h-8 text-xs ${
                          index === currentPreviewQuestion
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'hover:bg-blue-50'
                        }`}
                        onClick={() => setCurrentPreviewQuestion(index)}
                      >
                        {index + 1}
                      </Button>
                    ))}
                    {problems.length > 10 && (
                      <span className="text-sm text-gray-500 self-center px-2">
                        +{problems.length - 10} more
                      </span>
                    )}
                  </div>
                </div>

                <Button 
                  variant="outline"
                  onClick={() => setCurrentPreviewQuestion(Math.min(problems.length - 1, currentPreviewQuestion + 1))}
                  disabled={currentPreviewQuestion === problems.length - 1}
                  className="px-6 py-3"
                >
                  Next Question
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ContestDetails;
