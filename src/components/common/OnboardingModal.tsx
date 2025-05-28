import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, FileText, Users, Trophy, BarChart3, ArrowRight, ArrowLeft, X } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const OnboardingModal = ({ isOpen, onClose, onComplete }: OnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Quiz System! 🎉",
      description: "Your complete online assessment platform",
      content: (
        <div className="text-center space-y-4">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-lg text-white">
            <BookOpen className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Quiz System</h3>
            <p className="text-blue-100">Create, manage, and conduct online assessments with ease</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900">For Educators</h4>
              <p className="text-blue-700">Create courses, build question banks, and track student performance</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900">For Students</h4>
              <p className="text-green-700">Take quizzes, view results, and track your progress</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 1: Create Courses",
      description: "Organize your content and students",
      content: (
        <div className="space-y-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <h3 className="text-lg font-semibold">Courses</h3>
              </div>
              <p className="text-gray-600 mb-3">
                Courses are containers that organize your students and content. Think of them as classrooms.
              </p>
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">What you can do:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Create courses for different subjects or topics</li>
                  <li>• Enroll students in specific courses</li>
                  <li>• Organize contests by course</li>
                  <li>• Track course-specific performance</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      title: "Step 2: Build Question Bank",
      description: "Create MCQ questions for assessments",
      content: (
        <div className="space-y-4">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <FileText className="h-8 w-8 text-green-600" />
                <h3 className="text-lg font-semibold">Question Bank</h3>
              </div>
              <p className="text-gray-600 mb-3">
                Build a library of Multiple Choice Questions (MCQs) that you can reuse in different contests.
              </p>
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Question features:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Multiple choice questions with 4 options</li>
                  <li>• Support for multiple correct answers</li>
                  <li>• Add explanations for correct answers</li>
                  <li>• Search and filter questions easily</li>
                  <li>• Reuse questions across different contests</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      title: "Step 3: Enroll Students",
      description: "Add students to your courses",
      content: (
        <div className="space-y-4">
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Users className="h-8 w-8 text-purple-600" />
                <h3 className="text-lg font-semibold">Student Management</h3>
              </div>
              <p className="text-gray-600 mb-3">
                Add students to your courses so they can participate in contests and assessments.
              </p>
              <div className="bg-purple-50 p-3 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">Student enrollment:</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Add students by email address</li>
                  <li>• Students get automatic access to course contests</li>
                  <li>• View enrolled students for each course</li>
                  <li>• Track individual student performance</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      title: "Step 4: Create Contests",
      description: "Schedule quiz competitions",
      content: (
        <div className="space-y-4">
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Trophy className="h-8 w-8 text-orange-600" />
                <h3 className="text-lg font-semibold">Quiz Contests</h3>
              </div>
              <p className="text-gray-600 mb-3">
                Create timed quiz contests using questions from your question bank.
              </p>
              <div className="bg-orange-50 p-3 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-2">Contest features:</h4>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• Set start and end times for contests</li>
                  <li>• Select questions from your question bank</li>
                  <li>• Assign different marks to each question</li>
                  <li>• Students can only participate during contest time</li>
                  <li>• Automatic scoring and result generation</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      title: "Step 5: Track Results",
      description: "Monitor performance and export data",
      content: (
        <div className="space-y-4">
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <BarChart3 className="h-8 w-8 text-red-600" />
                <h3 className="text-lg font-semibold">Results & Analytics</h3>
              </div>
              <p className="text-gray-600 mb-3">
                View detailed performance analytics and export results for further analysis.
              </p>
              <div className="bg-red-50 p-3 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Analytics features:</h4>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• View contest results and rankings</li>
                  <li>• See detailed answer analysis</li>
                  <li>• Export results to Excel or CSV</li>
                  <li>• Track student progress over time</li>
                  <li>• Generate performance reports</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      title: "You're Ready to Start! 🚀",
      description: "Begin your quiz platform journey",
      content: (
        <div className="text-center space-y-6">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 rounded-lg text-white">
            <Trophy className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Setup Complete!</h3>
            <p className="text-green-100">You now know how to use the Quiz System platform</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-left">
              <h4 className="font-semibold text-blue-900 mb-2">Quick Start Checklist:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>□ Create your first course</li>
                <li>□ Add some MCQ questions</li>
                <li>□ Enroll students in the course</li>
                <li>□ Create your first contest</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg text-left">
              <h4 className="font-semibold text-green-900 mb-2">Need Help?</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Hover over navigation items for tips</li>
                <li>• Follow the setup progress on dashboard</li>
                <li>• Use the quick actions for common tasks</li>
                <li>• Check the getting started guide</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{steps[currentStep].title}</DialogTitle>
              <DialogDescription className="text-base">
                {steps[currentStep].description}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="py-4">
          {steps[currentStep].content}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex space-x-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-blue-600' : 
                  index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <div className="text-sm text-gray-500">
            {currentStep + 1} of {steps.length}
          </div>

          <div className="flex space-x-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                Get Started!
                <Trophy className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal; 