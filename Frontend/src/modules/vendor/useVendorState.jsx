import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendorData, updateVendorState as updateSliceState, setVendorState as setSliceState } from '../../store/slices/vendorSlice';

export const VendorProvider = ({ children }) => {
  const dispatch = useDispatch();
  
  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    if (token) {
      dispatch(fetchVendorData(token));
    }

    const handleStorageChange = (e) => {
      if (e.key === 'vendorToken' && !e.newValue) {
        window.location.href = '/vendor/login';
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [dispatch]);

  return children;
};

export const useVendorState = () => {
  const dispatch = useDispatch();
  const vendorState = useSelector((state) => state.vendor.data);
  const loading = useSelector((state) => state.vendor.loading);

  const updateVendorState = useCallback((patch) => {
    dispatch(updateSliceState(patch));
  }, [dispatch]);

  const setVendorState = useCallback((newState) => {
    dispatch(setSliceState(newState));
  }, [dispatch]);

  const refreshData = useCallback(() => {
    const token = localStorage.getItem('vendorToken');
    if (token) {
      dispatch(fetchVendorData(token));
    }
  }, [dispatch]);

  return {
    vendorState,
    setVendorState,
    updateVendorState,
    loading,
    refreshData
  };
};
