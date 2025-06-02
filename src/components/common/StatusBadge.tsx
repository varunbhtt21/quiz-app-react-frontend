import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, Play, Pause, User, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: "not_started" | "in_progress" | "ended" | "PENDING" | "ACTIVE" | "SUSPENDED";
  className?: string;
  showIcon?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', showIcon = true }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'not_started':
        return {
          text: 'Not Started',
          className: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200',
          icon: Clock
        };
      case 'in_progress':
        return {
          text: 'In Progress',
          className: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 animate-pulse',
          icon: Play
        };
      case 'ended':
        return {
          text: 'Ended',
          className: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200',
          icon: XCircle
        };
      case 'PENDING':
        return {
          text: 'Pending',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200',
          icon: AlertCircle
        };
      case 'ACTIVE':
        return {
          text: 'Active',
          className: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
          icon: CheckCircle
        };
      case 'SUSPENDED':
        return {
          text: 'Suspended',
          className: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200',
          icon: Pause
        };
      default:
        return {
          text: 'Unknown',
          className: 'bg-gray-100 text-gray-700 border-gray-300',
          icon: User
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} font-medium transition-all duration-200 ${className}`}
    >
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {config.text}
    </Badge>
  );
};

export default StatusBadge;
