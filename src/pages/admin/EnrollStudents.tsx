import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Save, Search, Users, Home, ChevronRight, Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, RefreshCw } from 'lucide-react';
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

interface CSVEnrollmentResult {
  total_emails: number;
  successful_enrollments: number;
  failed_enrollments: number;
  errors: string[];
  enrolled_students: { email: string; name: string; id: string; status: string }[];
}

const EnrollStudents = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<CSVEnrollmentResult | null>(null);
  const [showCsvResult, setShowCsvResult] = useState(false);

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

  const handleDownloadCSVTemplate = async () => {
    if (!id) return;
    
    try {
      const blob = await apiService.downloadCourseEnrollmentTemplate(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `course_enrollment_template_${course?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "CSV template downloaded successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive"
      });
    }
  };

  const handleCSVFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleCSVEnrollment(file);
    }
  };

  const handleCSVEnrollment = async (file: File) => {
    if (!id) return;
    
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Error",
        description: "Please select a CSV file (.csv)",
        variant: "destructive"
      });
      return;
    }

    try {
      setCsvUploading(true);
      const result = await apiService.bulkEnrollStudentsCSV(id, file) as CSVEnrollmentResult;
      setCsvResult(result);
      setShowCsvResult(true);
      
      if (result.successful_enrollments > 0) {
        toast({
          title: "Enrollment Completed",
          description: `Successfully enrolled ${result.successful_enrollments} students${result.failed_enrollments > 0 ? ` (${result.failed_enrollments} failed)` : ''}`
        });
      } else {
        toast({
          title: "Enrollment Failed",
          description: "No students were enrolled. Please check the file format and data.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to enroll students from CSV",
        variant: "destructive"
      });
    } finally {
      setCsvUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
            <p className="text-gray-600">Select students manually or upload a CSV file with email addresses</p>
          </div>
        </div>

        {/* CSV Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              <span>Bulk Enrollment via CSV</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <div className="text-blue-600 mt-0.5">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">CSV Format Instructions</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Upload a CSV file with a single 'email' column containing student email addresses.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDownloadCSVTemplate}
                      className="text-blue-600 border-blue-300 hover:bg-blue-100"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Download CSV Template
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVFileUpload}
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={csvUploading}
                  className="flex items-center space-x-2"
                >
                  {csvUploading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span>{csvUploading ? 'Uploading...' : 'Upload CSV File'}</span>
                </Button>
                <span className="text-sm text-gray-500">
                  Supports CSV files with email addresses
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CSV Result Modal */}
        {showCsvResult && csvResult && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center space-x-2">
                  {csvResult.successful_enrollments > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span>CSV Enrollment Results</span>
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowCsvResult(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{csvResult.total_emails}</div>
                    <div className="text-sm text-gray-600">Total Emails</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{csvResult.successful_enrollments}</div>
                    <div className="text-sm text-green-700">Enrolled</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{csvResult.failed_enrollments}</div>
                    <div className="text-sm text-red-700">Failed</div>
                  </div>
                </div>

                {/* Successfully Enrolled Students */}
                {csvResult.enrolled_students.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Successfully Enrolled Students</h4>
                    <div className="max-h-40 overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvResult.enrolled_students.map((student, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{student.email}</TableCell>
                              <TableCell>{student.name}</TableCell>
                              <TableCell>
                                <Badge variant={student.status === 'enrolled' ? 'default' : 'secondary'}>
                                  {student.status === 'enrolled' ? 'New Enrollment' : 'Reactivated'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Errors */}
                {csvResult.errors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-900 mb-2">Errors</h4>
                    <div className="max-h-32 overflow-y-auto bg-red-50 border border-red-200 rounded-lg p-3">
                      <ul className="space-y-1">
                        {csvResult.errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-700">• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Manual Selection - Available Students</span>
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