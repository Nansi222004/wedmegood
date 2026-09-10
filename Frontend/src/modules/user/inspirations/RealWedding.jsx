import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Toast from '../../../components/ui/Toast';

const RealWedding = () => {
  const { id } = useParams();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState('story');

  // Mock data for real weddings
  const weddingData = {
    1: {
      couple: 'Priya & Rahul',
      date: 'December 15, 2023',
      location: 'Jaipur, Rajasthan',
      venue: 'The Oberoi Rajvilas',
      coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop&q=80',
      story: 'Our love story began in college, where we were both pursuing engineering. What started as a friendship over late-night study sessions blossomed into a beautiful romance. After 5 years of dating, Rahul proposed during a trip to Paris, and we knew we wanted a traditional Indian wedding that celebrated our roots.',
      theme: 'Royal Rajasthani',
      guestCount: 500,
      budget: '₹50 Lakhs',
      highlights: [
        'Traditional Rajasthani welcome with folk dancers',
        'Vintage car entry for the groom',
        'Rooftop sangeet under the stars',
        'Heritage palace venue with royal decor'
      ],
      gallery: [
        'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=600&h=400&fit=crop&q=80'
      ],
      vendors: [
        { type: 'Photographer', name: 'The Wedding Filmer', rating: 4.9, price: '₹1,20,000' },
        { type: 'Decorator', name: 'Devika Narain & Company', rating: 4.8, price: '₹8,50,000' },
        { type: 'Makeup Artist', name: 'Chandni Singh', rating: 4.9, price: '₹85,000' },
        { type: 'Caterer', name: 'Royal Caterers', rating: 4.7, price: '₹12,00,000' },
        { type: 'DJ', name: 'DJ Sumit', rating: 4.6, price: '₹1,50,000' }
      ],
      events: [
        { name: 'Mehndi', date: 'Dec 13', description: 'Colorful mehndi ceremony with traditional music' },
        { name: 'Sangeet', date: 'Dec 14', description: 'Grand sangeet night with dance performances' },
        { name: 'Haldi', date: 'Dec 15 Morning', description: 'Traditional haldi ceremony' },
        { name: 'Wedding', date: 'Dec 15 Evening', description: 'Royal wedding ceremony at sunset' },
        { name: 'Reception', date: 'Dec 15 Night', description: 'Grand reception with 500 guests' }
      ]
    },
    2: {
      couple: 'Ananya & Vikram',
      date: 'November 20, 2023',
      location: 'Goa',
      venue: 'Beach Resort',
      coverImage: 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=800&h=600&fit=crop&q=80',
      story: 'We met through mutual friends at a beach party in Goa. The connection was instant, and we spent the entire night talking about our dreams and passions. A beach wedding was always our dream.',
      theme: 'Beach Boho',
      guestCount: 150,
      budget: '₹25 Lakhs'
    }
  };

  const wedding = weddingData[id] || weddingData[1];

  const handleSave = () => {
    setIsSaved(!isSaved);
    setToastMessage(isSaved ? 'Removed from saved' : 'Saved to your collection');
    setShowToast(true);
  };

  const handleShare = () => {
    setToastMessage('Link copied to clipboard');
    setShowToast(true);
  };

  const tabs = [
    { id: 'story', name: 'Story', icon: 'book' },
    { id: 'gallery', name: 'Gallery', icon: 'camera' },
    { id: 'vendors', name: 'Vendors', icon: 'users' },
    { id: 'details', name: 'Details', icon: 'info' }
  ];

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-40 px-4 py-4 border-b backdrop-blur-md bg-opacity-90"
        style={{ 
          backgroundColor: theme.semantic.background.primary,
          borderBottomColor: theme.semantic.border.light
        }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full transition-colors"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-full transition-colors"
              style={{ backgroundColor: theme.semantic.background.accent }}
            >
              <Icon name="share" size="sm" style={{ color: theme.semantic.text.primary }} />
            </button>
            <button
              onClick={handleSave}
              className="p-2 rounded-full transition-colors"
              style={{ 
                backgroundColor: isSaved ? theme.colors.primary[500] : theme.semantic.background.accent 
              }}
            >
              <Icon name="heart" size="sm" style={{ color: isSaved ? 'white' : theme.semantic.text.primary }} />
            </button>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      <div className="relative">
        <img
          src={wedding.coverImage}
          alt={wedding.couple}
          className="w-full h-[50vh] object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            {wedding.couple}
          </h1>
          <div className="flex items-center gap-4 text-white/90 text-sm">
            <span className="flex items-center gap-1">
              <Icon name="calendar" size="xs" />
              {wedding.date}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="location" size="xs" />
              {wedding.location}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div 
        className="sticky top-[72px] z-30 px-4 py-3 border-b"
        style={{ 
          backgroundColor: theme.semantic.background.primary,
          borderBottomColor: theme.semantic.border.light
        }}
      >
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: activeTab === tab.id 
                  ? theme.colors.primary[500] 
                  : theme.semantic.background.accent,
                color: activeTab === tab.id 
                  ? 'white' 
                  : theme.semantic.text.primary
              }}
            >
              <Icon name={tab.icon} size="xs" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Story Tab */}
        {activeTab === 'story' && (
          <div className="space-y-6">
            <div>
              <h2 
                className="text-xl font-bold mb-3"
                style={{ color: theme.semantic.text.primary }}
              >
                Our Love Story
              </h2>
              <p 
                className="text-sm leading-relaxed"
                style={{ color: theme.semantic.text.secondary }}
              >
                {wedding.story}
              </p>
            </div>

            {wedding.highlights && (
              <div>
                <h2 
                  className="text-xl font-bold mb-3"
                  style={{ color: theme.semantic.text.primary }}
                >
                  Wedding Highlights
                </h2>
                <div className="space-y-2">
                  {wedding.highlights.map((highlight, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ backgroundColor: theme.semantic.background.accent }}
                    >
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: theme.colors.primary[500] }}
                      >
                        <Icon name="star" size="xs" style={{ color: 'white' }} />
                      </div>
                      <p 
                        className="text-sm"
                        style={{ color: theme.semantic.text.primary }}
                      >
                        {highlight}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {wedding.events && (
              <div>
                <h2 
                  className="text-xl font-bold mb-3"
                  style={{ color: theme.semantic.text.primary }}
                >
                  Wedding Events
                </h2>
                <div className="space-y-3">
                  {wedding.events.map((event, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-xl"
                      style={{ backgroundColor: theme.semantic.background.accent }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 
                          className="font-semibold"
                          style={{ color: theme.semantic.text.primary }}
                        >
                          {event.name}
                        </h3>
                        <span 
                          className="text-xs px-2 py-1 rounded-full"
                          style={{ 
                            backgroundColor: theme.colors.primary[100],
                            color: theme.colors.primary[700]
                          }}
                        >
                          {event.date}
                        </span>
                      </div>
                      <p 
                        className="text-sm"
                        style={{ color: theme.semantic.text.secondary }}
                      >
                        {event.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && wedding.gallery && (
          <div className="grid grid-cols-2 gap-3">
            {wedding.gallery.map((image, index) => (
              <div
                key={index}
                className="relative rounded-xl overflow-hidden cursor-pointer group"
              >
                <img
                  src={image}
                  alt={`Wedding photo ${index + 1}`}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
            ))}
          </div>
        )}

        {/* Vendors Tab */}
        {activeTab === 'vendors' && wedding.vendors && (
          <div className="space-y-3">
            <h2 
              className="text-xl font-bold mb-4"
              style={{ color: theme.semantic.text.primary }}
            >
              Our Vendors
            </h2>
            {wedding.vendors.map((vendor, index) => (
              <div
                key={index}
                className="p-4 rounded-xl"
                style={{ backgroundColor: theme.semantic.background.accent }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p 
                      className="text-xs mb-1"
                      style={{ color: theme.semantic.text.secondary }}
                    >
                      {vendor.type}
                    </p>
                    <h3 
                      className="font-semibold"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      {vendor.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="star" size="xs" style={{ color: '#FFA500' }} />
                    <span 
                      className="text-sm font-semibold"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      {vendor.rating}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p 
                    className="text-sm font-bold"
                    style={{ color: theme.colors.primary[500] }}
                  >
                    {vendor.price}
                  </p>
                  <button
                    onClick={() => navigate('/user/vendors')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ 
                      backgroundColor: theme.colors.primary[500],
                      color: 'white'
                    }}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            <h2 
              className="text-xl font-bold mb-4"
              style={{ color: theme.semantic.text.primary }}
            >
              Wedding Details
            </h2>
            
            <div 
              className="p-4 rounded-xl space-y-3"
              style={{ backgroundColor: theme.semantic.background.accent }}
            >
              <div className="flex items-center justify-between py-2 border-b" style={{ borderBottomColor: theme.semantic.border.light }}>
                <span style={{ color: theme.semantic.text.secondary }}>Venue</span>
                <span className="font-semibold" style={{ color: theme.semantic.text.primary }}>{wedding.venue}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b" style={{ borderBottomColor: theme.semantic.border.light }}>
                <span style={{ color: theme.semantic.text.secondary }}>Theme</span>
                <span className="font-semibold" style={{ color: theme.semantic.text.primary }}>{wedding.theme}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b" style={{ borderBottomColor: theme.semantic.border.light }}>
                <span style={{ color: theme.semantic.text.secondary }}>Guest Count</span>
                <span className="font-semibold" style={{ color: theme.semantic.text.primary }}>{wedding.guestCount}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span style={{ color: theme.semantic.text.secondary }}>Budget</span>
                <span className="font-semibold" style={{ color: theme.colors.primary[500] }}>{wedding.budget}</span>
              </div>
            </div>

            <div 
              className="p-4 rounded-xl"
              style={{ backgroundColor: theme.semantic.background.accent }}
            >
              <h3 
                className="font-semibold mb-3"
                style={{ color: theme.semantic.text.primary }}
              >
                Planning Tips
              </h3>
              <ul className="space-y-2 text-sm" style={{ color: theme.semantic.text.secondary }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: theme.colors.primary[500] }}>•</span>
                  <span>Book your venue at least 6-8 months in advance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: theme.colors.primary[500] }}>•</span>
                  <span>Meet vendors in person before finalizing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: theme.colors.primary[500] }}>•</span>
                  <span>Create a detailed timeline for the wedding day</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: theme.colors.primary[500] }}>•</span>
                  <span>Keep buffer time between events</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default RealWedding;
