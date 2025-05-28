
import React from 'react';
import { Clock, Play, Check } from 'lucide-react';

interface StatusBadgeProps {
  status: 'not_started' | 'in_progress' | 'ended';
  className?: string;
}

const StatusBadge = ({ status, className = '' }: StatusBadgeProps) => {
  const config = {
    not_started: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock,
      text: 'Upcoming'
    },
    in_progress: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: Play,
      text: 'Active'
    },
    ended: {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: Check,
      text: 'Ended'
    }
  };

  const { color, icon: Icon, text } = config[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color} ${className}`}>
      <Icon className="w-3 h-3 mr-1" />
      {text}
    </span>
  );
};

export default StatusBadge;
