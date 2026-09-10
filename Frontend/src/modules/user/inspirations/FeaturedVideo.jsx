import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Toast from '../../../components/ui/Toast';

const FeaturedVideo = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [savedVideos, setSavedVideos] = useState(new Set());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const categories = [
    { id: 'all', name: 'All Videos' },
    { id: 'wedding', name: 'Wedding Films' },
    { id: 'pre-wedding', name: 'Pre-Wedding' },
    { id: 'highlights', name: 'Highlights' },
    { id: 'teaser', name: 'Teasers' },
    { id: 'ceremony', name: 'Ceremonies' }
  ];

  const videos = [
    {
      id: 1,
      title: 'Romantic Beach Wedding',
      category: 'wedding',
      thumbnail: 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=600&h=400&fit=crop&q=80',
      duration: '12:45',
      views: 45000,
      likes: 3200,
      photographer: 'Cinematic Weddings',
      location: 'Goa',
      description: 'A beautiful beach wedding captured in stunning 4K'
    },
    {
      id: 2,
      title: 'Royal Palace Wedding',
      category: 'wedding',
      thumbnail: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=400&fit=crop&q=80',
      duration: '15:30',
      views: 67000,
      likes: 5400,
      photographer: 'Royal Films',
      location: 'Jaipur',
      description: 'Grand royal wedding at a heritage palace'
    },
    {
      id: 3,
      title: 'Love Story Pre-Wedding',
      category: 'pre-wedding',
      thumbnail: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&h=400&fit=crop&q=80',
      duration: '8:20',
      views: 32000,
      likes: 2800,
      photographer: 'Love Stories Studio',
      location: 'Udaipur',
      description: 'Romantic pre-wedding shoot in the city of lakes'
    },
    {
      id: 4,
      title: 'Traditional Wedding Highlights',
      category: 'highlights',
      thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop&q=80',
      duration: '5:15',
      views: 28000,
      likes: 2100,
      photographer: 'Wedding Highlights Co',
      location: 'Delhi',
      description: 'Best moments from a traditional Indian wedding'
    },
    {
      id: 5,
      title: 'Destination Wedding Teaser',
      category: 'teaser',
      thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=400&fit=crop&q=80',
      duration: '2:30',
      views: 52000,
      likes: 4300,
      photographer: 'Destination Films',
      location: 'Thailand',
      description: 'Sneak peek of an exotic destination wedding'
    },
    {
      id: 6,
      title: 'Mehndi Ceremony',
      category: 'ceremony',
      thumbnail: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&h=400&fit=crop&q=80',
      duration: '6:45',
      views: 19000,
      likes: 1600,
      photographer: 'Ceremony Captures',
      location: 'Mumbai',
      description: 'Colorful mehndi ceremony with family and friends'
    },
    {
      id: 7,
      title: 'Garden Wedding Film',
      category: 'wedding',
      thumbnail: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=600&h=400&fit=crop&q=80',
      duration: '14:20',
      views: 41000,
      likes: 3500,
      photographer: 'Garden Films',
      location: 'Bangalore',
      description: 'Elegant garden wedding with natural beauty'
    },
    {
      id: 8,
      title: 'Candid Pre-Wedding',
      category: 'pre-wedding',
      thumbnail: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&h=400&fit=crop&q=80',
      duration: '7:50',
      views: 36000,
      likes: 2900,
      photographer: 'Candid Stories',
      location: 'Manali',
      description: 'Natural and candid pre-wedding moments'
    },
    {
      id: 9,
      title: 'Wedding Day Highlights',
      category: 'highlights',
      thumbnail: 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=600&h=400&fit=crop&q=80',
      duration: '4:45',
      views: 25000,
      likes: 1900,
      photographer: 'Quick Cuts Studio',
      location: 'Pune',
      description: 'Perfect highlights reel of the big day'
    },
    {
      id: 10,
      title: 'Cinematic Wedding Teaser',
      category: 'teaser',
      thumbnail: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=400&fit=crop&q=80',
      duration: '3:10',
      views: 58000,
      likes: 4800,
      photographer: 'Cinematic Weddings',
      location: 'Hyderabad',
      description: 'Movie-style wedding teaser'
    },
    {
      id: 11,
      title: 'Sangeet Night',
      category: 'ceremony',
      thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=400&fit=crop&q=80',
      duration: '9:30',
      views: 33000,
      likes: 2700,
      photographer: 'Night Events Films',
      location: 'Chandigarh',
      description: 'Energetic sangeet ceremony with dance performances'
    },
    {
      id: 12,
      title: 'Haldi Ceremony',
      category: 'ceremony',
      thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop&q=80',
      duration: '5:55',
      views: 22000,
      likes: 1800,
      photographer: 'Ceremony Captures',
      location: 'Ahmedabad',
      description: 'Joyful haldi ceremony with vibrant colors'
    }
  ];

  const filteredVideos = selectedCategory === 'all' 
    ? videos 
    : videos.filter(video => video.category === selectedCategory);

  const handleSave = (videoId) => {
    setSavedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
        setToastMessage('Removed from saved');
      } else {
        newSet.add(videoId);
        setToastMessage('Saved to your collection');
      }
      setShowToast(true);
      return newSet;
    });
  };

  const handleVideoClick = (video) => {
    setToastMessage('Video player coming soon');
    setShowToast(true);
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-40 px-4 py-4 border-b"
        style={{ 
          backgroundColor: theme.semantic.background.primary,
          borderBottomColor: theme.semantic.border.light
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full transition-colors"
              style={{ backgroundColor: theme.semantic.background.accent }}
            >
              <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
            </button>
            <div>
              <h1 
                className="text-xl font-bold"
                style={{ color: theme.semantic.text.primary }}
              >
                Featured Videos
              </h1>
              <p 
                className="text-sm"
                style={{ color: theme.semantic.text.secondary }}
              >
                {filteredVideos.length} wedding videos
              </p>
            </div>
          </div>
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="video" size="sm" style={{ color: theme.colors.primary[500] }} />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: selectedCategory === category.id 
                  ? theme.colors.primary[500] 
                  : theme.semantic.background.accent,
                color: selectedCategory === category.id 
                  ? 'white' 
                  : theme.semantic.text.primary
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div 
        className="mx-4 mt-4 p-4 rounded-xl grid grid-cols-3 gap-4"
        style={{ backgroundColor: theme.semantic.background.accent }}
      >
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: theme.colors.primary[500] }}>
            {videos.length}
          </p>
          <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
            Total Videos
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: theme.colors.primary[500] }}>
            {savedVideos.size}
          </p>
          <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
            Saved
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: theme.colors.primary[500] }}>
            {Math.floor(videos.reduce((sum, v) => sum + v.views, 0) / 1000)}K
          </p>
          <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
            Total Views
          </p>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="px-4 py-4 space-y-4">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            className="rounded-2xl overflow-hidden shadow-md cursor-pointer transition-all duration-300 hover:shadow-xl"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            {/* Thumbnail */}
            <div 
              className="relative"
              onClick={() => handleVideoClick(video)}
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=600&h=400&fit=crop&q=80';
                }}
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
              
              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                >
                  <Icon name="video" size="lg" style={{ color: theme.colors.primary[500] }} />
                </div>
              </div>

              {/* Duration Badge */}
              <div 
                className="absolute bottom-3 right-3 px-2 py-1 rounded text-xs font-medium"
                style={{ backgroundColor: 'rgba(0,0,0,0.8)', color: 'white' }}
              >
                {video.duration}
              </div>

              {/* Save Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave(video.id);
                }}
                className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{ 
                  backgroundColor: savedVideos.has(video.id) 
                    ? theme.colors.primary[500] 
                    : 'rgba(255,255,255,0.9)'
                }}
              >
                <Icon 
                  name="heart" 
                  size="sm" 
                  style={{ 
                    color: savedVideos.has(video.id) 
                      ? 'white' 
                      : theme.semantic.text.tertiary 
                  }} 
                />
              </button>
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 
                className="font-semibold text-base mb-2"
                style={{ color: theme.semantic.text.primary }}
              >
                {video.title}
              </h3>
              
              <p 
                className="text-sm mb-3"
                style={{ color: theme.semantic.text.secondary }}
              >
                {video.description}
              </p>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  <Icon name="camera" size="xs" style={{ color: theme.semantic.text.tertiary }} />
                  <span 
                    className="text-xs"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    {video.photographer}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Icon name="location" size="xs" style={{ color: theme.semantic.text.tertiary }} />
                  <span 
                    className="text-xs"
                    style={{ color: theme.semantic.text.secondary }}
                  >
                    {video.location}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs" style={{ color: theme.semantic.text.secondary }}>
                <span className="flex items-center gap-1">
                  <Icon name="eye" size="xs" />
                  {(video.views / 1000).toFixed(1)}K views
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="heart" size="xs" />
                  {(video.likes / 1000).toFixed(1)}K likes
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredVideos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="video" size="lg" style={{ color: theme.semantic.text.tertiary }} />
          </div>
          <h3 
            className="text-lg font-semibold mb-2"
            style={{ color: theme.semantic.text.primary }}
          >
            No videos found
          </h3>
          <p 
            className="text-sm text-center"
            style={{ color: theme.semantic.text.secondary }}
          >
            Try selecting a different category
          </p>
        </div>
      )}

      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default FeaturedVideo;
