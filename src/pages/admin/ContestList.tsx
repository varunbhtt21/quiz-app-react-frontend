import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import StatusBadge from '../../components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Eye, Edit } from 'lucide-react';
import { apiService } from '../../services/api';
import { toast } from '@/hooks/use-toast';

interface Contest {
  id: string;
  course_id: string;
  course_name?: string;
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  status: "not_started" | "in_progress" | "ended";
  problem_count?: number;
  submission_count?: number;
  created_at: string;
}

const ContestList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContests();
  }, []);

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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Contest Management</h1>
          <Button onClick={() => navigate('/admin/contests/create')} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Contest</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Contests</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search contests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredContests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {contests.length === 0 ? 'No contests created yet' : 'No contests match your search'}
                </p>
                {contests.length === 0 && (
                  <Button 
                    onClick={() => navigate('/admin/contests/create')} 
                    className="mt-4"
                  >
                    Create Your First Contest
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contest Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContests.map((contest) => {
                    const status = getContestStatus(contest.start_time, contest.end_time);
                    return (
                      <TableRow key={contest.id}>
                        <TableCell className="font-medium">{contest.name}</TableCell>
                        <TableCell>{contest.course_name || 'Unknown Course'}</TableCell>
                        <TableCell>
                          <StatusBadge status={status} />
                        </TableCell>
                        <TableCell>{new Date(contest.start_time).toLocaleString()}</TableCell>
                        <TableCell>{new Date(contest.end_time).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate(`/admin/contests/${contest.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate(`/admin/contests/edit/${contest.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ContestList;
