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

const JoinFamilyGroup = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [invitation, setInvitation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError('No invitation token provided.');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const res = await userApi.getPublicFamilyInvitation(token);
        if (res.success && res.data) {
          setInvitation(res.data);
        } else {
          setError(res.message || 'Invitation not found or has expired.');
        }
      } catch (err) {
        setError(getFriendlyErrorMessage(err, 'Failed to load invitation details.'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await userApi.joinFamilyGroupWithToken(token);
      if (res.success) {
        toast.success(`Welcome to ${invitation?.groupName || 'the family group'}!`);
        const targetGroupId = res.data?.group?._id || invitation?.groupId;
        if (targetGroupId) {
          navigate(`/user/family/group/${targetGroupId}`, {
            state: { group: res.data?.group }
          });
        } else {
          navigate('/user/family/groups');
        }
      } else {
        toast.error(res.message || 'Failed to accept invitation.');
      }
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, 'Failed to accept invitation.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
  };

  const handleRegisterRedirect = () => {
    navigate(`/signup?redirect=${encodeURIComponent(location.pathname)}`);
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
              Loading invitation details...
            </p>
          </Card>
        ) : error ? (
          <Card className="p-8 text-center space-y-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: '#FEE2E2' }}
            >
              <Icon name="warning" size="xl" style={{ color: '#DC2626' }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: theme.semantic.text.primary }}>
              Invalid Invitation
            </h2>
            <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
              {error}
            </p>
            <div className="pt-2">
              <Button
                onClick={() => navigate('/user/family/groups')}
                className="w-full py-3"
              >
                View My Family Groups
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden shadow-xl border" style={{ borderColor: theme.semantic.border.light }}>
            {/* Header Banner */}
            <div 
              className="p-6 text-center text-white"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary[600]}, ${theme.colors.primary[700]})`
              }}
            >
              <div className="relative inline-block mb-3">
                <img
                  src={invitation.groupAvatar || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=150&h=150&fit=crop'}
                  alt={invitation.groupName}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md mx-auto"
                />
              </div>
              <p className="text-xs uppercase tracking-wider font-semibold opacity-90">
                You're Invited to Join
              </p>
              <h1 className="text-2xl font-bold mt-1">
                {invitation.groupName}
              </h1>
              <p className="text-xs opacity-90 mt-1">
                Organized by <span className="font-semibold">{invitation.inviterName}</span>
              </p>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5">
              {invitation.groupDescription && (
                <div 
                  className="p-3 rounded-xl text-xs text-center border"
                  style={{ 
                    backgroundColor: theme.semantic.background.secondary || '#F9FAFB',
                    borderColor: theme.semantic.border.light,
                    color: theme.semantic.text.secondary 
                  }}
                >
                  "{invitation.groupDescription}"
                </div>
              )}

              {/* Invitee Notice */}
              <div className="text-center space-y-1">
                <p className="text-xs" style={{ color: theme.semantic.text.tertiary }}>
                  Invitation for
                </p>
                <p className="text-base font-bold" style={{ color: theme.semantic.text.primary }}>
                  {invitation.inviteeName} ({invitation.relation || 'Family Member'})
                </p>
              </div>

              {/* What You Can Do */}
              <div className="space-y-2 border-t pt-4" style={{ borderColor: theme.semantic.border.light }}>
                <p className="text-xs font-semibold" style={{ color: theme.semantic.text.secondary }}>
                  As an accepted member, you will be able to:
                </p>
                <div className="space-y-1.5 text-xs" style={{ color: theme.semantic.text.primary }}>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>Chat in real-time with family members</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>View shared wedding planning checklists & timelines</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>Collaborate on wedding preparations</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-3">
                {user ? (
                  <>
                    <Button
                      onClick={handleAccept}
                      disabled={isProcessing}
                      className="w-full py-3.5 font-bold text-base flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: theme.colors.primary[500],
                        color: 'white'
                      }}
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                          <span>Joining Group...</span>
                        </>
                      ) : (
                        <>
                          <Icon name="check" size="sm" />
                          <span>Accept & Join Group</span>
                        </>
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => navigate('/user/family/groups')}
                      className="w-full py-2.5 text-xs font-semibold text-center hover:opacity-75 transition"
                      style={{ color: theme.semantic.text.secondary }}
                    >
                      Decline & Return
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div 
                      className="p-3 rounded-xl text-xs text-amber-800 bg-amber-50 border border-amber-200 text-center leading-relaxed"
                    >
                      <span className="font-semibold block mb-0.5">Acceptance Requirements</span>
                      Please log in with your existing account, or create a new account using your invited phone number or email.
                    </div>

                    <div>
                      <Button
                        onClick={handleLoginRedirect}
                        className="w-full py-3 font-semibold"
                        style={{
                          backgroundColor: theme.colors.primary[500],
                          color: 'white'
                        }}
                      >
                        Log In to Accept
                      </Button>
                      <p className="text-[11px] text-center mt-1" style={{ color: theme.semantic.text.secondary }}>
                        (Use this if you already have an existing Utsavo account)
                      </p>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleRegisterRedirect}
                        className="w-full py-3 rounded-xl border text-sm font-semibold transition hover:bg-stone-50"
                        style={{
                          borderColor: theme.semantic.border.light,
                          color: theme.semantic.text.primary
                        }}
                      >
                        Create Account to Accept
                      </button>
                      <p className="text-[11px] text-center mt-1" style={{ color: theme.semantic.text.secondary }}>
                        (New to Utsavo? Sign up & choose your own password)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default JoinFamilyGroup;
