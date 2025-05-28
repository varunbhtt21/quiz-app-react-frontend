import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileSpreadsheet, BarChart3, TrendingUp, Users, Award, Calendar, Target, RefreshCw, Filter, Search, Trophy, CheckCircle, Clock } from 'lucide-react';
import { apiService } from '../../services/api';
import { toast } from '@/hooks/use-toast';

interface Contest {
  id: string;
  name: string;
  course_id: string;
  course_name?: string;
  created_at: string;
}

interface Result {
  id: string;
  student_email: string;
  score: number;
  max_score: number;
  percentage: number;
  submitted_at: string;
  time_taken_seconds?: number;
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

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
    if (percentage >= 80) return { grade: 'B', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
    if (percentage >= 70) return { grade: 'C', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    if (percentage >= 60) return { grade: 'D', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
    return { grade: 'F', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
  };

  const formatTimeTaken = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

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
      <div className="space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-red-700 rounded-2xl p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-8 w-8" />
                  <h1 className="text-4xl font-bold">📊 Results & Analytics</h1>
                </div>
                <p className="text-purple-100 text-lg mb-4">
                  Analyze performance data and export detailed reports
                </p>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Trophy className="h-3 w-3 mr-1" />
                    {contests.length} Contests Available
                  </Badge>
                  {selectedContest && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      <Users className="h-3 w-3 mr-1" />
                      {results.length} Submissions
                    </Badge>
                  )}
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-16 w-16 text-purple-200" />
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        </div>

        {/* Enhanced Contest Selection */}
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">🎯 Contest Selection</CardTitle>
                <p className="text-gray-600 text-sm mt-1">Choose a contest to view detailed analytics</p>
              </div>
              <Button 
                variant="outline" 
                onClick={loadContests}
                className="hover:bg-blue-50 hover:border-blue-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contest" className="text-sm font-medium">Select Contest</Label>
                <select
                  id="contest"
                  value={selectedContest}
                  onChange={(e) => setSelectedContest(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Choose a contest to analyze...</option>
                  {contests.map((contest) => (
                    <option key={contest.id} value={contest.id}>
                      {contest.name} - {contest.course_name}
                    </option>
                  ))}
                </select>
              </div>
              {contests.length === 0 && (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No contests available for analysis</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedContest && (
          <>
            {loadingResults ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <>
                {/* Enhanced Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Total Submissions</p>
                          <p className="text-3xl font-bold text-blue-600">{results.length}</p>
                          <p className="text-xs text-gray-500">Students participated</p>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-50">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Average Score</p>
                          <p className="text-3xl font-bold text-green-600">{averageScore.toFixed(1)}%</p>
                          <p className="text-xs text-gray-500">Class performance</p>
                        </div>
                        <div className="p-3 rounded-xl bg-green-50">
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Highest Score</p>
                          <p className="text-3xl font-bold text-purple-600">
                            {results.length > 0 ? Math.max(...results.map(r => r.percentage)).toFixed(1) : 0}%
                          </p>
                          <p className="text-xs text-gray-500">Best performance</p>
                        </div>
                        <div className="p-3 rounded-xl bg-purple-50">
                          <Award className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Pass Rate</p>
                          <p className="text-3xl font-bold text-orange-600">
                            {results.length > 0 ? ((results.filter(r => r.percentage >= 60).length / results.length) * 100).toFixed(1) : 0}%
                          </p>
                          <p className="text-xs text-gray-500">Students passing (≥60%)</p>
                        </div>
                        <div className="p-3 rounded-xl bg-orange-50">
                          <CheckCircle className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Enhanced Results Table */}
                  <div className="lg:col-span-2">
                    <Card className="shadow-lg border-0">
                      <CardHeader className="border-b bg-gray-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-xl">📋 Student Results</CardTitle>
                            <p className="text-gray-600 text-sm mt-1">Detailed performance breakdown</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              onClick={loadContestResults}
                              size="sm"
                              className="hover:bg-blue-50 hover:border-blue-300"
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Refresh
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        {results.length === 0 ? (
                          <div className="text-center py-16">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <BarChart3 className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Results Yet</h3>
                            <p className="text-gray-500">No students have submitted this contest yet.</p>
                          </div>
                        ) : (
                          <div className="overflow-hidden">
                            <Table>
                              <TableHeader className="bg-gray-50">
                                <TableRow>
                                  <TableHead className="font-semibold">Student</TableHead>
                                  <TableHead className="font-semibold">Score</TableHead>
                                  <TableHead className="font-semibold">Grade</TableHead>
                                  <TableHead className="font-semibold">Time</TableHead>
                                  <TableHead className="font-semibold">Submitted</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {results.map((result) => {
                                  const { grade, color, bgColor, borderColor } = getGrade(result.percentage);
                                  
                                  return (
                                    <TableRow key={result.id} className="hover:bg-gray-50 transition-colors">
                                      <TableCell>
                                        <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                                            <span className="text-white font-semibold text-xs">
                                              {result.student_email.charAt(0).toUpperCase()}
                                            </span>
                                          </div>
                                          <div>
                                            <p className="font-medium text-gray-900">{result.student_email}</p>
                                            <p className="text-sm text-gray-500">ID: {result.id.slice(0, 8)}...</p>
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="space-y-1">
                                          <div className="flex items-center space-x-2">
                                            <span className="font-bold text-gray-900">
                                              {result.score}/{result.max_score}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                              ({result.percentage.toFixed(1)}%)
                                            </span>
                                          </div>
                                          <Progress value={result.percentage} className="h-2 w-20" />
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge className={`${bgColor} ${color} ${borderColor} border font-bold`}>
                                          {grade}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center space-x-1">
                                          <Clock className="h-3 w-3 text-gray-400" />
                                          <span className="text-sm text-gray-600">
                                            {formatTimeTaken(result.time_taken_seconds)}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="text-sm text-gray-600">
                                          {new Date(result.submitted_at).toLocaleDateString()}
                                          <div className="text-xs text-gray-500">
                                            {new Date(result.submitted_at).toLocaleTimeString()}
                                          </div>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Enhanced Analytics Sidebar */}
                  <div className="space-y-6">
                    {/* Grade Distribution */}
                    <Card className="shadow-lg border-0">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <BarChart3 className="h-5 w-5 text-purple-600" />
                          </div>
                          <span>Grade Distribution</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {Object.entries(gradeDistribution).map(([grade, count]) => {
                            const percentage = results.length > 0 ? (count / results.length) * 100 : 0;
                            const gradeInfo = getGrade(grade.includes('90-100') ? 95 : 
                                                     grade.includes('80-89') ? 85 : 
                                                     grade.includes('70-79') ? 75 : 
                                                     grade.includes('60-69') ? 65 : 50);
                            
                            return (
                              <div key={grade} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-700">{grade}</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">{count}</span>
                                    <Badge className={`${gradeInfo.bgColor} ${gradeInfo.color} ${gradeInfo.borderColor} border text-xs`}>
                                      {percentage.toFixed(0)}%
                                    </Badge>
                                  </div>
                                </div>
                                <Progress value={percentage} className="h-2" />
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Export Options */}
                    <Card className="shadow-lg border-0">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Download className="h-5 w-5 text-green-600" />
                          </div>
                          <span>Export Options</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <Button 
                            className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700"
                            onClick={() => handleExport('excel')}
                            disabled={results.length === 0}
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                            <span>Export to Excel</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full flex items-center justify-center space-x-2 hover:bg-blue-50 hover:border-blue-300"
                            onClick={() => handleExport('csv')}
                            disabled={results.length === 0}
                          >
                            <Download className="h-4 w-4" />
                            <span>Export to CSV</span>
                          </Button>
                          {results.length === 0 && (
                            <p className="text-xs text-gray-500 text-center">
                              Select a contest with results to enable export
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Performance Summary */}
                    <Card className="shadow-lg border-0">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Target className="h-5 w-5 text-orange-600" />
                          </div>
                          <span>Performance Summary</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-sm font-medium text-blue-900 mb-1">Class Average</div>
                            <div className="text-2xl font-bold text-blue-600">{averageScore.toFixed(1)}%</div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                              <div className="text-xs font-medium text-green-700">Highest</div>
                              <div className="text-lg font-bold text-green-600">
                                {results.length > 0 ? Math.max(...results.map(r => r.percentage)).toFixed(1) : 0}%
                              </div>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-center">
                              <div className="text-xs font-medium text-red-700">Lowest</div>
                              <div className="text-lg font-bold text-red-600">
                                {results.length > 0 ? Math.min(...results.map(r => r.percentage)).toFixed(1) : 0}%
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="text-xs font-medium text-purple-700 mb-1">Pass Rate (≥60%)</div>
                            <div className="flex items-center space-x-2">
                              <Progress 
                                value={results.length > 0 ? (results.filter(r => r.percentage >= 60).length / results.length) * 100 : 0} 
                                className="flex-1 h-2" 
                              />
                              <span className="text-sm font-bold text-purple-600">
                                {results.length > 0 ? ((results.filter(r => r.percentage >= 60).length / results.length) * 100).toFixed(1) : 0}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Results;
