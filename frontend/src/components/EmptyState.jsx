import React from 'react';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  message, 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 md:py-12 px-3 md:px-4">
      {Icon && (
        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
          <Icon className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-1 md:mb-2 text-center">{title}</h3>
      <p className="text-xs md:text-base text-gray-600 text-center max-w-md mb-4 md:mb-6 leading-tight md:leading-normal">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 md:px-6 py-2 md:py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition font-medium text-sm md:text-base"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;