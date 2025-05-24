import { useState, useCallback } from 'react';

/**
 * Boolean değeri tersine çevirmek için kullanılan basit bir hook
 * @param initialState Başlangıç değeri (varsayılan: false)
 * @returns [değer, değeri çeviren fonksiyon]
 */
export function useToggle(initialState: boolean = false): [boolean, () => void] {
  const [state, setState] = useState<boolean>(initialState);
  
  const toggle = useCallback(() => {
    setState(prevState => !prevState);
  }, []);
  
  return [state, toggle];
} 