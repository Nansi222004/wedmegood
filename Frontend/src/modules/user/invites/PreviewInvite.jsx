import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { useToast } from '../../../components/ui/Toast';

const PreviewInvite = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast, ToastComponent } = useToast();
  const [showShareModal, setShowShareModal] = useState(false);

  // Mock data - in real app, fetch from API
  const inviteData = {
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
    enableRSVP: true,
    enableMap: true,
    views: 234,
    rsvps: 156,
    shareUrl: 'https://utsavo.com/invite/priya-rahul-2026'
  };

  const stats = [
    { label: 'Total Views', value: inviteData.views, icon: 'eye', color: theme.colors.primary[500] },
    { label: 'RSVPs Received', value: inviteData.rsvps, icon: 'users', color: theme.colors.accent[500] },
    { label: 'Pending', value: inviteData.views - inviteData.rsvps, icon: 'clock', color: theme.colors.secondary[500] },
    { label: 'Acceptance Rate', value: `${Math.round((inviteData.rsvps / inviteData.views) * 100)}%`, icon: 'chart', color: theme.colors.primary[500] }
  ];

  const shareOptions = [
    { id: 'whatsapp', name: 'WhatsApp', icon: 'share', color: '#25D366' },
    { id: 'email', name: 'Email', icon: 'mail', color: '#EA4335' },
    { id: 'sms', name: 'SMS', icon: 'message', color: '#0088CC' },
    { id: 'copy', name: 'Copy Link', icon: 'link', color: theme.colors.primary[500] }
  ];

  const handleShare = (platform) => {
    const url = inviteData.shareUrl;
    const text = `You're invited to ${inviteData.brideName} & ${inviteData.groomName}'s wedding!`;
    
    switch(platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`;
        break;
      case 'sms':
        window.location.href = `sms:?body=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard!', 'success', 2000);
        setShowShareModal(false);
        break;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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
                Preview Invitation
              </h1>
              <p 
                className="text-sm"
                style={{ color: theme.semantic.text.secondary }}
              >
                {inviteData.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/user/e-invites/edit/${id}`)}
              className="hidden sm:flex items-center gap-2"
            >
              <Icon name="edit" size="sm" />
              Edit
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2"
            >
              <Icon name="share" size="sm" />
              Share
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Icon name={stat.icon} size="md" style={{ color: stat.color }} />
                </div>
                <div>
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    {stat.value}
                  </div>
                  <div 
                    className="text-xs"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    {stat.label}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invitation Preview */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              {/* Invitation Card */}
              <div 
                className="relative p-8 md:p-12"
                style={{ 
                  backgroundColor: inviteData.backgroundColor,
                  minHeight: '600px'
                }}
              >
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-32 h-32 opacity-10">
                  <div 
                    className="w-full h-full rounded-full"
                    style={{ backgroundColor: inviteData.accentColor }}
                  />
                </div>
                <div className="absolute bottom-0 right-0 w-40 h-40 opacity-10">
                  <div 
                    className="w-full h-full rounded-full"
                    style={{ backgroundColor: inviteData.accentColor }}
                  />
                </div>

                {/* Content */}
                <div className="relative z-10 text-center max-w-2xl mx-auto">
                  {/* Header */}
                  <div className="mb-8">
                    <div 
                      className="text-sm font-medium mb-2 tracking-widest uppercase"
                      style={{ color: inviteData.accentColor }}
                    >
                      You're Invited
                    </div>
                    <div 
                      className="w-16 h-1 mx-auto mb-6"
                      style={{ backgroundColor: inviteData.accentColor }}
                    />
                  </div>

                  {/* Names */}
                  <div className="mb-8">
                    <h1 
                      className="text-4xl md:text-5xl font-bold mb-2"
                      style={{ color: inviteData.textColor }}
                    >
                      {inviteData.brideName}
                    </h1>
                    <div 
                      className="text-3xl md:text-4xl font-light mb-2"
                      style={{ color: inviteData.accentColor }}
                    >
                      &
                    </div>
                    <h1 
                      className="text-4xl md:text-5xl font-bold"
                      style={{ color: inviteData.textColor }}
                    >
                      {inviteData.groomName}
                    </h1>
                  </div>

                  {/* Message */}
                  <p 
                    className="text-lg md:text-xl mb-8 leading-relaxed"
                    style={{ color: inviteData.textColor, opacity: 0.9 }}
                  >
                    {inviteData.message}
                  </p>

                  {/* Date & Time */}
                  <div className="mb-8">
                    <div 
                      className="text-2xl md:text-3xl font-semibold mb-2"
                      style={{ color: inviteData.accentColor }}
                    >
                      {formatDate(inviteData.weddingDate)}
                    </div>
                    <div 
                      className="text-xl"
                      style={{ color: inviteData.textColor, opacity: 0.8 }}
                    >
                      {formatTime(inviteData.weddingTime)}
                    </div>
                  </div>

                  {/* Venue */}
                  <div className="mb-8">
                    <div 
                      className="flex items-center justify-center gap-2 mb-2"
                      style={{ color: inviteData.accentColor }}
                    >
                      <Icon name="location" size="md" />
                      <span className="text-sm font-medium uppercase tracking-wide">Venue</span>
                    </div>
                    <div 
                      className="text-xl font-semibold mb-1"
                      style={{ color: inviteData.textColor }}
                    >
                      {inviteData.venue}
                    </div>
                    <div 
                      className="text-sm"
                      style={{ color: inviteData.textColor, opacity: 0.8 }}
                    >
                      {inviteData.venueAddress}
                    </div>
                  </div>

                  {/* Dress Code */}
                  {inviteData.dresscode && (
                    <div className="mb-8">
                      <div 
                        className="inline-block px-6 py-2 rounded-full border-2"
                        style={{ 
                          borderColor: inviteData.accentColor,
                          color: inviteData.textColor
                        }}
                      >
                        <span className="text-sm font-medium">Dress Code: {inviteData.dresscode}</span>
                      </div>
                    </div>
                  )}

                  {/* RSVP Button */}
                  {inviteData.enableRSVP && (
                    <div className="mb-6">
                      <button
                        onClick={() => showToast('RSVP feature coming soon!', 'info', 2000)}
                        className="px-8 py-3 rounded-full font-semibold text-lg transition-transform hover:scale-105"
                        style={{
                          backgroundColor: inviteData.accentColor,
                          color: inviteData.backgroundColor
                        }}
                      >
                        RSVP Now
                      </button>
                      <p 
                        className="text-sm mt-2"
                        style={{ color: inviteData.textColor, opacity: 0.7 }}
                      >
                        Please respond by {formatDate(inviteData.rsvpDeadline)}
                      </p>
                    </div>
                  )}

                  {/* Contact */}
                  <div 
                    className="text-sm"
                    style={{ color: inviteData.textColor, opacity: 0.7 }}
                  >
                    <p>For any queries, please contact:</p>
                    <p className="font-medium">{inviteData.contactPerson} - {inviteData.contactPhone}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Quick Actions */}
            <Card className="p-4">
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
                  onClick={() => navigate(`/user/e-invites/edit/${id}`)}
                >
                  <Icon name="edit" size="sm" />
                  Edit Invitation
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setShowShareModal(true)}
                >
                  <Icon name="share" size="sm" />
                  Share Invitation
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => showToast('Download feature coming soon!', 'info', 2000)}
                >
                  <Icon name="download" size="sm" />
                  Download as Image
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => showToast('Analytics feature coming soon!', 'info', 2000)}
                >
                  <Icon name="chart" size="sm" />
                  View Analytics
                </Button>
              </div>
            </Card>

            {/* Share Link */}
            <Card className="p-4">
              <h3 
                className="font-semibold mb-3"
                style={{ color: theme.semantic.text.primary }}
              >
                Share Link
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inviteData.shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 rounded-lg border text-sm"
                  style={{
                    backgroundColor: theme.semantic.background.accent,
                    borderColor: theme.semantic.border.light,
                    color: theme.semantic.text.primary
                  }}
                />
                <button
                  onClick={() => handleShare('copy')}
                  className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-black transition-colors"
                  style={{ color: theme.colors.primary[500] }}
                >
                  <Icon name="copy" size="md" />
                </button>
              </div>
            </Card>

            {/* Status */}
            <Card className="p-4">
              <h3 
                className="font-semibold mb-3"
                style={{ color: theme.semantic.text.primary }}
              >
                Invitation Status
              </h3>
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  backgroundColor: inviteData.status === 'Published' 
                    ? theme.colors.accent[50] 
                    : theme.colors.secondary[50]
                }}
              >
                <Icon 
                  name={inviteData.status === 'Published' ? 'check' : 'clock'} 
                  size="sm" 
                  style={{ 
                    color: inviteData.status === 'Published' 
                      ? theme.colors.accent[600] 
                      : theme.colors.secondary[600]
                  }} 
                />
                <span 
                  className="font-medium text-sm"
                  style={{ 
                    color: inviteData.status === 'Published' 
                      ? theme.colors.accent[600] 
                      : theme.colors.secondary[600]
                  }}
                >
                  {inviteData.status}
                </span>
              </div>
              {inviteData.status === 'Published' && (
                <p 
                  className="text-xs mt-2"
                  style={{ color: theme.semantic.text.secondary }}
                >
                  Your invitation is live and can be shared with guests
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowShareModal(false)}
        >
          <Card 
            className="max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 
                className="text-lg font-semibold"
                style={{ color: theme.semantic.text.primary }}
              >
                Share Invitation
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-lg hover:bg-opacity-10 hover:bg-black transition-colors"
              >
                <Icon name="close" size="md" style={{ color: theme.semantic.text.secondary }} />
              </button>
            </div>
            <p 
              className="text-sm mb-4"
              style={{ color: theme.semantic.text.secondary }}
            >
              Choose how you want to share your invitation
            </p>
            <div className="grid grid-cols-2 gap-3">
              {shareOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleShare(option.id)}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:shadow-md transition-all"
                  style={{ borderColor: theme.semantic.border.light }}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${option.color}20` }}
                  >
                    <Icon name={option.icon} size="md" style={{ color: option.color }} />
                  </div>
                  <span 
                    className="text-sm font-medium"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    {option.name}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      <ToastComponent />
    </div>
  );
};

export default PreviewInvite;
