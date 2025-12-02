// frontend/src/components/UnreadBadge.jsx
import React from 'react';

const UnreadBadge = ({ count, size = 'default', className = '' }) => {
  if (!count || count === 0) return null;

  const sizeClasses = {
    small: 'w-4 h-4 text-[10px]',
    default: 'w-5 h-5 text-xs',
    large: 'w-6 h-6 text-sm'
  };

  const displayCount = count > 99 ? '99+' : count;

  return (
    <span 
      className={`
        ${sizeClasses[size]} 
        bg-red-500 text-white font-bold rounded-full 
        flex items-center justify-center 
        animate-pulse
        ${className}
      `}
      title={`${count} unread message${count !== 1 ? 's' : ''}`}
    >
      {displayCount}
    </span>
  );
};

export default UnreadBadge;