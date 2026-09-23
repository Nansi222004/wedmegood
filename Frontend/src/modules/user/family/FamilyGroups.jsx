import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import userApi from '../../../services/userApi';
import { useAuth } from '../../../contexts/AuthContext';

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=200&h=200&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=200&h=200&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=200&h=200&fit=crop&q=80'
];

const FamilyGroups = () => {
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
  const [copiedGeneralLink, setCopiedGeneralLink] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generalInviteData, setGeneralInviteData] = useState(null);
  const [newInviteName, setNewInviteName] = useState('');
  const [newInvitePhone, setNewInvitePhone] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const menuRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Close 3-dot dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Check if group is newly created (e.g., within last 7 days or no messages yet)
  const isGroupNew = (group) => {
    if (!group) return false;
    if (group.isNewGroup === true) return true;
    if (group.createdAt) {
      const createdDate = new Date(group.createdAt).getTime();
      const diffDays = (Date.now() - createdDate) / (1000 * 60 * 60 * 24);
      if (diffDays <= 7) return true;
    }
    // If no last message exists yet, consider it newly active
    return !group.lastMessage;
  };

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await userApi.getFamilyGroups();
      if (res.success) {
        const groupsData = Array.isArray(res.data) ? res.data : (res.data?.groups || []);
        const pendingData = Array.isArray(res.data?.pendingInvitations) ? res.data.pendingInvitations : [];
        const formatted = groupsData.map((g, idx) => ({
          ...g,
          id: g._id || g.id,
          avatar: g.avatar || DEFAULT_AVATARS[idx % DEFAULT_AVATARS.length],
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
      setError(err?.message || 'Could not load family groups. Please check your connection.');
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
        showToast(accept ? 'Invitation accepted! Welcome to the group.' : 'Invitation declined.');
        await fetchGroups();
      } else {
        showToast(res.message || 'Failed to respond to invitation');
      }
    } catch (err) {
      console.error('Error responding to group invitation:', err);
      showToast('Error responding to invitation');
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
      showToast('Group deleted successfully');
    } catch (err) {
      console.error('Error deleting group from MongoDB:', err);
      showToast('Failed to delete group');
    } finally {
      setShowDeleteConfirm(false);
      setGroupToDelete(null);
    }
  };

  const confirmDeleteGroup = (group) => {
    setGroupToDelete(group);
    setShowDeleteConfirm(true);
    setOpenMenuId(null);
  };

  // Open share modal & load general invitation link
  const handleOpenShareModal = async (group, e) => {
    if (e) e.stopPropagation();
    setShareModalGroup(group);
    setOpenMenuId(null);
    setGeneralInviteData(null);
    try {
      setIsGeneratingLink(true);
      const res = await userApi.getFamilyGroupShareLink(group._id || group.id);
      if (res.success && res.data) {
        setGeneralInviteData(res.data);
      }
    } catch (err) {
      console.error('Error fetching general share link:', err);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyGeneralLink = async () => {
    if (!generalInviteData?.inviteUrl && !generalInviteData?.inviteToken) return;
    const url = generalInviteData.inviteUrl || `${window.location.origin}/family/join-group/${generalInviteData.inviteToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedGeneralLink(true);
      showToast('General group invitation link copied!');
      setTimeout(() => setCopiedGeneralLink(false), 3000);
    } catch (err) {
      showToast('Could not copy to clipboard');
    }
  };

  const handleWhatsAppGeneralLink = () => {
    if (!shareModalGroup) return;
    const url = generalInviteData?.inviteUrl || `${window.location.origin}/family/join-group/${generalInviteData?.inviteToken || ''}`;
    const text = `Hi! You are invited to join our wedding planning group "${shareModalGroup.name}" on Utsavo.\n\nClick this link to request to join:\n${url}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyLinkForMember = async (group, member) => {
    try {
      setIsGeneratingLink(true);
      const res = await userApi.getFamilyMemberShareLink(group._id || group.id, member._id || member.id);
      if (res.success && res.data?.inviteToken) {
        const fullUrl = `${window.location.origin}/family/join/${res.data.inviteToken}`;
        await navigator.clipboard.writeText(fullUrl);
        setCopiedMemberId(member._id || member.id);
        showToast(`Invitation link for ${member.name} copied!`);
        setTimeout(() => setCopiedMemberId(null), 3000);
      } else {
        showToast(res.message || 'Could not generate invitation link');
      }
    } catch (err) {
      showToast('Failed to get invite link');
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
        showToast(res.message || 'Could not generate WhatsApp invitation link');
      }
    } catch (err) {
      showToast('Failed to prepare WhatsApp invitation');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleAddNewMemberAndWhatsApp = async (e) => {
    e.preventDefault();
    if (!shareModalGroup) return;
    if (!newInviteName.trim()) {
      showToast('Please enter member name');
      return;
    }
    if (!newInvitePhone.trim()) {
      showToast('Please enter member phone number');
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
        showToast(`Invitation created for ${newInviteName.trim()}!`);
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
        showToast(res.message || 'Failed to add member');
      }
    } catch (err) {
      showToast(err.message || 'Failed to invite member');
    } finally {
      setIsAddingMember(false);
    }
  };

  return (
    <div className="min-h-screen pb-28 relative z-0 bg-transparent">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#401332] text-white text-xs font-semibold shadow-xl border border-white/20 animate-fade-in flex items-center gap-2">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Container matching Screenshot 2 */}
      <div className="max-w-md mx-auto sm:max-w-xl md:max-w-2xl px-4 sm:px-6 pt-1">
        
        {/* Page Heading Row: Back button, Title & Subtitle, Circular Plus button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Circular Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 rounded-full bg-white flex items-center justify-center border border-[#F2E6ED] shadow-[0_2px_8px_rgba(74,21,75,0.06)] hover:bg-[#FAF4F7] active:scale-95 transition-all text-[#401332] flex-shrink-0"
              title="Go back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Title & Subtitle */}
            <div>
              <h1 
                className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#401332] leading-tight"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                Family Groups
              </h1>
              <p className="text-[13px] text-[#735F6F] font-normal mt-0.5">
                Your wedding planning groups
              </p>
            </div>
          </div>

          {/* Top Circular Purple Plus Button */}
          <button
            onClick={handleCreateNewGroup}
            className="w-11 h-11 rounded-full bg-[#5B1645] hover:bg-[#4C1039] active:scale-95 text-white flex items-center justify-center shadow-[0_3px_12px_rgba(91,22,69,0.3)] transition-all flex-shrink-0"
            title="Create New Group"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Group Search Bar */}
        <div className="mb-4">
          <div className="flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-full px-4.5 py-3 border border-[#F2E5EC] shadow-[0_2px_10px_rgba(74,21,75,0.03)] focus-within:border-[#5B1645]/40 focus-within:shadow-[0_2px_14px_rgba(74,21,75,0.06)] transition-all">
            <svg className="w-4.5 h-4.5 text-[#9E8E9A] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm text-[#3D1E36] placeholder-[#9E8E9A] font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-[#9E8E9A] hover:text-[#5B1645] text-xs font-semibold p-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Action Feature Cards: New Group and Contacts side by side */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4 mb-5">
          {/* New Group Card */}
          <div
            onClick={handleCreateNewGroup}
            className="relative overflow-hidden rounded-2xl py-6 px-3 bg-[#FDF1F5] border border-[#F7D5E2] shadow-[0_2px_10px_rgba(247,213,226,0.25)] hover:shadow-[0_4px_16px_rgba(247,213,226,0.45)] hover:scale-[1.02] active:scale-98 transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
          >
            {/* Subtle decorative leaf watermark */}
            <svg 
              className="absolute -right-4 -bottom-4 w-24 h-24 text-[#F7D5E2] opacity-40 pointer-events-none" 
              viewBox="0 0 100 100" 
              fill="currentColor"
            >
              <path d="M50 10 C65 25, 75 45, 60 70 C45 95, 20 85, 20 70 C20 45, 35 25, 50 10 Z" />
              <path d="M50 20 C45 40, 40 60, 20 70" stroke="#F1B6CD" strokeWidth="2" fill="none" />
            </svg>

            {/* Plum circular icon button */}
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#5B1645] group-hover:bg-[#4C1039] flex items-center justify-center text-white shadow-sm transition-all relative z-10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 6v12m6-6H6" />
              </svg>
            </div>

            {/* Serif label */}
            <span 
              className="mt-3 text-[15px] sm:text-base font-bold text-[#401332] tracking-wide relative z-10"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              New Group
            </span>
          </div>

          {/* Contacts Card */}
          <div
            onClick={() => navigate('/user/family/contacts')}
            className="relative overflow-hidden rounded-2xl py-6 px-3 bg-[#FAF5EC] border border-[#F0E4CE] shadow-[0_2px_10px_rgba(240,228,206,0.25)] hover:shadow-[0_4px_16px_rgba(240,228,206,0.45)] hover:scale-[1.02] active:scale-98 transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
          >
            {/* Subtle decorative leaf watermark */}
            <svg 
              className="absolute -right-4 -bottom-4 w-24 h-24 text-[#F0E4CE] opacity-40 pointer-events-none" 
              viewBox="0 0 100 100" 
              fill="currentColor"
            >
              <path d="M50 10 C65 25, 75 45, 60 70 C45 95, 20 85, 20 70 C20 45, 35 25, 50 10 Z" />
              <path d="M50 20 C45 40, 40 60, 20 70" stroke="#DFCCA9" strokeWidth="2" fill="none" />
            </svg>

            {/* Gold circular icon button */}
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#BF9456] group-hover:bg-[#B08544] flex items-center justify-center text-white shadow-sm transition-all relative z-10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>

            {/* Serif label */}
            <span 
              className="mt-3 text-[15px] sm:text-base font-bold text-[#401332] tracking-wide relative z-10"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Contacts
            </span>
          </div>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="mb-4 p-4 rounded-2xl border border-rose-200 bg-rose-50/95 backdrop-blur-sm flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center space-x-3 text-rose-800 min-w-0">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div className="text-xs min-w-0">
                <p className="font-bold text-sm text-rose-900">Failed to load groups</p>
                <p className="text-rose-700 truncate">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchGroups}
              className="px-3.5 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition flex-shrink-0 shadow-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Pending Group Invitations Banner (if any) */}
        {pendingInvitations.length > 0 && (
          <div className="mb-4 p-4 rounded-2xl border border-amber-200 bg-amber-50/90 backdrop-blur-sm space-y-3 shadow-sm">
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

            <div className="space-y-2 pt-1">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv._id || inv.id}
                  className="p-3 rounded-xl border border-stone-200 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={inv.avatar || DEFAULT_AVATARS[0]}
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
        )}

        {/* Loading State */}
        {isLoading && groups.length === 0 && (
          <div className="space-y-3.5 pt-2">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white/80 rounded-2xl p-4 sm:p-5 border border-[#F4E6ED] animate-pulse flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-stone-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-stone-200 rounded w-1/2" />
                  <div className="h-3 bg-stone-100 rounded w-3/4" />
                  <div className="h-3 bg-stone-100 rounded w-1/4 pt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Family Group Cards List */}
        {!isLoading && filteredGroups.length > 0 && (
          <div className="space-y-3.5 sm:space-y-4">
            {filteredGroups.map((group) => {
              const isAdmin = isCurrentUserAdmin(group);
              const isNew = isGroupNew(group);
              const isMenuOpen = openMenuId === group.id;

              return (
                <div
                  key={group.id}
                  onClick={() => handleGroupClick(group)}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F4E6ED] shadow-[0_4px_16px_rgba(74,21,75,0.03)] hover:shadow-[0_6px_22px_rgba(74,21,75,0.06)] transition-all cursor-pointer relative overflow-visible"
                >
                  <div className="flex items-center gap-3.5 sm:gap-4.5">
                    {/* Large Circular Avatar on the left */}
                    <div className="w-[66px] h-[66px] sm:w-[72px] sm:h-[72px] rounded-full ring-4 ring-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-black/5 overflow-hidden flex-shrink-0 bg-stone-100">
                      <img
                        src={group.avatar}
                        alt={group.name}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_AVATARS[0];
                        }}
                      />
                    </div>

                    {/* Group Details on the right */}
                    <div className="flex-1 min-w-0">
                      {/* Top Row: Group Name + New Badge + Three Dots */}
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h3 
                          className="font-bold text-[16px] sm:text-[17px] text-[#3B142F] truncate tracking-tight"
                          style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                        >
                          {group.name}
                        </h3>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* New Status Indicator */}
                          {isNew && (
                            <span className="text-[12px] font-bold text-[#D8315B] flex items-center gap-1.5 flex-shrink-0">
                              <span>New</span>
                              <span className="w-2 h-2 rounded-full bg-[#D8315B] inline-block" />
                            </span>
                          )}

                          {/* Vertical Three-Dot Menu Button */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(isMenuOpen ? null : group.id);
                              }}
                              className="p-1 -mr-1 text-[#8C7A87] hover:text-[#4A154B] rounded-full hover:bg-[#FAF4F7] transition"
                              title="Group options"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>

                            {/* Dropdown Menu Popup */}
                            {isMenuOpen && (
                              <div
                                ref={menuRef}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-8 z-30 w-44 bg-white rounded-xl shadow-[0_4px_20px_rgba(74,21,75,0.15)] border border-[#F2E5EC] py-1.5 animate-fade-in"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleGroupClick(group);
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#401332] hover:bg-[#FAF4F7] flex items-center gap-2"
                                >
                                  <span>💬</span>
                                  <span>Open Group Chat</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleOpenShareModal(group, e)}
                                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#401332] hover:bg-[#FAF4F7] flex items-center gap-2"
                                >
                                  <span>🔗</span>
                                  <span>Share Invite</span>
                                </button>

                                {isAdmin && (
                                  <>
                                    <div className="border-t border-[#F5E6ED] my-1" />
                                    <button
                                      type="button"
                                      onClick={() => confirmDeleteGroup(group)}
                                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                    >
                                      <span>🗑️</span>
                                      <span>Delete Group</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Group Description */}
                      <p className="text-[13px] text-[#7A6876] font-normal truncate mt-0.5">
                        {group.description || 'Wedding planning group'}
                      </p>

                      {/* Thin Pale Pink Horizontal Divider */}
                      <div className="border-b border-[#F5E6ED] my-2.5 sm:my-3" />

                      {/* Bottom Metadata & Actions Row */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        {/* Member Count & Admin Badge */}
                        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                          <div className="flex items-center gap-1.5 text-xs text-[#5A4555] font-medium">
                            <svg className="w-3.5 h-3.5 text-[#6A5866] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>
                              {group.members?.length || 0} members
                            </span>
                          </div>

                          {/* Pale Mint-Green Admin Badge */}
                          {isAdmin && (
                            <span className="bg-[#E5F8EE] text-[#1E824C] border border-[#C6F0D8] px-2.5 py-0.5 rounded-full text-[11px] font-semibold leading-none flex items-center">
                              Admin
                            </span>
                          )}

                          {/* Subtle Vertical Divider */}
                          <span className="text-[#E0D2DC] font-light">|</span>
                        </div>

                        {/* Mint-Green Share Invite Button */}
                        <button
                          type="button"
                          onClick={(e) => handleOpenShareModal(group, e)}
                          className="bg-[#EDF9F2] hover:bg-[#E2F6EB] active:scale-95 text-[#1E6B4E] border border-[#C8F0DA] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-[0_1px_3px_rgba(30,107,78,0.06)] transition-all flex-shrink-0"
                          title="Share Group Invitation"
                        >
                          <svg className="w-3.5 h-3.5 text-[#1E6B4E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          <span>Share Invite</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State when no groups or search returns 0 */}
        {!isLoading && filteredGroups.length === 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-[#F4E6ED] text-center shadow-sm my-6">
            <div className="w-16 h-16 rounded-full bg-[#FDF1F5] border border-[#F7D5E2] flex items-center justify-center mx-auto mb-4 text-2xl">
              👨‍👩‍👧‍👦
            </div>
            <h3 
              className="text-lg font-bold text-[#401332] mb-1"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              {searchQuery ? 'No matching groups found' : 'No family groups yet'}
            </h3>
            <p className="text-xs text-[#735F6F] max-w-xs mx-auto mb-5 leading-relaxed">
              {searchQuery 
                ? 'Try adjusting your search query to find your planning groups.'
                : 'Create your first wedding planning group to collaborate, chat, and share memories with family.'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreateNewGroup}
                className="px-5 py-2.5 rounded-full bg-[#5B1645] hover:bg-[#4C1039] text-white text-xs font-bold shadow-md transition-all active:scale-95 inline-flex items-center gap-2"
              >
                <span>+</span>
                <span>Create Your First Group</span>
              </button>
            )}
          </div>
        )}

      </div>

      {/* Floating Action Button (FAB) matching Screenshot 2 */}
      <div className="fixed bottom-6 right-5 z-40 sm:bottom-8 sm:right-8">
        <button
          onClick={handleCreateNewGroup}
          className="w-14 h-14 rounded-full bg-[#5B1645] hover:bg-[#4C1039] active:scale-95 text-white flex items-center justify-center shadow-[0_4px_18px_rgba(91,22,69,0.38)] transition-all"
          title="Create New Group"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 6v12m6-6H6" />
          </svg>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && groupToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl p-6 bg-white border border-[#F2E5EC] shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-3.5 text-rose-600 text-2xl">
              🗑️
            </div>
            
            <h3 
              className="text-lg font-bold text-[#401332] mb-1.5"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Delete "{groupToDelete.name}"?
            </h3>
            <p className="text-xs text-[#735F6F] mb-6 leading-relaxed">
              This action cannot be undone. All messages, photos, and group data will be permanently removed.
            </p>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setGroupToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs border border-[#F2E5EC] text-[#5A4555] hover:bg-stone-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteGroup(groupToDelete.id)}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition"
              >
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Invitation Modal */}
      {shareModalGroup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl p-6 max-h-[88vh] overflow-y-auto space-y-4 bg-white border border-[#F2E5EC] shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F5E6ED]">
              <div className="flex items-center gap-3">
                <img
                  src={shareModalGroup.avatar || DEFAULT_AVATARS[0]}
                  alt={shareModalGroup.name}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-[#F7D5E2]"
                />
                <div>
                  <h3 
                    className="font-bold text-base text-[#401332]"
                    style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                  >
                    Share Group Invite
                  </h3>
                  <p className="text-xs text-[#735F6F] truncate max-w-[210px]">
                    {shareModalGroup.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShareModalGroup(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition"
              >
                ✕
              </button>
            </div>

            {/* General Group Share Link Section */}
            <div className="p-3.5 rounded-2xl bg-[#FAF5EE] border border-[#F0E4CE] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#401332] uppercase tracking-wide">
                  General Group Invite Link
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E5F8EE] text-[#1E824C]">
                  Requires Host Approval
                </span>
              </div>

              <p className="text-[11px] text-[#735F6F]">
                Anyone with this link can request to join. You can approve or decline join requests inside the group chat.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isGeneratingLink}
                  onClick={handleWhatsAppGeneralLink}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <span>📱</span>
                  <span>Share on WhatsApp</span>
                </button>

                <button
                  type="button"
                  disabled={isGeneratingLink}
                  onClick={handleCopyGeneralLink}
                  className={`py-2 px-3.5 rounded-xl border text-xs font-bold transition active:scale-95 flex items-center gap-1.5 ${copiedGeneralLink ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white text-[#401332] border-[#F0E4CE]'}`}
                >
                  <span>{copiedGeneralLink ? '✓' : '📋'}</span>
                  <span>{copiedGeneralLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Direct Member Invitations */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#735F6F] mb-2">
                Member Invitations
              </h4>
              
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {(shareModalGroup.members || [])
                  .filter(m => m.role !== 'admin' || m.status === 'pending')
                  .map((m) => {
                    const isPending = m.status === 'pending';
                    const isCopied = copiedMemberId === (m._id || m.id);

                    return (
                      <div 
                        key={m._id || m.id || m.name}
                        className="p-2.5 rounded-xl border border-[#F5E6ED] bg-[#FAF7F9] flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-[#401332] truncate">
                            {m.name}
                          </p>
                          <p className="text-[11px] text-[#735F6F] truncate">
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
                              className="px-2 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1 shadow-sm transition active:scale-95"
                              style={{ backgroundColor: '#25D366' }}
                              title="Share on WhatsApp"
                            >
                              <span>📱</span>
                            </button>
                            <button
                              type="button"
                              disabled={isGeneratingLink}
                              onClick={() => handleCopyLinkForMember(shareModalGroup, m)}
                              className={`p-1.5 rounded-lg border text-xs font-semibold transition active:scale-95 ${isCopied ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white text-[#401332] border-[#F2E5EC]'}`}
                              title="Copy Personal Link"
                            >
                              <span>{isCopied ? '✓' : '📋'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Quick Invite New Contact & WhatsApp */}
            <div className="pt-2 border-t border-[#F5E6ED]">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#735F6F] mb-2">
                Invite Specific Contact Directly
              </h4>

              <form onSubmit={handleAddNewMemberAndWhatsApp} className="space-y-2">
                <input
                  type="text"
                  placeholder="Contact Name (e.g. Aunt Seema, Rahul)"
                  value={newInviteName}
                  onChange={(e) => setNewInviteName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#F2E5EC] focus:outline-none focus:border-[#5B1645]/50 bg-[#FAF7F9]"
                />
                <input
                  type="tel"
                  placeholder="10-digit Phone Number (e.g. 9876543210)"
                  value={newInvitePhone}
                  onChange={(e) => setNewInvitePhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#F2E5EC] focus:outline-none focus:border-[#5B1645]/50 bg-[#FAF7F9]"
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
                      <span>Invite via WhatsApp</span>
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