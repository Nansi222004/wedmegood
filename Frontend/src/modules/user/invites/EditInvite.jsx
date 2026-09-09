import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { useToast } from '../../../components/ui/Toast';

const EditInvite = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast, ToastComponent } = useToast();

  // Mock data - in real app, fetch from API
  const [inviteData, setInviteData] = useState({
    id: 1,
    name: 'Priya & Rahul Wedding',
    template: 'Royal Elegance',
    status: 'Published',
    brideName: 'Priya Sharma',
    groomName: 'Rahul Verma',
    weddingDate: '2026-03-15',
    weddingTime: '18:00',
    venue: 'Royal Palace Banquets, Indore',
    venueAddress: 'AB Road, Indore, Madhya Pradesh - 452001',
    message: 'We joyfully invite you to celebrate our wedding ceremony. Your presence will make our day more special.',
    rsvpDeadline: '2026-03-01',
    contactPerson: 'Mr. Sharma',
    contactPhone: '+91 98765 43210',
    dresscode: 'Traditional Indian Attire',
    backgroundColor: '#8B4513',
    textColor: '#FFFFFF',
    accentColor: '#FFD700',
    musicUrl: '',
    enableRSVP: true,
    enableMap: true,
    enableGallery: false
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [isSaving, setIsSaving] = useState(false);

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: 'edit' },
    { id: 'venue', name: 'Venue Details', icon: 'location' },
    { id: 'design', name: 'Design', icon: 'palette' },
    { id: 'features', name: 'Features', icon: 'settings' }
  ];

  const handleInputChange = (field, value) => {
    setInviteData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async (publish = false) => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newStatus = publish ? 'Published' : 'Draft';
    setInviteData(prev => ({ ...prev, status: newStatus }));
    
    setIsSaving(false);
    showToast(
      publish ? 'Invitation published successfully!' : 'Changes saved as draft',
      'success',
      3000
    );
  };

  const handlePreview = () => {
    navigate(`/user/e-invites/preview/${id}`);
  };

  return (
    <div 
      className="min-h-screen pb-20"
      style={{ backgroundColor: theme.semantic.background.primary }}
    >
      {/* Header */}
      <div 
        className="sticky top-0 z-10 px-4 py-4 border-b"
        style={{
          backgroundColor: theme.semantic.background.primary,
          borderColor: theme.semantic.border.light
        }}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/user/e-invites')}
              className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-black transition-colors"
            >
              <Icon name="chevronLeft" size="md" style={{ color: theme.semantic.text.primary }} />
            </button>
            <div>
              <h1 
                className="text-xl font-bold"
                style={{ color: theme.semantic.text.primary }}
              >
                Edit Invitation
              </h1>
              <p 
                className="text-sm"
                style={{ color: theme.semantic.text.secondary }}
              >
                {inviteData.name} • {inviteData.template}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold"
              style={{
                backgroundColor: inviteData.status === 'Published' 
                  ? theme.colors.accent[50] 
                  : theme.colors.secondary[50],
                color: inviteData.status === 'Published' 
                  ? theme.colors.accent[600] 
                  : theme.colors.secondary[600]
              }}
            >
              <Icon name={inviteData.status === 'Published' ? 'check' : 'clock'} size="sm" />
              {inviteData.status}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              className="hidden sm:flex items-center gap-2"
            >
              <Icon name="eye" size="sm" />
              Preview
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Icon name="check" size="sm" />
                  <span className="hidden sm:inline">Publish</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Tabs */}
          <div className="lg:col-span-1">
            <Card className="p-2">
              <div className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left"
                    style={{
                      backgroundColor: activeTab === tab.id 
                        ? theme.colors.primary[50] 
                        : 'transparent',
                      color: activeTab === tab.id 
                        ? theme.colors.primary[600] 
                        : theme.semantic.text.primary
                    }}
                  >
                    <Icon 
                      name={tab.icon} 
                      size="md" 
                      style={{ 
                        color: activeTab === tab.id 
                          ? theme.colors.primary[600] 
                          : theme.semantic.text.secondary 
                      }} 
                    />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-4 mt-4">
              <h3 
                className="font-semibold mb-3"
                style={{ color: theme.semantic.text.primary }}
              >
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleSave(false)}
                >
                  <Icon name="save" size="sm" />
                  Save as Draft
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handlePreview}
                >
                  <Icon name="eye" size="sm" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => showToast('Share feature coming soon!', 'info', 2000)}
                >
                  <Icon name="share" size="sm" />
                  Share
                </Button>
              </div>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div>
                    <h2 
                      className="text-lg font-semibold mb-4"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      Basic Information
                    </h2>
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      Invitation Title
                    </label>
                    <input
                      type="text"
                      value={inviteData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{
                        backgroundColor: theme.semantic.background.accent,
                        borderColor: theme.semantic.border.light,
                        color: theme.semantic.text.primary
                      }}
                      placeholder="e.g., Priya & Rahul Wedding"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label 
                        className="block text-sm font-medium mb-2"
                        style={{ color: theme.semantic.text.primary }}
                      >
                        Bride's Name
                      </label>
                      <input
                        type="text"
                        value={inviteData.brideName}
                        onChange={(e) => handleInputChange('brideName', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border"
                        style={{
                          backgroundColor: theme.semantic.background.accent,
                          borderColor: theme.semantic.border.light,
                          color: theme.semantic.text.primary
                        }}
                      />
                    </div>

                    <div>
                      <label 
                        className="block text-sm font-medium mb-2"
                        style={{ color: theme.semantic.text.primary }}
                      >
                        Groom's Name
                      </label>
                      <input
                        type="text"
                        value={inviteData.groomName}
                        onChange={(e) => handleInputChange('groomName', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border"
                        style={{
                          backgroundColor: theme.semantic.background.accent,
                          borderColor: theme.semantic.border.light,
                          color: theme.semantic.text.primary
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label 
                        className="block text-sm font-medium mb-2"
                        style={{ color: theme.semantic.text.primary }}
                      >
                        Wedding Date
                      </label>
                      <input
                        type="date"
                        value={inviteData.weddingDate}
                        onChange={(e) => handleInputChange('weddingDate', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border"
                        style={{
                          backgroundColor: theme.semantic.background.accent,
                          borderColor: theme.semantic.border.light,
                          color: theme.semantic.text.primary
                        }}
                      />
                    </div>

                    <div>
                      <label 
                        className="block text-sm font-medium mb-2"
                        style={{ color: theme.semantic.text.primary }}
                      >
                        Wedding Time
                      </label>
                      <input
                        type="time"
                        value={inviteData.weddingTime}
                        onChange={(e) => handleInputChange('weddingTime', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border"
                        style={{
                          backgroundColor: theme.semantic.background.accent,
                          borderColor: theme.semantic.border.light,
                          color: theme.semantic.text.primary
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      Personal Message
                    </label>
                    <textarea
                      value={inviteData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{
                        backgroundColor: theme.semantic.background.accent,
                        borderColor: theme.semantic.border.light,
                        color: theme.semantic.text.primary
                      }}
                      placeholder="Write a personal message for your guests..."
                    />
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      Dress Code
                    </label>
                    <input
                      type="text"
                      value={inviteData.dresscode}
                      onChange={(e) => handleInputChange('dresscode', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{
                        backgroundColor: theme.semantic.background.accent,
                        borderColor: theme.semantic.border.light,
                        color: theme.semantic.text.primary
                      }}
                      placeholder="e.g., Traditional Indian Attire"
                    />
                  </div>
                </div>
              )}

              {/* Venue Tab */}
              {activeTab === 'venue' && (
                <div className="space-y-6">
                  <div>
                    <h2 
                      className="text-lg font-semibold mb-4"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      Venue Details
                    </h2>
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      Venue Name
                    </label>
                    <input
                      type="text"
                      value={inviteData.venue}
                      onChange={(e) => handleInputChange('venue', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{
                        backgroundColor: theme.semantic.background.accent,
                        borderColor: theme.semantic.border.light,
                        color: theme.semantic.text.primary
                      }}
                    />
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      Full Address
                    </label>
                    <textarea
                      value={inviteData.venueAddress}
                      onChange={(e) => handleInputChange('venueAddress', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{
                        backgroundColor: theme.semantic.background.accent,
                        borderColor: theme.semantic.border.light,
                        color: theme.semantic.text.primary
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label 
                        className="block text-sm font-medium mb-2"
                        style={{ color: theme.semantic.text.primary }}
                      >
                        Contact Person
                      </label>
                      <input
                        type="text"
                        value={inviteData.contactPerson}
                        onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border"
                        style={{
                          backgroundColor: theme.semantic.background.accent,
                          borderColor: theme.semantic.border.light,
                          color: theme.semantic.text.primary
                        }}
                      />
                    </div>

                    <div>
                      <label 
                        className="block text-sm font-medium mb-2"
                        style={{ color: theme.semantic.text.primary }}
                      >
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={inviteData.contactPhone}
                        onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border"
                        style={{
                          backgroundColor: theme.semantic.background.accent,
                          borderColor: theme.semantic.border.light,
                          color: theme.semantic.text.primary
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      RSVP Deadline
                    </label>
                    <input
                      type="date"
                      value={inviteData.rsvpDeadline}
                      onChange={(e) => handleInputChange('rsvpDeadline', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{
                        backgroundColor: theme.semantic.background.accent,
                        borderColor: theme.semantic.border.light,
                        color: theme.semantic.text.primary
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Design Tab */}
              {activeTab === 'design' && (
                <div className="space-y-6">
                  <div>
                    <h2 
                      className="text-lg font-semibold mb-4"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      Design & Colors
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label 
                        className="block text-sm font-medium mb-2"
                        style={{ color: theme.semantic.text.primary }}
                      >
                        Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={inviteData.backgroundColor}
                          onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                          className="w-12 h-12 rounded border cursor-pointer"
                          style={{ borderColor: theme.semantic.border.light }}
                        />
                        <input
                          type="text"
                          value={inviteData.backgroundColor}
                          onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border text-sm"
                          style={{
                            backgroundColor: theme.semantic.background.accent,
                            borderColor: theme.semantic.border.light,
                            color: theme.semantic.text.primary
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label 
                        className="block text-sm font-medium mb-2"
                        style={{ color: theme.semantic.text.primary }}
                      >
                        Text Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={inviteData.textColor}
                          onChange={(e) => handleInputChange('textColor', e.target.value)}
                          className="w-12 h-12 rounded border cursor-pointer"
                          style={{ borderColor: theme.semantic.border.light }}
                        />
                        <input
                          type="text"
                          value={inviteData.textColor}
                          onChange={(e) => handleInputChange('textColor', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border text-sm"
                          style={{
                            backgroundColor: theme.semantic.background.accent,
                            borderColor: theme.semantic.border.light,
                            color: theme.semantic.text.primary
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label 
                        className="block text-sm font-medium mb-2"
                        style={{ color: theme.semantic.text.primary }}
                      >
                        Accent Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={inviteData.accentColor}
                          onChange={(e) => handleInputChange('accentColor', e.target.value)}
                          className="w-12 h-12 rounded border cursor-pointer"
                          style={{ borderColor: theme.semantic.border.light }}
                        />
                        <input
                          type="text"
                          value={inviteData.accentColor}
                          onChange={(e) => handleInputChange('accentColor', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border text-sm"
                          style={{
                            backgroundColor: theme.semantic.background.accent,
                            borderColor: theme.semantic.border.light,
                            color: theme.semantic.text.primary
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      Preview
                    </label>
                    <div 
                      className="w-full h-64 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: inviteData.backgroundColor }}
                    >
                      <div className="text-center p-8">
                        <h3 
                          className="text-3xl font-bold mb-2"
                          style={{ color: inviteData.textColor }}
                        >
                          {inviteData.brideName} & {inviteData.groomName}
                        </h3>
                        <p 
                          className="text-xl"
                          style={{ color: inviteData.accentColor }}
                        >
                          {new Date(inviteData.weddingDate).toLocaleDateString('en-US', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Features Tab */}
              {activeTab === 'features' && (
                <div className="space-y-6">
                  <div>
                    <h2 
                      className="text-lg font-semibold mb-4"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      Features & Settings
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-opacity-5 hover:bg-black transition-colors"
                      style={{ borderColor: theme.semantic.border.light }}
                    >
                      <div className="flex items-center gap-3">
                        <Icon name="users" size="md" style={{ color: theme.colors.primary[500] }} />
                        <div>
                          <div 
                            className="font-medium"
                            style={{ color: theme.semantic.text.primary }}
                          >
                            Enable RSVP
                          </div>
                          <div 
                            className="text-sm"
                            style={{ color: theme.semantic.text.secondary }}
                          >
                            Allow guests to confirm attendance
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={inviteData.enableRSVP}
                        onChange={(e) => handleInputChange('enableRSVP', e.target.checked)}
                        className="w-5 h-5 accent-pink-600"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-opacity-5 hover:bg-black transition-colors"
                      style={{ borderColor: theme.semantic.border.light }}
                    >
                      <div className="flex items-center gap-3">
                        <Icon name="location" size="md" style={{ color: theme.colors.primary[500] }} />
                        <div>
                          <div 
                            className="font-medium"
                            style={{ color: theme.semantic.text.primary }}
                          >
                            Show Map
                          </div>
                          <div 
                            className="text-sm"
                            style={{ color: theme.semantic.text.secondary }}
                          >
                            Display venue location on map
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={inviteData.enableMap}
                        onChange={(e) => handleInputChange('enableMap', e.target.checked)}
                        className="w-5 h-5 accent-pink-600"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-opacity-5 hover:bg-black transition-colors"
                      style={{ borderColor: theme.semantic.border.light }}
                    >
                      <div className="flex items-center gap-3">
                        <Icon name="image" size="md" style={{ color: theme.colors.primary[500] }} />
                        <div>
                          <div 
                            className="font-medium"
                            style={{ color: theme.semantic.text.primary }}
                          >
                            Photo Gallery
                          </div>
                          <div 
                            className="text-sm"
                            style={{ color: theme.semantic.text.secondary }}
                          >
                            Add photo gallery to invitation
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={inviteData.enableGallery}
                        onChange={(e) => handleInputChange('enableGallery', e.target.checked)}
                        className="w-5 h-5 accent-pink-600"
                      />
                    </label>
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      Background Music URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={inviteData.musicUrl}
                      onChange={(e) => handleInputChange('musicUrl', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{
                        backgroundColor: theme.semantic.background.accent,
                        borderColor: theme.semantic.border.light,
                        color: theme.semantic.text.primary
                      }}
                      placeholder="https://example.com/music.mp3"
                    />
                    <p 
                      className="text-xs mt-1"
                      style={{ color: theme.semantic.text.secondary }}
                    >
                      Add a link to your favorite song
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <ToastComponent />
    </div>
  );
};

export default EditInvite;
