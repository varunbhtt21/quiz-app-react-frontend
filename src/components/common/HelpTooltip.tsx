import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HelpTooltipProps {
  content: string;
  className?: string;
}

const HelpTooltip = ({ content, className = "" }: HelpTooltipProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-auto p-1 text-gray-400 hover:text-gray-600 ${className}`}
      title={content}
    >
      <HelpCircle className="h-4 w-4" />
    </Button>
  );
};

export default HelpTooltip; 