import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileSpreadsheet } from 'lucide-react';
import { apiService } from '../../services/api';
import { toast } from '@/hooks/use-toast';

interface Contest {
  id: string;
  name: string;
  course_id: string;
  course_name?: string;
}

interface Result {
  id: string;
  student_email: string;
  score: number;
  max_score: number;
  percentage: number;
  submitted_at: string;
}

const Results = () => {
  const [selectedContest, setSelectedContest] = useState('');
  const [contests, setContests] = useState<Contest[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    loadContests();
  }, []);

  useEffect(() => {
    if (selectedContest) {
      loadContestResults();
    } else {
      setResults([]);
    }
  }, [selectedContest]);

  const loadContests = async () => {
    try {
      setLoading(true);
      const contestsData = await apiService.getContests() as Contest[];
      
      // Load course names for each contest
      const contestsWithCourseNames = await Promise.all(
        contestsData.map(async (contest) => {
          try {
            const course = await apiService.getCourse(contest.course_id) as { id: string; name: string };
            return {
              ...contest,
              course_name: course.name || 'Unknown Course'
            };
          } catch (error) {
            return {
              ...contest,
              course_name: 'Unknown Course'
            };
          }
        })
      );
      
      setContests(contestsWithCourseNames);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load contests",
        variant: "destructive"
      });
      console.error('Error loading contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContestResults = async () => {
    if (!selectedContest) return;
    
    try {
      setLoadingResults(true);
      const resultsData = await apiService.getContestResults(selectedContest) as Result[];
      setResults(resultsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load contest results",
        variant: "destructive"
      });
      console.error('Error loading contest results:', error);
      setResults([]);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleExport = async (format: 'excel' | 'csv') => {
    if (!selectedContest) {
      toast({
        title: "Error",
        description: "Please select a contest first",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiService.exportResults(selectedContest, format);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contest_results_${selectedContest}.${format === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `Results exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to export results as ${format.toUpperCase()}`,
        variant: "destructive"
      });
    }
  };

  const gradeDistribution = results.length > 0 ? {
    'A (90-100%)': results.filter(r => r.percentage >= 90).length,
    'B (80-89%)': results.filter(r => r.percentage >= 80 && r.percentage < 90).length,
    'C (70-79%)': results.filter(r => r.percentage >= 70 && r.percentage < 80).length,
    'D (60-69%)': results.filter(r => r.percentage >= 60 && r.percentage < 70).length,
    'F (0-59%)': results.filter(r => r.percentage < 60).length,
  } : {};

  const averageScore = results.length > 0 
    ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length 
    : 0;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

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
                      {contest.name} - {contest.course_name}
                    </option>
                  ))}
                </select>
              </div>
              {contests.length === 0 && (
                <p className="text-sm text-gray-500">No contests available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedContest && (
          <>
            {loadingResults ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
              </div>
            ) : (
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
                        {results.length > 0 ? Math.max(...results.map(r => r.percentage)) : 0}%
                      </div>
                      <p className="text-sm text-gray-500">Highest Score</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold text-orange-600">
                        {results.length > 0 ? Math.min(...results.map(r => r.percentage)) : 0}%
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
                      {results.length > 0 ? (
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
                      ) : (
                        <p className="text-gray-500 text-center py-4">No results to display</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Export Options</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Button 
                          className="w-full flex items-center justify-center space-x-2"
                          onClick={() => handleExport('excel')}
                          disabled={results.length === 0}
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>Export to Excel</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full flex items-center justify-center space-x-2"
                          onClick={() => handleExport('csv')}
                          disabled={results.length === 0}
                        >
                          <Download className="h-4 w-4" />
                          <span>Export to CSV</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Contest Results</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExport('csv')}
                        disabled={results.length === 0}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Table
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {results.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No submissions found for this contest</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student Email</TableHead>
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
                                <TableCell className="font-medium">{result.student_email}</TableCell>
                                <TableCell>{result.score}/{result.max_score}</TableCell>
                                <TableCell>{result.percentage.toFixed(1)}%</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Results;
