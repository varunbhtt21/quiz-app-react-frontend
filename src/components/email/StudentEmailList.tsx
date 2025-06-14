import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Send, 
  Upload,
  Filter,
  RefreshCw,
  Users,
  AlertCircle,
  Eye,
  Settings
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '../../services/api';

interface StudentWithEmailStatus {
  id: string;
  email: string;
  name?: string;
  role: string;
  is_active: boolean;
  registration_status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  email_sent: boolean;
  email_verified: boolean;
  invitation_sent_at?: string;
  verification_method: string;
  created_at: string;
  updated_at: string;
}

interface EmailOperation {
  operation_id: string;
  status: string;
  total_emails: number;
  sent_count: number;
  failed_count: number;
  progress_percentage: number;
  errors: string[];
  started_at: string;
  completed_at?: string;
}

const StudentEmailList: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [students, setStudents] = useState<StudentWithEmailStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [emailStatusFilter, setEmailStatusFilter] = useState<string>('all');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [courseId, setCourseId] = useState('');
  const [trackingOperations, setTrackingOperations] = useState<string[]>([]);
  const [operationStatuses, setOperationStatuses] = useState<Record<string, EmailOperation>>({});
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadStudents();
  }, [searchTerm, emailStatusFilter]);

  useEffect(() => {
    // Poll for operation status updates
    if (trackingOperations.length > 0) {
      const interval = setInterval(() => {
        trackingOperations.forEach(operationId => {
          pollOperationStatus(operationId);
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [trackingOperations]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await apiService.getStudentsWithEmailStatus(
        0, 
        1000, 
        searchTerm || undefined, 
        emailStatusFilter === 'all' ? undefined : emailStatusFilter
      );
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

  const pollOperationStatus = async (operationId: string) => {
    try {
      const status = await apiService.getEmailOperationStatus(operationId);
      setOperationStatuses(prev => ({ ...prev, [operationId]: status }));

      // Remove completed operations from tracking
      if (status.status === 'completed' || status.status === 'failed') {
        setTrackingOperations(prev => prev.filter(id => id !== operationId));
        
        // Refresh student list when operation completes
        loadStudents();
        
        toast({
          title: status.status === 'completed' ? "Email Operation Completed" : "Email Operation Failed",
          description: `${status.sent_count} emails sent successfully${status.failed_count > 0 ? `, ${status.failed_count} failed` : ''}`,
          variant: status.status === 'completed' ? "default" : "destructive"
        });
      }
    } catch (error) {
      console.error('Error polling operation status:', error);
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(students.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSendInvitations = async () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "No Students Selected",
        description: "Please select students to send invitations to",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await apiService.sendInvitationEmails(
        selectedStudents,
        courseId || undefined,
        customMessage || undefined
      );

      // Start tracking the operation
      setTrackingOperations(prev => [...prev, result.operation_id]);
      
      toast({
        title: "Sending Invitations",
        description: `Sending emails to ${result.eligible_for_email} students`,
      });

      setShowInvitationDialog(false);
      setSelectedStudents([]);
      setCustomMessage('');
      setCourseId('');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitations",
        variant: "destructive"
      });
    }
  };

  const handleBulkImportWithEmail = async (file: File) => {
    try {
      setImporting(true);
      const result = await apiService.bulkImportWithEmail(file, true, courseId || undefined, 1);
      
      if (result.email_operation) {
        setTrackingOperations(prev => [...prev, result.email_operation.operation_id]);
      }

      toast({
        title: "Import Completed",
        description: `Successfully imported ${result.successful} students${result.email_operation ? ' and started sending emails' : ''}`,
      });

      loadStudents();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import students",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleBulkImportWithEmail(file);
    }
  };

  const toggleEmailStatus = async (studentId: string, field: 'email_sent' | 'email_verified', currentValue: boolean) => {
    try {
      const updateData: any = {};
      updateData[field === 'email_sent' ? 'emailSent' : 'emailVerified'] = !currentValue;
      
      await apiService.updateStudentEmailStatus(
        studentId,
        field === 'email_sent' ? !currentValue : undefined,
        field === 'email_verified' ? !currentValue : undefined
      );

      toast({
        title: "Status Updated",
        description: `Email ${field.replace('_', ' ')} status updated successfully`,
      });

      loadStudents();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update email status",
        variant: "destructive"
      });
    }
  };

  const getEmailStatusBadge = (student: StudentWithEmailStatus) => {
    if (student.email_verified) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    } else if (student.email_sent) {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
          <Clock className="h-3 w-3 mr-1" />
          Sent
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
          <XCircle className="h-3 w-3 mr-1" />
          Not Sent
        </Badge>
      );
    }
  };

  const getRegistrationStatusBadge = (status: string) => {
    const colors = {
      'PENDING': 'bg-orange-100 text-orange-800 hover:bg-orange-200 hover:border-orange-300',
      'ACTIVE': 'bg-green-100 text-green-800 hover:bg-green-200 hover:border-green-300',
      'SUSPENDED': 'bg-red-100 text-red-800 hover:bg-red-200 hover:border-red-300'
    };
    return (
      <Badge className={`${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 hover:bg-gray-200 hover:border-gray-300'} border transition-colors cursor-default`}>
        {status}
      </Badge>
    );
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm || student.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const emailSentCount = students.filter(s => s.email_sent).length;
  const emailVerifiedCount = students.filter(s => s.email_verified).length;
  const pendingCount = students.length - emailSentCount;

  return (
    <div className="space-y-6">
      {/* Statistics Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Emails Sent</p>
                <p className="text-2xl font-bold">{emailSentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className="text-2xl font-bold">{emailVerifiedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Operations */}
      {Object.keys(operationStatuses).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Email Operations in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(operationStatuses).map(([operationId, status]) => (
                <div key={operationId} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Operation {operationId.slice(-8)}</span>
                    <Badge className={
                      status.status === 'completed' ? 'bg-green-500' : 
                      status.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                    }>
                      {status.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    Progress: {status.sent_count} / {status.total_emails} emails sent ({status.progress_percentage.toFixed(1)}%)
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Student List */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Students with Email Status
              </CardTitle>
              <p className="text-gray-600 text-sm mt-1">Manage student email communications</p>
            </div>
            
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
              <Button 
                variant="outline" 
                onClick={loadStudents}
                disabled={loading}
                className="hover:bg-blue-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv,.txt"
                className="hidden"
              />
              
              <Button 
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="hover:bg-green-50"
              >
                <Upload className={`h-4 w-4 mr-2 ${importing ? 'animate-spin' : ''}`} />
                {importing ? 'Importing...' : 'Bulk Import & Email'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Search and Filter Controls */}
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={emailStatusFilter} onValueChange={setEmailStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="sent">Email Sent</SelectItem>
                <SelectItem value="not_sent">Email Not Sent</SelectItem>
                <SelectItem value="verified">Email Verified</SelectItem>
                <SelectItem value="not_verified">Email Not Verified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedStudents.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">
                  {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Dialog open={showInvitationDialog} onOpenChange={setShowInvitationDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Send className="h-4 w-4 mr-2" />
                        Send Invitations
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send Email Invitations</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Course ID (Optional)</label>
                          <Input
                            value={courseId}
                            onChange={(e) => setCourseId(e.target.value)}
                            placeholder="Enter course ID for context"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Custom Message (Optional)</label>
                          <Textarea
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            placeholder="Add a personal message to the invitation"
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSendInvitations} className="flex-1">
                            Send Invitations
                          </Button>
                          <Button variant="outline" onClick={() => setShowInvitationDialog(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedStudents([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Students Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead>Email Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Last Invitation</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading students...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-gray-400" />
                        <span className="text-gray-500">No students found</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{student.email}</TableCell>
                      <TableCell>{student.name || '-'}</TableCell>
                      <TableCell>{getRegistrationStatusBadge(student.registration_status)}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleEmailStatus(student.id, 'email_sent', student.email_sent)}
                          className="cursor-pointer"
                        >
                          {getEmailStatusBadge(student)}
                        </button>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleEmailStatus(student.id, 'email_verified', student.email_verified)}
                          className="cursor-pointer"
                        >
                          {student.email_verified ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                              <XCircle className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        {student.invitation_sent_at ? (
                          <span className="text-sm text-gray-600">
                            {new Date(student.invitation_sent_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSelectStudent(student.id, !selectedStudents.includes(student.id))}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toggleEmailStatus(student.id, 'email_sent', student.email_sent)}
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentEmailList; 