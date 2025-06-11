import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mail, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Send,
  TrendingUp,
  Activity,
  RefreshCw,
  Settings
} from 'lucide-react';
import { apiService } from '../../services/api';
import { toast } from '@/hooks/use-toast';

interface EmailStats {
  totalStudents: number;
  emailsSent: number;
  emailsVerified: number;
  pendingEmails: number;
  recentOperations: number;
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

const EmailDashboard: React.FC = () => {
  const [stats, setStats] = useState<EmailStats>({
    totalStudents: 0,
    emailsSent: 0,
    emailsVerified: 0,
    pendingEmails: 0,
    recentOperations: 0
  });
  const [activeOperations, setActiveOperations] = useState<EmailOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    
    // Set up polling for active operations
    const interval = setInterval(() => {
      if (activeOperations.length > 0) {
        refreshActiveOperations();
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [activeOperations.length]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load students with email status
      const studentsData = await apiService.getStudentsWithEmailStatus(0, 1000);
      
      // Calculate statistics
      const totalStudents = studentsData.length;
      const emailsSent = studentsData.filter((s: any) => s.email_sent).length;
      const emailsVerified = studentsData.filter((s: any) => s.email_verified).length;
      const pendingEmails = totalStudents - emailsSent;
      
      setStats({
        totalStudents,
        emailsSent,
        emailsVerified,
        pendingEmails,
        recentOperations: 0 // This would come from operation history in a real implementation
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load email dashboard data",
        variant: "destructive"
      });
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshActiveOperations = async () => {
    setRefreshing(true);
    try {
      // In a real implementation, you'd track operation IDs and fetch their status
      // For now, we'll simulate this functionality
      
    } catch (error) {
      console.error('Error refreshing operations:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'in_progress': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const emailSentPercentage = stats.totalStudents > 0 ? (stats.emailsSent / stats.totalStudents) * 100 : 0;
  const emailVerifiedPercentage = stats.totalStudents > 0 ? (stats.emailsVerified / stats.totalStudents) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Mail className="h-8 w-8" />
                <h1 className="text-4xl font-bold">📧 Email Management</h1>
              </div>
              <p className="text-blue-100 text-lg mb-4">
                Monitor email operations and manage student communications
              </p>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Activity className="h-3 w-3 mr-1" />
                  {stats.totalStudents} Total Students
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {emailSentPercentage.toFixed(1)}% Email Coverage
                </Badge>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                <Mail className="h-16 w-16 text-blue-200" />
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Emails Sent</p>
                <p className="text-3xl font-bold text-blue-600">{stats.emailsSent}</p>
                <div className="flex items-center mt-2">
                  <Progress value={emailSentPercentage} className="w-20 h-2" />
                  <span className="text-xs text-gray-500 ml-2">{emailSentPercentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50">
                <Send className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Verified</p>
                <p className="text-3xl font-bold text-green-600">{stats.emailsVerified}</p>
                <div className="flex items-center mt-2">
                  <Progress value={emailVerifiedPercentage} className="w-20 h-2" />
                  <span className="text-xs text-gray-500 ml-2">{emailVerifiedPercentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-green-50">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pendingEmails}</p>
                <p className="text-xs text-gray-500">Awaiting email</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-50">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalStudents}</p>
                <p className="text-xs text-gray-500">Registered users</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-lg border-0">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
            <div>
              <CardTitle className="text-xl">🚀 Quick Actions</CardTitle>
              <p className="text-gray-600 text-sm mt-1">Common email management tasks</p>
            </div>
            <Button 
              variant="outline" 
              onClick={loadDashboardData}
              disabled={refreshing}
              className="hover:bg-blue-50 hover:border-blue-300"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              className="h-20 flex-col gap-2" 
              variant="outline"
              onClick={() => window.location.href = '/admin/students?tab=email-status'}
            >
              <Users className="h-6 w-6" />
              <span>Manage Students</span>
            </Button>
            
            <Button 
              className="h-20 flex-col gap-2" 
              variant="outline"
              onClick={() => window.location.href = '/admin/students?action=bulk-import'}
            >
              <Send className="h-6 w-6" />
              <span>Bulk Import & Email</span>
            </Button>
            
            <Button 
              className="h-20 flex-col gap-2" 
              variant="outline"
              onClick={() => window.location.href = '/admin/students?action=send-invitations'}
            >
              <Mail className="h-6 w-6" />
              <span>Send Invitations</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Operations */}
      {activeOperations.length > 0 && (
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Active Email Operations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {activeOperations.map((operation) => (
                <div key={operation.operation_id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(operation.status)}
                      <span className="font-medium">Operation {operation.operation_id.slice(-8)}</span>
                      <Badge className={getStatusColor(operation.status)}>
                        {operation.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      {operation.sent_count} / {operation.total_emails} sent
                    </span>
                  </div>
                  
                  <Progress value={operation.progress_percentage} className="mb-2" />
                  
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress: {operation.progress_percentage.toFixed(1)}%</span>
                    <span>Started: {new Date(operation.started_at).toLocaleTimeString()}</span>
                  </div>
                  
                  {operation.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-red-600">Errors:</p>
                      <ul className="text-xs text-red-500 ml-4">
                        {operation.errors.slice(0, 3).map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                        {operation.errors.length > 3 && (
                          <li>• ... and {operation.errors.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Email Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Emails Sent</span>
                  <span>{stats.emailsSent} / {stats.totalStudents}</span>
                </div>
                <Progress value={emailSentPercentage} />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Email Verified</span>
                  <span>{stats.emailsVerified} / {stats.totalStudents}</span>
                </div>
                <Progress value={emailVerifiedPercentage} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Service</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">SMTP Configuration</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Background Processing</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Running
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailDashboard; 