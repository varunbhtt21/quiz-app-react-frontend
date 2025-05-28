
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Clock, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState(7200); // 2 hours in seconds
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const contest: Contest = {
    id: '1',
    name: 'JavaScript Fundamentals Quiz',
    description: 'Test your knowledge of JavaScript basics',
    start_time: '2024-01-25T14:00:00Z',
    end_time: '2024-01-25T16:00:00Z',
    problems: [
      {
        id: '1',
        title: 'What is React?',
        description: 'Choose the correct definition of React',
        option_a: 'A JavaScript library for building user interfaces',
        option_b: 'A programming language',
        option_c: 'A database management system',
        option_d: 'An operating system',
        marks: 5,
        order_index: 0
      },
      {
        id: '2',
        title: 'JavaScript Data Types',
        description: 'Which of the following are primitive data types in JavaScript? (Select all that apply)',
        option_a: 'String',
        option_b: 'Number',
        option_c: 'Object',
        option_d: 'Boolean',
        marks: 10,
        order_index: 1
      },
      {
        id: '3',
        title: 'CSS Flexbox',
        description: 'What does the CSS property justify-content: center do?',
        option_a: 'Centers items vertically',
        option_b: 'Centers items horizontally along the main axis',
        option_c: 'Stretches items to fill the container',
        option_d: 'Aligns items to the start of the container',
        marks: 5,
        order_index: 2
      }
    ]
  };

  useEffect(() => {
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
  }, []);

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
    try {
      const submissionData = {
        answers,
        time_taken_seconds: 7200 - timeRemaining
      };

      console.log('Submitting contest:', submissionData);

      toast({
        title: "Success",
        description: "Contest submitted successfully!"
      });

      navigate('/student/results');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit contest",
        variant: "destructive"
      });
    }
  };

  const handleAutoSubmit = () => {
    toast({
      title: "Time's Up!",
      description: "Contest auto-submitted due to time limit"
    });
    handleSubmit();
  };

  const currentProblem = contest.problems[currentQuestion];
  const isLastQuestion = currentQuestion === contest.problems.length - 1;
  const currentAnswers = answers[currentProblem.id] || [];

  const answeredQuestions = Object.keys(answers).length;
  const totalQuestions = contest.problems.length;

  return (
    <Layout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{contest.name}</CardTitle>
                <p className="text-gray-600">{contest.description}</p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  timeRemaining < 600 ? 'text-red-600' : 'text-blue-600'
                }`}>
                  <Clock className="inline h-5 w-5 mr-2" />
                  {formatTime(timeRemaining)}
                </div>
                <p className="text-sm text-gray-500">Time Remaining</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    Question {currentQuestion + 1} of {contest.problems.length}
                  </CardTitle>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {currentProblem.marks} marks
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{currentProblem.title}</h3>
                  <p className="text-gray-700 mb-4">{currentProblem.description}</p>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'A', text: currentProblem.option_a },
                    { key: 'B', text: currentProblem.option_b },
                    { key: 'C', text: currentProblem.option_c },
                    { key: 'D', text: currentProblem.option_d }
                  ].map((option) => (
                    <div key={option.key} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={`option_${option.key}`}
                        checked={currentAnswers.includes(option.key)}
                        onCheckedChange={(checked) => 
                          handleAnswerChange(currentProblem.id, option.key, checked as boolean)
                        }
                      />
                      <Label htmlFor={`option_${option.key}`} className="flex-1 cursor-pointer">
                        <span className="font-medium">{option.key})</span> {option.text}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-6 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                    disabled={currentQuestion === 0}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  {isLastQuestion ? (
                    <Button 
                      onClick={() => setShowSubmitConfirm(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit Contest
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setCurrentQuestion(Math.min(contest.problems.length - 1, currentQuestion + 1))}
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Question Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {contest.problems.map((_, index) => {
                    const isAnswered = Object.keys(answers).includes(contest.problems[index].id);
                    const isCurrent = index === currentQuestion;
                    
                    return (
                      <Button
                        key={index}
                        size="sm"
                        variant={isCurrent ? "default" : isAnswered ? "outline" : "ghost"}
                        className={`h-10 ${
                          isCurrent ? 'ring-2 ring-blue-500' :
                          isAnswered ? 'bg-green-100 text-green-800 border-green-300' : ''
                        }`}
                        onClick={() => setCurrentQuestion(index)}
                      >
                        {index + 1}
                      </Button>
                    );
                  })}
                </div>
                
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Answered:</span>
                    <span className="font-medium">{answeredQuestions}/{totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining:</span>
                    <span className="font-medium">{totalQuestions - answeredQuestions}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    💡 You can select multiple options for questions that allow it.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {showSubmitConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Submit Contest?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Are you sure you want to submit your contest? You have answered {answeredQuestions} out of {totalQuestions} questions.
                </p>
                <p className="text-sm text-gray-600 mb-6">
                  Once submitted, you cannot make any changes to your answers.
                </p>
                <div className="flex space-x-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSubmitConfirm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Yes, Submit
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
