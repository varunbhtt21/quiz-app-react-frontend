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
  Edit
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
        title: "Success",
        description: "Review submitted successfully",
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
        title: "Success",
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
    const styles = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    
    const icons = {
      high: '🔴',
      medium: '🟡', 
      low: '🟢'
    };

    return (
      <Badge className={styles[priority]}>
        {icons[priority]} {priority.toUpperCase()}
      </Badge>
    );
  };

  const getScoringMethodBadge = (method: string) => {
    const styles = {
      manual: 'bg-blue-100 text-blue-800',
      keyword_based: 'bg-purple-100 text-purple-800',
      manual_fallback: 'bg-orange-100 text-orange-800'
    };

    const icons = {
      manual: '✋',
      keyword_based: '🧠',
      manual_fallback: '⚠️'
    };

    return (
      <Badge className={styles[method as keyof typeof styles] || 'bg-gray-100 text-gray-800'}>
        {icons[method as keyof typeof icons] || '❓'} {method.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.manual_review_pending}</div>
              <p className="text-xs text-muted-foreground">
                Pending manual review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auto-Scored</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.keyword_scored}</div>
              <p className="text-xs text-muted-foreground">
                Keyword-based scoring
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.average_keyword_accuracy.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Keyword scoring accuracy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.manually_reviewed}</div>
              <p className="text-xs text-muted-foreground">
                Manually reviewed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pending Reviews ({pendingReviews.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            Analytics & Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label htmlFor="scoring-method">Scoring Method</Label>
                  <Select value={filterScoringMethod} onValueChange={setFilterScoringMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="All methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All methods</SelectItem>
                      <SelectItem value="manual">Manual Review</SelectItem>
                      <SelectItem value="keyword_based">Keyword-based</SelectItem>
                      <SelectItem value="manual_fallback">Manual Fallback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={loadPendingReviews} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pending Reviews Table */}
          <Card>
            <CardHeader>
              <CardTitle>Submissions Requiring Review</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : pendingReviews.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Reviews Pending</h3>
                  <p className="text-muted-foreground">All submissions have been reviewed or auto-scored.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student & Contest</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Review Items</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(pendingReviews || []).map((review) => (
                      <TableRow key={review.submission_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{review.student_name}</div>
                            <div className="text-sm text-muted-foreground">{review.student_email}</div>
                            <div className="text-xs text-muted-foreground">{review.contest_name}</div>
                            <div className="text-xs text-muted-foreground">{review.course_name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(review.submitted_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(review.submitted_at).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {review.total_score}/{review.max_possible_score}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {((review.total_score / review.max_possible_score) * 100).toFixed(1)}%
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            {(review.review_items || []).map((item, index) => (
                              <div key={item.problem_id} className="flex items-center space-x-2">
                                {getPriorityBadge(item.review_priority)}
                                {getScoringMethodBadge(item.scoring_method)}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openReviewDialog(review.submission_id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleKeywordRescore(review.submission_id)}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Rescore
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Scoring Method Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Scoring Method Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(analytics.scoring_method_breakdown || {}).map(([method, count]) => (
                      <div key={method} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getScoringMethodBadge(method)}
                          <span className="text-sm">{method.replace('_', ' ')}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{count}</div>
                          <div className="text-xs text-muted-foreground">
                            {analytics.total_long_answer_questions > 0 
                              ? ((count / analytics.total_long_answer_questions) * 100).toFixed(1)
                              : 0}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Review Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Review Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Completed Reviews</span>
                        <span>{analytics.manually_reviewed}/{analytics.total_long_answer_questions}</span>
                      </div>
                      <Progress 
                        value={analytics.total_long_answer_questions > 0 
                          ? (analytics.manually_reviewed / analytics.total_long_answer_questions) * 100 
                          : 0} 
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Auto-Scored</span>
                        <span>{analytics.keyword_scored}/{analytics.total_long_answer_questions}</span>
                      </div>
                      <Progress 
                        value={analytics.total_long_answer_questions > 0 
                          ? (analytics.keyword_scored / analytics.total_long_answer_questions) * 100 
                          : 0} 
                        className="bg-purple-100"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-6">
              {/* Submission Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Submission Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Student:</span> {selectedSubmission.submission.student_email}
                    </div>
                    <div>
                      <span className="font-medium">Contest:</span> {selectedSubmission.submission.contest_name}
                    </div>
                    <div>
                      <span className="font-medium">Submitted:</span> {new Date(selectedSubmission.submission.submitted_at).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Time Taken:</span> {Math.floor(selectedSubmission.submission.time_taken_seconds / 60)} minutes
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Problems for Review */}
              {(selectedSubmission.problems || [])
                .filter(problem => problem.needs_review)
                .map(problem => (
                  <Card key={problem.problem_id}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{problem.title}</span>
                        <Badge>{problem.marks} marks</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Question */}
                      <div>
                        <Label className="text-sm font-medium">Question:</Label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">
                          {problem.question}
                        </div>
                      </div>

                      {/* Student Answer */}
                      <div>
                        <Label className="text-sm font-medium">Student Answer:</Label>
                        <div className="p-3 bg-blue-50 rounded-md text-sm">
                          {problem.student_answer}
                        </div>
                      </div>

                      {/* Keyword Analysis */}
                      {problem.keyword_analysis && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-green-600">Found Keywords:</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(problem.keyword_analysis.found_keywords || []).map(keyword => (
                                <Badge key={keyword} className="bg-green-100 text-green-800">
                                  {keyword}
                                </Badge>
                              ))}
                              {(!problem.keyword_analysis.found_keywords || problem.keyword_analysis.found_keywords.length === 0) && (
                                <span className="text-sm text-gray-500">None</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-red-600">Missing Keywords:</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(problem.keyword_analysis.missing_keywords || []).map(keyword => (
                                <Badge key={keyword} className="bg-red-100 text-red-800">
                                  {keyword}
                                </Badge>
                              ))}
                              {(!problem.keyword_analysis.missing_keywords || problem.keyword_analysis.missing_keywords.length === 0) && (
                                <span className="text-sm text-gray-500">None</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Score Input */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`score-${problem.problem_id}`}>Score (out of {problem.marks})</Label>
                          <Input
                            id={`score-${problem.problem_id}`}
                            type="number"
                            min={0}
                            max={problem.marks}
                            step={0.5}
                            value={reviewScores[problem.problem_id] || 0}
                            onChange={(e) => handleScoreChange(problem.problem_id, parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`feedback-${problem.problem_id}`}>Feedback (optional)</Label>
                          <Input
                            id={`feedback-${problem.problem_id}`}
                            value={reviewFeedback[problem.problem_id] || ''}
                            onChange={(e) => handleFeedbackChange(problem.problem_id, e.target.value)}
                            placeholder="Feedback for student..."
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {/* General Feedback */}
              <div>
                <Label htmlFor="general-feedback">General Feedback (optional)</Label>
                <Textarea
                  id="general-feedback"
                  value={generalFeedback}
                  onChange={(e) => setGeneralFeedback(e.target.value)}
                  placeholder="Overall feedback for the submission..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submitReview}>
                  <Save className="h-4 w-4 mr-2" />
                  Submit Review
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewDashboard; 