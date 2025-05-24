import React, { useEffect, useState } from 'react';
import FormDecorations from './FormDecorations';

interface FormWrapperProps {
  children: React.ReactNode;
  colorScheme?: 'blue' | 'indigo' | 'purple' | 'green';
  className?: string;
}

const FormWrapper: React.FC<FormWrapperProps> = ({
  children,
  colorScheme = 'blue',
  className = ''
}) => {
  const [formVisible, setFormVisible] = useState(false);
  
  // Form animasyonu için
  useEffect(() => {
    setFormVisible(true);
  }, []);
  
  return (
    <div 
      className={`bg-white dark:bg-[#1c2732] p-8 pt-10 rounded-xl w-full max-w-md overflow-hidden relative transition-all transform ${formVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} duration-500 ease-out ${className}`}
    >
      {/* Dekoratif süsler */}
      <FormDecorations colorScheme={colorScheme} />
      
      {/* Form içeriği */}
      {children}
    </div>
  );
};

export default FormWrapper; 