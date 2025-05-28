
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import StatusBadge from '../../components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Eye, Edit } from 'lucide-react';

interface Contest {
  id: string;
  course_id: string;
  course_name: string;
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  status: "not_started" | "in_progress" | "ended";
  problem_count: number;
  submission_count: number;
  created_at: string;
}

const ContestList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [contests] = useState<Contest[]>([
    {
      id: '1',
      course_id: '1',
      course_name: 'Introduction to Programming',
      name: 'JavaScript Fundamentals Quiz',
      description: 'Test your knowledge of JavaScript basics',
      start_time: '2024-01-20T10:00:00Z',
      end_time: '2024-01-20T12:00:00Z',
      status: 'ended',
      problem_count: 10,
      submission_count: 23,
      created_at: '2024-01-18T09:00:00Z'
    },
    {
      id: '2',
      course_id: '1',
      course_name: 'Introduction to Programming',
      name: 'React Components Assessment',
      description: 'Understanding React component lifecycle',
      start_time: '2024-01-25T14:00:00Z',
      end_time: '2024-01-25T16:00:00Z',
      status: 'in_progress',
      problem_count: 15,
      submission_count: 8,
      created_at: '2024-01-22T11:30:00Z'
    },
    {
      id: '3',
      course_id: '2',
      course_name: 'Advanced Web Development',
      name: 'Node.js and Express Quiz',
      description: 'Backend development concepts',
      start_time: '2024-01-30T09:00:00Z',
      end_time: '2024-01-30T11:00:00Z',
      status: 'not_started',
      problem_count: 12,
      submission_count: 0,
      created_at: '2024-01-23T16:45:00Z'
    }
  ]);

  const filteredContests = contests.filter(contest =>
    contest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contest.course_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contest Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Problems</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContests.map((contest) => (
                  <TableRow key={contest.id}>
                    <TableCell className="font-medium">{contest.name}</TableCell>
                    <TableCell>{contest.course_name}</TableCell>
                    <TableCell>
                      <StatusBadge status={contest.status} />
                    </TableCell>
                    <TableCell>{new Date(contest.start_time).toLocaleString()}</TableCell>
                    <TableCell>{new Date(contest.end_time).toLocaleString()}</TableCell>
                    <TableCell>{contest.problem_count}</TableCell>
                    <TableCell>{contest.submission_count}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ContestList;
