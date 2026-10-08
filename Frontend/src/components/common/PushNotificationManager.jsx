import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../ui/Toast';
import { usePushRegistration } from '../../hooks/usePushRegistration';

// Which portal's notifications a page may show: vendor pages only vendor pushes, user pages only user pushes
const audienceForPath = (pathname) => {
  if (pathname.startsWith('/vendor')) return 'vendor';
  if (pathname.startsWith('/user')) return 'user';
  return null;
};

/**
 * Registers the browser's FCM token for logged-in users (on user pages only, so a browser
 * belongs to the portal it was last used in) and bridges service-worker push events
 * (foreground toast, notification click) into the app for both portals.
 */
const PushNotificationManager = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const currentAudience = audienceForPath(pathname);
  const canReceivePush = Boolean(
    currentAudience === 'user' && isAuthenticated && user?.token && !user?.isGuest && user?.role !== 'admin'
  );

  usePushRegistration('user', canReceivePush, user?._id);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;

    const handleMessage = (event) => {
      const msg = event.data;
      if (!msg || typeof msg !== 'object') return;

      if (msg.type === 'FCM_PUSH_RECEIVED') {
        const audience = msg.data?.audience === 'vendor' ? 'vendor' : 'user';
        if (audience !== currentAudience) return;
        toast.info(msg.body ? `${msg.title}: ${msg.body}` : msg.title, 5000);
        window.dispatchEvent(new CustomEvent(`${audience}-notifications-updated`));
      } else if (msg.type === 'FCM_NOTIFICATION_CLICK' && typeof msg.link === 'string' && msg.link.startsWith('/')) {
        navigate(msg.link);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [navigate, currentAudience]);

  return null;
};

export default PushNotificationManager;
