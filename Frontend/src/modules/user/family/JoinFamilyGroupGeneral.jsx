import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import userApi from '../../../services/userApi';
import { toast } from '../../../components/ui/Toast';
import { getFriendlyErrorMessage } from '../../../utils/errorHandler';

const JoinFamilyGroupGeneral = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [groupInfo, setGroupInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  useEffect(() => {
    const fetchGroupPreview = async () => {
      if (!token) {
        setError('No invitation token provided.');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const res = await userApi.getPublicFamilyGroupPreview(token);
        if (res.success && res.data) {
          setGroupInfo(res.data);
        } else {
          setError(res.message || 'Invitation link not found or has expired.');
        }
      } catch (err) {
        setError(getFriendlyErrorMessage(err, 'Failed to load group invitation details.'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupPreview();
  }, [token]);

  const handleRequestJoin = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await userApi.requestJoinFamilyGroup(token);
      if (res.success) {
        if (res.data?.status === 'accepted') {
          toast.success(`Welcome to ${groupInfo?.groupName || 'the group'}!`);
          navigate(`/user/family/group/${res.data?.groupId || groupInfo?.groupId}`);
        } else {
          setRequestSubmitted(true);
          toast.success(res.message || 'Join request submitted! Awaiting host approval.');
        }
      } else {
        toast.error(res.message || 'Failed to submit join request.');
      }
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, 'Failed to submit join request.'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: theme.semantic.background.primary }}
    >
      <div className="w-full max-w-md">
        {isLoading ? (
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent mx-auto mb-4" />
            <p className="text-sm font-medium" style={{ color: theme.semantic.text.secondary }}>
              Loading group invitation...
            </p>
          </Card>
        ) : error ? (
          <Card className="p-8 text-center">
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-red-500"
              style={{ backgroundColor: `${theme.colors.error || '#EF4444'}15` }}
            >
              <Icon name="xCircle" size="xl" />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: theme.semantic.text.primary }}>
              Invalid Invitation
            </h2>
            <p className="text-sm mb-6" style={{ color: theme.semantic.text.secondary }}>
              {error}
            </p>
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => navigate('/user/family/groups')}
            >
              Go to Family Groups
            </Button>
          </Card>
        ) : groupInfo ? (
          <Card className="p-8 text-center shadow-lg border">
            {/* Group Avatar */}
            <div className="relative inline-block mb-4">
              <img 
                src={groupInfo.groupAvatar || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=150&h=150&fit=crop'} 
                alt={groupInfo.groupName} 
                className="w-24 h-24 rounded-full object-cover border-4 mx-auto shadow-md"
                style={{ borderColor: theme.colors.primary[500] }}
              />
              <span className="absolute bottom-0 right-0 bg-primary-500 text-white rounded-full p-1.5 shadow">
                <Icon name="users" size="sm" />
              </span>
            </div>

            {/* Group Name & Host */}
            <h1 className="text-2xl font-bold mb-1" style={{ color: theme.semantic.text.primary }}>
              {groupInfo.groupName}
            </h1>
            <p className="text-sm mb-3" style={{ color: theme.semantic.text.secondary }}>
              Created by <span className="font-semibold text-primary-600">{groupInfo.hostName}</span>
            </p>

            {groupInfo.groupDescription && (
              <p className="text-sm italic mb-4 px-4 py-2 rounded-lg bg-gray-50 border border-gray-100" style={{ color: theme.semantic.text.secondary }}>
                "{groupInfo.groupDescription}"
              </p>
            )}

            {/* Member count badge */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span 
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ 
                  backgroundColor: theme.colors.primary[50], 
                  color: theme.colors.primary[700] 
                }}
              >
                👥 {groupInfo.memberCount || 1} Active {groupInfo.memberCount === 1 ? 'Member' : 'Members'}
              </span>
              <span 
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ 
                  backgroundColor: '#FEF3C7', 
                  color: '#92400E' 
                }}
              >
                🔒 Approval Required
              </span>
            </div>

            {requestSubmitted ? (
              <div className="p-4 rounded-xl mb-4 text-left border" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                <div className="flex items-center gap-2 text-green-700 font-semibold mb-1">
                  <Icon name="checkCircle" size="sm" />
                  <span>Join Request Submitted!</span>
                </div>
                <p className="text-xs text-green-600 leading-relaxed">
                  Your request is awaiting approval from <strong>{groupInfo.hostName}</strong>. You'll be notified as soon as you're approved to join group chats and shared planning.
                </p>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    fullWidth 
                    size="sm" 
                    onClick={() => navigate('/user/family/groups')}
                  >
                    View Your Groups
                  </Button>
                </div>
              </div>
            ) : user ? (
              <div>
                <p className="text-xs mb-4 text-gray-500">
                  Joining as <strong>{user.name || user.email}</strong>. The host will review your request before granting access.
                </p>
                <Button 
                  fullWidth 
                  size="lg" 
                  onClick={handleRequestJoin}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Submitting Request...' : 'Request to Join Group'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 mb-2">
                  Please log in or sign up to request access to this wedding planning group.
                </p>
                <Button 
                  fullWidth 
                  size="md" 
                  onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)}
                >
                  Log In to Request Access
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth 
                  size="md" 
                  onClick={() => navigate(`/signup?redirect=${encodeURIComponent(location.pathname)}`)}
                >
                  Create an Account
                </Button>
              </div>
            )}
          </Card>
        ) : null}
      </div>
    </div>
  );
};

export default JoinFamilyGroupGeneral;
