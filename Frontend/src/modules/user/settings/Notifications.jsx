import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking':
        return 'calendar';
      case 'payment':
        return 'money';
      case 'quote':
        return 'fileText';
      case 'family':
        return 'users';
      default:
        return 'bell';
    }
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 pt-3 pb-32 bg-transparent">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Top Bar matching Screenshot 1 */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white border border-[#F2E5EC] shadow-sm flex items-center justify-center text-[#401332] active:scale-95 transition-all hover:bg-[#FAF6F8] cursor-pointer shrink-0"
              aria-label="Go back"
            >
              <Icon name="chevronLeft" size="sm" />
            </button>
            <div>
              <h1 
                className="text-2xl sm:text-3xl font-bold text-[#401332] leading-tight" 
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                Notifications
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A6876] mt-0.5">
                {unreadCount > 0 ? `${unreadCount} UNREAD MESSAGE${unreadCount > 1 ? 'S' : ''}` : 'ALL CAUGHT UP'}
              </p>
            </div>
          </div>

          {activeTab === 'inbox' && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-[#7A1C43] hover:underline cursor-pointer active:scale-95 transition-transform"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Segmented Navigation Switcher matching Screenshot 1 */}
        <div className="grid grid-cols-2 p-1.5 bg-white/90 backdrop-blur-md rounded-full border border-[#F2E5EC] shadow-sm">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`py-2.5 px-4 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'inbox'
                ? 'bg-[#551E43] text-white shadow-sm'
                : 'text-[#5C4A57] hover:text-[#401332]'
            }`}
          >
            <Icon name="bell" size="xs" />
            <span>Inbox</span>
            {unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#E11D48] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`py-2.5 px-4 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'preferences'
                ? 'bg-[#551E43] text-white shadow-sm'
                : 'text-[#5C4A57] hover:text-[#401332]'
            }`}
          >
            <Icon name="settings" size="xs" />
            <span>Preferences</span>
          </button>
        </div>

        {/* Tab 1: Inbox */}
        {activeTab === 'inbox' && (
          <div className="space-y-4">
            {/* Category Filter Pills matching Screenshot 1 */}
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
                  className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    filterType === f.id
                      ? 'bg-[#EBE0E7] text-[#401332] shadow-none'
                      : 'bg-white/90 text-[#7A6876] border border-[#F2E5EC] hover:bg-white hover:text-[#401332]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Notification List matching Screenshot 1 */}
            {inboxLoading ? (
              <div className="p-12 text-center text-xs font-bold text-[#7A6876]">
                <div className="w-8 h-8 border-2 border-[#551E43] border-t-transparent animate-spin rounded-full mx-auto mb-2" />
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-2xl shadow-sm border border-[#F2E5EC] space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#F3EBF9] flex items-center justify-center mx-auto text-[#7A2A70]">
                  <Icon name="bell" size="md" />
                </div>
                <h3 
                  className="text-base font-bold text-[#401332]"
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                >
                  No Notifications Found
                </h3>
                <p className="text-xs text-[#7A6876] max-w-xs mx-auto leading-relaxed">
                  You'll receive updates on your wedding quotes, bookings, payments, and timeline reminders here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => handleMarkOneRead(notif)}
                    className="p-4 sm:p-5 rounded-2xl bg-white shadow-sm border border-[#F2E5EC] transition-all cursor-pointer hover:shadow-md active:scale-[0.99] flex items-start gap-3.5 relative overflow-hidden group"
                  >
                    {/* Slim Plum Accent along Left Edge for Unread */}
                    {!notif.isRead && (
                      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#551E43] rounded-l-2xl" />
                    )}

                    {/* Circular Notification Icon with Soft Lavender Background */}
                    <div className="w-11 h-11 rounded-full bg-[#F3EBF9] text-[#7A2A70] flex items-center justify-center shrink-0">
                      <Icon name={getNotificationIcon(notif.type)} size="sm" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2">
                        <h4 className="text-sm font-bold text-[#2E1026] leading-tight truncate">
                          {notif.title}
                        </h4>
                        <span className="text-xs text-[#8A7987] font-medium whitespace-nowrap">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#5C4A57] mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                      {notif.link && (
                        <div className="flex items-center gap-1 text-xs font-bold text-[#7A1C43] mt-2 group-hover:underline">
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
            <div className="p-5 rounded-2xl bg-white shadow-sm border border-[#F2E5EC] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#401332]">
                Delivery Channels
              </h3>
              <div className="space-y-3">
                {[
                  { key: 'pushEnabled', label: 'Push Notifications', desc: 'Receive instant alerts on your device' },
                  { key: 'emailEnabled', label: 'Email Notifications', desc: 'Receive booking confirmations and invoices' },
                  { key: 'smsEnabled', label: 'SMS Notifications', desc: 'Receive critical booking updates via text' },
                  { key: 'inAppEnabled', label: 'In-App Alerts', desc: 'Show toast notifications while using the portal' }
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-2 border-b border-[#F2E5EC] last:border-0">
                    <div>
                      <div className="text-xs font-bold text-[#2E1026]">{item.label}</div>
                      <div className="text-[11px] text-[#7A6876]">{item.desc}</div>
                    </div>
                    <button
                      onClick={() => handleTogglePreference(item.key, item.label)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        settings[item.key] ? 'bg-[#551E43]' : 'bg-[#E5D7DE]'
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

            <div className="p-5 rounded-2xl bg-white shadow-sm border border-[#F2E5EC] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#401332]">
                Event Subscriptions
              </h3>
              <div className="space-y-3">
                {[
                  { key: 'bookingUpdates', label: 'Booking & Status Updates', desc: 'Confirmation, cancellations, vendor assignments' },
                  { key: 'vendorMessages', label: 'Vendor Quote Updates', desc: 'New proposals and quote expiry notices' },
                  { key: 'paymentReminders', label: 'Payment Reminders', desc: 'Advance payment notices and refund confirmations' },
                  { key: 'weddingReminders', label: 'Planning Milestones', desc: 'Upcoming checklist tasks and timeline alarms' }
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-2 border-b border-[#F2E5EC] last:border-0">
                    <div>
                      <div className="text-xs font-bold text-[#2E1026]">{item.label}</div>
                      <div className="text-[11px] text-[#7A6876]">{item.desc}</div>
                    </div>
                    <button
                      onClick={() => handleTogglePreference(item.key, item.label)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        settings[item.key] ? 'bg-[#551E43]' : 'bg-[#E5D7DE]'
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