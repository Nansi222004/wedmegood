import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import userApi from '../../../services/userApi';
import { useAuth } from '../../../contexts/AuthContext';

const FamilyGroups = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [respondingId, setRespondingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareModalGroup, setShareModalGroup] = useState(null);
  const [copiedMemberId, setCopiedMemberId] = useState(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [newInviteName, setNewInviteName] = useState('');
  const [newInvitePhone, setNewInvitePhone] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Check if current user is admin/owner of a group with real RBAC
  const isCurrentUserAdmin = (group) => {
    if (!group || !user) return false;
    const currentUserId = String(user._id || user.id || '');
    const currentUserEmail = (user.email || '').toLowerCase();

    // 1. Group Creator / Owner
    const ownerId = String(group.userId?._id || group.userId || '');
    if (ownerId && currentUserId && ownerId === currentUserId) {
      return true;
    }

    // 2. Accepted member with admin role
    if (Array.isArray(group.members)) {
      const myMembership = group.members.find(m => {
        const memberUserId = String(m.userId?._id || m.userId || '');
        const memberEmail = (m.email || '').toLowerCase();
        return (memberUserId && memberUserId === currentUserId) ||
               (memberEmail && currentUserEmail && memberEmail === currentUserEmail);
      });

      if (myMembership && myMembership.status === 'accepted' && myMembership.role === 'admin') {
        return true;
      }
    }

    return false;
  };

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await userApi.getFamilyGroups();
      if (res.success) {
        const groupsData = Array.isArray(res.data) ? res.data : (res.data?.groups || []);
        const pendingData = Array.isArray(res.data?.pendingInvitations) ? res.data.pendingInvitations : [];
        const formatted = groupsData.map(g => ({
          ...g,
          id: g._id,
          members: Array.isArray(g.members) ? g.members : []
        }));
        setGroups(formatted);
        setPendingInvitations(pendingData);
      } else {
        setGroups([]);
        setPendingInvitations([]);
        setError(res.message || 'Failed to load family groups');
      }
    } catch (err) {
      console.error('Error loading family groups from MongoDB:', err);
      setGroups([]);
      setPendingInvitations([]);
      setError(err?.message || 'Could not load family groups. Please check your connection or login session.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleRespondInvitation = async (invitation, accept) => {
    const groupId = invitation._id || invitation.id;
    setRespondingId(groupId);
    try {
      const res = await userApi.respondFamilyGroupInvitation(groupId, { accept });
      if (res.success) {
        await fetchGroups();
      } else {
        console.error('Failed to respond to group invitation:', res.message);
      }
    } catch (err) {
      console.error('Error responding to group invitation:', err);
    } finally {
      setRespondingId(null);
    }
  };

  const filteredGroups = groups.filter(group =>
    (group.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (group.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGroupClick = (group) => {
    navigate(`/user/family/group/${group.id || group._id}`, { state: { group } });
  };

  const handleCreateNewGroup = () => {
    navigate('/user/family/create-group');
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      if (typeof groupId === 'string' && groupId.length === 24) {
        await userApi.deleteFamilyGroup(groupId);
      }
      const updatedGroups = groups.filter(g => (g._id !== groupId && g.id !== groupId));
      setGroups(updatedGroups);
    } catch (err) {
      console.error('Error deleting group from MongoDB:', err);
    } finally {
      setShowDeleteConfirm(false);
      setGroupToDelete(null);
    }
  };

  const confirmDeleteGroup = (group) => {
    setGroupToDelete(group);
    setShowDeleteConfirm(true);
  };

  const getMemberNames = (members) => {
    if (!Array.isArray(members)) return '';
    return members
      .map(m => m?.name ? m.name.split(' ')[0] : 'Member')
      .filter(Boolean)
      .slice(0, 3)
      .join(', ');
  };

  const handleCopyLinkForMember = async (group, member) => {
    try {
      setIsGeneratingLink(true);
      const res = await userApi.getFamilyMemberShareLink(group._id || group.id, member._id || member.id);
      if (res.success && res.data?.inviteToken) {
        const fullUrl = `${window.location.origin}/family/join/${res.data.inviteToken}`;
        await navigator.clipboard.writeText(fullUrl);
        setCopiedMemberId(member._id || member.id);
        toast.success(`Invitation link for ${member.name} copied!`);
        setTimeout(() => setCopiedMemberId(null), 3000);
      } else {
        toast.error(res.message || 'Could not generate invitation link');
      }
    } catch (err) {
      toast.error('Failed to get invite link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleWhatsAppForMember = async (group, member) => {
    try {
      setIsGeneratingLink(true);
      const res = await userApi.getFamilyMemberShareLink(group._id || group.id, member._id || member.id);
      if (res.success && res.data?.inviteToken) {
        const fullUrl = `${window.location.origin}/family/join/${res.data.inviteToken}`;
        const greeting = `Hi ${member.name}! `;
        const text = `${greeting}You're invited to join our wedding planning group "${group.name}" on Utsavo.\n\nClick this link to join and start planning with the family:\n${fullUrl}`;
        const cleanPhone = (member.phone || '').replace(/\D/g, '');
        const whatsappUrl = cleanPhone 
          ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`
          : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
      } else {
        toast.error(res.message || 'Could not generate WhatsApp invitation link');
      }
    } catch (err) {
      toast.error('Failed to prepare WhatsApp invitation');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleAddNewMemberAndWhatsApp = async (e) => {
    e.preventDefault();
    if (!shareModalGroup) return;
    if (!newInviteName.trim()) {
      toast.warning('Please enter member name');
      return;
    }
    if (!newInvitePhone.trim()) {
      toast.warning('Please enter member phone number');
      return;
    }

    setIsAddingMember(true);
    try {
      const res = await userApi.inviteFamilyGroupMember(shareModalGroup._id || shareModalGroup.id, {
        name: newInviteName.trim(),
        phone: newInvitePhone.trim(),
        role: 'member',
        relation: 'Family'
      });

      if (res.success) {
        toast.success(`Invitation created for ${newInviteName.trim()}!`);
        const token = res.data?.inviteToken;
        if (token) {
          const fullUrl = `${window.location.origin}/family/join/${token}`;
          const text = `Hi ${newInviteName.trim()}! You're invited to join our wedding planning group "${shareModalGroup.name}" on Utsavo.\n\nClick this link to join:\n${fullUrl}`;
          const cleanPhone = newInvitePhone.replace(/\D/g, '');
          window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`, '_blank');
        }
        setNewInviteName('');
        setNewInvitePhone('');
        await fetchGroups();
        const updated = await userApi.getFamilyGroups();
        if (updated.success) {
          const found = (updated.data?.groups || updated.data || []).find(g => (g._id || g.id) === (shareModalGroup._id || shareModalGroup.id));
          if (found) setShareModalGroup(found);
        }
      } else {
        toast.error(res.message || 'Failed to add member');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to invite member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-10 px-4 py-4 border-b backdrop-blur-sm"
        style={{ 
          backgroundColor: `${theme.semantic.background.primary}95`,
          borderBottomColor: theme.semantic.border.light 
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-3 p-2 rounded-full"
              style={{ backgroundColor: theme.semantic.background.accent }}
            >
              <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
            </button>
            <div>
              <h1 className="text-lg font-bold" style={{ color: theme.semantic.text.primary }}>
                Family Groups
              </h1>
              <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                Your wedding planning groups
              </p>
            </div>
          </div>
          
          <button
            onClick={handleCreateNewGroup}
            className="p-2 rounded-full"
            style={{ backgroundColor: theme.colors.primary[500] }}
          >
            <Icon name="plus" size="sm" style={{ color: 'white' }} />
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative">
            <Icon 
              name="search" 
              size="sm" 
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
              style={{ color: theme.semantic.text.secondary }}
            />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 text-sm"
              style={{
                backgroundColor: theme.semantic.card.background,
                borderColor: theme.semantic.card.border,
                borderWidth: '1px',
                color: theme.semantic.text.primary,
                '--tw-ring-color': theme.colors.primary[500],
                fontSize: '16px' // Prevent zoom on iOS
              }}
            />
          </div>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="px-4 pt-4">
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center space-x-3 text-rose-800 min-w-0">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div className="text-xs min-w-0">
                <p className="font-bold text-sm text-rose-900">Failed to load groups</p>
                <p className="text-rose-700 truncate">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchGroups}
              className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition flex-shrink-0 shadow-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Pending Group Invitations Banner / Cards */}
      {pendingInvitations.length > 0 && (
        <div className="px-4 pt-4">
          <div 
            className="p-4 rounded-2xl border space-y-3"
            style={{
              backgroundColor: '#FEF3C7',
              borderColor: '#FDE68A'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base">📩</span>
                <h2 className="font-bold text-sm text-stone-900">
                  Pending Invitations ({pendingInvitations.length})
                </h2>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                Action Required
              </span>
            </div>
            <p className="text-xs text-stone-700">
              You have been invited to join these wedding planning groups. Accept to view message history and chat.
            </p>

            <div className="space-y-2.5 pt-1">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv._id || inv.id}
                  className="p-3 rounded-xl border bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={inv.avatar || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=150&h=150&fit=crop'}
                      alt={inv.name}
                      className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-stone-900 truncate">
                        {inv.name}
                      </h3>
                      {inv.description && (
                        <p className="text-xs text-stone-500 truncate">
                          {inv.description}
                        </p>
                      )}
                      <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                        Role: {inv.relation || 'Family'} ({inv.role || 'member'})
                      </p>
                    </div>
                  </div>

                  {/* Accept / Decline Action Buttons */}
                  <div className="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
                    <button
                      type="button"
                      disabled={respondingId === (inv._id || inv.id)}
                      onClick={() => handleRespondInvitation(inv, false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border text-rose-600 border-rose-200 hover:bg-rose-50 transition disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      disabled={respondingId === (inv._id || inv.id)}
                      onClick={() => handleRespondInvitation(inv, true)}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                    >
                      {respondingId === (inv._id || inv.id) ? 'Accepting...' : 'Accept'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCreateNewGroup}
            className="p-4 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: theme.colors.primary[50],
              borderColor: theme.colors.primary[200],
              borderWidth: '1px'
            }}
          >
            <div className="flex flex-col items-center space-y-2">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.colors.primary[500] }}
              >
                <Icon name="plus" size="sm" style={{ color: 'white' }} />
              </div>
              <span className="text-sm font-medium" style={{ color: theme.colors.primary[700] }}>
                New Group
              </span>
            </div>
          </button>
          
          <button
            onClick={() => navigate('/user/family/contacts')}
            className="p-4 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: theme.colors.accent[50],
              borderColor: theme.colors.accent[200],
              borderWidth: '1px'
            }}
          >
            <div className="flex flex-col items-center space-y-2">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.colors.accent[500] }}
              >
                <Icon name="users" size="sm" style={{ color: 'white' }} />
              </div>
              <span className="text-sm font-medium" style={{ color: theme.colors.accent[700] }}>
                Contacts
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Groups List */}
      <div className="px-4 space-y-3">
        {filteredGroups.map((group) => (
          <Card 
            key={group.id}
            className="transition-all duration-200 hover:scale-[1.01] cursor-pointer relative"
          >
            <div className="p-4" onClick={() => handleGroupClick(group)}>
              <div className="flex items-center space-x-3">
                {/* Group Avatar */}
                <div className="relative">
                  <img
                    src={group.avatar}
                    alt={group.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {group.isActive && (
                    <div 
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                      style={{ backgroundColor: theme.colors.accent[500] }}
                    />
                  )}
                  {group.unreadCount > 0 && (
                    <div 
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: theme.colors.primary[500] }}
                    >
                      <span className="text-xs font-bold text-white">
                        {group.unreadCount > 9 ? '9+' : group.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Group Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 
                      className="font-semibold text-base truncate"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      {group.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span 
                        className="text-xs flex-shrink-0"
                        style={{ color: theme.semantic.text.secondary }}
                      >
                        {group.lastMessage ? formatTime(group.createdAt) : 'New'}
                      </span>
                      {isCurrentUserAdmin(group) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDeleteGroup(group);
                          }}
                          className="p-1 rounded-full hover:bg-red-100 transition-colors"
                          title="Delete group"
                        >
                          <Icon name="trash" size="xs" style={{ color: '#dc2626' }} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <p 
                    className="text-sm mb-2 line-clamp-1"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    {group.description}
                  </p>
                  
                  {group.lastMessage && (
                    <div className="flex items-center justify-between">
                      <p 
                        className="text-sm truncate flex-1"
                        style={{ 
                          color: group.unreadCount > 0 
                            ? theme.semantic.text.primary 
                            : theme.semantic.text.secondary,
                          fontWeight: group.unreadCount > 0 ? '500' : '400'
                        }}
                      >
                        <span className="font-medium">{group.lastMessage.sender}:</span> {group.lastMessage.text}
                      </p>
                      <span 
                        className="text-xs ml-2 flex-shrink-0"
                        style={{ color: theme.semantic.text.tertiary }}
                      >
                        {group.lastMessage.time}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-3 pt-2 border-t" style={{ borderColor: theme.semantic.border.light }}>
                    <div className="flex items-center space-x-1">
                      <Icon name="users" size="xs" style={{ color: theme.semantic.text.secondary }} />
                      <span className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                        {group.members.length} members
                      </span>
                      {isCurrentUserAdmin(group) && (
                        <div 
                          className="px-2 py-0.5 rounded-full text-[11px] font-semibold ml-1.5"
                          style={{
                            backgroundColor: theme.colors.accent[100],
                            color: theme.colors.accent[700]
                          }}
                        >
                          Admin
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareModalGroup(group);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 active:scale-95"
                        title="Share Group Invitation via WhatsApp or Link"
                      >
                        <span className="text-sm leading-none">📱</span>
                        <span>Share Invite</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="users" size="xl" style={{ color: theme.semantic.text.secondary }} />
          </div>
          <h3 
            className="text-lg font-semibold mb-2"
            style={{ color: theme.semantic.text.primary }}
          >
            {searchQuery ? 'No groups found' : 'No groups yet'}
          </h3>
          <p 
            className="text-center max-w-sm mb-6"
            style={{ color: theme.semantic.text.secondary }}
          >
            {searchQuery 
              ? 'Try adjusting your search terms to find the groups you\'re looking for.'
              : 'Create your first family group to start planning your wedding together.'
            }
          </p>
          
          {!searchQuery && (
            <Button
              onClick={handleCreateNewGroup}
              className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
              style={{
                backgroundColor: theme.colors.primary[500],
                color: 'white'
              }}
            >
              <Icon name="plus" size="sm" />
              Create Your First Group
            </Button>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-40 md:bottom-6">
        <button
          onClick={handleCreateNewGroup}
          className="w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center hover:scale-110"
          style={{
            backgroundColor: theme.colors.primary[500],
            boxShadow: `0 4px 20px ${theme.colors.primary[500]}40`,
          }}
        >
          <Icon name="plus" size="lg" style={{ color: 'white' }} />
        </button>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && groupToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ backgroundColor: theme.semantic.background.primary }}
          >
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#fee2e2' }}
              >
                <Icon name="warning" size="xl" style={{ color: '#dc2626' }} />
              </div>
              
              <h3 className="text-lg font-bold mb-2" style={{ color: theme.semantic.text.primary }}>
                Delete "{groupToDelete.name}"?
              </h3>
              <p className="text-sm mb-6" style={{ color: theme.semantic.text.secondary }}>
                This action cannot be undone. All messages and group data will be permanently deleted.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setGroupToDelete(null);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-medium transition-colors"
                  style={{
                    backgroundColor: theme.semantic.background.accent,
                    color: theme.semantic.text.primary
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteGroup(groupToDelete.id)}
                  className="flex-1 py-3 px-4 rounded-xl font-medium transition-colors"
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Invitation & WhatsApp Modal */}
      {shareModalGroup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div 
            className="w-full max-w-md rounded-2xl p-6 max-h-[85vh] overflow-y-auto space-y-5"
            style={{ backgroundColor: theme.semantic.background.primary }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.semantic.border.light }}>
              <div className="flex items-center gap-2.5">
                <img
                  src={shareModalGroup.avatar || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=150&h=150&fit=crop'}
                  alt={shareModalGroup.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-bold text-base" style={{ color: theme.semantic.text.primary }}>
                    Share Group Invite
                  </h3>
                  <p className="text-xs truncate max-w-[200px]" style={{ color: theme.semantic.text.secondary }}>
                    {shareModalGroup.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShareModalGroup(null)}
                className="p-1.5 rounded-full hover:bg-stone-100"
              >
                <Icon name="close" size="sm" style={{ color: theme.semantic.text.secondary }} />
              </button>
            </div>

            {/* Pending members section */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider mb-2.5" style={{ color: theme.semantic.text.secondary }}>
                Invited Members
              </h4>
              <div className="space-y-2.5">
                {(shareModalGroup.members || [])
                  .filter(m => m.role !== 'admin' || m.status === 'pending')
                  .map((m) => {
                    const isPending = m.status === 'pending';
                    const isCopied = copiedMemberId === (m._id || m.id);
                    return (
                      <div 
                        key={m._id || m.id || m.name}
                        className="p-3 rounded-xl border flex items-center justify-between gap-2"
                        style={{ backgroundColor: theme.semantic.background.secondary, borderColor: theme.semantic.border.light }}
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate" style={{ color: theme.semantic.text.primary }}>
                            {m.name}
                          </p>
                          <p className="text-[11px] truncate" style={{ color: theme.semantic.text.secondary }}>
                            {m.relation || 'Family'} {m.phone ? `• ${m.phone}` : ''}
                          </p>
                          <span className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full ${isPending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {isPending ? 'Pending Acceptance' : 'Joined'}
                          </span>
                        </div>

                        {isPending && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              disabled={isGeneratingLink}
                              onClick={() => handleWhatsAppForMember(shareModalGroup, m)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1 shadow-sm transition active:scale-95"
                              style={{ backgroundColor: '#25D366' }}
                              title="Share on WhatsApp"
                            >
                              <span>📱</span>
                              <span>WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              disabled={isGeneratingLink}
                              onClick={() => handleCopyLinkForMember(shareModalGroup, m)}
                              className="p-1.5 rounded-lg border text-xs font-semibold transition active:scale-95"
                              style={{
                                backgroundColor: isCopied ? '#ECFDF5' : 'white',
                                borderColor: isCopied ? '#10B981' : theme.semantic.border.light,
                                color: isCopied ? '#059669' : theme.semantic.text.primary
                              }}
                              title="Copy Invite Link"
                            >
                              <Icon name={isCopied ? 'check' : 'copy'} size="xs" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Quick Invite New Contact & WhatsApp */}
            <div className="pt-2 border-t" style={{ borderColor: theme.semantic.border.light }}>
              <h4 className="font-bold text-xs uppercase tracking-wider mb-2" style={{ color: theme.semantic.text.secondary }}>
                Invite Another Contact via WhatsApp
              </h4>
              <form onSubmit={handleAddNewMemberAndWhatsApp} className="space-y-2">
                <input
                  type="text"
                  placeholder="Contact Name (e.g. Rahul, Khushu)"
                  value={newInviteName}
                  onChange={(e) => setNewInviteName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                  style={{ borderColor: theme.semantic.border.light }}
                />
                <input
                  type="tel"
                  placeholder="10-digit Phone Number (e.g. 9876543210)"
                  value={newInvitePhone}
                  onChange={(e) => setNewInvitePhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                  style={{ borderColor: theme.semantic.border.light }}
                />
                <button
                  type="submit"
                  disabled={isAddingMember}
                  className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 text-white shadow-sm transition active:scale-95"
                  style={{ backgroundColor: '#25D366' }}
                >
                  {isAddingMember ? (
                    <span>Generating WhatsApp Invite...</span>
                  ) : (
                    <>
                      <span>📱</span>
                      <span>Send WhatsApp Invitation</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyGroups;