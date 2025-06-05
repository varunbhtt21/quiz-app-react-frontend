import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import StatusBadge from '../../components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Eye, Edit, Trophy, Calendar, Clock, Users, Target, Play, Pause, CheckCircle, RefreshCw, Download, BookOpen, Timer, TrendingUp, Trash2, Power, PowerOff } from 'lucide-react';
import { apiService } from '../../services/api';
import { toast } from '@/hooks/use-toast';

interface Contest {
  id: string;
  course_id: string;
  course_name?: string;
  name: string;
  description?: string;
  is_active: boolean;
  start_time: string;
  end_time: string;
  status: "not_started" | "in_progress" | "ended";
  problem_count?: number;
  submission_count?: number;
  created_at: string;
  can_be_deleted?: boolean;
}

const ContestList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingContestId, setDeletingContestId] = useState<string | null>(null);
  const [togglingContestId, setTogglingContestId] = useState<string | null>(null);

  useEffect(() => {
    loadContests();
  }, []);

  const loadContests = async () => {
    try {
      setLoading(true);
      const contestsData = await apiService.getContests() as Contest[];
      
      // Load course names and additional data for each contest
      const contestsWithDetails = await Promise.all(
        contestsData.map(async (contest) => {
          try {
            const course = await apiService.getCourse(contest.course_id) as { id: string; name: string };
            
            // Try to get contest details for problem count
            let problemCount = 0;
            try {
              const contestDetails = await apiService.getContest(contest.id) as any;
              problemCount = contestDetails.problems ? contestDetails.problems.length : 0;
            } catch (error) {
              // Contest details not available
            }
            
            return {
              ...contest,
              course_name: course.name || 'Unknown Course',
              problem_count: problemCount
            };
          } catch (error) {
            return {
              ...contest,
              course_name: 'Unknown Course',
              problem_count: 0
            };
          }
        })
      );
      
      setContests(contestsWithDetails);
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

  const handleDeleteContest = async (contestId: string) => {
    try {
      setDeletingContestId(contestId);
      await apiService.deleteContest(contestId);
      
      toast({
        title: "Success",
        description: "Contest deleted successfully"
      });
      
      // Reload contests
      await loadContests();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete contest",
        variant: "destructive"
      });
    } finally {
      setDeletingContestId(null);
    }
  };

  const handleToggleContestStatus = async (contestId: string, isActive: boolean) => {
    try {
      setTogglingContestId(contestId);
      await apiService.toggleContestStatus(contestId, isActive);
      
      toast({
        title: "Success",
        description: `Contest ${isActive ? 'enabled' : 'disabled'} successfully`
      });
      
      // Update local state
      setContests(contests.map(contest => 
        contest.id === contestId 
          ? { ...contest, is_active: isActive }
          : contest
      ));
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update contest status",
        variant: "destructive"
      });
    } finally {
      setTogglingContestId(null);
    }
  };

  const getContestStatus = (startTime: string, endTime: string): "not_started" | "in_progress" | "ended" => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now < start) return "not_started";
    if (now >= start && now <= end) return "in_progress";
    return "ended";
  };

  const filteredContests = contests.filter(contest =>
    contest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contest.course_name && contest.course_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeContests = contests.filter(c => getContestStatus(c.start_time, c.end_time) === 'in_progress').length;
  const upcomingContests = contests.filter(c => getContestStatus(c.start_time, c.end_time) === 'not_started').length;
  const completedContests = contests.filter(c => getContestStatus(c.start_time, c.end_time) === 'ended').length;
  const recentContests = contests.filter(contest => {
    const createdDate = new Date(contest.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdDate > weekAgo;
  }).length;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString.replace('Z', '')).toLocaleString();
  };

  const getTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime.replace('Z', ''));
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
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
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-red-600 to-pink-700 rounded-2xl p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Trophy className="h-8 w-8" />
                  <h1 className="text-4xl font-bold">🏆 Quiz Contests</h1>
                </div>
                <p className="text-orange-100 text-lg mb-4">
                  Schedule, manage, and monitor quiz competitions
                </p>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Trophy className="h-3 w-3 mr-1" />
                    {contests.length} Total Contests
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Play className="h-3 w-3 mr-1" />
                    {activeContests} Active Now
                  </Badge>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                  <Trophy className="h-16 w-16 text-orange-200" />
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Contests</p>
                  <p className="text-3xl font-bold text-gray-900">{contests.length}</p>
                  <p className="text-xs text-gray-500">All time contests</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50">
                  <Trophy className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Contests</p>
                  <p className="text-3xl font-bold text-green-600">{activeContests}</p>
                  <p className="text-xs text-gray-500">Currently running</p>
                </div>
                <div className="p-3 rounded-xl bg-green-50">
                  <Play className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Upcoming</p>
                  <p className="text-3xl font-bold text-purple-600">{upcomingContests}</p>
                  <p className="text-xs text-gray-500">Scheduled contests</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-orange-600">{completedContests}</p>
                  <p className="text-xs text-gray-500">Finished contests</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-50">
                  <CheckCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Contest Management */}
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">🎯 All Contests</CardTitle>
                <p className="text-gray-600 text-sm mt-1">Schedule and manage quiz competitions</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  onClick={loadContests}
                  className="hover:bg-blue-50 hover:border-blue-300"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button 
                  variant="outline"
                  className="hover:bg-green-50 hover:border-green-300"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button 
                  onClick={() => navigate('/admin/contests/create')} 
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Contest
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Enhanced Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search contests by name or course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between mb-4 p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">
                  Showing {filteredContests.length} of {contests.length} contests
                </span>
              </div>
              {searchTerm && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSearchTerm('')}
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                >
                  Clear search
                </Button>
              )}
            </div>

            {filteredContests.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-3">
                  {searchTerm ? 'No contests found' : 'No contests yet'}
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {searchTerm 
                    ? 'Try adjusting your search terms to find what you\'re looking for.' 
                    : 'Start by creating your first quiz contest to engage your students.'
                  }
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => navigate('/admin/contests/create')}
                    className="px-6 bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Contest
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold">Contest</TableHead>
                      <TableHead className="font-semibold">Course</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Schedule</TableHead>
                      <TableHead className="font-semibold">Details</TableHead>
                      <TableHead className="font-semibold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContests.map((contest) => {
                      const status = getContestStatus(contest.start_time, contest.end_time);
                      
                      return (
                        <TableRow key={contest.id} className={`hover:bg-gray-50 transition-colors ${!contest.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center ${!contest.is_active ? 'opacity-50' : ''}`}>
                                <Trophy className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className={`font-medium text-gray-900 ${!contest.is_active ? 'line-through text-gray-500' : ''}`}>
                                    {contest.name}
                                  </h4>
                                  {!contest.is_active && (
                                    <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 border-red-200">
                                      Disabled
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">ID: {contest.id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <BookOpen className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{contest.course_name || 'Unknown Course'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <StatusBadge status={status} />
                              {status === 'in_progress' && (
                                <div className="text-xs text-orange-600 font-medium">
                                  Ends in {getTimeRemaining(contest.end_time)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              <div className="flex items-center text-gray-900">
                                <Calendar className="h-3 w-3 mr-1" />
                                Start: {formatDateTime(contest.start_time)}
                              </div>
                              <div className="flex items-center text-gray-600">
                                <Timer className="h-3 w-3 mr-1" />
                                End: {formatDateTime(contest.end_time)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant="outline" className="text-xs">
                                <Target className="h-3 w-3 mr-1" />
                                {contest.problem_count || 0} Questions
                              </Badge>
                              <div className="text-xs text-gray-500">
                                Created {new Date(contest.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate(`/admin/contests/${contest.id}`)}
                                className="hover:bg-blue-50 hover:border-blue-300"
                                title="View Contest"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate(`/admin/contests/edit/${contest.id}`)}
                                className="hover:bg-green-50 hover:border-green-300"
                                title="Edit Contest"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              
                              {/* Enable/Disable Toggle */}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleToggleContestStatus(contest.id, !contest.is_active)}
                                disabled={togglingContestId === contest.id}
                                className={`${contest.is_active 
                                  ? 'hover:bg-red-50 hover:border-red-300 text-red-600' 
                                  : 'hover:bg-green-50 hover:border-green-300 text-green-600'
                                }`}
                                title={contest.is_active ? 'Disable Contest' : 'Enable Contest'}
                              >
                                {togglingContestId === contest.id ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : contest.is_active ? (
                                  <PowerOff className="h-3 w-3" />
                                ) : (
                                  <Power className="h-3 w-3" />
                                )}
                              </Button>

                              {/* Delete Button */}
                              {contest.can_be_deleted && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="hover:bg-red-50 hover:border-red-300 text-red-600"
                                      title="Delete Contest"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Contest</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{contest.name}"? This action cannot be undone and will remove all contest data including problems.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteContest(contest.id)}
                                        disabled={deletingContestId === contest.id}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        {deletingContestId === contest.id ? (
                                          <>
                                            <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                                            Deleting...
                                          </>
                                        ) : (
                                          <>
                                            <Trash2 className="h-3 w-3 mr-2" />
                                            Delete Contest
                                          </>
                                        )}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
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
    </Layout>
  );
};

export default ContestList;
