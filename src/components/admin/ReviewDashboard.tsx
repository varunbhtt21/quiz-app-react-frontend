import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Eye, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Filter,
  Save,
  RotateCcw,
  TrendingUp,
  Users,
  Target,
  Award,
  Brain,
  Edit,
  Search,
  Star,
  Calendar,
  Timer,
  BookOpen,
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  Activity,
  BarChart3
} from 'lucide-react';
import { apiService } from '../../services/api';
import { toast } from '@/hooks/use-toast';
import { 
  PendingReviewsResponse, 
  PendingReview, 
  ReviewItem,
  SubmissionDetailResponse,
  DetailedProblem,
  ReviewAnalytics,
  ProblemReview,
  SubmissionReviewUpdate,
  RescoreResult 
} from '../../types/review';

interface ReviewDashboardProps {
  selectedContestId?: string;
  onRefreshResults?: () => void;
}

const ReviewDashboard: React.FC<ReviewDashboardProps> = ({
  selectedContestId,
  onRefreshResults
}) => {
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [analytics, setAnalytics] = useState<ReviewAnalytics | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewScores, setReviewScores] = useState<Record<string, number>>({});
  const [reviewFeedback, setReviewFeedback] = useState<Record<string, string>>({});
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [filterScoringMethod, setFilterScoringMethod] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  useEffect(() => {
    loadPendingReviews();
    loadAnalytics();
  }, [selectedContestId, filterScoringMethod]);

  const loadPendingReviews = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPendingReviews(
        undefined, 
        selectedContestId, 
        filterScoringMethod === 'all' ? undefined : filterScoringMethod
      ) as PendingReviewsResponse;
      
      setPendingReviews(response.pending_reviews);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load pending reviews",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await apiService.getReviewAnalytics(
        undefined, 
        selectedContestId
      ) as ReviewAnalytics;
      
      setAnalytics(response);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const openReviewDialog = async (submissionId: string) => {
    try {
      setLoading(true);
      const response = await apiService.getSubmissionForReview(submissionId) as SubmissionDetailResponse;
      setSelectedSubmission(response);
      
      // Initialize review scores with current scores
      const scores: Record<string, number> = {};
      const feedback: Record<string, string> = {};
      
      response.problems.forEach(problem => {
        if (problem.needs_review) {
          scores[problem.problem_id] = problem.current_score;
          feedback[problem.problem_id] = '';
        }
      });
      
      setReviewScores(scores);
      setReviewFeedback(feedback);
      setGeneralFeedback('');
      setReviewDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load submission details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (problemId: string, score: number) => {
    setReviewScores(prev => ({
      ...prev,
      [problemId]: score
    }));
  };

  const handleFeedbackChange = (problemId: string, feedback: string) => {
    setReviewFeedback(prev => ({
      ...prev,
      [problemId]: feedback
    }));
  };

  const submitReview = async () => {
    if (!selectedSubmission) return;

    try {
      const problemReviews: ProblemReview[] = Object.entries(reviewScores).map(([problemId, score]) => ({
        problem_id: problemId,
        new_score: score,
        feedback: reviewFeedback[problemId] || undefined
      }));

      const reviewData: SubmissionReviewUpdate = {
        problem_reviews: problemReviews,
        general_feedback: generalFeedback || undefined
      };

      await apiService.updateSubmissionReview(selectedSubmission.submission.id, reviewData);
      
      toast({
        title: "✅ Review Completed",
        description: "Review submitted successfully with updated scores",
      });

      setReviewDialogOpen(false);
      loadPendingReviews();
      loadAnalytics();
      if (onRefreshResults) {
        onRefreshResults();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive"
      });
    }
  };

  const handleKeywordRescore = async (submissionId: string, problemIds?: string[]) => {
    try {
      const result = await apiService.rescoreWithKeywords(submissionId, problemIds) as RescoreResult;
      
      toast({
        title: "Rescore Complete",
        description: `Rescored ${result.rescored_problems.length} problems. Score change: ${result.total_score_change > 0 ? '+' : ''}${result.total_score_change}`,
      });

      loadPendingReviews();
      loadAnalytics();
      if (onRefreshResults) {
        onRefreshResults();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rescore with keywords",
        variant: "destructive"
      });
    }
  };

  const getPriorityBadge = (priority: 'low' | 'medium' | 'high') => {
    const config = {
      high: {
        style: 'bg-red-100 text-red-800 border border-red-200',
        label: 'High Priority',
        icon: <AlertTriangle className="h-3 w-3" />
      },
      medium: {
        style: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        label: 'Medium Priority',
        icon: <Clock className="h-3 w-3" />
      },
      low: {
        style: 'bg-green-100 text-green-800 border border-green-200',
        label: 'Low Priority',
        icon: <CheckCircle className="h-3 w-3" />
      }
    };

    const { style, label, icon } = config[priority];

    return (
      <Badge className={`${style} font-medium px-2 py-1 flex items-center space-x-1`}>
        {icon}
        <span>{label}</span>
      </Badge>
    );
  };

  const getScoringMethodBadge = (method: string) => {
    const config: Record<string, { style: string; label: string; icon: React.ReactNode }> = {
      manual: {
        style: 'bg-blue-100 text-blue-800 border border-blue-200',
        label: 'Manual Review',
        icon: <Edit className="h-3 w-3" />
      },
      keyword_based: {
        style: 'bg-purple-100 text-purple-800 border border-purple-200',
        label: 'Keyword Based',
        icon: <Search className="h-3 w-3" />
      },
      manual_fallback: {
        style: 'bg-orange-100 text-orange-800 border border-orange-200',
        label: 'Manual Fallback',
        icon: <RotateCcw className="h-3 w-3" />
      }
    };

    const methodConfig = config[method] || {
      style: 'bg-gray-100 text-gray-800 border border-gray-200',
      label: method.replace('_', ' '),
      icon: <FileText className="h-3 w-3" />
    };

    return (
      <Badge className={`${methodConfig.style} font-medium px-2 py-1 flex items-center space-x-1`}>
        {methodConfig.icon}
        <span>{methodConfig.label}</span>
      </Badge>
    );
  };

  const filteredReviews = pendingReviews.filter(review =>
    review.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.student_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.contest_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const reviewProgress = analytics ? (analytics.manually_reviewed / Math.max(analytics.total_long_answer_questions, 1)) * 100 : 0;
  const autoScoredProgress = analytics ? (analytics.keyword_scored / Math.max(analytics.total_long_answer_questions, 1)) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FileText className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">📋 Manual Review Center</h1>
                  <p className="text-indigo-100 text-lg">Comprehensive Submission Review System</p>
                </div>
              </div>
              {analytics && (
                <div className="flex items-center space-x-6">
                  <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                    <Timer className="h-4 w-4 mr-1" />
                    {analytics.manual_review_pending} Pending
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                    <Target className="h-4 w-4 mr-1" />
                    {analytics.keyword_scored} Auto-Scored
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    {reviewProgress.toFixed(1)}% Complete
                  </Badge>
                </div>
              )}
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                <BarChart3 className="h-16 w-16 text-indigo-200" />
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      {/* Enhanced Analytics Dashboard */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Pending Reviews</p>
                  <p className="text-3xl font-bold text-blue-900">{analytics.manual_review_pending}</p>
                  <p className="text-xs text-blue-700 mt-1">Require attention</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-200/50">
                  <Timer className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

                     <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-purple-50 to-purple-100">
             <CardContent className="p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-purple-600 mb-1">Auto-Scored</p>
                   <p className="text-3xl font-bold text-purple-900">{analytics.keyword_scored}</p>
                   <p className="text-xs text-purple-700 mt-1">Automated scoring</p>
                 </div>
                 <div className="p-3 rounded-xl bg-purple-200/50">
                   <Target className="h-6 w-6 text-purple-700" />
                 </div>
               </div>
             </CardContent>
           </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-green-900">{analytics.manually_reviewed}</p>
                  <p className="text-xs text-green-700 mt-1">Reviews finished</p>
                </div>
                <div className="p-3 rounded-xl bg-green-200/50">
                  <CheckCircle2 className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

                     <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-orange-50 to-orange-100">
             <CardContent className="p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-orange-600 mb-1">Accuracy Rate</p>
                   <p className="text-3xl font-bold text-orange-900">{analytics.average_keyword_accuracy.toFixed(1)}%</p>
                   <p className="text-xs text-orange-700 mt-1">System precision</p>
                 </div>
                 <div className="p-3 rounded-xl bg-orange-200/50">
                   <Award className="h-6 w-6 text-orange-700" />
                 </div>
               </div>
             </CardContent>
           </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl">
          <TabsTrigger 
            value="pending" 
            className="flex items-center space-x-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
          >
            <Timer className="h-4 w-4" />
            <span>Pending Reviews ({filteredReviews.length})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="analytics"
            className="flex items-center space-x-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analytics & Insights</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6 mt-6">
          {/* Enhanced Search and Filters */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-gray-100">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Search students, contests, or emails..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                                 <div className="lg:w-64">
                   <Select value={filterScoringMethod} onValueChange={setFilterScoringMethod}>
                     <SelectTrigger className="h-12 border-gray-200">
                       <SelectValue placeholder="Filter by method" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">All Methods</SelectItem>
                       <SelectItem value="manual">Manual Review</SelectItem>
                       <SelectItem value="keyword_based">Keyword Based</SelectItem>
                       <SelectItem value="manual_fallback">Manual Fallback</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                <Button 
                  onClick={loadPendingReviews} 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 h-12 px-6"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Review List */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <div className="flex justify-between items-center">
                                 <div>
                   <CardTitle className="text-xl flex items-center space-x-2">
                     <Sparkles className="h-5 w-5 text-indigo-600" />
                     <span>Review Queue</span>
                   </CardTitle>
                   <p className="text-gray-600 text-sm mt-1">Prioritized submissions requiring review</p>
                 </div>
                {filteredReviews.length > 0 && (
                  <Badge className="bg-indigo-100 text-indigo-800 px-3 py-1">
                    {filteredReviews.length} items
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                        <RefreshCw className="h-8 w-8 text-white animate-spin" />
                      </div>
                    </div>
                    <p className="text-gray-600 font-medium">Loading reviews...</p>
                  </div>
                </div>
              ) : filteredReviews.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                                     <h3 className="text-xl font-bold text-gray-900 mb-3">🎉 All Caught Up!</h3>
                   <p className="text-gray-600 mb-2">No pending reviews found.</p>
                   <p className="text-sm text-gray-500">All submissions have been reviewed or auto-scored by the system.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredReviews.map((review, index) => (
                    <div 
                      key={review.submission_id} 
                      className="p-6 hover:bg-gray-50 transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {review.student_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-bold text-gray-900 truncate">
                                {review.student_name || 'Unknown Student'}
                              </h4>
                              <p className="text-sm text-gray-600 truncate">{review.student_email}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center space-x-2">
                              <BookOpen className="h-4 w-4 text-indigo-600" />
                              <span className="text-sm font-medium text-gray-900">{review.contest_name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-gray-600">
                                {new Date(review.submitted_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Target className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-bold text-gray-900">
                                {review.total_score}/{review.max_possible_score}
                              </span>
                              <Badge className="bg-purple-100 text-purple-800 text-xs">
                                {((review.total_score / review.max_possible_score) * 100).toFixed(1)}%
                              </Badge>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {(review.review_items || []).map((item, itemIndex) => (
                              <div key={item.problem_id} className="flex items-center space-x-2">
                                {getPriorityBadge(item.review_priority)}
                                {getScoringMethodBadge(item.scoring_method)}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 ml-4">
                          <Button
                            size="lg"
                            onClick={() => openReviewDialog(review.submission_id)}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 group-hover:shadow-lg transition-all duration-200"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                                                     <Button
                             size="lg"
                             variant="outline"
                             onClick={() => handleKeywordRescore(review.submission_id)}
                             className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 group-hover:shadow-lg transition-all duration-200"
                           >
                             <RotateCcw className="h-4 w-4 mr-2" />
                             Rescore
                           </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Enhanced Scoring Method Breakdown */}
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                  <CardTitle className="text-xl flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Scoring Distribution</span>
                  </CardTitle>
                  <p className="text-gray-600 text-sm mt-1">How submissions are being evaluated</p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {Object.entries(analytics.scoring_method_breakdown || {}).map(([method, count]) => {
                      const percentage = analytics.total_long_answer_questions > 0 
                        ? (count / analytics.total_long_answer_questions) * 100 
                        : 0;
                      return (
                        <div key={method} className="space-y-2">
                          <div className="flex items-center justify-between">
                            {getScoringMethodBadge(method)}
                            <div className="text-right">
                              <div className="font-bold text-lg">{count}</div>
                              <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                            </div>
                          </div>
                          <Progress 
                            value={percentage} 
                            className="h-2"
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Review Progress */}
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
                  <CardTitle className="text-xl flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    <span>Review Progress</span>
                  </CardTitle>
                  <p className="text-gray-600 text-sm mt-1">Overall completion status</p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span className="font-medium">Manual Reviews</span>
                        </div>
                        <span className="font-bold">{analytics.manually_reviewed}/{analytics.total_long_answer_questions}</span>
                      </div>
                      <Progress 
                        value={reviewProgress} 
                        className="h-3"
                      />
                      <p className="text-sm text-gray-600 text-right">{reviewProgress.toFixed(1)}% Complete</p>
                    </div>
                    
                    <Separator />
                    
                                         <div className="space-y-3">
                       <div className="flex justify-between items-center">
                         <div className="flex items-center space-x-2">
                           <Target className="h-5 w-5 text-purple-600" />
                           <span className="font-medium">Auto-Scored</span>
                         </div>
                         <span className="font-bold">{analytics.keyword_scored}/{analytics.total_long_answer_questions}</span>
                       </div>
                       <Progress 
                         value={autoScoredProgress} 
                         className="h-3 bg-purple-100"
                       />
                       <p className="text-sm text-gray-600 text-right">{autoScoredProgress.toFixed(1)}% Automated</p>
                     </div>

                    {analytics.average_keyword_accuracy > 0 && (
                      <>
                        <Separator />
                                                 <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                           <div className="flex items-center space-x-2 mb-2">
                             <Star className="h-5 w-5 text-yellow-500" />
                             <span className="font-bold text-gray-900">System Accuracy</span>
                           </div>
                           <div className="text-2xl font-bold text-indigo-600">
                             {analytics.average_keyword_accuracy.toFixed(1)}%
                           </div>
                           <p className="text-sm text-gray-600">Keyword matching precision</p>
                         </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Enhanced Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="border-b pb-4">
                         <DialogTitle className="text-2xl flex items-center space-x-3">
               <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                 <Edit className="h-5 w-5 text-white" />
               </div>
               <span>Review Submission</span>
             </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[calc(90vh-120px)]">
            {selectedSubmission && (
              <div className="space-y-6 p-6">
                {/* Enhanced Submission Info */}
                <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-gray-100">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      <span>Submission Overview</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-500">Student</p>
                          <p className="font-medium">{selectedSubmission.submission.student_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-500">Contest</p>
                          <p className="font-medium">{selectedSubmission.submission.contest_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-xs text-gray-500">Submitted</p>
                          <p className="font-medium">{new Date(selectedSubmission.submission.submitted_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Timer className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-xs text-gray-500">Time Taken</p>
                          <p className="font-medium">{Math.floor(selectedSubmission.submission.time_taken_seconds / 60)} min</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Problems for Review */}
                <div className="space-y-6">
                  {(selectedSubmission.problems || [])
                    .filter(problem => problem.needs_review)
                    .map((problem, index) => (
                      <Card key={problem.problem_id} className="border-0 shadow-xl">
                        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                {index + 1}
                              </div>
                              <span>{problem.title}</span>
                            </CardTitle>
                            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1">
                              {problem.marks} marks
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                          {/* Question */}
                          <div>
                            <Label className="text-sm font-bold text-gray-700 flex items-center space-x-2 mb-3">
                              <FileText className="h-4 w-4" />
                              <span>Question:</span>
                            </Label>
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                              <p className="text-gray-800 leading-relaxed">{problem.question}</p>
                            </div>
                          </div>

                          {/* Student Answer */}
                          <div>
                            <Label className="text-sm font-bold text-gray-700 flex items-center space-x-2 mb-3">
                              <Edit className="h-4 w-4" />
                              <span>Student Answer:</span>
                            </Label>
                            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                              <p className="text-gray-800 leading-relaxed">{problem.student_answer}</p>
                            </div>
                          </div>

                          {/* Enhanced Keyword Analysis */}
                          {problem.keyword_analysis && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div>
                                <Label className="text-sm font-bold text-green-700 flex items-center space-x-2 mb-3">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>Found Keywords:</span>
                                </Label>
                                <div className="flex flex-wrap gap-2 p-4 bg-green-50 rounded-xl border border-green-200 min-h-[60px]">
                                  {(problem.keyword_analysis.found_keywords || []).map(keyword => (
                                    <Badge key={keyword} className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 shadow-sm">
                                      ✓ {keyword}
                                    </Badge>
                                  ))}
                                  {(!problem.keyword_analysis.found_keywords || problem.keyword_analysis.found_keywords.length === 0) && (
                                    <span className="text-gray-500 italic">No keywords found</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-bold text-red-700 flex items-center space-x-2 mb-3">
                                  <XCircle className="h-4 w-4" />
                                  <span>Missing Keywords:</span>
                                </Label>
                                <div className="flex flex-wrap gap-2 p-4 bg-red-50 rounded-xl border border-red-200 min-h-[60px]">
                                  {(problem.keyword_analysis.missing_keywords || []).map(keyword => (
                                    <Badge key={keyword} className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 shadow-sm">
                                      ✗ {keyword}
                                    </Badge>
                                  ))}
                                  {(!problem.keyword_analysis.missing_keywords || problem.keyword_analysis.missing_keywords.length === 0) && (
                                    <span className="text-gray-500 italic">All keywords found</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Enhanced Score Input */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <Label htmlFor={`score-${problem.problem_id}`} className="text-sm font-bold text-gray-700">
                                Score (out of {problem.marks})
                              </Label>
                              <div className="flex items-center space-x-3">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleScoreChange(problem.problem_id, Math.max(0, (reviewScores[problem.problem_id] || 0) - 0.5))}
                                  className="h-10 w-10 p-0"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                  id={`score-${problem.problem_id}`}
                                  type="number"
                                  min={0}
                                  max={problem.marks}
                                  step={0.5}
                                  value={reviewScores[problem.problem_id] || 0}
                                  onChange={(e) => handleScoreChange(problem.problem_id, parseFloat(e.target.value) || 0)}
                                  className="text-center text-lg font-bold h-12"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleScoreChange(problem.problem_id, Math.min(problem.marks, (reviewScores[problem.problem_id] || 0) + 0.5))}
                                  className="h-10 w-10 p-0"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleScoreChange(problem.problem_id, 0)}
                                  className="flex-1"
                                >
                                  0
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleScoreChange(problem.problem_id, problem.marks / 2)}
                                  className="flex-1"
                                >
                                  {problem.marks / 2}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleScoreChange(problem.problem_id, problem.marks)}
                                  className="flex-1"
                                >
                                  {problem.marks}
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <Label htmlFor={`feedback-${problem.problem_id}`} className="text-sm font-bold text-gray-700">
                                Feedback (optional)
                              </Label>
                              <Textarea
                                id={`feedback-${problem.problem_id}`}
                                value={reviewFeedback[problem.problem_id] || ''}
                                onChange={(e) => handleFeedbackChange(problem.problem_id, e.target.value)}
                                placeholder="Provide constructive feedback for the student..."
                                rows={4}
                                className="resize-none"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>

                {/* Enhanced General Feedback */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      <span>Overall Feedback</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={generalFeedback}
                      onChange={(e) => setGeneralFeedback(e.target.value)}
                      placeholder="Provide overall feedback for the entire submission..."
                      rows={4}
                      className="resize-none"
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </ScrollArea>

          {/* Enhanced Actions */}
          <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50">
            <Button 
              variant="outline" 
              onClick={() => setReviewDialogOpen(false)}
              className="px-6"
            >
              Cancel
            </Button>
            <Button 
              onClick={submitReview}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-8"
            >
              <Save className="h-4 w-4 mr-2" />
              Submit Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewDashboard; 