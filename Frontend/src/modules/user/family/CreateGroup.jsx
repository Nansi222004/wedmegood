import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import userApi from '../../../services/userApi';
import { toast } from '../../../components/ui/Toast';
import { getFriendlyErrorMessage } from '../../../utils/errorHandler';

const CreateGroup = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupAvatar, setGroupAvatar] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', phone: '', email: '', relation: 'Family', role: 'member' });

  // Get selected contacts from navigation state or fallback
  useEffect(() => {
    if (location.state?.selectedContactsData && location.state.selectedContactsData.length > 0) {
      setSelectedMembers(location.state.selectedContactsData);
      
      // Auto-generate group name based on selected contacts
      const contactNames = location.state.selectedContactsData
        .map(c => c.name?.split(' ')[0])
        .filter(Boolean)
        .slice(0, 3);
      
      if (contactNames.length > 0) {
        setGroupName(`${contactNames.join(', ')} Wedding Group`);
      }
    } else if (location.state?.selectedContacts && location.state.selectedContacts.length > 0) {
      // Fetch guests to resolve IDs
      userApi.getGuests().then(res => {
        const guestList = res.data?.guests || res.data || [];
        const matched = guestList
          .filter(g => location.state.selectedContacts.includes(g._id || g.id))
          .map(g => ({
            id: g._id || g.id,
            name: g.name,
            phone: g.phone || '',
            relation: g.relation || 'Family',
            avatar: g.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(g.name)}&background=random`
          }));
        if (matched.length > 0) {
          setSelectedMembers(matched);
          const contactNames = matched.map(c => c.name?.split(' ')[0]).filter(Boolean).slice(0, 3);
          if (contactNames.length > 0) {
            setGroupName(`${contactNames.join(', ')} Wedding Group`);
          }
        }
      }).catch(err => {
        console.error('Failed to load guests for group:', err);
      });
    }
  }, [location.state]);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.warning('Please enter a group name');
      return;
    }

    setIsCreating(true);

    try {
      const membersPayload = selectedMembers.map(c => ({
        name: c.name,
        phone: c.phone || '',
        email: c.email || '',
        role: c.role || 'member',
        relation: c.relation || 'Family',
        status: 'accepted'
      }));

      const payload = {
        name: groupName.trim(),
        description: groupDescription.trim() || 'Wedding planning group',
        avatar: groupAvatar || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=150&h=150&fit=crop',
        members: membersPayload
      };

      const res = await userApi.createFamilyGroup(payload);
      const savedGroup = res.data?.group || res.data || {
        _id: String(Date.now()),
        ...payload
      };

      // Also update local copy for backward compatibility with GroupChat
      const existingGroups = JSON.parse(localStorage.getItem('familyGroups') || '[]');
      const groupForChat = {
        id: savedGroup._id || Date.now(),
        name: savedGroup.name,
        description: savedGroup.description,
        avatar: savedGroup.avatar,
        members: selectedMembers.map(c => c.id || c._id),
        createdBy: 1,
        createdAt: savedGroup.createdAt || new Date().toISOString(),
        lastMessage: {
          text: `${savedGroup.name} group created!`,
          sender: 'System',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        unreadCount: 0,
        isActive: true
      };
      existingGroups.push(groupForChat);
      localStorage.setItem('familyGroups', JSON.stringify(existingGroups));

      setIsCreating(false);
      navigate(`/user/family/group/${groupForChat.id}`, { 
        state: { group: groupForChat, isNewGroup: true }
      });
    } catch (err) {
      console.error('Error creating family group:', err);
      toast.error(getFriendlyErrorMessage(err, 'Failed to create family group'));
      setIsCreating(false);
    }
  };

  const handleRemoveContact = (contactId) => {
    setSelectedMembers(prev => prev.filter(m => (m.id || m._id) !== contactId));
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMember.name.trim()) {
      toast.warning('Please enter member name');
      return;
    }
    const memberToAdd = {
      id: 'custom_' + Date.now(),
      name: newMember.name.trim(),
      phone: newMember.phone.trim(),
      email: newMember.email.trim(),
      relation: newMember.relation,
      role: newMember.role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newMember.name.trim())}&background=random`
    };
    setSelectedMembers(prev => [...prev, memberToAdd]);
    setNewMember({ name: '', phone: '', email: '', relation: 'Family', role: 'member' });
    setShowAddModal(false);
  };

  const predefinedAvatars = [
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=150&h=150&fit=crop',
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=150&h=150&fit=crop',
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=150&h=150&fit=crop',
    'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=150&h=150&fit=crop',
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=150&h=150&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop'
  ];

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-10 px-4 py-4 border-b backdrop-blur-sm"
        style={{ 
          backgroundColor: `${theme.semantic.background.primary}95`,
          borderBottomColor: theme.semantic.border.light 
        }}
      >
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
              Create Wedding Group
            </h1>
            <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
              Set up your family group chat
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Group Avatar Selection */}
        <Card>
          <div className="p-4">
            <h3 className="font-semibold mb-4" style={{ color: theme.semantic.text.primary }}>
              Choose Group Avatar
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {predefinedAvatars.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => setGroupAvatar(avatar)}
                  className={`relative rounded-xl overflow-hidden transition-all duration-200 ${
                    groupAvatar === avatar ? 'ring-2 scale-105' : 'hover:scale-105'
                  }`}
                  style={{
                    '--tw-ring-color': theme.colors.primary[500]
                  }}
                >
                  <img
                    src={avatar}
                    alt={`Avatar ${index + 1}`}
                    className="w-full h-20 object-cover"
                  />
                  {groupAvatar === avatar && (
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.colors.primary[500] }}
                      >
                        <Icon name="check" size="xs" style={{ color: 'white' }} />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Group Details */}
        <Card>
          <div className="p-4 space-y-4">
            <h3 className="font-semibold" style={{ color: theme.semantic.text.primary }}>
              Group Details
            </h3>
            
            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.semantic.text.secondary }}>
                Group Name *
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 text-sm border"
                style={{
                  backgroundColor: theme.semantic.card.background,
                  borderColor: theme.semantic.card.border,
                  color: theme.semantic.text.primary,
                  '--tw-ring-color': theme.colors.primary[500]
                }}
                maxLength={50}
              />
            </div>

            {/* Group Description */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.semantic.text.secondary }}>
                Description (Optional)
              </label>
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Describe the purpose of this group..."
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 text-sm border resize-none"
                style={{
                  backgroundColor: theme.semantic.card.background,
                  borderColor: theme.semantic.card.border,
                  color: theme.semantic.text.primary,
                  '--tw-ring-color': theme.colors.primary[500]
                }}
                rows={3}
                maxLength={200}
              />
            </div>
          </div>
        </Card>

        {/* Selected Members */}
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold" style={{ color: theme.semantic.text.primary }}>
                  Group Members ({selectedMembers.length})
                </h3>
                <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                  Select contacts or add family members directly
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                  style={{
                    backgroundColor: theme.colors.primary[500],
                    color: 'white'
                  }}
                >
                  <Icon name="plus" size="xs" />
                  <span>Add</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/user/family/contacts', { 
                    state: { selectedContacts: selectedMembers.map(m => m.id || m._id) } 
                  })}
                  className="text-xs font-medium px-2.5 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: theme.colors.primary[100],
                    color: theme.colors.primary[700]
                  }}
                >
                  From Guests
                </button>
              </div>
            </div>

            {selectedMembers.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-xl" style={{ borderColor: theme.semantic.border.light }}>
                <Icon name="users" size="md" className="mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium" style={{ color: theme.semantic.text.secondary }}>
                  No members added yet. Click &quot;Add&quot; or select from guests.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedMembers.map((contact) => {
                  const contactKey = contact.id || contact._id || contact.name;
                  return (
                    <div key={contactKey} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: theme.semantic.background.secondary || `${theme.semantic.border.light}30` }}>
                      <div className="flex items-center space-x-3">
                        <img
                          src={contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=random`}
                          alt={contact.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-sm" style={{ color: theme.semantic.text.primary }}>
                            {contact.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs" style={{ color: theme.semantic.text.secondary }}>
                            <span>{contact.relation || 'Family'}</span>
                            {contact.phone && <span>• {contact.phone}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleRemoveContact(contactKey)}
                        className="p-1.5 rounded-full hover:bg-red-100 text-red-500 transition-colors"
                        title="Remove member"
                      >
                        <Icon name="close" size="xs" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Add Member Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4" style={{ backgroundColor: theme.semantic.card.background }}>
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-base" style={{ color: theme.semantic.text.primary }}>Add Family Member</h4>
                <button onClick={() => setShowAddModal(false)} className="p-1">
                  <Icon name="close" size="sm" style={{ color: theme.semantic.text.secondary }} />
                </button>
              </div>
              <form onSubmit={handleAddMember} className="space-y-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: theme.semantic.text.secondary }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newMember.name}
                    onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none"
                    style={{ borderColor: theme.semantic.card.border, color: theme.semantic.text.primary, backgroundColor: theme.semantic.background.primary }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: theme.semantic.text.secondary }}>Phone Number</label>
                  <input
                    type="tel"
                    value={newMember.phone}
                    onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none"
                    style={{ borderColor: theme.semantic.card.border, color: theme.semantic.text.primary, backgroundColor: theme.semantic.background.primary }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: theme.semantic.text.secondary }}>Email (Optional)</label>
                  <input
                    type="email"
                    value={newMember.email}
                    onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                    placeholder="e.g. rahul@example.com"
                    className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none"
                    style={{ borderColor: theme.semantic.card.border, color: theme.semantic.text.primary, backgroundColor: theme.semantic.background.primary }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: theme.semantic.text.secondary }}>Relation</label>
                    <select
                      value={newMember.relation}
                      onChange={e => setNewMember({ ...newMember, relation: e.target.value })}
                      className="w-full px-2 py-2 text-xs rounded-lg border focus:outline-none"
                      style={{ borderColor: theme.semantic.card.border, color: theme.semantic.text.primary, backgroundColor: theme.semantic.background.primary }}
                    >
                      <option value="Family">Family</option>
                      <option value="Parents">Parents</option>
                      <option value="Siblings">Siblings</option>
                      <option value="Bride">Bride</option>
                      <option value="Groom">Groom</option>
                      <option value="Friend">Friend</option>
                      <option value="Relative">Relative</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: theme.semantic.text.secondary }}>Role</label>
                    <select
                      value={newMember.role}
                      onChange={e => setNewMember({ ...newMember, role: e.target.value })}
                      className="w-full px-2 py-2 text-xs rounded-lg border focus:outline-none"
                      style={{ borderColor: theme.semantic.card.border, color: theme.semantic.text.primary, backgroundColor: theme.semantic.background.primary }}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3 py-1.5 text-xs rounded-lg border"
                    style={{ borderColor: theme.semantic.border.light, color: theme.semantic.text.secondary }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs rounded-lg text-white font-medium"
                    style={{ backgroundColor: theme.colors.primary[500] }}
                  >
                    Add Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Group Features Preview */}
        <Card>
          <div className="p-4">
            <h3 className="font-semibold mb-3" style={{ color: theme.semantic.text.primary }}>
              Group Features
            </h3>
            <div className="space-y-3">
              {[
                { icon: 'chat', title: 'Group Chat', desc: 'Real-time messaging with all members' },
                { icon: 'calendar', title: 'Event Planning', desc: 'Share wedding events and reminders' },
                { icon: 'image', title: 'Photo Sharing', desc: 'Share wedding photos and memories' },
                { icon: 'bell', title: 'Notifications', desc: 'Stay updated with group activities' }
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: theme.colors.primary[100] }}
                  >
                    <Icon name={feature.icon} size="xs" style={{ color: theme.colors.primary[600] }} />
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: theme.semantic.text.primary }}>
                      {feature.title}
                    </p>
                    <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Create Group Button */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-4 border-t backdrop-blur-sm z-50"
        style={{ 
          backgroundColor: `${theme.semantic.background.primary}F0`,
          borderTopColor: theme.semantic.border.light,
          boxShadow: `0 -4px 20px ${theme.semantic.card.shadow}`
        }}
      >
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || isCreating}
            className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: (!groupName.trim() || isCreating) 
                ? theme.semantic.text.tertiary 
                : theme.colors.primary[500],
              color: 'white',
              boxShadow: (!groupName.trim() || isCreating) 
                ? 'none' 
                : `0 4px 20px ${theme.colors.primary[500]}40`,
              minHeight: '56px'
            }}
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Creating Group...</span>
              </>
            ) : (
              <>
                <Icon name="sparkles" size="sm" />
                <span>Create Wedding Group</span>
                <Icon name="chevronRight" size="sm" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup;