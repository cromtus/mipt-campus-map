import { Updater, useImmer } from 'use-immer';
import savedState from '../../assets/map'

export const useLocalStorage = <T>(key: string, initialValue: T): [T, Updater<T>] => {
  const [value, setValue] = useImmer<T>(() => {
    const storedValue = (savedState as any)[key];
    return storedValue ?? initialValue;
  });

  return [value, setValue];
};
