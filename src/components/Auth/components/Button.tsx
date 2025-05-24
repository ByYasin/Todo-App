import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  colorScheme?: 'blue' | 'indigo';
  isLoading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  colorScheme = 'blue',
  isLoading = false,
  loadingText,
  fullWidth = true,
  icon,
  ...props
}) => {
  // Renk şemasına göre stilleri ayarla
  const variantClasses = {
    primary: {
      blue: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white',
      indigo: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white',
    },
    secondary: 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200',
  };

  // Seçili variant ve renk şeması stilini belirle
  const buttonStyle = 
    variant === 'primary' 
      ? variantClasses.primary[colorScheme]
      : variantClasses.secondary;
  
  return (
    <button
      type={props.type || 'button'}
      className={`relative ${fullWidth ? 'w-full' : ''} py-3 px-4 overflow-hidden ${buttonStyle} font-semibold rounded-lg shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-${colorScheme}-500 flex items-center justify-center transition-all duration-300 ${
        isLoading ? 'opacity-70 cursor-not-allowed' : 'transform hover:-translate-y-1'
      }`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {/* Buton arka plan animasyonu */}
      <span className="absolute inset-0 w-full h-full bg-white dark:bg-white opacity-20 transform -skew-x-12 -translate-x-full animate-shine"></span>
      
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {loadingText || 'Yükleniyor...'}
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button; 