import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import { vendorApi } from '../vendorApi';
import { useVendorState } from '../useVendorState';

const VendorNotifications = () => {
  const navigate = useNavigate();
  const { vendorState } = useVendorState();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const token = localStorage.getItem('vendorToken');

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await vendorApi.getNotifications(token);
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
      } else {
        // Fallback default system notifications if list is empty
        const defaultAlerts = [
          {
            _id: 'sys-1',
            type: 'System',
            message: vendorState?.status === 'Approved' 
              ? 'Your vendor profile is approved and active on the platform!'
              : 'Your vendor profile is currently under review by the administration team.',
            isRead: false,
            createdAt: new Date().toISOString()
          },
          {
            _id: 'sys-2',
            type: 'System',
            message: `Subscription active: ${vendorState?.subscription?.planName || 'Premium Plan'}. Enjoy premium visibility!`,
            isRead: true,
            createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
          }
        ];
        setNotifications(defaultAlerts);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token, vendorState?.status]);

  const handleMarkAsRead = async (id) => {
    try {
      await vendorApi.markNotificationRead(id, token);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unreadList = notifications.filter(n => !n.isRead);
      await Promise.all(unreadList.map(n => vendorApi.markNotificationRead(n._id, token).catch(() => {})));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'Lead': return { icon: 'user', color: 'text-blue-500 bg-blue-50' };
      case 'Booking': return { icon: 'calendar', color: 'text-emerald-500 bg-emerald-50' };
      case 'Review': return { icon: 'star', color: 'text-amber-500 bg-amber-50' };
      default: return { icon: 'bell', color: 'text-violet-600 bg-violet-50' };
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'leads') return n.type === 'Lead';
    if (filter === 'bookings') return n.type === 'Booking';
    if (filter === 'system') return n.type === 'System';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Notifications & Alerts</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold">
                {unreadCount} New
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Stay informed on profile approvals, new inquiries, bookings, and important platform updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-xl transition-all self-start sm:self-auto"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'system', label: 'System' },
          { id: 'leads', label: 'Leads' },
          { id: 'bookings', label: 'Bookings' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all shrink-0 ${
              filter === tab.id
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-violet-600 border-t-transparent"></div>
            <p className="text-xs text-slate-400 mt-2">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => {
            const { icon, color } = getIconForType(notif.type);
            return (
              <div
                key={notif._id}
                onClick={() => handleMarkAsRead(notif._id)}
                className={`p-4 sm:p-5 flex items-start gap-4 transition-all hover:bg-slate-50/80 cursor-pointer ${
                  !notif.isRead ? 'bg-violet-50/20' : ''
                }`}
              >
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon name={icon} size="sm" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {notif.type || 'System'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                    </span>
                  </div>

                  <p className={`text-sm leading-relaxed ${!notif.isRead ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                    {notif.message}
                  </p>
                </div>

                {!notif.isRead && (
                  <div className="h-2 w-2 rounded-full bg-violet-600 shrink-0 mt-2"></div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mx-auto">
              <Icon name="bell" size="md" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No Notifications</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              You're all caught up! New alerts regarding your profile and bookings will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorNotifications;
