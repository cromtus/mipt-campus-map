import { useState, useEffect } from 'react';
import { localStorageKeys } from '../utils/export';

export const useLocalStorage = <T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  if (!localStorageKeys.includes(key)) {
    localStorageKeys.push(key);
  }

  return [value, setValue];
};
