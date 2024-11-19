import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch as useDispatchUntyped, useSelector as useSelectorUntyped } from 'react-redux';
import { load, save } from 'redux-localstorage-simple';
import polygonsReducer from './polygonsSlice';

const localStorageConfig = {
  states: ['polygons'],
  namespace: '',
  namespaceSeparator: '',
};

export const store = configureStore({
  reducer: {
    polygons: polygonsReducer
  },
  preloadedState: {
    polygons: {
      ...load(localStorageConfig) as any,
      selectedIndex: -1
    }
  },
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(save(localStorageConfig)),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useDispatch = () => useDispatchUntyped<AppDispatch>();
export const useSelector: TypedUseSelectorHook<RootState> = useSelectorUntyped;
