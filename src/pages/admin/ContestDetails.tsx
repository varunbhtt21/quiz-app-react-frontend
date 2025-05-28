
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import StatusBadge from '../../components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Download, Eye } from 'lucide-react';

interface ContestSubmission {
  id: string;
  student_email: string;
  student_name: string;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  submitted_at: string;
  time_taken_seconds: number;
}

const ContestDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const contest = {
    id: '1',
    name: 'JavaScript Fundamentals Quiz',
    description: 'Test your knowledge of JavaScript basics',
    course_name: 'Introduction to Programming',
    start_time: '2024-01-20T10:00:00Z',
    end_time: '2024-01-20T12:00:00Z',
    status: 'ended' as const,
    problem_count: 10,
    max_possible_score: 50
  };

  const [submissions] = useState<ContestSubmission[]>([
    {
      id: '1',
      student_email: 'john.doe@example.com',
      student_name: 'John Doe',
      total_score: 42,
      max_possible_score: 50,
      percentage: 84,
      submitted_at: '2024-01-20T11:45:00Z',
      time_taken_seconds: 6300
    },
    {
      id: '2',
      student_email: 'jane.smith@example.com',
      student_name: 'Jane Smith',
      total_score: 38,
      max_possible_score: 50,
      percentage: 76,
      submitted_at: '2024-01-20T11:52:00Z',
      time_taken_seconds: 6720
    },
    {
      id: '3',
      student_email: 'bob.johnson@example.com',
      student_name: 'Bob Johnson',
      total_score: 45,
      max_possible_score: 50,
      percentage: 90,
      submitted_at: '2024-01-20T11:38:00Z',
      time_taken_seconds: 5880
    }
  ]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const averageScore = submissions.reduce((sum, s) => sum + s.percentage, 0) / submissions.length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/admin/contests')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{contest.name}</h1>
            <p className="text-gray-600">{contest.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <StatusBadge status={contest.status} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{contest.problem_count}</div>
              <p className="text-sm text-gray-500">Problems</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{submissions.length}</div>
              <p className="text-sm text-gray-500">Submissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-600">{contest.max_possible_score}</div>
              <p className="text-sm text-gray-500">Max Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-600">{averageScore.toFixed(1)}%</div>
              <p className="text-sm text-gray-500">Avg Score</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Contest Information</CardTitle>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Problems
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Course</p>
                <p className="text-lg">{contest.course_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Duration</p>
                <p className="text-lg">2 hours</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Start Time</p>
                <p className="text-lg">{new Date(contest.start_time).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">End Time</p>
                <p className="text-lg">{new Date(contest.end_time).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Submissions</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Time Taken</TableHead>
                  <TableHead>Submitted At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.student_name}</TableCell>
                    <TableCell>{submission.student_email}</TableCell>
                    <TableCell>
                      {submission.total_score} / {submission.max_possible_score}
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        submission.percentage >= 80 ? 'text-green-600' :
                        submission.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {submission.percentage}%
                      </span>
                    </TableCell>
                    <TableCell>{formatTime(submission.time_taken_seconds)}</TableCell>
                    <TableCell>{new Date(submission.submitted_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ContestDetails;
