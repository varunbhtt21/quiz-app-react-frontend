import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Clock, Send, Loader2, AlertTriangle, CheckCircle, Circle, BookOpen, Target, Timer, Award } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '../../services/api';
import { API_SERVER_URL } from '../../config/api';

interface ContestProblem {
  id: string;
  title: string;
  description: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  marks: number;
  order_index: number;
  image_url?: string;
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
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<any>(null);

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
      } catch (error) {
        // No submission found, student can take the contest
        console.log('No existing submission found, student can take contest');
      }
      
      // Calculate time remaining based on contest end time
      const endTime = new Date(contestData.end_time.replace('Z', ''));
      const now = new Date();
      const remainingMs = endTime.getTime() - now.getTime();
      const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
      
      setTimeRemaining(remainingSeconds);
      
      if (remainingSeconds <= 0) {
        toast({
          title: "Contest Ended",
          description: "This contest has already ended.",
          variant: "destructive"
        });
        navigate('/student/dashboard');
        return;
      }
      
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
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, option: string, checked: boolean) => {
    setAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      if (checked) {
        return { ...prev, [questionId]: [...currentAnswers, option] };
      } else {
        return { ...prev, [questionId]: currentAnswers.filter(ans => ans !== option) };
      }
    });
  };

  const handleSubmit = async () => {
    if (!contest) return;
    
    try {
      setSubmitting(true);
      
      // Calculate time taken
      const endTime = new Date(contest.end_time.replace('Z', ''));
      const now = new Date();
      const totalContestTime = endTime.getTime() - new Date(contest.start_time.replace('Z', '')).getTime();
      const timeTaken = Math.floor((totalContestTime - (timeRemaining * 1000)) / 1000);

      await apiService.submitContest(contest.id, answers, timeTaken);

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

  const handleAutoSubmit = () => {
    toast({
      title: "Time's Up!",
      description: "Contest auto-submitted due to time limit"
    });
    handleSubmit();
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
                    <h1 className="text-2xl font-bold">Contest Completed! ✅</h1>
                  </div>
                  <p className="text-green-100 text-lg">{contest.name}</p>
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
                <div className={`text-3xl font-bold mb-2 ${color}`}>
                  {grade}
                </div>
                <p className="text-sm text-gray-600">Grade</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-md border-0">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {formatTimeTaken(existingSubmission.time_taken_seconds)}
                </div>
                <p className="text-sm text-gray-600">Time Taken</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-md border-0">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {new Date(existingSubmission.submitted_at).toLocaleDateString()}
                </div>
                <p className="text-sm text-gray-600">Submitted On</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Results */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <span>Your Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className={`p-6 rounded-xl border-2 ${borderColor} ${bgColor}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Final Result</h3>
                    <Badge className={`${bgColor} ${color} ${borderColor} border font-bold text-lg px-4 py-2`}>
                      Grade {grade}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Score</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {existingSubmission.total_score} / {existingSubmission.max_possible_score}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Percentage</p>
                      <p className="text-2xl font-bold text-gray-900">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress value={percentage} className="h-3" />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Submission Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Submitted:</span>
                      <p className="font-medium text-blue-900">
                        {new Date(existingSubmission.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-700">Time Taken:</span>
                      <p className="font-medium text-blue-900">
                        {formatTimeTaken(existingSubmission.time_taken_seconds)}
                      </p>
                    </div>
                  </div>
                  {existingSubmission.is_auto_submitted && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        Auto-submitted due to time limit
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">What's Next?</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• You have successfully completed this contest</li>
                    <li>• Your results have been recorded and cannot be changed</li>
                    <li>• Check your overall performance in the Results section</li>
                    <li>• Look for new contests on your dashboard</li>
                  </ul>
                </div>

                <div className="flex space-x-4">
                  <Button 
                    onClick={() => navigate('/student/dashboard')}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                  <Button 
                    onClick={() => navigate('/student/results')}
                    variant="outline"
                    className="flex-1"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    View All Results
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const currentProblem = contest.problems[currentQuestion];
  const isLastQuestion = currentQuestion === contest.problems.length - 1;
  const currentAnswers = answers[currentProblem.id] || [];

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
                    <p className="text-gray-600 text-sm mt-1">Choose the correct answer(s)</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-4 py-2">
                    <Award className="h-4 w-4 mr-1" />
                    {currentProblem.marks} mark{currentProblem.marks !== 1 ? 's' : ''}
                  </Badge>
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

                {/* Options */}
                <div className="space-y-4">
                  {[
                    { key: 'A', text: currentProblem.option_a },
                    { key: 'B', text: currentProblem.option_b },
                    { key: 'C', text: currentProblem.option_c },
                    { key: 'D', text: currentProblem.option_d }
                  ].map((option) => {
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
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-500 text-white' 
                              : 'border-gray-300 text-gray-600 group-hover:border-blue-400'
                          }`}>
                            {isSelected ? <CheckCircle className="h-5 w-5" /> : option.key}
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
                    <Circle className={`h-3 w-3 ${currentAnswers.length > 0 ? 'fill-green-500 text-green-500' : 'text-gray-300'}`} />
                    <span>{currentAnswers.length > 0 ? 'Answered' : 'Not answered'}</span>
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
                        {isAnswered && !isCurrent && (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        {!isAnswered && !isCurrent && (index + 1)}
                        {isCurrent && (index + 1)}
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
                      <li>• You can select multiple options</li>
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
