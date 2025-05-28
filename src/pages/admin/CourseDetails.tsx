import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, UserPlus, Download, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '../../services/api';

interface Student {
  id: string;
  email: string;
  is_active: boolean;
  course_id: string;
}

interface Course {
  id: string;
  name: string;
  description: string;
  instructor_id: string;
  created_at: string;
  updated_at: string;
}

interface StudentsResponse {
  course_id: string;
  course_name: string;
  students: Array<{
    id: string;
    email: string;
    is_active: boolean;
  }>;
}

const CourseDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCourseData();
    }
  }, [id]);

  const loadCourseData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Load course details first
      const courseData = await apiService.getCourse(id) as Course;
      setCourse(courseData);
      
      // Then load students
      try {
        const studentsResponse = await apiService.getCourseStudents(id);
        console.log('Students response:', studentsResponse);
        
        // Handle the response format from backend
        let studentsData: Student[] = [];
        if (studentsResponse && typeof studentsResponse === 'object') {
          if (Array.isArray(studentsResponse)) {
            // If response is directly an array
            studentsData = studentsResponse;
          } else if ('students' in studentsResponse && Array.isArray((studentsResponse as StudentsResponse).students)) {
            // If response has a 'students' property (which is the actual backend format)
            studentsData = (studentsResponse as StudentsResponse).students.map((student: any) => ({
              ...student,
              course_id: id // Add course_id to match interface
            }));
          }
        }
        
        setStudents(studentsData);
      } catch (studentsError) {
        console.error('Error loading students:', studentsError);
        setStudents([]);
        // Don't show error toast for students as course might just have no students
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load course data",
        variant: "destructive"
      });
      console.error('Error loading course data:', error);
      // Navigate back if course doesn't exist
      navigate('/admin/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student from the course?')) {
      return;
    }

    if (!id) return;

    try {
      await apiService.unenrollStudent(id, studentId);
      toast({
        title: "Success",
        description: "Student removed from course successfully"
      });
      loadCourseData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove student",
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
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/admin/courses')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{course.name}</h1>
            <p className="text-gray-600">{course.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{Array.isArray(students) ? students.length : 0}</div>
              <p className="text-sm text-gray-500">Enrolled Students</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">0</div>
              <p className="text-sm text-gray-500">Active Contests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-600">0</div>
              <p className="text-sm text-gray-500">Completed Contests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-600">-</div>
              <p className="text-sm text-gray-500">Avg Performance</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enroll Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Select students from the system to enroll in this course. Students can be enrolled in multiple courses.
              </p>
              <Button 
                onClick={() => navigate(`/admin/courses/${id}/enroll`)}
                className="flex items-center space-x-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>Select Students to Enroll</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Enrolled Students</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!Array.isArray(students) || students.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No students enrolled yet</p>
                <p className="text-sm text-gray-400 mt-2">Use the form above to enroll your first student</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
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
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteStudent(student.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

export default CourseDetails;
