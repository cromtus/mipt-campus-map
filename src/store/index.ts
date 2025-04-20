import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch as useDispatchUntyped, useSelector as useSelectorUntyped } from 'react-redux';
import { load, save } from 'redux-localstorage-simple';
import polygonsReducer from './polygonsSlice';
import graphReducer from './graphSlice';
import savedState from '../../assets/map'

// console.log('savedState', savedState);

export const store = configureStore({
  reducer: {
    polygons: polygonsReducer,
    graph: graphReducer
  },
  preloadedState: {
    polygons: {
      polygons: savedState.polygons as any,
      selectedIndex: -1
    },
    graph: {
      nodes: savedState.graph.nodes as any,
      edges: savedState.graph.edges as any,
      selectedEdgeId: null
    }
  },
  // middleware: (getDefaultMiddleware) => 
  //   getDefaultMiddleware().concat(save({ states: ['polygons', 'graph'], namespace: '', namespaceSeparator: '' })),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useDispatch = () => useDispatchUntyped<AppDispatch>();
export const useSelector: TypedUseSelectorHook<RootState> = useSelectorUntyped;
