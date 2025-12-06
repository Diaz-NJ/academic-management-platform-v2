// frontend/src/components/DeadlineBadge.jsx

import React from 'react';

/**
 * Deadline notification badge component
 * Shows count of urgent tasks with pulsing animation
 */
const DeadlineBadge = ({ count, size = 'default', className = '' }) => {
  if (!count || count === 0) return null;

  const sizeClasses = {
    small: 'min-w-[16px] h-4 text-[9px] px-1',
    default: 'min-w-[20px] h-5 text-[10px] px-1.5',
    large: 'min-w-[24px] h-6 text-xs px-2'
  };

  const displayCount = count > 99 ? '99+' : count;

  return (
    <span 
      className={`
        ${sizeClasses[size]} 
        bg-red-500 text-white font-bold rounded-full 
        flex items-center justify-center 
        animate-pulse
        shadow-lg
        ${className}
      `}
      title={`${count} task${count !== 1 ? 's' : ''} due soon`}
    >
      {displayCount}
    </span>
  );
};

export default DeadlineBadge;