import { configureStore } from '@reduxjs/toolkit';
import analysisReducer from './slices/analysisSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    analysis: analysisReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
