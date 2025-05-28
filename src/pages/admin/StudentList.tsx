import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Users, UserCheck, UserX, Home, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '../../services/api';

interface Student {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const StudentList = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    // Filter students based on search term
    if (searchTerm.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [students, searchTerm]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await apiService.getStudents(0, 1000);
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive"
      });
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete student ${email}? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.deleteStudent(studentId);
      toast({
        title: "Success",
        description: "Student deleted successfully"
      });
      loadStudents();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete student",
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (studentId: string, currentStatus: boolean) => {
    try {
      await apiService.updateStudent(studentId, { is_active: !currentStatus });
      toast({
        title: "Success",
        description: `Student ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });
      loadStudents();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update student status",
        variant: "destructive"
      });
    }
  };

  const activeStudents = students.filter(s => s.is_active).length;
  const inactiveStudents = students.filter(s => s.is_active === false).length;

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
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin/dashboard')}
            className="p-0 h-auto font-normal"
          >
            <Home className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Students</span>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Student Management</h1>
            <p className="text-gray-600">Manage all student accounts in the system</p>
          </div>
          <Button onClick={() => navigate('/admin/students/create')} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add New Student</span>
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{students.length}</div>
                  <p className="text-sm text-gray-500">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{activeStudents}</div>
                  <p className="text-sm text-gray-500">Active Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <UserX className="h-8 w-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{inactiveStudents}</div>
                  <p className="text-sm text-gray-500">Inactive Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>All Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search students by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={loadStudents}>
                Refresh
              </Button>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'No students found matching your search' : 'No students found'}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {searchTerm ? 'Try adjusting your search terms' : 'Create your first student to get started'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          student.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {student.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(student.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(student.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/students/${student.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={student.is_active ? "secondary" : "default"}
                            onClick={() => handleToggleStatus(student.id, student.is_active)}
                          >
                            {student.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteStudent(student.id, student.email)}
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

export default StudentList; 