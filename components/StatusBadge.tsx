import React from 'react';
import { PrinterStatus } from '../types';
import { CheckCircle2, AlertCircle, Wrench } from 'lucide-react';

interface StatusBadgeProps {
  status: PrinterStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyles = () => {
    switch (status) {
      case PrinterStatus.ONLINE:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case PrinterStatus.OFFLINE:
        return 'bg-red-100 text-red-800 border-red-200';
      case PrinterStatus.MAINTENANCE:
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIcon = () => {
    const iconClass = size === 'lg' ? "w-6 h-6 mr-2" : "w-4 h-4 mr-1.5";
    switch (status) {
      case PrinterStatus.ONLINE:
        return <CheckCircle2 className={iconClass} />;
      case PrinterStatus.OFFLINE:
        return <AlertCircle className={iconClass} />;
      case PrinterStatus.MAINTENANCE:
        return <Wrench className={iconClass} />;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-4 py-2',
  };

  return (
    <span className={`inline-flex items-center justify-center font-medium border rounded-full ${getStyles()} ${sizeClasses[size]}`}>
      {getIcon()}
      {status}
    </span>
  );
};
