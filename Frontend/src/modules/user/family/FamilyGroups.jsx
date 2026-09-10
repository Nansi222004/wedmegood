import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { familyGroups, familyContacts } from '../../../data/contacts';

const FamilyGroups = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);

  // Check if current user is admin of a group
  const isCurrentUserAdmin = (group) => {
    const currentUserId = 1; // Current user ID
    return group.createdBy === currentUserId;
  };

  useEffect(() => {
    // Load groups from localStorage and merge with default groups
    const savedGroups = JSON.parse(localStorage.getItem('familyGroups') || '[]');
    const allGroups = [...familyGroups, ...savedGroups];
    setGroups(allGroups);
  }, []);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGroupClick = (group) => {
    navigate(`/user/family/group/${group.id}`, { state: { group } });
  };

  const handleCreateNewGroup = () => {
    navigate('/user/family/contacts');
  };

  const handleDeleteGroup = (groupId) => {
    const updatedGroups = groups.filter(g => g.id !== groupId);
    setGroups(updatedGroups);
    
    // Update localStorage
    const savedGroups = JSON.parse(localStorage.getItem('familyGroups') || '[]');
    const updatedSavedGroups = savedGroups.filter(g => g.id !== groupId);
    localStorage.setItem('familyGroups', JSON.stringify(updatedSavedGroups));
    
    setShowDeleteConfirm(false);
    setGroupToDelete(null);
  };

  const confirmDeleteGroup = (group) => {
    setGroupToDelete(group);
    setShowDeleteConfirm(true);
  };

  const getMemberNames = (memberIds) => {
    return memberIds
      .map(id => familyContacts.find(c => c.id === id)?.name.split(' ')[0])
      .filter(Boolean)
      .slice(0, 3)
      .join(', ');
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
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-1">
                      <Icon name="users" size="xs" style={{ color: theme.semantic.text.secondary }} />
                      <span className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                        {group.members.length} members
                      </span>
                      {isCurrentUserAdmin(group) && (
                        <div 
                          className="px-2 py-1 rounded-full text-xs font-medium ml-2"
                          style={{
                            backgroundColor: theme.colors.accent[100],
                            color: theme.colors.accent[700]
                          }}
                        >
                          Admin
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <span className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                        {getMemberNames(group.members)}
                      </span>
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
    </div>
  );
};

export default FamilyGroups;