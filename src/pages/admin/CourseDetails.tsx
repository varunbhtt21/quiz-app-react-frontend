
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, UserPlus, Download, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Student {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  enrolled_at: string;
}

const CourseDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [students] = useState<Student[]>([
    {
      id: '1',
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe',
      enrolled_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      email: 'jane.smith@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      enrolled_at: '2024-01-16T14:30:00Z'
    }
  ]);

  const course = {
    id: '1',
    name: 'Introduction to Programming',
    description: 'Learn the basics of programming with JavaScript and React',
    student_count: students.length
  };

  const handleEnrollStudent = async () => {
    if (!newStudentEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Enrolling student:', newStudentEmail);
      
      toast({
        title: "Success",
        description: "Student enrolled successfully"
      });
      
      setNewStudentEmail('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enroll student",
        variant: "destructive"
      });
    }
  };

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
              <div className="text-2xl font-bold text-blue-600">{course.student_count}</div>
              <p className="text-sm text-gray-500">Enrolled Students</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">5</div>
              <p className="text-sm text-gray-500">Active Contests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-600">12</div>
              <p className="text-sm text-gray-500">Completed Contests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-600">85%</div>
              <p className="text-sm text-gray-500">Avg Performance</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enroll New Student</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Input
                placeholder="Enter student email"
                value={newStudentEmail}
                onChange={(e) => setNewStudentEmail(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleEnrollStudent} className="flex items-center space-x-2">
                <UserPlus className="h-4 w-4" />
                <span>Enroll</span>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Enrolled Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.first_name} {student.last_name}
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{new Date(student.enrolled_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

export default CourseDetails;
