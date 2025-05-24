import React from 'react';

interface DividerProps {
  text?: string;
  className?: string;
}

const Divider: React.FC<DividerProps> = ({ 
  text = 'veya', 
  className = '' 
}) => {
  return (
    <div className={`text-center relative ${className}`}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
      </div>
      {text && (
        <div className="relative flex justify-center">
          <span className="px-2 bg-white dark:bg-[#1c2732] text-xs text-gray-500 dark:text-gray-400 uppercase">{text}</span>
        </div>
      )}
    </div>
  );
};

export default Divider; 