import React, { InputHTMLAttributes } from 'react';

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: string;
  colorScheme?: 'blue' | 'indigo'; // Renk şeması - varsayılan blue
}

const FormInput: React.FC<FormInputProps> = ({
  id,
  label,
  icon,
  error,
  colorScheme = 'blue',
  type = 'text',
  ...props
}) => {
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
          {icon}
        </span>
        <input
          id={id}
          type={type}
          className={`w-full pl-10 ${type === 'password' ? 'pr-12' : 'pr-3'} py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#22303c] text-gray-900 dark:text-white ${colorClass.ring} outline-none transition-all duration-200`}
          {...props}
        />
        {error && (
          <div className="text-red-500 dark:text-red-400 text-xs mt-1">{error}</div>
        )}
      </div>
    </div>
  );
};

export default FormInput; 