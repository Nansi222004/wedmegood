import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { userApi } from '../../../services/userApi';

const Notifications = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();

  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'preferences'

  // Notifications Inbox State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  // Preferences State
  const [settings, setSettings] = useState({
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: true,
    inAppEnabled: true,
    bookingUpdates: true,
    vendorMessages: true,
    paymentReminders: true,
    weddingReminders: true
  });
  const [prefLoading, setPrefLoading] = useState(false);

  // Fetch Notifications
  const loadNotifications = async () => {
    try {
      setInboxLoading(true);
      const [notifsRes, countRes] = await Promise.all([
        userApi.getNotifications({ type: filterType, limit: 50 }),
        userApi.getUnreadNotificationCount()
      ]);

      if (notifsRes.success && Array.isArray(notifsRes.data)) {
        setNotifications(notifsRes.data);
      }
      if (countRes.success && typeof countRes.count === 'number') {
        setUnreadCount(countRes.count);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    } finally {
      setInboxLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'inbox') {
      loadNotifications();
    }
  }, [activeTab, filterType]);

  // Load Preferences
  useEffect(() => {
    let isMounted = true;
    userApi.getUserPreferences()
      .then(res => {
        if (isMounted && res.success && res.data?.preferences?.notifications) {
          setSettings(prev => ({
            ...prev,
            ...res.data.preferences.notifications
          }));
        }
      })
      .catch(e => console.warn('Preferences load error:', e.message));
    return () => { isMounted = false; };
  }, []);

  const handleMarkOneRead = async (notification) => {
    try {
      if (!notification.isRead) {
        await userApi.markNotificationRead(notification._id);
        setNotifications(prev =>
          prev.map(n => (n._id === notification._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        window.dispatchEvent(new CustomEvent('user-notifications-updated'));
      }

      if (notification.link && notification.link.startsWith('/user/')) {
        navigate(notification.link);
      }
    } catch (err) {
      console.warn('Mark read failed:', err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await userApi.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('user-notifications-updated'));
      showToast('All notifications marked as read', 'success', 2000);
    } catch (err) {
      showToast('Failed to mark all as read', 'error', 2000);
    }
  };

  const handleTogglePreference = async (key, label) => {
    const newValue = !settings[key];
    const updated = { ...settings, [key]: newValue };
    setSettings(updated);

    showToast(`${label} ${newValue ? 'enabled' : 'disabled'}`, 'info', 1500);

    try {
      await userApi.updateUserPreferences({ notifications: updated });
    } catch (e) {
      console.warn('Failed to save preference to backend:', e.message);
    }
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 pb-28" style={{ backgroundColor: '#EAE1D8' }}>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl bg-white shadow-sm border border-white active:scale-95 transition-all text-[#3D2B2B]"
            >
              <Icon name="chevronLeft" size="sm" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#3D2B2B]" style={{ fontFamily: '"Playfair Display", serif' }}>
                Notifications
              </h1>
              <p className="text-[10px] font-black uppercase text-[#3D2B2B]/40 tracking-wider">
                {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
              </p>
            </div>
          </div>

          {activeTab === 'inbox' && unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-[#BE185D] hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-white/70 backdrop-blur-md rounded-2xl border border-white shadow-sm">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'inbox'
                ? 'bg-[#3D2B2B] text-white shadow-sm'
                : 'text-[#3D2B2B]/60 hover:text-[#3D2B2B]'
            }`}
          >
            <Icon name="bell" size="xs" />
            Inbox {unreadCount > 0 && <span className="px-1.5 py-0.2 bg-pink-500 text-white rounded-full text-[10px]">{unreadCount}</span>}
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'preferences'
                ? 'bg-[#3D2B2B] text-white shadow-sm'
                : 'text-[#3D2B2B]/60 hover:text-[#3D2B2B]'
            }`}
          >
            <Icon name="settings" size="xs" />
            Preferences
          </button>
        </div>

        {/* Tab 1: Inbox */}
        {activeTab === 'inbox' && (
          <div className="space-y-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: 'All' },
                { id: 'booking', label: 'Bookings' },
                { id: 'quote', label: 'Quotes' },
                { id: 'payment', label: 'Payments' },
                { id: 'planning', label: 'Planning' },
                { id: 'family', label: 'Family' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                    filterType === f.id
                      ? 'bg-white text-[#3D2B2B] border-white shadow-sm'
                      : 'bg-white/40 text-[#3D2B2B]/60 border-transparent hover:bg-white/70'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Notification List */}
            {inboxLoading ? (
              <div className="p-8 text-center text-xs font-bold text-[#3D2B2B]/40">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl shadow-sm border border-white space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EAE1D8] flex items-center justify-center mx-auto text-[#3D2B2B]">
                  <Icon name="bell" size="md" />
                </div>
                <h3 className="text-sm font-bold text-[#3D2B2B]">No Notifications Found</h3>
                <p className="text-xs text-[#3D2B2B]/50 max-w-xs mx-auto">
                  You'll receive updates on your quotes, bookings, payments, and wedding reminders here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => handleMarkOneRead(notif)}
                    className={`p-4 rounded-3xl bg-white shadow-sm border transition-all cursor-pointer hover:shadow-md active:scale-[0.99] flex items-start gap-3.5 relative overflow-hidden ${
                      !notif.isRead ? 'border-pink-300 ring-1 ring-pink-200' : 'border-white'
                    }`}
                  >
                    {!notif.isRead && (
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-pink-500" />
                    )}
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                      notif.type === 'booking' ? 'bg-pink-100 text-pink-600' :
                      notif.type === 'payment' ? 'bg-emerald-100 text-emerald-600' :
                      notif.type === 'quote' ? 'bg-amber-100 text-amber-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      <Icon name={
                        notif.type === 'booking' ? 'calendar' :
                        notif.type === 'payment' ? 'money' :
                        notif.type === 'quote' ? 'money' : 'bell'
                      } size="xs" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2">
                        <h4 className="text-xs font-bold text-[#3D2B2B] leading-tight truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[9px] text-[#3D2B2B]/40 whitespace-nowrap">
                          {new Date(notif.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-[#3D2B2B]/70 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                      {notif.link && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#BE185D] mt-2">
                          <span>View Details</span>
                          <Icon name="chevronRight" size="xs" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Preferences */}
        {activeTab === 'preferences' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="p-5 rounded-3xl bg-white shadow-sm border border-white space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#3D2B2B]/60">
                Delivery Channels
              </h3>
              <div className="space-y-3">
                {[
                  { key: 'pushEnabled', label: 'Push Notifications', desc: 'Receive instant alerts on your device' },
                  { key: 'emailEnabled', label: 'Email Notifications', desc: 'Receive booking confirmations and invoices' },
                  { key: 'smsEnabled', label: 'SMS Notifications', desc: 'Receive critical booking updates via text' },
                  { key: 'inAppEnabled', label: 'In-App Alerts', desc: 'Show toast notifications while using the portal' }
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-2 border-b border-[#3D2B2B]/5 last:border-0">
                    <div>
                      <div className="text-xs font-bold text-[#3D2B2B]">{item.label}</div>
                      <div className="text-[11px] text-[#3D2B2B]/50">{item.desc}</div>
                    </div>
                    <button
                      onClick={() => handleTogglePreference(item.key, item.label)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        settings[item.key] ? 'bg-[#BE185D]' : 'bg-[#EAE1D8]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                        settings[item.key] ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white shadow-sm border border-white space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#3D2B2B]/60">
                Event Subscriptions
              </h3>
              <div className="space-y-3">
                {[
                  { key: 'bookingUpdates', label: 'Booking & Status Updates', desc: 'Confirmation, cancellations, vendor assignments' },
                  { key: 'vendorMessages', label: 'Vendor Quote Updates', desc: 'New proposals and quote expiry notices' },
                  { key: 'paymentReminders', label: 'Payment Reminders', desc: 'Advance payment notices and refund confirmations' },
                  { key: 'weddingReminders', label: 'Planning Milestones', desc: 'Upcoming checklist tasks and timeline alarms' }
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-2 border-b border-[#3D2B2B]/5 last:border-0">
                    <div>
                      <div className="text-xs font-bold text-[#3D2B2B]">{item.label}</div>
                      <div className="text-[11px] text-[#3D2B2B]/50">{item.desc}</div>
                    </div>
                    <button
                      onClick={() => handleTogglePreference(item.key, item.label)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        settings[item.key] ? 'bg-[#BE185D]' : 'bg-[#EAE1D8]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                        settings[item.key] ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
      {ToastComponent}
    </div>
  );
};

export default Notifications;