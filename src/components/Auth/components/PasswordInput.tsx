import React, { useState, InputHTMLAttributes } from 'react';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> {
  id: string;
  label: string;
  error?: string;
  colorScheme?: 'blue' | 'indigo'; // Renk şeması - varsayılan blue
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  label,
  error,
  colorScheme = 'blue',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  // Renk şemasına göre stilleri ayarla
  const focusColorClasses = {
    blue: {
      label: 'group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400',
      icon: 'group-focus-within:text-blue-500',
      ring: 'focus:ring-blue-500 focus:border-blue-500'
    },
    indigo: {
      label: 'group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400',
      icon: 'group-focus-within:text-indigo-500',
      ring: 'focus:ring-indigo-500 focus:border-indigo-500'
    }
  };

  const colorClass = focusColorClasses[colorScheme];
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="group">
      <label 
        htmlFor={id} 
        className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors ${colorClass.label}`}
      >
        {label}
      </label>
      <div className="relative">
        <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors ${colorClass.icon}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </span>
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          className={`w-full pl-10 pr-12 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#22303c] text-gray-900 dark:text-white ${colorClass.ring} outline-none transition-all duration-200`}
          {...props}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {showPassword ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
        {error && (
          <div className="text-red-500 dark:text-red-400 text-xs mt-1">{error}</div>
        )}
      </div>
    </div>
  );
};

export default PasswordInput; 