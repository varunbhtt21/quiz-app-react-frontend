import React from 'react';
import { Clock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useContestTimer } from '../../hooks/useContestTimer';
import { formatDateTime, getUserTimezone } from '../../utils/timeUtils';

export interface ContestTimerProps {
  contestId: string;
  startTime: string;
  endTime: string;
  onTimeExpired?: () => void;
  onStatusChange?: (status: string) => void;
  showProgress?: boolean;
  showTimezone?: boolean;
  compact?: boolean;
  className?: string;
}

export const ContestTimer: React.FC<ContestTimerProps> = ({
  contestId,
  startTime,
  endTime,
  onTimeExpired,
  onStatusChange,
  showProgress = true,
  showTimezone = true,
  compact = false,
  className = '',
}) => {
  const timer = useContestTimer({
    contestId,
    onTimeExpired,
    onStatusChange,
  });

  const getStatusColor = () => {
    switch (timer.status) {
      case 'not_started':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ended':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = () => {
    switch (timer.status) {
      case 'not_started':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <CheckCircle className="h-4 w-4" />;
      case 'ended':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (timer.status) {
      case 'not_started':
        return 'Not Started';
      case 'in_progress':
        return 'In Progress';
      case 'ended':
        return 'Ended';
      default:
        return 'Loading...';
    }
  };

  const getTimeDisplay = () => {
    switch (timer.status) {
      case 'not_started':
        return {
          label: 'Starts in',
          time: timer.getFormattedTimeToStart(),
          isUrgent: (timer.timeToStart || 0) < 300, // Less than 5 minutes
        };
      case 'in_progress':
        return {
          label: 'Time remaining',
          time: timer.getFormattedTimeRemaining(),
          isUrgent: (timer.timeRemaining || 0) < 300, // Less than 5 minutes
        };
      case 'ended':
        return {
          label: 'Contest ended',
          time: formatDateTime(endTime, { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZoneName: 'short' 
          }),
          isUrgent: false,
        };
      default:
        return {
          label: 'Loading',
          time: '--:--:--',
          isUrgent: false,
        };
    }
  };

  const timeDisplay = getTimeDisplay();
  const userTimezone = getUserTimezone();

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Badge variant="outline" className={`${getStatusColor()} flex items-center space-x-1`}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </Badge>
        <div className="flex items-center space-x-1 text-sm">
          <Clock className="h-3 w-3" />
          <span className={timeDisplay.isUrgent ? 'text-red-600 font-semibold' : 'text-gray-600'}>
            {timeDisplay.time}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        {/* Server sync status */}
        {!timer.isServerSynced && (
          <Alert className="mb-4 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-orange-800">
              Time synchronization with server is offline. Contest timing may be inaccurate.
            </AlertDescription>
          </Alert>
        )}

        {/* Contest status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={`${getStatusColor()} flex items-center space-x-1`}>
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </Badge>
            {timer.canSubmit && (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                Can Submit
              </Badge>
            )}
          </div>
          
          {showTimezone && (
            <div className="text-xs text-gray-500">
              {userTimezone}
            </div>
          )}
        </div>

        {/* Time display */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {timeDisplay.label}
            </span>
            <span className={`text-2xl font-mono font-bold ${
              timeDisplay.isUrgent ? 'text-red-600' : 'text-gray-900'
            }`}>
              {timeDisplay.time}
            </span>
          </div>
          
          {/* Progress bar for active contests */}
          {showProgress && timer.status === 'in_progress' && (
            <div className="space-y-1">
              <Progress 
                value={timer.getProgress()} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress: {timer.getProgress().toFixed(1)}%</span>
                <span>
                  {timer.timeRemaining && timer.timeRemaining > 0 && (
                    `${Math.ceil(timer.timeRemaining / 60)} min left`
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Contest time range */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Starts:</span>
            <span>{formatDateTime(startTime, { 
              month: 'short', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</span>
          </div>
          <div className="flex justify-between">
            <span>Ends:</span>
            <span>{formatDateTime(endTime, { 
              month: 'short', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</span>
          </div>
        </div>

        {/* Last update timestamp */}
        {timer.lastUpdate && (
          <div className="text-xs text-gray-400 mt-2 text-center">
            Last updated: {timer.lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContestTimer; 