import { useState, useEffect } from 'react';

/**
 * Dark mode takibi için kullanılan hook
 * @returns isDarkMode - Dark mode aktif mi?
 */
export function useDarkMode(): boolean {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    // İlk yükleme kontrolü
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Dark mode değişikliklerini izle
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);
  
  return isDarkMode;
} 