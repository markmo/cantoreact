import { configureStore } from '@reduxjs/toolkit';

import viewerReducer from '../features/Viewer/viewerSlice';

export const store = configureStore({
  reducer: {
    viewer: viewerReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
