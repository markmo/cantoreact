import { configureStore } from '@reduxjs/toolkit';

import viewerReducer from './features/Viewer/viewerSlice';

export default configureStore({
  reducer: {
    viewer: viewerReducer,
  },
});
