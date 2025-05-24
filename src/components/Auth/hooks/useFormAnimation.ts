import { useState, useEffect } from 'react';

/**
 * Form animasyonu için hook
 * @returns formVisible - Form görünüm durumu
 */
export function useFormAnimation(): boolean {
  const [formVisible, setFormVisible] = useState(false);
  
  useEffect(() => {
    setFormVisible(true);
    
    return () => {
      setFormVisible(false);
    };
  }, []);
  
  return formVisible;
} 