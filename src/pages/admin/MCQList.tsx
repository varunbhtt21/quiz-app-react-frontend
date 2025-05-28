
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

interface MCQProblem {
  id: string;
  title: string;
  description: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_options: string[];
  explanation?: string;
  created_at: string;
  updated_at: string;
}

const MCQList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [mcqs] = useState<MCQProblem[]>([
    {
      id: '1',
      title: 'What is React?',
      description: 'Choose the correct definition of React',
      option_a: 'A JavaScript library',
      option_b: 'A programming language',
      option_c: 'A database',
      option_d: 'An operating system',
      correct_options: ['A'],
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      title: 'JavaScript Data Types',
      description: 'Which of the following are primitive data types in JavaScript?',
      option_a: 'String',
      option_b: 'Number',
      option_c: 'Object',
      option_d: 'Boolean',
      correct_options: ['A', 'B', 'D'],
      created_at: '2024-01-14T15:30:00Z',
      updated_at: '2024-01-14T15:30:00Z'
    }
  ]);

  const filteredMCQs = mcqs.filter(mcq =>
    mcq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mcq.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">MCQ Management</h1>
          <Button onClick={() => navigate('/admin/mcq/create')} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create MCQ</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All MCQ Problems</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search MCQs..."
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
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Correct Options</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMCQs.map((mcq) => (
                  <TableRow key={mcq.id}>
                    <TableCell className="font-medium">{mcq.title}</TableCell>
                    <TableCell>{mcq.description.substring(0, 50)}...</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {mcq.correct_options.map((option) => (
                          <span key={option} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            {option}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(mcq.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/admin/mcq/edit/${mcq.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
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

export default MCQList;
