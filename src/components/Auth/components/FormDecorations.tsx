import React from 'react';

interface FormDecorationsProps {
  colorScheme?: 'blue' | 'indigo' | 'purple' | 'green';
}

const FormDecorations: React.FC<FormDecorationsProps> = ({ 
  colorScheme = 'blue'
}) => {
  const colorStyles = {
    blue: {
      top: 'bg-gradient-to-br from-blue-400/20 to-indigo-400/20 dark:from-blue-500/10 dark:to-indigo-500/10',
      bottom: 'bg-gradient-to-tr from-purple-400/20 to-indigo-400/20 dark:from-purple-500/10 dark:to-indigo-500/10',
      title: 'bg-blue-500/20 dark:bg-blue-500/10',
    },
    indigo: {
      top: 'bg-gradient-to-br from-purple-400/20 to-indigo-400/20 dark:from-purple-500/10 dark:to-indigo-500/10',
      bottom: 'bg-gradient-to-tr from-green-400/20 to-teal-400/20 dark:from-green-500/10 dark:to-teal-500/10',
      title: 'bg-indigo-500/20 dark:bg-indigo-500/10',
    },
    purple: {
      top: 'bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-purple-500/10 dark:to-pink-500/10',
      bottom: 'bg-gradient-to-tr from-blue-400/20 to-indigo-400/20 dark:from-blue-500/10 dark:to-indigo-500/10',
      title: 'bg-purple-500/20 dark:bg-purple-500/10',
    },
    green: {
      top: 'bg-gradient-to-br from-green-400/20 to-teal-400/20 dark:from-green-500/10 dark:to-teal-500/10',
      bottom: 'bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 dark:from-blue-500/10 dark:to-cyan-500/10',
      title: 'bg-green-500/20 dark:bg-green-500/10',
    },
  };

  const colors = colorStyles[colorScheme];

  return (
    <>
      {/* Üst dekoratif süs */}
      <div className="absolute top-0 right-0">
        <div className={`w-20 h-20 ${colors.top} rounded-bl-full blur-xl`}></div>
      </div>
      
      {/* Alt dekoratif süs */}
      <div className="absolute bottom-0 left-0">
        <div className={`w-16 h-16 ${colors.bottom} rounded-tr-full blur-xl`}></div>
      </div>
      
      {/* Başlık için dekoratif süs (başlık bileşeninde kullanılacak) */}
      <div className="absolute -top-2 -left-2 w-10 h-10 rounded-full blur-xl z-0 pointer-events-none">
        <div className={`w-full h-full ${colors.title} rounded-full`}></div>
      </div>
    </>
  );
};

export default FormDecorations; 