import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import userApi from '../../../services/userApi';

const VendorManagement = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [vendorData, setVendorData] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchVendorData = async () => {
    try {
      setIsLoading(true);
      const res = await userApi.getVendorManagement();
      if (res.success && res.data) {
        setVendorData(res.data);
      }
    } catch (err) {
      console.error('Error fetching vendor management data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, []);

  const handleBack = () => {
    navigate('/user/planning-dashboard');
  };

  const getPercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: theme.semantic.background.primary }}>
        <div className="px-4 py-6">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mr-3"></div>
            <div>
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="w-24 h-4 bg-gray-200 rounded mb-4"></div>
                <div className="w-full h-48 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasData = vendorData && vendorData.totalVendors > 0;
  const filteredVendors = (vendorData?.vendors || []).filter(v => {
    if (filterStatus === 'all') return true;
    return v.status.toLowerCase().includes(filterStatus.toLowerCase());
  });

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="mr-3 p-2 rounded-full"
              style={{ backgroundColor: theme.semantic.background.accent }}
            >
              <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.semantic.text.primary }}>
                Vendor Management
              </h1>
              <p className="text-sm mt-1" style={{ color: theme.semantic.text.secondary }}>
                Track and manage your real wedding vendors
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/user/vendors')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm"
            style={{ backgroundColor: theme.colors.primary[500] }}
          >
            Find Vendors
          </button>
        </div>

        {/* Vendor Overview Grid */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total</p>
            <p className="text-lg font-black text-slate-900">
              {vendorData?.totalVendors || 0}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-1">Booked</p>
            <p className="text-lg font-black text-emerald-600">
              {vendorData?.bookedVendors || 0}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-1">Pending</p>
            <p className="text-lg font-black text-amber-600">
              {vendorData?.pendingVendors || 0}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-500 mb-1">Quoted</p>
            <p className="text-lg font-black text-purple-600">
              {vendorData?.quotedVendors || 0}
            </p>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="px-4 py-12 text-center">
          <div className="w-16 h-16 rounded-3xl bg-pink-50 text-pink-400 flex items-center justify-center mx-auto mb-4">
            <Icon name="compare" size="lg" />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: theme.semantic.text.primary }}>
            No Active Vendor Connections
          </h2>
          <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: theme.semantic.text.secondary }}>
            Inquire with verified vendors, receive quotes, and confirm bookings to track them in your unified dashboard.
          </p>
          <button
            onClick={() => navigate('/user/vendors')}
            className="px-6 py-3 rounded-xl font-semibold text-white shadow-md shadow-pink-200"
            style={{ backgroundColor: theme.colors.primary[500] }}
          >
            Explore Vendors Marketplace
          </button>
        </div>
      ) : (
        <div className="px-4 space-y-6">
          {/* Booking Progress Bar */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-base text-slate-800">
                Booking Conversion Progress
              </h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                {getPercentage(vendorData.bookedVendors, vendorData.totalVendors)}% Completed
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out bg-emerald-500"
                style={{ width: `${getPercentage(vendorData.bookedVendors, vendorData.totalVendors)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{vendorData.bookedVendors}</span> of{' '}
              <span className="font-semibold text-slate-700">{vendorData.totalVendors}</span> contacted vendors are officially booked.
            </p>
          </div>

          {/* Vendors Filter & List */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-800">
                Active Engagements ({filteredVendors.length})
              </h3>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                {['all', 'booked', 'quote', 'inquiry'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                      filterStatus === st
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  onClick={() => vendor.vendorId && navigate(`/user/vendor/${vendor.vendorId}`)}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={vendor.avatar || 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=100&h=100&fit=crop&q=80'}
                      alt={vendor.businessName}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {vendor.businessName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="capitalize">{vendor.category}</span>
                        {vendor.contact && <span>• {vendor.contact}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <span
                      className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-1 ${
                        vendor.status === 'Booked'
                          ? 'bg-emerald-100 text-emerald-700'
                          : vendor.status === 'Quote Received'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {vendor.status}
                    </span>
                    {vendor.amount > 0 && (
                      <p className="text-xs font-black text-slate-700">
                        ₹{vendor.amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Distribution */}
          {vendorData.categories && vendorData.categories.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="font-bold text-base text-slate-800 mb-4">
                Category Breakdown
              </h3>
              <div className="space-y-3">
                {vendorData.categories.map((category) => (
                  <div key={category.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: category.color || '#ec4899' }}
                        />
                        <span className="text-slate-700">{category.name}</span>
                      </div>
                      <span className="text-slate-500">
                        {category.booked} booked / {category.total} total
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${getPercentage(category.booked, category.total)}%`,
                          backgroundColor: category.color || '#ec4899'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real Recent Activity */}
          {vendorData.recentActivity && vendorData.recentActivity.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="font-bold text-base text-slate-800 mb-3">
                Recent Engagement History
              </h3>
              <div className="space-y-2.5">
                {vendorData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          activity.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {activity.vendor}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {activity.action} • {activity.date}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        activity.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {activity.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="h-8"></div>
    </div>
  );
};

export default VendorManagement;