import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Eye, TrendingUp, Loader2, Trophy, Target, BookOpen, Clock, Award, Star, Calendar, Timer } from 'lucide-react';
import { apiService } from '../../services/api';
import { toast } from '@/hooks/use-toast';

interface StudentResult {
  id: string;
  contest_name: string;
  course_name: string;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  submitted_at: string;
  time_taken_seconds?: number;
  is_auto_submitted: boolean;
}

const StudentResults = () => {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const submissions = await apiService.getMySubmissions() as StudentResult[];
      setResults(submissions);
    } catch (error) {
      console.error('Error loading results:', error);
      toast({
        title: "Error",
        description: "Failed to load your results",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading your results...</span>
          </div>
        </div>
      </Layout>
    );
  }

  const averageScore = results.length > 0 ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length : 0;
  const totalContests = results.length;
  const bestScore = results.length > 0 ? Math.max(...results.map(r => r.percentage)) : 0;
  const totalPoints = results.reduce((sum, r) => sum + r.total_score, 0);
  const maxPossiblePoints = results.reduce((sum, r) => sum + r.max_possible_score, 0);

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
    if (percentage >= 80) return { grade: 'B', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
    if (percentage >= 70) return { grade: 'C', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    if (percentage >= 60) return { grade: 'D', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
    return { grade: 'F', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
  };

  const statsCards = [
    {
      title: 'Contests Completed',
      value: totalContests,
      icon: Trophy,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Total contests finished'
    },
    {
      title: 'Average Score',
      value: `${averageScore.toFixed(1)}%`,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Your performance average'
    },
    {
      title: 'Best Score',
      value: `${bestScore.toFixed(1)}%`,
      icon: Star,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Your highest achievement'
    },
    {
      title: 'Total Points',
      value: `${totalPoints}/${maxPossiblePoints}`,
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Points earned overall'
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">📊 My Results</h1>
                <p className="text-purple-100 text-lg">
                  Track your progress and celebrate your achievements
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-12 w-12 text-yellow-300" />
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Results Table */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">🏆 Contest Results</CardTitle>
                    <p className="text-gray-600 text-sm mt-1">Your performance across all contests</p>
                  </div>
                  <Button variant="outline" size="sm" disabled className="hover:bg-gray-50">
                    <Download className="h-4 w-4 mr-2" />
                    Export Results
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Trophy className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-3">No Results Yet</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Complete some contests to see your results here. Your performance data will appear once you start taking quizzes.
                    </p>
                    <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-300">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Browse Contests
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-semibold">Contest</TableHead>
                          <TableHead className="font-semibold">Course</TableHead>
                          <TableHead className="font-semibold">Score</TableHead>
                          <TableHead className="font-semibold">Grade</TableHead>
                          <TableHead className="font-semibold">Time</TableHead>
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((result, index) => {
                          const { grade, color, bgColor, borderColor } = getGrade(result.percentage);
                          
                          return (
                            <TableRow key={result.id} className="hover:bg-gray-50 transition-colors">
                              <TableCell>
                                <div>
                                  <p className="font-medium text-gray-900">{result.contest_name}</p>
                                  <p className="text-xs text-gray-500">Contest #{index + 1}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  <BookOpen className="h-3 w-3 mr-1" />
                                  {result.course_name}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-gray-900">
                                      {result.total_score}/{result.max_possible_score}
                                    </span>
                                    <span className={`text-sm font-medium ${color}`}>
                                      {result.percentage.toFixed(1)}%
                                    </span>
                                  </div>
                                  <Progress 
                                    value={result.percentage} 
                                    className="h-2 w-20"
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${bgColor} ${color} ${borderColor} border font-bold`}>
                                  {grade}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="flex items-center text-gray-900">
                                    <Timer className="h-3 w-3 mr-1" />
                                    {formatTimeTaken(result.time_taken_seconds)}
                                  </div>
                                  {result.is_auto_submitted && (
                                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-200 mt-1">
                                      Auto-submitted
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {new Date(result.submitted_at).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {new Date(result.submitted_at).toLocaleTimeString()}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button size="sm" variant="outline" disabled className="hover:bg-gray-50">
                                  <Eye className="h-3 w-3" />
                                </Button>
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance Trends */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <span>📈 Performance Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Grade Distribution */}
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-900">Grade Distribution</h4>
                    <div className="space-y-3">
                      {['A', 'B', 'C', 'D', 'F'].map((grade) => {
                        const count = results.filter(r => getGrade(r.percentage).grade === grade).length;
                        const percentage = results.length > 0 ? (count / results.length) * 100 : 0;
                        const gradeInfo = getGrade(grade === 'A' ? 95 : grade === 'B' ? 85 : grade === 'C' ? 75 : grade === 'D' ? 65 : 55);
                        
                        return (
                          <div key={grade} className="flex items-center space-x-3">
                            <Badge className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${gradeInfo.bgColor} ${gradeInfo.color} ${gradeInfo.borderColor} border`}>
                              {grade}
                            </Badge>
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700">Grade {grade}</span>
                                <span className="text-sm text-gray-500">{count} contest{count !== 1 ? 's' : ''}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${gradeInfo.color.replace('text-', 'bg-')}`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Performance Summary */}
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-900">Performance Summary</h4>
                    <div className="space-y-3">
                      {results.length > 0 ? (
                        <>
                          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <span className="text-sm font-medium text-blue-900">Total Contests</span>
                            <span className="font-bold text-blue-900">{results.length}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <span className="text-sm font-medium text-green-900">Average Score</span>
                            <span className="font-bold text-green-900">{averageScore.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                            <span className="text-sm font-medium text-purple-900">Best Performance</span>
                            <span className="font-bold text-purple-900">{bestScore.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                            <span className="text-sm font-medium text-orange-900">Total Points</span>
                            <span className="font-bold text-orange-900">{totalPoints}/{maxPossiblePoints}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">No performance data available yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Award className="h-5 w-5 text-yellow-600" />
                  </div>
                  <span>🏅 Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bestScore >= 90 && (
                    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                      <div className="text-3xl">🏆</div>
                      <div>
                        <p className="font-semibold text-sm text-yellow-900">Excellence Award</p>
                        <p className="text-xs text-yellow-700">Scored 90%+ in a contest</p>
                      </div>
                    </div>
                  )}
                  {results.length >= 5 && (
                    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="text-3xl">📚</div>
                      <div>
                        <p className="font-semibold text-sm text-blue-900">Dedicated Learner</p>
                        <p className="text-xs text-blue-700">Completed 5+ contests</p>
                      </div>
                    </div>
                  )}
                  {results.length >= 3 && (
                    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <div className="text-3xl">🎯</div>
                      <div>
                        <p className="font-semibold text-sm text-green-900">Consistent Performer</p>
                        <p className="text-xs text-green-700">Completed 3+ contests</p>
                      </div>
                    </div>
                  )}
                  {results.some(r => r.time_taken_seconds && r.time_taken_seconds < 3600) && (
                    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                      <div className="text-3xl">⚡</div>
                      <div>
                        <p className="font-semibold text-sm text-purple-900">Speed Champion</p>
                        <p className="text-xs text-purple-700">Completed contest in under 1 hour</p>
                      </div>
                    </div>
                  )}
                  {averageScore >= 80 && (
                    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
                      <div className="text-3xl">⭐</div>
                      <div>
                        <p className="font-semibold text-sm text-indigo-900">High Achiever</p>
                        <p className="text-xs text-indigo-700">Maintained 80%+ average</p>
                      </div>
                    </div>
                  )}
                  {results.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 mb-2">No achievements yet</p>
                      <p className="text-xs text-gray-400">Complete contests to unlock achievements!</p>
                    </div>
                  )}
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
