import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '../../services/api';

interface MCQProblem {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

const MCQList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [mcqs, setMcqs] = useState<MCQProblem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMCQs();
  }, []);

  const loadMCQs = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMCQs(0, 100, searchTerm || undefined) as MCQProblem[];
      setMcqs(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load MCQs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadMCQs();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this MCQ?')) {
      return;
    }

    try {
      await apiService.deleteMCQ(id);
      toast({
        title: "Success",
        description: "MCQ deleted successfully"
      });
      loadMCQs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete MCQ",
        variant: "destructive"
      });
    }
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
            {mcqs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {searchTerm ? 'No MCQs match your search' : 'No MCQs created yet'}
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => navigate('/admin/mcq/create')} 
                    className="mt-4"
                  >
                    Create Your First MCQ
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mcqs.map((mcq) => (
                    <TableRow key={mcq.id}>
                      <TableCell className="font-medium">{mcq.title}</TableCell>
                      <TableCell className="max-w-md truncate">{mcq.description}</TableCell>
                      <TableCell>{new Date(mcq.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/mcq/edit/${mcq.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(mcq.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MCQList;
