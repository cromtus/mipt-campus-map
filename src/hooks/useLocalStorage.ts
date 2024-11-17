import { useEffect } from 'react';
import { Updater, useImmer } from 'use-immer';
import { localStorageKeys } from '../utils/export';

export const useLocalStorage = <T>(key: string, initialValue: T): [T, Updater<T>] => {
  const [value, setValue] = useImmer<T>(() => {
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
