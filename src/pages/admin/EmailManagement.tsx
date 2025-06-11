import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '../../components/common/Layout';
import EmailDashboard from '../../components/email/EmailDashboard';
import StudentEmailList from '../../components/email/StudentEmailList';

const EmailManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="border-b border-gray-200 pb-5">
          <h1 className="text-3xl font-bold leading-6 text-gray-900">
            📧 Email Management
          </h1>
          <p className="mt-2 max-w-4xl text-sm text-gray-500">
            Manage student email communications, track email status, and monitor bulk operations. 
            Send invitation emails, track verification status, and maintain communication with your students.
          </p>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard">Email Dashboard</TabsTrigger>
            <TabsTrigger value="students">Student Email Management</TabsTrigger>
          </TabsList>

          {/* Email Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <EmailDashboard />
          </TabsContent>

          {/* Student Email Management Tab */}
          <TabsContent value="students" className="space-y-6">
            <StudentEmailList />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EmailManagement; 