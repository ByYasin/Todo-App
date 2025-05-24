import React from 'react';

interface AlertMessageProps {
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  className?: string;
}

const AlertMessage: React.FC<AlertMessageProps> = ({
  type,
  message,
  onClose,
  className = '',
}) => {
  // Uyarı tipine göre stil ve ikon tanımlamaları
  const styleConfig = {
    error: {
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      borderColor: 'border-red-400 dark:border-red-700/50',
      textColor: 'text-red-700 dark:text-red-300',
      iconColor: 'text-red-500 dark:text-red-400',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    success: {
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      borderColor: 'border-green-400 dark:border-green-700/50',
      textColor: 'text-green-700 dark:text-green-300',
      iconColor: 'text-green-500 dark:text-green-400',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    warning: {
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      borderColor: 'border-yellow-400 dark:border-yellow-700/50',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      iconColor: 'text-yellow-500 dark:text-yellow-400',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      borderColor: 'border-blue-400 dark:border-blue-700/50',
      textColor: 'text-blue-700 dark:text-blue-300',
      iconColor: 'text-blue-500 dark:text-blue-400',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const config = styleConfig[type];

  return (
    <div className={`${config.bgColor} ${config.borderColor} border ${config.textColor} px-4 py-3 rounded-lg mb-6 flex items-center animate-fade-in-down ${className}`}>
      <span className={`mr-2 ${config.iconColor}`}>{config.icon}</span>
      <span className="flex-1">{message}</span>
      
      {onClose && (
        <button 
          onClick={onClose} 
          className={`${config.iconColor} hover:opacity-75 ml-2 focus:outline-none`}
          aria-label="Kapat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default AlertMessage; 