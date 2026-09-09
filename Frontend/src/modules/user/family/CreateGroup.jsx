import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { familyContacts } from '../../../data/contacts';

const CreateGroup = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [groupAvatar, setGroupAvatar] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Get selected contacts from navigation state
  useEffect(() => {
    if (location.state?.selectedContacts) {
      setSelectedContacts(location.state.selectedContacts);
      
      // Auto-generate group name based on selected contacts
      const contactNames = location.state.selectedContacts
        .map(id => familyContacts.find(c => c.id === id)?.name.split(' ')[0])
        .filter(Boolean)
        .slice(0, 3);
      
      if (contactNames.length > 0) {
        setGroupName(`${contactNames.join(', ')} Wedding Group`);
      }
    } else {
      // Redirect back if no contacts selected
      navigate('/user/family/contacts');
    }
  }, [location.state, navigate]);

  const selectedContactsData = selectedContacts
    .map(id => familyContacts.find(contact => contact.id === id))
    .filter(Boolean);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    if (selectedContacts.length < 2) {
      alert('Please select at least 2 contacts');
      return;
    }

    setIsCreating(true);

    // Simulate group creation
    setTimeout(() => {
      const newGroup = {
        id: Date.now(),
        name: groupName.trim(),
        description: groupDescription.trim(),
        avatar: groupAvatar || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=150&h=150&fit=crop',
        members: selectedContacts,
        createdBy: 1, // Current user
        createdAt: new Date().toISOString(),
        lastMessage: {
          text: `${groupName} group created!`,
          sender: 'System',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        unreadCount: 0,
        isActive: true
      };

      // Store group in localStorage (in real app, this would be API call)
      const existingGroups = JSON.parse(localStorage.getItem('familyGroups') || '[]');
      existingGroups.push(newGroup);
      localStorage.setItem('familyGroups', JSON.stringify(existingGroups));

      setIsCreating(false);
      
      // Navigate to the created group chat
      navigate(`/user/family/group/${newGroup.id}`, { 
        state: { group: newGroup, isNewGroup: true }
      });
    }, 2000);
  };

  const handleRemoveContact = (contactId) => {
    setSelectedContacts(prev => prev.filter(id => id !== contactId));
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
              <h3 className="font-semibold" style={{ color: theme.semantic.text.primary }}>
                Group Members ({selectedContactsData.length})
              </h3>
              <button
                onClick={() => navigate('/user/family/contacts', { 
                  state: { selectedContacts } 
                })}
                className="text-sm font-medium px-3 py-1 rounded-lg"
                style={{
                  backgroundColor: theme.colors.primary[100],
                  color: theme.colors.primary[700]
                }}
              >
                Edit
              </button>
            </div>
            
            <div className="space-y-3">
              {selectedContactsData.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-sm" style={{ color: theme.semantic.text.primary }}>
                        {contact.name}
                      </p>
                      <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                        {contact.relation}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRemoveContact(contact.id)}
                    className="p-1 rounded-full hover:bg-red-100 transition-colors"
                  >
                    <Icon name="close" size="xs" style={{ color: theme.semantic.text.secondary }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>

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
            disabled={!groupName.trim() || selectedContacts.length < 2 || isCreating}
            className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: (!groupName.trim() || selectedContacts.length < 2 || isCreating) 
                ? theme.semantic.text.tertiary 
                : theme.colors.primary[500],
              color: 'white',
              boxShadow: (!groupName.trim() || selectedContacts.length < 2 || isCreating) 
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