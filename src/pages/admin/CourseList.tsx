import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users, BookOpen, GraduationCap, Calendar, TrendingUp, RefreshCw, Download, Settings, Eye, UserPlus, Clock, Target, Trash2 } from 'lucide-react';
import { apiService } from '../../services/api';
import { toast } from '@/hooks/use-toast';

interface Course {
  id: string;
  name: string;
  description?: string;
  instructor_id: string;
  student_count?: number;
  created_at: string;
  updated_at: string;
}

const CourseList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await apiService.getCourses() as Course[];
      
      // Load student count for each course
      const coursesWithStudentCount = await Promise.all(
        data.map(async (course) => {
          try {
            const students = await apiService.getCourseStudents(course.id);
            return {
              ...course,
              student_count: Array.isArray(students) ? students.length : 0
            };
          } catch (error) {
            return {
              ...course,
              student_count: 0
            };
          }
        })
      );
      
      setCourses(coursesWithStudentCount);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: string, courseName: string, studentCount: number) => {
    const message = studentCount > 0 
      ? `Are you sure you want to delete the course "${courseName}"?\n\nThis will permanently delete:\n• The course itself\n• ${studentCount} student enrollment${studentCount !== 1 ? 's' : ''}\n• All associated contests and quiz data\n\nThis action cannot be undone.`
      : `Are you sure you want to delete the course "${courseName}"?\n\nThis action cannot be undone.`;
    
    if (!confirm(message)) {
      return;
    }

    try {
      const result = await apiService.deleteCourse(courseId);
      toast({
        title: "Success",
        description: `Course "${courseName}" deleted successfully`
      });
      loadCourses(); // Refresh the course list
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete course",
        variant: "destructive"
      });
    }
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalStudents = courses.reduce((sum, course) => sum + (course.student_count || 0), 0);
  const recentCourses = courses.filter(course => {
    const createdDate = new Date(course.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdDate > weekAgo;
  }).length;

  const activeCourses = courses.filter(course => (course.student_count || 0) > 0).length;

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
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-700 rounded-2xl p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <GraduationCap className="h-8 w-8" />
                  <h1 className="text-4xl font-bold">🎓 Course Management</h1>
                </div>
                <p className="text-indigo-100 text-lg mb-4">
                  Create, organize, and manage your educational courses
                </p>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {courses.length} Total Courses
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Users className="h-3 w-3 mr-1" />
                    {totalStudents} Enrolled Students
                  </Badge>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                  <GraduationCap className="h-16 w-16 text-indigo-200" />
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
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Courses</p>
                  <p className="text-3xl font-bold text-gray-900">{courses.length}</p>
                  <p className="text-xs text-gray-500">Created courses</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Courses</p>
                  <p className="text-3xl font-bold text-green-600">{activeCourses}</p>
                  <p className="text-xs text-gray-500">With enrolled students</p>
                </div>
                <div className="p-3 rounded-xl bg-green-50">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Students</p>
                  <p className="text-3xl font-bold text-purple-600">{totalStudents}</p>
                  <p className="text-xs text-gray-500">Across all courses</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Recent Courses</p>
                  <p className="text-3xl font-bold text-orange-600">{recentCourses}</p>
                  <p className="text-xs text-gray-500">Created this week</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-50">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Course Management */}
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">📚 All Courses</CardTitle>
                <p className="text-gray-600 text-sm mt-1">Manage your educational courses and enrollments</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  onClick={loadCourses}
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
                  onClick={() => navigate('/admin/courses/create')} 
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
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
                  placeholder="Search courses by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between mb-4 p-3 bg-indigo-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-900">
                  Showing {filteredCourses.length} of {courses.length} courses
                </span>
              </div>
              {searchTerm && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSearchTerm('')}
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100"
                >
                  Clear search
                </Button>
              )}
            </div>

            {filteredCourses.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-3">
                  {searchTerm ? 'No courses found' : 'No courses yet'}
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {searchTerm 
                    ? 'Try adjusting your search terms to find what you\'re looking for.' 
                    : 'Start by creating your first course to organize students and content.'
                  }
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => navigate('/admin/courses/create')}
                    className="px-6 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Course
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg truncate group-hover:text-indigo-600 transition-colors">
                              {course.name}
                            </CardTitle>
                            <p className="text-sm text-gray-500">Course ID: {course.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                        {course.description || 'No description available'}
                      </p>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {course.student_count || 0} student{(course.student_count || 0) !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <Badge 
                            className={`${
                              (course.student_count || 0) > 0 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                            } border font-medium`}
                          >
                            {(course.student_count || 0) > 0 ? 'Active' : 'Empty'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>Created {new Date(course.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => navigate(`/admin/courses/${course.id}`)}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/admin/courses/${course.id}/enroll`)}
                          className="hover:bg-green-50 hover:border-green-300"
                        >
                          <UserPlus className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteCourse(course.id, course.name, course.student_count || 0)}
                          className="hover:bg-red-50 hover:border-red-300 text-red-600"
                          title="Delete course"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CourseList;
