import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import { createCookieStorage } from './cookie-storage';
import { useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/auth-slice';
import tableFiltersReducer from './slices/table-filters-slice';
import modalReducer from './slices/modal-slice';

const rootReducer = combineReducers({
  auth: authReducer,
  tableFilters: tableFiltersReducer,
  modals: modalReducer,
});

const persistConfig = {
  key: 'soaird-app',
  version: 1,
  storage: createCookieStorage(),
  whitelist: ['auth'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  preloadedState: undefined,
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();