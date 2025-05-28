import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Save, Search, Users, Home, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '../../services/api';

interface Student {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Course {
  id: string;
  name: string;
  description: string;
}

const EnrollStudents = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

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

  const loadData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Load course details
      const courseData = await apiService.getCourse(id) as Course;
      setCourse(courseData);
      
      // Load all students
      const studentsData = await apiService.getStudents(0, 1000);
      setStudents(Array.isArray(studentsData) ? studentsData.filter(s => s.is_active) : []);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
      console.error('Error loading data:', error);
      navigate('/admin/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handleEnrollStudents = async () => {
    if (selectedStudents.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student to enroll",
        variant: "destructive"
      });
      return;
    }

    if (!id) return;

    try {
      setEnrolling(true);
      const studentIds = Array.from(selectedStudents);
      await apiService.enrollStudents(id, studentIds);
      
      toast({
        title: "Success",
        description: `Successfully enrolled ${studentIds.length} student(s) in the course`
      });
      
      navigate(`/admin/courses/${id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to enroll students",
        variant: "destructive"
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleBack = () => {
    navigate(`/admin/courses/${id}`);
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

  if (!course) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-gray-500">Course not found</p>
          <Button onClick={() => navigate('/admin/courses')} className="mt-4">
            Back to Courses
          </Button>
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
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin/courses')}
            className="p-0 h-auto font-normal"
          >
            Courses
          </Button>
          <ChevronRight className="h-4 w-4" />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/admin/courses/${id}`)}
            className="p-0 h-auto font-normal"
          >
            {course.name}
          </Button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Enroll Students</span>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Enroll Students in {course.name}</h1>
            <p className="text-gray-600">Select students from the system to enroll in this course</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Available Students</span>
              </CardTitle>
              <div className="text-sm text-gray-500">
                {selectedStudents.size} of {filteredStudents.length} selected
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search students by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {filteredStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'No students found matching your search' : 'No active students found'}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    {searchTerm ? 'Try adjusting your search terms' : 'Create students first to enroll them in courses'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Select All */}
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Checkbox
                      id="select-all"
                      checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                      Select All ({filteredStudents.length} students)
                    </label>
                  </div>

                  {/* Students Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Select</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedStudents.has(student.id)}
                              onCheckedChange={() => handleStudentToggle(student.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{student.email}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              Active
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(student.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  disabled={enrolling}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleEnrollStudents}
                  disabled={enrolling || selectedStudents.size === 0}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>
                    {enrolling 
                      ? 'Enrolling...' 
                      : `Enroll ${selectedStudents.size} Student${selectedStudents.size !== 1 ? 's' : ''}`
                    }
                  </span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EnrollStudents; 