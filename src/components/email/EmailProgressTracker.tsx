import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  Mail,
  Activity,
  X
} from 'lucide-react';
import { apiService } from '../../services/api';
import { toast } from '@/hooks/use-toast';

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

interface EmailProgressTrackerProps {
  operationId: string;
  onComplete?: (operation: EmailOperation) => void;
  onClose?: () => void;
  showCloseButton?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const EmailProgressTracker: React.FC<EmailProgressTrackerProps> = ({
  operationId,
  onComplete,
  onClose,
  showCloseButton = true,
  autoRefresh = true,
  refreshInterval = 2000
}) => {
  const [operation, setOperation] = useState<EmailOperation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOperationStatus();

    if (autoRefresh) {
      const interval = setInterval(() => {
        if (operation?.status !== 'completed' && operation?.status !== 'failed') {
          fetchOperationStatus();
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [operationId, autoRefresh, refreshInterval, operation?.status]);

  const fetchOperationStatus = async () => {
    try {
      setError(null);
      const data = await apiService.getEmailOperationStatus(operationId);
      setOperation(data);

      // Check if operation just completed
      if ((data.status === 'completed' || data.status === 'failed') && onComplete) {
        onComplete(data);
      }

      // Show completion toast
      if (data.status === 'completed' && operation?.status !== 'completed') {
        toast({
          title: "Email Operation Completed",
          description: `Successfully sent ${data.sent_count} emails`,
        });
      } else if (data.status === 'failed' && operation?.status !== 'failed') {
        toast({
          title: "Email Operation Failed",
          description: `Operation failed with ${data.failed_count} errors`,
          variant: "destructive"
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch operation status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'in_progress':
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-orange-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600';
      case 'failed':
        return 'bg-red-600';
      case 'in_progress':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const calculateDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    
    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs % 60}s`;
    }
    return `${diffSecs}s`;
  };

  if (loading && !operation) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading operation status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Error: {error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchOperationStatus}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!operation) {
    return (
      <Card className="w-full border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            <span>Operation not found</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(operation.status)}
            <div>
              <CardTitle className="text-lg">
                Email Operation {operationId.slice(-8)}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {operation.status === 'completed' ? 'Completed' : 
                 operation.status === 'failed' ? 'Failed' :
                 operation.status === 'in_progress' ? 'In Progress' : 'Pending'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(operation.status)}>
              {operation.status.replace('_', ' ')}
            </Badge>
            {showCloseButton && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{operation.progress_percentage.toFixed(1)}%</span>
          </div>
          <Progress 
            value={operation.progress_percentage} 
            className="h-3"
          />
        </div>

        {/* Email Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Mail className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {operation.total_emails}
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Sent</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {operation.sent_count}
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Failed</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {operation.failed_count}
            </div>
          </div>
        </div>

        {/* Timing Information */}
        <div className="flex justify-between text-sm text-gray-600 pt-2 border-t">
          <span>Started: {formatTime(operation.started_at)}</span>
          <span>
            Duration: {calculateDuration(operation.started_at, operation.completed_at)}
          </span>
          {operation.completed_at && (
            <span>Completed: {formatTime(operation.completed_at)}</span>
          )}
        </div>

        {/* Error Messages */}
        {operation.errors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Errors ({operation.errors.length})</span>
            </div>
            <div className="max-h-32 overflow-y-auto bg-red-50 rounded-md p-3">
              <ul className="space-y-1 text-sm text-red-700">
                {operation.errors.slice(0, 10).map((error, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-red-400 mt-1">•</span>
                    <span>{error}</span>
                  </li>
                ))}
                {operation.errors.length > 10 && (
                  <li className="text-red-500 italic">
                    ... and {operation.errors.length - 10} more errors
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchOperationStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {(operation.status === 'completed' || operation.status === 'failed') && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(operation, null, 2));
                toast({
                  title: "Copied",
                  description: "Operation details copied to clipboard",
                });
              }}
            >
              Copy Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailProgressTracker; 