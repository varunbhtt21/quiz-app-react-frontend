
import React, { useState } from 'react';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileSpreadsheet } from 'lucide-react';

const Results = () => {
  const [selectedContest, setSelectedContest] = useState('');
  
  const contests = [
    { id: '1', name: 'JavaScript Fundamentals Quiz', course: 'Introduction to Programming' },
    { id: '2', name: 'React Components Assessment', course: 'Introduction to Programming' },
    { id: '3', name: 'Node.js and Express Quiz', course: 'Advanced Web Development' }
  ];

  const results = [
    {
      id: '1',
      student_name: 'John Doe',
      student_email: 'john.doe@example.com',
      score: 42,
      max_score: 50,
      percentage: 84,
      submitted_at: '2024-01-20T11:45:00Z'
    },
    {
      id: '2',
      student_name: 'Jane Smith',
      student_email: 'jane.smith@example.com',
      score: 38,
      max_score: 50,
      percentage: 76,
      submitted_at: '2024-01-20T11:52:00Z'
    },
    {
      id: '3',
      student_name: 'Bob Johnson',
      student_email: 'bob.johnson@example.com',
      score: 45,
      max_score: 50,
      percentage: 90,
      submitted_at: '2024-01-20T11:38:00Z'
    }
  ];

  const gradeDistribution = {
    'A (90-100%)': results.filter(r => r.percentage >= 90).length,
    'B (80-89%)': results.filter(r => r.percentage >= 80 && r.percentage < 90).length,
    'C (70-79%)': results.filter(r => r.percentage >= 70 && r.percentage < 80).length,
    'D (60-69%)': results.filter(r => r.percentage >= 60 && r.percentage < 70).length,
    'F (0-59%)': results.filter(r => r.percentage < 60).length,
  };

  const averageScore = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Results & Export</h1>

        <Card>
          <CardHeader>
            <CardTitle>Select Contest</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contest">Contest</Label>
                <select
                  id="contest"
                  value={selectedContest}
                  onChange={(e) => setSelectedContest(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a contest</option>
                  {contests.map((contest) => (
                    <option key={contest.id} value={contest.id}>
                      {contest.name} - {contest.course}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedContest && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-blue-600">{results.length}</div>
                  <p className="text-sm text-gray-500">Total Submissions</p>
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
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.max(...results.map(r => r.percentage))}%
                  </div>
                  <p className="text-sm text-gray-500">Highest Score</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.min(...results.map(r => r.percentage))}%
                  </div>
                  <p className="text-sm text-gray-500">Lowest Score</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(gradeDistribution).map(([grade, count]) => (
                      <div key={grade} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{grade}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(count / results.length) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Export Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full flex items-center justify-center space-x-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Export to Excel</span>
                    </Button>
                    <Button variant="outline" className="w-full flex items-center justify-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>Export to CSV</span>
                    </Button>
                    <Button variant="outline" className="w-full flex items-center justify-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>Export Detailed Report</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Contest Results</CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Table
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Submitted At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => {
                      let grade = 'F';
                      if (result.percentage >= 90) grade = 'A';
                      else if (result.percentage >= 80) grade = 'B';
                      else if (result.percentage >= 70) grade = 'C';
                      else if (result.percentage >= 60) grade = 'D';

                      return (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">{result.student_name}</TableCell>
                          <TableCell>{result.student_email}</TableCell>
                          <TableCell>{result.score} / {result.max_score}</TableCell>
                          <TableCell>
                            <span className={`font-medium ${
                              result.percentage >= 80 ? 'text-green-600' :
                              result.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {result.percentage}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              grade === 'A' ? 'bg-green-100 text-green-800' :
                              grade === 'B' ? 'bg-blue-100 text-blue-800' :
                              grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                              grade === 'D' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {grade}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(result.submitted_at).toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Results;
