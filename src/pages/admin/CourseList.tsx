
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, BookOpen } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  description?: string;
  instructor_id: string;
  student_count: number;
  created_at: string;
  updated_at: string;
}

const CourseList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [courses] = useState<Course[]>([
    {
      id: '1',
      name: 'Introduction to Programming',
      description: 'Learn the basics of programming with JavaScript and React',
      instructor_id: '1',
      student_count: 25,
      created_at: '2024-01-10T08:00:00Z',
      updated_at: '2024-01-10T08:00:00Z'
    },
    {
      id: '2',
      name: 'Advanced Web Development',
      description: 'Master modern web development technologies',
      instructor_id: '1',
      student_count: 18,
      created_at: '2024-01-12T10:30:00Z',
      updated_at: '2024-01-12T10:30:00Z'
    },
    {
      id: '3',
      name: 'Database Systems',
      description: 'Understanding relational and NoSQL databases',
      instructor_id: '1',
      student_count: 32,
      created_at: '2024-01-08T14:15:00Z',
      updated_at: '2024-01-08T14:15:00Z'
    }
  ]);

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Course Management</h1>
          <Button onClick={() => navigate('/admin/courses/create')} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Course</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Courses</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <span>{course.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{course.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Users className="h-4 w-4" />
                        <span>{course.student_count} students</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(course.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => navigate(`/admin/courses/${course.id}`)}
                        className="flex-1"
                      >
                        Manage
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/admin/courses/edit/${course.id}`)}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CourseList;
