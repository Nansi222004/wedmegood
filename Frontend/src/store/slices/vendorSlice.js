import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { vendorApi } from '../../modules/vendor/vendorApi';
import { defaultVendorState } from '../../modules/vendor/vendorStore';

export const fetchVendorData = createAsyncThunk(
  'vendor/fetchVendorData',
  async (token, { rejectWithValue }) => {
    try {
      const profileRes = await vendorApi.getProfile(token);
      
      if (profileRes.success === false && (!token || profileRes.message?.toLowerCase().includes('token') || profileRes.message?.includes('Access denied'))) {
        localStorage.removeItem('vendorToken');
        window.location.href = '/vendor/login';
        return rejectWithValue('Access denied');
      }

      const newState = { ...defaultVendorState };
      if (profileRes.success) {
        Object.assign(newState, profileRes.data);
        
        if (profileRes.data.status === 'Approved' && profileRes.data.subscription?.status === 'Active') {
          const [statsRes, leadsRes, bookingsRes, notesRes, bannersRes] = await Promise.all([
            vendorApi.getStats(token),
            vendorApi.getLeads(token),
            vendorApi.getBookings(token),
            vendorApi.getNotifications(token),
            vendorApi.getDashboardBanners(token)
          ]);

          if (statsRes.success) newState.analytics = statsRes.data;
          if (leadsRes.success) newState.leads = leadsRes.data;
          if (bookingsRes.success) newState.bookings = bookingsRes.data;
          if (notesRes.success) newState.notifications = notesRes.data;
          if (bannersRes.success) newState.banners = bannersRes.data;
        }
      }
      return newState;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const vendorSlice = createSlice({
  name: 'vendor',
  initialState: {
    data: defaultVendorState,
    loading: !!localStorage.getItem('vendorToken'),
    error: null,
  },
  reducers: {
    setVendorState: (state, action) => {
      state.data = action.payload;
    },
    updateVendorState: (state, action) => {
      state.data = { ...state.data, ...action.payload };
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendorData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendorData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchVendorData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setVendorState, updateVendorState, setLoading } = vendorSlice.actions;

export default vendorSlice.reducer;
