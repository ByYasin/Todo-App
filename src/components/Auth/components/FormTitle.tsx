import React from 'react';

interface FormTitleProps {
  title: string;
  icon: React.ReactNode;
  colorScheme?: 'blue' | 'indigo' | 'purple' | 'green';
}

const FormTitle: React.FC<FormTitleProps> = ({
  title,
  icon,
  colorScheme = 'blue'
}) => {
  const colorStyles = {
    blue: {
      gradient: 'from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    indigo: {
      gradient: 'from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    purple: {
      gradient: 'from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    green: {
      gradient: 'from-green-600 to-teal-600 dark:from-green-400 dark:to-teal-400',
      iconColor: 'text-green-600 dark:text-green-400',
    },
  };

  const colors = colorStyles[colorScheme];

  return (
    <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white flex items-center justify-center relative">
      <div className="relative">
        <span className={`h-8 w-8 mr-2 ${colors.iconColor} inline-block transform transition-transform group-hover:rotate-12 duration-300`}>
          {icon}
        </span>
        <span className={`bg-clip-text text-transparent bg-gradient-to-r ${colors.gradient}`}>{title}</span>
      </div>
    </h2>
  );
};

export default FormTitle; 