import { configureStore } from '@reduxjs/toolkit';
import vendorReducer from './slices/vendorSlice';

export const store = configureStore({
  reducer: {
    vendor: vendorReducer,
  },
});
