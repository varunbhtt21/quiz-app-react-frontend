import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Users, UserCheck, UserX, Home, ChevronRight, Filter, Download, RefreshCw, Calendar, Mail, Activity, TrendingUp, Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '../../services/api';

interface User {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ImportResult {
  total_rows: number;
  successful: number;
  failed: number;
  errors: string[];
  created_students: { id: string; email: string }[];
}

const UserList = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'student'>('all');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showImportResult, setShowImportResult] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search term, status, and role
    let filtered = users;
    
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.is_active : !user.is_active
      );
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiService.getUsers(0, 1000);
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.deleteUser(userId);
      toast({
        title: "Success",
        description: "User deleted successfully"
      });
      loadUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await apiService.updateUser(userId, { is_active: !currentStatus });
      toast({
        title: "Success",
        description: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });
      loadUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await apiService.downloadUserTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `user_import_template_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "CSV template downloaded successfully"
      });
      
      // Show instructions after successful download
      setShowInstructions(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleBulkImport(file);
    }
  };

  const handleBulkImport = async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      toast({
        title: "Error",
        description: "Please select a CSV file (.csv)",
        variant: "destructive"
      });
      return;
    }

    try {
      setImporting(true);
      const result = await apiService.bulkImportUsers(file) as ImportResult;
      setImportResult(result);
      setShowImportResult(true);
      
      if (result.successful > 0) {
        loadUsers(); // Refresh the user list
        toast({
          title: "Import Completed",
          description: `Successfully imported ${result.successful} users${result.failed > 0 ? ` (${result.failed} failed)` : ''}`
        });
      } else {
        toast({
          title: "Import Failed",
          description: "No users were imported. Please check the file format and data.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import users",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const activeUsers = users.filter(u => u.is_active).length;
  const inactiveUsers = users.filter(u => u.is_active === false).length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const studentUsers = users.filter(u => u.role === 'student').length;
  const recentUsers = users.filter(u => {
    const createdDate = new Date(u.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdDate > weekAgo;
  }).length;

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
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-8 w-8" />
                  <h1 className="text-4xl font-bold">👥 User Management</h1>
                </div>
                <p className="text-blue-100 text-lg mb-4">
                  Manage user accounts, track enrollment, and monitor activity
                </p>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Activity className="h-3 w-3 mr-1" />
                    {users.length} Total Users
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {recentUsers} New This Week
                  </Badge>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                  <Users className="h-16 w-16 text-blue-200" />
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{users.length}</p>
                  <p className="text-xs text-gray-500">All registered users</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Administrators</p>
                  <p className="text-3xl font-bold text-red-600">{adminUsers}</p>
                  <p className="text-xs text-gray-500">System admins</p>
                </div>
                <div className="p-3 rounded-xl bg-red-50">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Students</p>
                  <p className="text-3xl font-bold text-blue-600">{studentUsers}</p>
                  <p className="text-xs text-gray-500">Learning accounts</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50">
                  <UserCheck className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Users</p>
                  <p className="text-3xl font-bold text-green-600">{activeUsers}</p>
                  <p className="text-xs text-gray-500">Currently active</p>
                </div>
                <div className="p-3 rounded-xl bg-green-50">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">New This Week</p>
                  <p className="text-3xl font-bold text-purple-600">{recentUsers}</p>
                  <p className="text-xs text-gray-500">Recent registrations</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search and Actions */}
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
              <div>
                <CardTitle className="text-xl">📋 All Users</CardTitle>
                <p className="text-gray-600 text-sm mt-1">Manage and monitor user accounts</p>
              </div>
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
                <Button 
                  variant="outline" 
                  onClick={loadUsers}
                  className="hover:bg-blue-50 hover:border-blue-300 w-full sm:w-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span className="sm:hidden">Refresh Data</span>
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="hover:bg-green-50 hover:border-green-300 w-full sm:w-auto"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  <span className="sm:hidden">CSV Template</span>
                  <span className="hidden sm:inline">Download CSV Template</span>
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="hover:bg-purple-50 hover:border-purple-300 w-full sm:w-auto"
                >
                  {importing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      <span className="sm:hidden">Import Users</span>
                      <span className="hidden sm:inline">Bulk Import</span>
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => navigate('/admin/users/create')} 
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="sm:hidden">New User</span>
                  <span className="hidden sm:inline">Add User</span>
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Enhanced Search and Filter Bar */}
            <div className="flex flex-col space-y-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users by email address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Status:</span>
                </div>
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-1">
                  <Button
                    size="sm"
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('all')}
                    className="h-9 w-full sm:w-auto"
                  >
                    All ({users.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={statusFilter === 'active' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('active')}
                    className="h-9 w-full sm:w-auto"
                  >
                    Active ({activeUsers})
                  </Button>
                  <Button
                    size="sm"
                    variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('inactive')}
                    className="h-9 w-full sm:w-auto"
                  >
                    Inactive ({inactiveUsers})
                  </Button>
                </div>
              </div>
              
              {/* Role Filter */}
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Role:</span>
                </div>
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-1">
                  <Button
                    size="sm"
                    variant={roleFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setRoleFilter('all')}
                    className="h-9 w-full sm:w-auto"
                  >
                    All Users ({users.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={roleFilter === 'admin' ? 'default' : 'outline'}
                    onClick={() => setRoleFilter('admin')}
                    className="h-9 w-full sm:w-auto"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Admins ({adminUsers})
                  </Button>
                  <Button
                    size="sm"
                    variant={roleFilter === 'student' ? 'default' : 'outline'}
                    onClick={() => setRoleFilter('student')}
                    className="h-9 w-full sm:w-auto"
                  >
                    <UserCheck className="h-3 w-3 mr-1" />
                    Students ({studentUsers})
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Showing {filteredUsers.length} of {users.length} users
                </span>
              </div>
              {(searchTerm || statusFilter !== 'all' || roleFilter !== 'all') && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setRoleFilter('all');
                  }}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 w-full sm:w-auto"
                >
                  Clear filters
                </Button>
              )}
            </div>

            {filteredUsers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-3">
                  {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' ? 'No users found' : 'No users yet'}
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' 
                    ? 'Try adjusting your search terms or filters to find what you\'re looking for.' 
                    : 'Get started by creating your first user account to begin managing enrollments.'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && roleFilter === 'all' && (
                  <Button 
                    onClick={() => navigate('/admin/users/create')}
                    className="px-6"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First User
                  </Button>
                )}
              </div>
            ) :
              // Mobile Card View for small screens, Table for larger screens
              <>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {filteredUsers.map((user) => (
                    <Card key={user.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{user.email}</p>
                              <p className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                          <Badge 
                            className={`${
                              user.is_active 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-red-100 text-red-800 border-red-200'
                            } border font-medium text-xs`}
                          >
                            {user.is_active ? (
                              <>
                                <UserCheck className="h-2 w-2 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <UserX className="h-2 w-2 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                          <div>
                            <div className="flex items-center text-gray-600 mb-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              Registered
                            </div>
                            <div className="text-gray-900">
                              {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center text-gray-600 mb-1">
                              <Activity className="h-3 w-3 mr-1" />
                              Last Activity
                            </div>
                            <div className="text-gray-900">
                              {new Date(user.updated_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                            className="flex-1 hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant={user.is_active ? "outline" : "default"}
                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                            className={`flex-1 ${user.is_active 
                              ? "hover:bg-orange-50 hover:border-orange-300 text-orange-600" 
                              : "hover:bg-green-700 bg-green-600"
                            }`}
                          >
                            {user.is_active ? (
                              <>
                                <UserX className="h-3 w-3 mr-1" />
                                Suspend
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3 w-3 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="hover:bg-red-50 hover:border-red-300 text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold">User</TableHead>
                        <TableHead className="font-semibold">Role</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Registration</TableHead>
                        <TableHead className="font-semibold">Last Activity</TableHead>
                        <TableHead className="font-semibold text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {user.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{user.email}</p>
                                <p className="text-sm text-gray-500">User ID: {user.id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={`${
                                user.role === 'admin'
                                  ? 'bg-red-100 text-red-800 border-red-200' 
                                  : 'bg-blue-100 text-blue-800 border-blue-200'
                              } border font-medium`}
                            >
                              {user.role === 'admin' ? (
                                <>
                                  <Shield className="h-3 w-3 mr-1" />
                                  Administrator
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Student
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={`${
                                user.is_active 
                                  ? 'bg-green-100 text-green-800 border-green-200' 
                                  : 'bg-red-100 text-red-800 border-red-200'
                              } border font-medium`}
                            >
                              {user.is_active ? (
                                <>
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <UserX className="h-3 w-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center text-gray-900">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(user.created_at).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(user.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center text-gray-900">
                                <Activity className="h-3 w-3 mr-1" />
                                {new Date(user.updated_at).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(user.updated_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                                className="hover:bg-blue-50 hover:border-blue-300"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant={user.is_active ? "outline" : "default"}
                                onClick={() => handleToggleStatus(user.id, user.is_active)}
                                className={user.is_active 
                                  ? "hover:bg-orange-50 hover:border-orange-300 text-orange-600" 
                                  : "hover:bg-green-700 bg-green-600"
                                }
                              >
                                {user.is_active ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                className="hover:bg-red-50 hover:border-red-300 text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            }
          </CardContent>
        </Card>

        {/* Import Results Modal */}
        {showImportResult && importResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    {importResult.successful > 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span>Import Results</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowImportResult(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{importResult.total_rows}</div>
                    <div className="text-sm text-blue-800">Total Rows</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{importResult.successful}</div>
                    <div className="text-sm text-green-800">Successful</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                    <div className="text-sm text-red-800">Failed</div>
                  </div>
                </div>

                {/* Successfully Created Users */}
                {importResult.created_students.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Successfully Created Users ({importResult.created_students.length})
                    </h3>
                    <div className="bg-green-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                      {importResult.created_students.map((user, index) => (
                        <div key={user.id} className="flex items-center justify-between py-2 border-b border-green-200 last:border-b-0">
                          <span className="text-green-800">{user.email}</span>
                          <Badge className="bg-green-100 text-green-800">Created</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {importResult.errors.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Errors ({importResult.errors.length})
                    </h3>
                    <div className="bg-red-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="py-2 border-b border-red-200 last:border-b-0">
                          <span className="text-red-800 text-sm">{error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instructions for next steps */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Next Steps:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Successfully imported users can now be enrolled in courses</li>
                    <li>• Review and fix any errors in your CSV file before re-importing</li>
                    <li>• Users will receive their login credentials via email (if configured)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CSV Instructions Modal */}
        {showInstructions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-green-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                    <span>CSV Import Instructions</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInstructions(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Step-by-step instructions */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                      How to Use the CSV Template
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                        <div>
                          <p className="font-medium text-blue-900">Open the downloaded CSV file</p>
                          <p className="text-sm text-blue-700">The file contains sample data to show the expected format</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                        <div>
                          <p className="font-medium text-green-900">Replace sample data with real user information</p>
                          <p className="text-sm text-green-700">Keep the column headers (email, password) unchanged</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                        <div>
                          <p className="font-medium text-purple-900">Save and upload the file</p>
                          <p className="text-sm text-purple-700">Use the "Bulk Import" button to upload your completed file</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Requirements
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• <strong>Email:</strong> Must be valid email addresses (contain @ and .)</li>
                      <li>• <strong>Password:</strong> Minimum 6 characters long</li>
                      <li>• <strong>Format:</strong> Save as .csv file format</li>
                      <li>• <strong>Headers:</strong> Do not modify column names (email, password)</li>
                    </ul>
                  </div>

                  {/* Tips */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">💡 Tips for Success</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Remove all sample data before adding real user information</li>
                      <li>• Each row represents one user</li>
                      <li>• Duplicate emails will be automatically skipped</li>
                      <li>• You can add as many users as needed</li>
                      <li>• Use spreadsheet software like Excel, Google Sheets, or any text editor</li>
                    </ul>
                  </div>

                  {/* Sample format */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">📋 Expected Format</h4>
                    <div className="bg-white p-3 rounded border font-mono text-sm">
                      <div className="font-bold border-b pb-1 mb-2">email,password</div>
                      <div>john.doe@university.edu,securepass123</div>
                      <div>jane.smith@university.edu,mypassword456</div>
                      <div>mike.wilson@university.edu,strongpass789</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserList; 