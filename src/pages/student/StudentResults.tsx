
import React, { useState } from 'react';
import Layout from '../../components/common/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Eye, TrendingUp } from 'lucide-react';

interface StudentResult {
  id: string;
  contest_name: string;
  course_name: string;
  score: number;
  max_score: number;
  percentage: number;
  submitted_at: string;
  time_taken: string;
  rank: number;
  total_participants: number;
}

const StudentResults = () => {
  const [results] = useState<StudentResult[]>([
    {
      id: '1',
      contest_name: 'JavaScript Fundamentals Quiz',
      course_name: 'Introduction to Programming',
      score: 42,
      max_score: 50,
      percentage: 84,
      submitted_at: '2024-01-20T11:45:00Z',
      time_taken: '1h 45m',
      rank: 3,
      total_participants: 25
    },
    {
      id: '2',
      contest_name: 'React Components Assessment',
      course_name: 'Introduction to Programming',
      score: 38,
      max_score: 45,
      percentage: 84.4,
      submitted_at: '2024-01-18T15:30:00Z',
      time_taken: '1h 30m',
      rank: 2,
      total_participants: 22
    },
    {
      id: '3',
      contest_name: 'CSS Styling Quiz',
      course_name: 'Web Development Basics',
      score: 28,
      max_score: 35,
      percentage: 80,
      submitted_at: '2024-01-15T10:15:00Z',
      time_taken: '1h 15m',
      rank: 5,
      total_participants: 18
    }
  ]);

  const averageScore = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;
  const totalContests = results.length;
  const bestScore = Math.max(...results.map(r => r.percentage));
  const averageRank = results.reduce((sum, r) => sum + r.rank, 0) / results.length;

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A', color: 'text-green-600' };
    if (percentage >= 80) return { grade: 'B', color: 'text-blue-600' };
    if (percentage >= 70) return { grade: 'C', color: 'text-yellow-600' };
    if (percentage >= 60) return { grade: 'D', color: 'text-orange-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Results</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{totalContests}</div>
              <p className="text-sm text-gray-500">Contests Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{averageScore.toFixed(1)}%</div>
              <p className="text-sm text-gray-500">Average Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-600">{bestScore}%</div>
              <p className="text-sm text-gray-500">Best Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-600">{averageRank.toFixed(1)}</div>
              <p className="text-sm text-gray-500">Average Rank</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Contest Results</CardTitle>
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
                      <TableHead>Contest</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => {
                      const { grade, color } = getGrade(result.percentage);
                      
                      return (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">{result.contest_name}</TableCell>
                          <TableCell className="text-sm text-gray-600">{result.course_name}</TableCell>
                          <TableCell>
                            <div>
                              <span className="font-medium">{result.score}/{result.max_score}</span>
                              <div className={`text-sm ${color}`}>{result.percentage}%</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`font-bold ${color}`}>{grade}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {result.rank}/{result.total_participants}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(result.submitted_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Performance Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Grade Distribution</h4>
                    <div className="space-y-2">
                      {['A', 'B', 'C', 'D', 'F'].map((grade) => {
                        const count = results.filter(r => getGrade(r.percentage).grade === grade).length;
                        const percentage = (count / results.length) * 100;
                        
                        return (
                          <div key={grade} className="flex items-center space-x-2">
                            <span className="w-4 text-sm font-medium">{grade}</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Recent Performance</h4>
                    <div className="text-sm text-gray-600">
                      <p>Last 3 contests average: <span className="font-medium text-gray-900">{averageScore.toFixed(1)}%</span></p>
                      <p>Improvement trend: <span className="font-medium text-green-600">+2.3%</span></p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl">🏆</div>
                    <div>
                      <p className="font-medium text-sm">Top Performer</p>
                      <p className="text-xs text-gray-600">Scored 90%+ in a contest</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl">📚</div>
                    <div>
                      <p className="font-medium text-sm">Consistent Learner</p>
                      <p className="text-xs text-gray-600">Completed 3+ contests</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl">⚡</div>
                    <div>
                      <p className="font-medium text-sm">Speed Demon</p>
                      <p className="text-xs text-gray-600">Completed contest in under 90 minutes</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentResults;
