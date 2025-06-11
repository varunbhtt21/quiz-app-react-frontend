import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, NavigateOptions } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import ContestTimer from '../../components/common/ContestTimer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Clock, Send, Loader2, AlertTriangle, CheckCircle, Circle, BookOpen, Target, Timer, Award, Check, CheckSquare, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '../../services/api';
import { API_SERVER_URL } from '../../config/api';
import { useServerTime } from '../../hooks/useServerTime';
import { useContestTimer } from '../../hooks/useContestTimer';
import { formatDateTime, formatTimer } from '../../utils/timeUtils';

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
}

interface Contest {
  id: string;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  problems: ContestProblem[];
}

const ContestTaking = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Server time synchronization
  const { serverNow, isConnected: serverTimeConnected } = useServerTime();
  
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[] | string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const [detailedSubmission, setDetailedSubmission] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [currentReviewQuestion, setCurrentReviewQuestion] = useState(0);

  // Simple contest security state
  const [contestInProgress, setContestInProgress] = useState(false);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Handle auto-submission when time expires
  const handleAutoSubmit = useCallback(async () => {
    if (!contest || submitting || hasSubmitted) return;
    
    // Deactivate contest security for auto-submit
    setContestInProgress(false);
    
    toast({
      title: "Time's Up!",
      description: "Contest auto-submitted due to time limit"
    });
    
    try {
      setSubmitting(true);
      
      // Calculate time taken using server time
      const now = serverNow();
      const startTime = new Date(contest.start_time).getTime();
      const endTime = new Date(contest.end_time).getTime();
      const totalContestTime = endTime - startTime;
      const timeTaken = Math.floor(totalContestTime / 1000);

      // Convert answers to the format expected by the API
      const formattedAnswers = Object.keys(answers).reduce((acc, questionId) => {
        const answer = answers[questionId];
        const problem = contest.problems.find(p => p.id === questionId);
        
        if (problem?.question_type === 'long_answer') {
          // Long Answer questions MUST be strings
          if (Array.isArray(answer)) {
            // If somehow stored as array, join it
            acc[questionId] = answer.join(' ').trim();
          } else if (typeof answer === 'string') {
            acc[questionId] = answer.trim();
          } else {
            // Fallback to empty string
            acc[questionId] = '';
          }
        } else {
          // MCQ questions expect array format
          if (Array.isArray(answer)) {
            acc[questionId] = answer.filter(a => a && a.trim().length > 0);
          } else if (typeof answer === 'string' && answer.trim().length > 0) {
            acc[questionId] = [answer.trim()];
          } else {
            acc[questionId] = [];
          }
        }
        return acc;
      }, {} as Record<string, string[] | string>);
      
      // Debug logging to help diagnose submission issues
      console.log('🔍 Formatted answers for submission:', formattedAnswers);
      Object.entries(formattedAnswers).forEach(([questionId, answer]) => {
        const problem = contest.problems.find(p => p.id === questionId);
        console.log(`  Question ${questionId} (${problem?.question_type}):`, {
          type: typeof answer,
          isArray: Array.isArray(answer),
          value: answer
        });
      });

      await apiService.submitContest(contest.id, formattedAnswers, timeTaken);
      setHasSubmitted(true);

      navigate('/student/dashboard');
    } catch (error) {
      console.error('Error auto-submitting contest:', error);
      toast({
        title: "Error",
        description: "Failed to auto-submit contest",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  }, [contest, submitting, hasSubmitted, serverNow, answers, navigate]);

  // Enhanced timer with server synchronization
  const contestTimer = useContestTimer({
    contestId: id || '',
    onTimeExpired: handleAutoSubmit,
    onStatusChange: (status) => {
      if (status === 'ended' && !hasSubmitted && !submitting) {
        handleAutoSubmit();
      }
    },
  });

  // Store original navigate function and create guarded version
  const originalNavigate = useNavigate();
  const guardedNavigate = useCallback((to: string | number, options?: NavigateOptions) => {
    if (contestInProgress && !hasSubmitted && !submitting) {
      const shouldLeave = window.confirm(
        'You have an active contest in progress. If you leave now, your progress may be lost. Are you sure you want to continue?'
      );
      
      if (shouldLeave) {
        setContestInProgress(false);
        if (typeof to === 'number') {
          originalNavigate(to);
        } else {
          originalNavigate(to, options);
        }
      }
      // If not confirmed, do nothing (block navigation)
    } else {
      if (typeof to === 'number') {
        originalNavigate(to);
      } else {
        originalNavigate(to, options);
      }
    }
  }, [contestInProgress, hasSubmitted, submitting, originalNavigate]);

  // Navigation protection for browser back/forward/refresh
  useEffect(() => {
    if (!contestInProgress || hasSubmitted || submitting) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have an active contest in progress. If you leave now, your answers will be automatically submitted. Are you sure you want to continue?';
      return e.returnValue;
    };

    const handlePopState = (e: PopStateEvent) => {
      const shouldLeave = window.confirm(
        'You have an active contest in progress. If you leave now, your answers will be automatically submitted. Are you sure you want to continue?'
      );
      
      if (!shouldLeave) {
        // Push the current state back to prevent navigation
        window.history.pushState(null, '', window.location.href);
      } else {
        // Auto-submit the contest before allowing navigation
        handleAutoSubmit().then(() => {
          // Allow the navigation after submission
          setContestInProgress(false);
        }).catch(() => {
          // If submission fails, prevent navigation
          window.history.pushState(null, '', window.location.href);
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    // Add a history entry to detect back button
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [contestInProgress, hasSubmitted, submitting]);

  // Global click interceptor for navigation protection
  useEffect(() => {
    if (!contestInProgress || hasSubmitted || submitting) return;

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if the clicked element or its parent is a navigation element
      const navElement = target.closest('a[href]') || 
                        target.closest('button') || 
                        target.closest('[role="button"]');
      
      // Check if it's specifically a navigation button (like Dashboard, etc.)
      if (navElement && (
          navElement.textContent?.includes('Dashboard') ||
          navElement.textContent?.includes('Results') ||
          navElement.textContent?.includes('Home') ||
          (navElement as HTMLAnchorElement).href ||
          navElement.getAttribute('data-nav')
      )) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const shouldLeave = window.confirm(
          'You have an active contest in progress. If you leave now, your answers will be automatically submitted. Are you sure you want to continue?'
        );
        
        if (shouldLeave) {
          // Auto-submit the contest before allowing navigation
          handleAutoSubmit().then(() => {
            // Navigate after submission is complete
            setTimeout(() => {
              (navElement as HTMLElement).click();
            }, 500);
          });
        }
      }
    };

    // Add listener with capture to intercept before other handlers
    document.addEventListener('click', handleDocumentClick, { capture: true });

    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true });
    };
  }, [contestInProgress, hasSubmitted, submitting, handleAutoSubmit]);

  useEffect(() => {
    if (id) {
      loadContest();
    }
  }, [id]);

  const loadContest = async () => {
    try {
      setLoading(true);
      const contestData = await apiService.getContest(id!) as Contest;
      setContest(contestData);
      
      // Check if student has already submitted this contest
      try {
        const submission = await apiService.getMySubmission(id!) as any;
        if (submission) {
          setHasSubmitted(true);
          setExistingSubmission(submission);
          return; // Don't set up timer if already submitted
        }
        // No submission found (null response), student can take the contest
        console.log('No existing submission found, student can take contest');
      } catch (error) {
        // Error fetching submission, log but allow student to take contest
        console.log('Error checking submission status:', error);
      }
      
      // Use server time for accurate timing validation
      const now = serverNow();
      const startTime = new Date(contestData.start_time).getTime();
      const endTime = new Date(contestData.end_time).getTime();
      
      if (now < startTime) {
        const timeToStart = Math.ceil((startTime - now) / 1000);
        toast({
          title: "Contest Not Started",
          description: `This contest will start in ${Math.ceil(timeToStart / 60)} minutes. Please wait for the start time.`,
          variant: "destructive"
        });
        navigate('/student/dashboard');
        return;
      }
      
      // Calculate time remaining based on server-synchronized time
      const remainingMs = endTime - now;
      const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
      
      setTimeRemaining(remainingSeconds);
      
      if (remainingSeconds <= 0) {
        toast({
          title: "Contest Ended",
          description: "This contest has already ended and you didn't submit your answers.",
          variant: "destructive"
        });
        navigate('/student/dashboard');
        return;
      }
      
      // Show server time sync status
      if (!serverTimeConnected) {
        toast({
          title: "Time Sync Warning",
          description: "Unable to sync with server time. Contest timing may be inaccurate.",
          variant: "destructive"
        });
      }
      
      // Activate contest security
      setContestInProgress(true);
      
      // Show security notification
      toast({
        title: "Contest Security Active",
        description: "Navigation is now protected. You must submit or complete the contest to leave this page.",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error loading contest:', error);
      toast({
        title: "Error",
        description: "Failed to load contest",
        variant: "destructive"
      });
      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, handleAutoSubmit]);

  useEffect(() => {
    const loadDetailedSubmission = async () => {
      if (hasSubmitted && existingSubmission && id) {
        try {
          setLoadingDetails(true);
          const details = await apiService.getMySubmissionDetails(id) as any;
          setDetailedSubmission(details);
        } catch (error) {
          console.error('Error loading detailed submission:', error);
          toast({
            title: "Error",
            description: "Failed to load submission details",
            variant: "destructive"
          });
        } finally {
          setLoadingDetails(false);
        }
      }
    };

    loadDetailedSubmission();
  }, [hasSubmitted, existingSubmission, id]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionType = (correctOptions: string[]) => {
    return correctOptions.length > 1 ? 'Multiple Choice' : 'Single Choice';
  };

  const getQuestionTypeColor = (correctOptions: string[]) => {
    return correctOptions.length > 1 
      ? 'bg-purple-100 text-purple-800 border-purple-200' 
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const handleAnswerChange = (questionId: string, option: string, checked: boolean) => {
    setAnswers(prev => {
      const currentAnswers = Array.isArray(prev[questionId]) ? prev[questionId] as string[] : [];
      const currentProblem = contest?.problems.find(p => p.id === questionId);
      
      if (checked) {
        // For single choice questions, replace the existing answer
        if (currentProblem && currentProblem.correct_options.length === 1) {
          return { ...prev, [questionId]: [option] };
        } else {
          // For multiple choice questions, add to existing answers
          return { ...prev, [questionId]: [...currentAnswers, option] };
        }
      } else {
        return { ...prev, [questionId]: currentAnswers.filter(ans => ans !== option) };
      }
    });
  };

  const handleLongAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    if (!contest) return;
    
    try {
      setSubmitting(true);
      
      // Calculate time taken using server time
      const now = serverNow();
      const startTime = new Date(contest.start_time).getTime();
      const endTime = new Date(contest.end_time).getTime();
      const totalContestTime = endTime - startTime;
      const timeTaken = Math.floor((totalContestTime - (timeRemaining * 1000)) / 1000);

      // Convert answers to the format expected by the API
      const formattedAnswers = Object.keys(answers).reduce((acc, questionId) => {
        const answer = answers[questionId];
        const problem = contest.problems.find(p => p.id === questionId);
        
        if (problem?.question_type === 'long_answer') {
          // Long Answer questions MUST be strings
          if (Array.isArray(answer)) {
            // If somehow stored as array, join it
            acc[questionId] = answer.join(' ').trim();
          } else if (typeof answer === 'string') {
            acc[questionId] = answer.trim();
          } else {
            // Fallback to empty string
            acc[questionId] = '';
          }
        } else {
          // MCQ questions expect array format
          if (Array.isArray(answer)) {
            acc[questionId] = answer.filter(a => a && a.trim().length > 0);
          } else if (typeof answer === 'string' && answer.trim().length > 0) {
            acc[questionId] = [answer.trim()];
          } else {
            acc[questionId] = [];
          }
        }
        return acc;
      }, {} as Record<string, string[] | string>);

      // Debug logging to help diagnose submission issues
      console.log('🔍 Formatted answers for submission:', formattedAnswers);
      Object.entries(formattedAnswers).forEach(([questionId, answer]) => {
        const problem = contest.problems.find(p => p.id === questionId);
        console.log(`  Question ${questionId} (${problem?.question_type}):`, {
          type: typeof answer,
          isArray: Array.isArray(answer),
          value: answer
        });
      });

      // Validate submission has some answers
      const hasAnswers = Object.keys(formattedAnswers).length > 0 && 
        Object.values(formattedAnswers).some(answer => {
          if (typeof answer === 'string') {
            return answer.trim().length > 0;
          }
          return Array.isArray(answer) && answer.length > 0 && answer.some(a => a && a.trim().length > 0);
        });

      if (!hasAnswers) {
        toast({
          title: "No Answers",
          description: "Please provide at least one answer before submitting.",
          variant: "destructive"
        });
        return;
      }
      
      await apiService.submitContest(contest.id, formattedAnswers, timeTaken);

      // Deactivate contest security
      setContestInProgress(false);

      toast({
        title: "Success",
        description: "Contest submitted successfully!"
      });

      navigate('/student/dashboard');
    } catch (error) {
      console.error('Error submitting contest:', error);
      toast({
        title: "Error",
        description: "Failed to submit contest",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading contest...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!contest || !contest.problems || contest.problems.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md shadow-lg border-0">
            <CardContent className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-3">No Problems Available</h3>
              <p className="text-gray-500 mb-6">
                This contest doesn't have any problems yet. Please check back later.
              </p>
              <Button onClick={() => navigate('/student/dashboard')} className="px-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Show submission result if already submitted
  if (hasSubmitted && existingSubmission) {
    if (loadingDetails) {
      return (
        <Layout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading submission details...</span>
            </div>
          </div>
        </Layout>
      );
    }

    if (!detailedSubmission) {
      return (
        <Layout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md shadow-lg border-0">
              <CardContent className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-3">Unable to Load Submission Details</h3>
                <p className="text-gray-500 mb-6">
                  There was an issue loading your submission details. Please try refreshing the page.
                </p>
                <Button onClick={() => window.location.reload()} className="px-6">
                  Refresh Page
                </Button>
              </CardContent>
            </Card>
          </div>
        </Layout>
      );
    }

    const percentage = existingSubmission.max_possible_score > 0 
      ? (existingSubmission.total_score / existingSubmission.max_possible_score * 100) 
      : 0;

    const getGrade = (percentage: number) => {
      if (percentage >= 90) return { grade: 'A', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
      if (percentage >= 80) return { grade: 'B', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
      if (percentage >= 70) return { grade: 'C', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
      if (percentage >= 60) return { grade: 'D', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
      return { grade: 'F', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
    };

    const { grade, color, bgColor, borderColor } = getGrade(percentage);

    const formatTimeTaken = (seconds?: number) => {
      if (!seconds) return 'N/A';
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    };

    const problems = detailedSubmission.problems || [];
    const currentProblem = problems[currentReviewQuestion];
    const totalQuestions = problems.length;
    const correctAnswers = problems.filter((p: any) => p.is_correct).length;
    const incorrectAnswers = totalQuestions - correctAnswers;

    // Safety check - if no problems, show error
    if (totalQuestions === 0) {
      return (
        <Layout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md shadow-lg border-0">
              <CardContent className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-3">No Questions Found</h3>
                <p className="text-gray-500 mb-6">
                  This contest doesn't have any questions to review.
                </p>
                <Button onClick={() => navigate('/student/dashboard')} className="px-6">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </Layout>
      );
    }

    // Safety check - ensure currentReviewQuestion is within bounds
    if (currentReviewQuestion >= totalQuestions) {
      setCurrentReviewQuestion(0);
      return null; // Re-render with correct index
    }

    const getAnswerStatusColor = (isCorrect: boolean) => {
      return isCorrect 
        ? 'bg-green-100 text-green-800 border-green-200' 
        : 'bg-red-100 text-red-800 border-red-200';
    };

    const formatAnswers = (answers: string[] | string | undefined) => {
      if (!answers) return 'No answer';
      if (typeof answers === 'string') return answers;
      if (Array.isArray(answers)) {
        return answers.map(opt => `${opt}`).join(', ') || 'No answer';
      }
      return 'No answer';
    };

    return (
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <Card className="shadow-lg border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-6 w-6" />
                    <h1 className="text-2xl font-bold">Submission Review ✅</h1>
                  </div>
                  <p className="text-green-100 text-lg">{detailedSubmission.contest.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">
                    {percentage.toFixed(1)}%
                  </div>
                  <p className="text-green-100">Your Score</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Results Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-md border-0">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {existingSubmission.total_score}/{existingSubmission.max_possible_score}
                </div>
                <p className="text-sm text-gray-600">Points Earned</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-md border-0">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {correctAnswers}
                </div>
                <p className="text-sm text-gray-600">Correct Answers</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-md border-0">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {incorrectAnswers}
                </div>
                <p className="text-sm text-gray-600">Incorrect Answers</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-md border-0">
              <CardContent className="p-6 text-center">
                <div className={`text-3xl font-bold mb-2 ${color}`}>
                  {grade}
                </div>
                <p className="text-sm text-gray-600">Grade</p>
              </CardContent>
            </Card>
          </div>

          {/* Question Review Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Question Area */}
            <div className="lg:col-span-3">
              <Card className="shadow-lg border-0">
                <CardHeader className="border-b bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl">
                        Question {currentReviewQuestion + 1} of {totalQuestions}
                      </CardTitle>
                      <p className="text-gray-600 text-sm mt-1">
                        Review your answer and see the explanation
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getAnswerStatusColor(currentProblem?.is_correct)} px-3 py-1.5 font-medium`}>
                        {currentProblem?.is_correct ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Correct
                          </>
                        ) : (
                          <>
                            <Circle className="h-4 w-4 mr-1" />
                            Incorrect
                          </>
                        )}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1.5 font-medium">
                        <Award className="h-4 w-4 mr-1" />
                        {currentProblem?.score}/{currentProblem?.max_score} mark{currentProblem?.max_score !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  {/* Question Content */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 leading-relaxed">
                      {currentProblem?.title}
                    </h3>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-700 text-lg leading-relaxed">
                        {currentProblem?.description}
                      </p>
                    </div>
                    
                    {/* Question Image */}
                    {currentProblem?.image_url && (
                      <div className="mt-6 flex justify-center">
                        <img
                          src={currentProblem.image_url.startsWith('http') ? currentProblem.image_url : `${API_SERVER_URL}${currentProblem.image_url}`}
                          alt="Question image"
                          className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                          style={{ maxHeight: '400px' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Options Review */}
                  <div className="space-y-4 mb-8">
                    {currentProblem && [
                      { key: 'A', text: currentProblem.option_a },
                      { key: 'B', text: currentProblem.option_b },
                      { key: 'C', text: currentProblem.option_c },
                      { key: 'D', text: currentProblem.option_d }
                    ].map((option) => {
                      const isStudentAnswer = currentProblem?.student_answer?.includes(option.key);
                      const isCorrectAnswer = currentProblem?.correct_options?.includes(option.key);
                      
                      let borderColor = 'border-gray-200';
                      let bgColor = 'bg-white';
                      let textColor = 'text-gray-900';
                      
                      if (isCorrectAnswer && isStudentAnswer) {
                        // Student got it right
                        borderColor = 'border-green-500';
                        bgColor = 'bg-green-50';
                        textColor = 'text-green-900';
                      } else if (isCorrectAnswer && !isStudentAnswer) {
                        // Correct answer not selected by student
                        borderColor = 'border-green-300';
                        bgColor = 'bg-green-25';
                        textColor = 'text-green-700';
                      } else if (!isCorrectAnswer && isStudentAnswer) {
                        // Student selected wrong answer
                        borderColor = 'border-red-500';
                        bgColor = 'bg-red-50';
                        textColor = 'text-red-900';
                      }
                      
                      return (
                        <div 
                          key={option.key} 
                          className={`p-4 border-2 rounded-xl ${borderColor} ${bgColor} relative`}
                        >
                          <div className="flex items-start space-x-4">
                            <div className={`flex-shrink-0 w-8 h-8 border-2 rounded-full flex items-center justify-center font-bold text-sm ${
                              isCorrectAnswer 
                                ? 'border-green-500 bg-green-500 text-white'
                                : isStudentAnswer
                                ? 'border-red-500 bg-red-500 text-white'
                                : 'border-gray-300 text-gray-600'
                            }`}>
                              {isCorrectAnswer ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : isStudentAnswer ? (
                                <Circle className="h-5 w-5" />
                              ) : (
                                option.key
                              )}
                            </div>
                            <div className="flex-1">
                              <Label className={`text-base leading-relaxed ${textColor}`}>
                                <span className="font-semibold mr-2">{option.key})</span>
                                {option.text}
                              </Label>
                            </div>
                            {/* Status indicators */}
                            <div className="flex flex-col items-end space-y-1">
                              {isStudentAnswer && (
                                <Badge 
                                  variant="outline" 
                                  className={isCorrectAnswer ? 'border-green-300 text-green-700' : 'border-red-300 text-red-700'}
                                >
                                  Your Answer
                                </Badge>
                              )}
                              {isCorrectAnswer && (
                                <Badge variant="outline" className="border-green-300 text-green-700">
                                  Correct Answer
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Answer Summary */}
                  <div className="bg-gray-50 rounded-lg p-6 mb-8">
                    <h4 className="font-bold text-gray-900 mb-4">Answer Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600 block mb-1">Your Answer:</span>
                        <p className={`font-medium ${currentProblem?.student_answer?.length > 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                          {formatAnswers(currentProblem?.student_answer || [])}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 block mb-1">Correct Answer:</span>
                        <p className="font-medium text-green-700">
                          {formatAnswers(currentProblem?.correct_options || [])}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  {currentProblem?.explanation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <span className="font-bold text-blue-900">Explanation</span>
                      </div>
                      <div className="prose prose-blue max-w-none">
                        <p className="text-blue-800 leading-relaxed">
                          {currentProblem.explanation}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between items-center pt-6 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentReviewQuestion(Math.max(0, currentReviewQuestion - 1))}
                      disabled={currentReviewQuestion === 0}
                      className="px-6 py-3"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>

                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Circle className={`h-3 w-3 ${currentProblem?.is_correct ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`} />
                      <span>{currentProblem?.is_correct ? 'Correct' : 'Incorrect'}</span>
                    </div>

                    <Button 
                      variant="outline"
                      onClick={() => setCurrentReviewQuestion(Math.min(totalQuestions - 1, currentReviewQuestion + 1))}
                      disabled={currentReviewQuestion === totalQuestions - 1}
                      className="px-6 py-3"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Review Sidebar */}
            <div className="space-y-6">
              {/* Question Navigator */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BookOpen className="h-5 w-5 text-purple-600" />
                    </div>
                    <span>Review Navigator</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2 mb-6">
                    {problems.map((_: any, index: number) => {
                      const problem = problems[index];
                      const isCurrent = index === currentReviewQuestion;
                      
                      return (
                        <Button
                          key={index}
                          size="sm"
                          variant={isCurrent ? "default" : "outline"}
                          className={`h-12 w-12 text-sm font-bold transition-all duration-200 ${
                            isCurrent 
                              ? 'ring-2 ring-blue-500 bg-blue-600 hover:bg-blue-700 text-white' :
                            problem?.is_correct 
                              ? 'bg-green-100 text-green-800 border-green-400 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 border-red-400 hover:bg-red-200'
                          }`}
                          onClick={() => setCurrentReviewQuestion(index)}
                        >
                          {index + 1}
                        </Button>
                      );
                    })}
                  </div>
                  
                  {/* Review Summary */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
                        <div className="text-xs text-green-700">Correct</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{incorrectAnswers}</div>
                        <div className="text-xs text-red-700">Incorrect</div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Award className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Performance</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-700">Score:</span>
                          <span className="font-bold text-blue-900">{existingSubmission.total_score}/{existingSubmission.max_possible_score}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-700">Percentage:</span>
                          <span className="font-bold text-blue-900">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-700">Grade:</span>
                          <span className={`font-bold ${color}`}>{grade}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contest Info */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Clock className="h-5 w-5 text-indigo-600" />
                    </div>
                    <span>Submission Info</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Submitted At</span>
                      <span className="font-bold text-gray-900 text-sm">
                        {new Date(existingSubmission.submitted_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Time Taken</span>
                      <span className="font-bold text-gray-900">{formatTimeTaken(existingSubmission.time_taken_seconds)}</span>
                    </div>
                    {existingSubmission.is_auto_submitted && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <span className="text-sm font-medium text-orange-800">Auto-submitted due to time limit</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card className="shadow-lg border-0">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Button 
                      onClick={() => navigate('/student/dashboard')}
                      className="w-full"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                    <Button 
                      onClick={() => navigate('/student/results')}
                      variant="outline"
                      className="w-full"
                    >
                      <Award className="h-4 w-4 mr-2" />
                      View All Results
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const currentProblem = contest.problems[currentQuestion];
  const isLastQuestion = currentQuestion === contest.problems.length - 1;
  const currentAnswers = Array.isArray(answers[currentProblem.id]) ? answers[currentProblem.id] as string[] : [];

  const answeredQuestions = Object.keys(answers).length;
  const totalQuestions = contest.problems.length;
  const progressPercentage = (answeredQuestions / totalQuestions) * 100;

  const getTimeColor = () => {
    if (timeRemaining < 300) return 'text-red-600'; // Less than 5 minutes
    if (timeRemaining < 900) return 'text-orange-600'; // Less than 15 minutes
    return 'text-blue-600';
  };

  const getTimeBackground = () => {
    if (timeRemaining < 300) return 'bg-red-50 border-red-200'; // Less than 5 minutes
    if (timeRemaining < 900) return 'bg-orange-50 border-orange-200'; // Less than 15 minutes
    return 'bg-blue-50 border-blue-200';
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-6 w-6" />
                  <h1 className="text-2xl font-bold">{contest.name}</h1>
                </div>
                <p className="text-blue-100 mb-4">{contest.description}</p>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {totalQuestions} Questions
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Award className="h-3 w-3 mr-1" />
                    {contest.problems.reduce((sum, p) => sum + p.marks, 0)} Total Marks
                  </Badge>
                  {contestInProgress && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-100 border-green-300/30">
                      <Shield className="h-3 w-3 mr-1" />
                      Secure Mode
                    </Badge>
                  )}
                </div>
              </div>
              <div className={`text-right p-4 rounded-xl border-2 ${getTimeBackground()}`}>
                <div className={`text-3xl font-bold ${getTimeColor()} flex items-center justify-center`}>
                  <Timer className="h-6 w-6 mr-2" />
                  {formatTime(timeRemaining)}
                </div>
                <p className="text-sm text-gray-600 mt-1">Time Remaining</p>
                {timeRemaining < 600 && (
                  <div className="flex items-center justify-center mt-2 text-red-600">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    <span className="text-xs font-medium">Hurry up!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-600">{answeredQuestions}/{totalQuestions} completed</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Area */}
          <div className="lg:col-span-3">
            <Card className="shadow-lg border-0">
              <CardHeader className="border-b bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">
                      Question {currentQuestion + 1} of {contest.problems.length}
                    </CardTitle>
                    <p className="text-gray-600 text-sm mt-1">
                      {currentProblem.question_type === 'long_answer' 
                        ? 'Write a detailed answer to the question' 
                        : currentProblem.correct_options.length > 1 
                        ? 'Choose all correct answers (multiple selections allowed)' 
                        : 'Choose the correct answer (single selection only)'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${currentProblem.question_type === 'long_answer' 
                        ? 'bg-purple-100 text-purple-800 border-purple-200' 
                        : getQuestionTypeColor(currentProblem.correct_options)} px-3 py-1.5 font-medium`}>
                      {currentProblem.question_type === 'long_answer' ? (
                        <>
                          <BookOpen className="h-4 w-4 mr-1" />
                          Long Answer
                        </>
                      ) : currentProblem.correct_options.length > 1 ? (
                        <>
                          <CheckSquare className="h-4 w-4 mr-1" />
                          {getQuestionType(currentProblem.correct_options)}
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          {getQuestionType(currentProblem.correct_options)}
                        </>
                      )}
                    </Badge>
                    <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1.5 font-medium">
                      <Award className="h-4 w-4 mr-1" />
                      {currentProblem.marks} mark{currentProblem.marks !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {/* Question Content */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 leading-relaxed">
                    {currentProblem.title}
                  </h3>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 text-lg leading-relaxed">
                      {currentProblem.description}
                    </p>
                  </div>
                  
                  {/* Question Image */}
                  {currentProblem.image_url && (
                    <div className="mt-6 flex justify-center">
                      <img
                        src={currentProblem.image_url.startsWith('http') ? currentProblem.image_url : `${API_SERVER_URL}${currentProblem.image_url}`}
                        alt="Question image"
                        className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                        style={{ maxHeight: '400px' }}
                      />
                    </div>
                  )}
                </div>

                {/* Options - MCQ vs Long Answer */}
                {currentProblem.question_type === 'long_answer' ? (
                  <div className="space-y-4">
                    <Label htmlFor="long-answer" className="text-base font-medium text-gray-900">
                      Your Answer
                    </Label>
                    <Textarea
                      id="long-answer"
                      placeholder="Type your answer here..."
                      value={typeof answers[currentProblem.id] === 'string' ? answers[currentProblem.id] as string : ''}
                      onChange={(e) => handleLongAnswerChange(currentProblem.id, e.target.value)}
                      className="min-h-[200px] resize-y"
                    />
                    <p className="text-sm text-gray-500">
                      Write a detailed answer to the question above. You can format your response with proper paragraphs and explanations.
                    </p>
                  </div>
                ) : (
                <div className="space-y-4">
                  {[
                    { key: 'A', text: currentProblem.option_a },
                    { key: 'B', text: currentProblem.option_b },
                    { key: 'C', text: currentProblem.option_c },
                    { key: 'D', text: currentProblem.option_d }
                    ].filter(option => option.text).map((option) => {
                    const isSelected = currentAnswers.includes(option.key);
                    
                    return (
                      <div 
                        key={option.key} 
                        className={`group relative p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer hover:shadow-md ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                        onClick={() => handleAnswerChange(currentProblem.id, option.key, !isSelected)}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`flex-shrink-0 w-8 h-8 border-2 flex items-center justify-center font-bold text-sm transition-colors ${
                            currentProblem.correct_options.length === 1
                              ? `rounded-full ${  // Radio style for single choice
                                  isSelected 
                                    ? 'border-blue-500 bg-blue-500 text-white' 
                                    : 'border-gray-300 text-gray-600 group-hover:border-blue-400'
                                }`
                              : `rounded ${  // Square style for multiple choice
                                  isSelected 
                                    ? 'border-blue-500 bg-blue-500 text-white' 
                                    : 'border-gray-300 text-gray-600 group-hover:border-blue-400'
                                }`
                          }`}>
                            {isSelected ? (
                              currentProblem.correct_options.length === 1 ? (
                                <Circle className="h-4 w-4 fill-current" />
                              ) : (
                                <CheckCircle className="h-5 w-5" />
                              )
                            ) : (
                              option.key
                            )}
                          </div>
                          <div className="flex-1">
                            <Label 
                              htmlFor={`option_${option.key}`} 
                              className="cursor-pointer text-base leading-relaxed text-gray-900"
                            >
                              <span className="font-semibold mr-2">{option.key})</span>
                              {option.text}
                            </Label>
                          </div>
                          <Checkbox
                            id={`option_${option.key}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => 
                              handleAnswerChange(currentProblem.id, option.key, checked as boolean)
                            }
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between items-center pt-8 mt-8 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                    disabled={currentQuestion === 0}
                    className="px-6 py-3"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    {(() => {
                      const answer = answers[currentProblem.id];
                      const isAnswered = currentProblem.question_type === 'long_answer' 
                        ? (typeof answer === 'string' && answer.trim().length > 0)
                        : (Array.isArray(answer) && answer.length > 0);
                      return (
                        <>
                          <Circle className={`h-3 w-3 ${isAnswered ? 'fill-green-500 text-green-500' : 'text-gray-300'}`} />
                          <span>{isAnswered ? 'Answered' : 'Not answered'}</span>
                        </>
                      );
                    })()}
                  </div>

                  {isLastQuestion ? (
                    <Button 
                      onClick={() => setShowSubmitConfirm(true)}
                      className="bg-green-600 hover:bg-green-700 px-6 py-3"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit Contest
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setCurrentQuestion(Math.min(contest.problems.length - 1, currentQuestion + 1))}
                      className="px-6 py-3"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Question Navigator */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                  </div>
                  <span>Question Navigator</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {contest.problems.map((_, index) => {
                    const isAnswered = Object.keys(answers).includes(contest.problems[index].id);
                    const isCurrent = index === currentQuestion;
                    
                    return (
                      <Button
                        key={index}
                        size="sm"
                        variant={isCurrent ? "default" : "outline"}
                        className={`h-12 w-12 text-sm font-bold transition-all duration-200 ${
                          isCurrent 
                            ? 'ring-2 ring-blue-500 bg-blue-600 hover:bg-blue-700' :
                          isAnswered 
                            ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100' 
                            : 'hover:border-blue-300 hover:bg-blue-50'
                        }`}
                        onClick={() => setCurrentQuestion(index)}
                      >
                        {index + 1}
                      </Button>
                    );
                  })}
                </div>
                
                {/* Progress Summary */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{answeredQuestions}</div>
                      <div className="text-xs text-green-700">Answered</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{totalQuestions - answeredQuestions}</div>
                      <div className="text-xs text-orange-700">Remaining</div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Quick Tips</span>
                    </div>
                    <ul className="text-xs text-blue-800 space-y-1">
                      {currentProblem.question_type === 'long_answer' ? (
                        <>
                          <li>• Write a detailed and well-structured answer</li>
                          <li>• Include relevant examples and explanations</li>
                          <li>• Check your spelling and grammar</li>
                        </>
                      ) : currentProblem.correct_options.length > 1 ? (
                        <>
                          <li>• You can select multiple options for this question</li>
                          <li>• Look for all correct answers</li>
                        </>
                      ) : (
                        <>
                          <li>• Select only one option for this question</li>
                          <li>• Choose the best answer</li>
                        </>
                      )}
                      <li>• Use the navigator to jump between questions</li>
                      <li>• Review your answers before submitting</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contest Info */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Award className="h-5 w-5 text-indigo-600" />
                  </div>
                  <span>Contest Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Total Questions</span>
                    <span className="font-bold text-gray-900">{totalQuestions}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Total Marks</span>
                    <span className="font-bold text-gray-900">{contest.problems.reduce((sum, p) => sum + p.marks, 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Current Question</span>
                    <span className="font-bold text-gray-900">{currentProblem.marks} mark{currentProblem.marks !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Submit Confirmation Modal */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg shadow-2xl border-0 animate-in fade-in-0 zoom-in-95 duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Submit Contest?</CardTitle>
                <p className="text-gray-600 mt-2">
                  You're about to submit your answers for final evaluation
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Your Progress</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{answeredQuestions}</div>
                      <div className="text-sm text-gray-600">Answered</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{totalQuestions - answeredQuestions}</div>
                      <div className="text-sm text-gray-600">Unanswered</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Progress value={progressPercentage} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {progressPercentage.toFixed(1)}% Complete
                    </p>
                  </div>
                </div>

                {/* Warning for unanswered questions */}
                {totalQuestions - answeredQuestions > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <span className="font-medium text-orange-900">Incomplete Submission</span>
                    </div>
                    <p className="text-sm text-orange-800">
                      You have {totalQuestions - answeredQuestions} unanswered question{totalQuestions - answeredQuestions !== 1 ? 's' : ''}. 
                      These will be marked as incorrect.
                    </p>
                  </div>
                )}

                {/* Time remaining info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Time Remaining</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    You still have <span className="font-bold">{formatTime(timeRemaining)}</span> left. 
                    You can continue working or submit now.
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-900">Final Warning</span>
                  </div>
                  <p className="text-sm text-red-800">
                    Once submitted, you cannot make any changes to your answers. 
                    Please review your responses carefully.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSubmitConfirm(false)}
                    className="flex-1 py-3"
                    disabled={submitting}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Continue Working
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    className="flex-1 bg-green-600 hover:bg-green-700 py-3"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Final Answers
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ContestTaking;
