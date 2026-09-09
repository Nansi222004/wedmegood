import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import VendorCard from '../vendors/VendorCardFixed';
import { vendors } from '../../../data/vendors';

const Trending = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [selectedTab, setSelectedTab] = useState('all');

  // Get trending vendors
  const trendingVendors = vendors.filter(vendor => vendor.isTrending);

  // Trending content data
  const trendingIdeas = [
    {
      id: 1,
      title: 'Pastel Wedding Decor Trends 2026',
      category: 'Decor',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop&q=80',
      views: '12.5K',
      likes: '2.3K',
      trending: true,
      route: '/user/inspirations/1'
    },
    {
      id: 2,
      title: 'Minimalist Bridal Makeup Look',
      category: 'Makeup',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop&q=80',
      views: '18.2K',
      likes: '3.8K',
      trending: true,
      route: '/user/inspirations/2'
    },
    {
      id: 3,
      title: 'Destination Wedding in Udaipur',
      category: 'Real Weddings',
      image: 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=600&h=400&fit=crop&q=80',
      views: '25.7K',
      likes: '5.2K',
      trending: true,
      route: '/user/real-weddings/1'
    },
    {
      id: 4,
      title: 'Floral Jewelry for Mehendi',
      category: 'Jewelry',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=400&fit=crop&q=80',
      views: '15.3K',
      likes: '2.9K',
      trending: true,
      route: '/user/inspirations/3'
    },
    {
      id: 5,
      title: 'Candid Photography Poses',
      category: 'Photography',
      image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&h=400&fit=crop&q=80',
      views: '22.1K',
      likes: '4.5K',
      trending: true,
      route: '/user/inspirations/4'
    },
    {
      id: 6,
      title: 'Sangeet Outfit Inspiration',
      category: 'Fashion',
      image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&h=400&fit=crop&q=80',
      views: '19.8K',
      likes: '3.6K',
      trending: true,
      route: '/user/inspirations/5'
    },
    {
      id: 7,
      title: 'Unique Mandap Designs',
      category: 'Decor',
      image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=600&h=400&fit=crop&q=80',
      views: '16.4K',
      likes: '3.1K',
      trending: true,
      route: '/user/inspirations/6'
    },
    {
      id: 8,
      title: 'Bridal Lehenga Trends',
      category: 'Fashion',
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&h=400&fit=crop&q=80',
      views: '28.9K',
      likes: '6.1K',
      trending: true,
      route: '/user/inspirations/7'
    },
    {
      id: 9,
      title: 'Mehendi Design Ideas',
      category: 'Mehendi',
      image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&h=400&fit=crop&q=80',
      views: '21.5K',
      likes: '4.2K',
      trending: true,
      route: '/user/inspirations/8'
    },
    {
      id: 10,
      title: 'Groom Entry Ideas',
      category: 'Ideas',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop&q=80',
      views: '14.7K',
      likes: '2.8K',
      trending: true,
      route: '/user/inspirations/9'
    },
    {
      id: 11,
      title: 'Wedding Cake Designs',
      category: 'Food',
      image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&h=400&fit=crop&q=80',
      views: '13.2K',
      likes: '2.5K',
      trending: true,
      route: '/user/inspirations/10'
    },
    {
      id: 12,
      title: 'Pre-Wedding Shoot Locations',
      category: 'Photography',
      image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&h=400&fit=crop&q=80',
      views: '20.3K',
      likes: '4.0K',
      trending: true,
      route: '/user/inspirations/11'
    }
  ];

  // Trending hashtags
  const trendingHashtags = [
    { tag: '#BridalMakeup2026', count: '45.2K posts', color: theme.colors.secondary[500] },
    { tag: '#DestinationWedding', count: '38.7K posts', color: theme.colors.primary[500] },
    { tag: '#WeddingDecor', count: '52.1K posts', color: theme.colors.accent[500] },
    { tag: '#MehendiDesigns', count: '41.3K posts', color: theme.colors.secondary[600] },
    { tag: '#BridalLehenga', count: '36.8K posts', color: theme.colors.primary[600] },
    { tag: '#WeddingPhotography', count: '48.5K posts', color: theme.colors.accent[600] }
  ];

  // Tabs
  const tabs = [
    { id: 'all', name: 'All Trending', icon: 'trending' },
    { id: 'vendors', name: 'Vendors', icon: 'star' },
    { id: 'ideas', name: 'Ideas', icon: 'sparkles' },
    { id: 'hashtags', name: 'Hashtags', icon: 'hash' }
  ];

  // Filter content based on selected tab
  const getFilteredContent = () => {
    switch(selectedTab) {
      case 'vendors':
        return { vendors: trendingVendors, ideas: [], hashtags: [] };
      case 'ideas':
        return { vendors: [], ideas: trendingIdeas, hashtags: [] };
      case 'hashtags':
        return { vendors: [], ideas: [], hashtags: trendingHashtags };
      default:
        return { vendors: trendingVendors.slice(0, 6), ideas: trendingIdeas.slice(0, 6), hashtags: trendingHashtags };
    }
  };

  const filteredContent = getFilteredContent();

  return (
    <div 
      className="min-h-screen pb-24"
      style={{ backgroundColor: theme.semantic.background.primary }}
    >
      <div className="px-3 sm:px-4 py-3 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-sm font-medium py-1 px-2 rounded-lg hover:bg-opacity-10 hover:bg-black transition-colors"
            style={{ color: theme.semantic.text.secondary }}
          >
            <Icon name="chevronLeft" size="sm" />
            <span className="hidden xs:inline">Back</span>
          </button>
          
          <h1 
            className="text-base sm:text-lg font-bold text-center flex-1 mx-4"
            style={{ color: theme.semantic.text.primary }}
          >
            Trending Today
          </h1>
          
          <div className="w-12 sm:w-16"></div>
        </div>

        {/* Hero Banner */}
        <div 
          className="mb-6 p-6 rounded-2xl relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.accent[500]} 0%, ${theme.colors.secondary[500]} 100%)`,
            boxShadow: `0 8px 24px ${theme.colors.accent[500]}40`
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="trending" size="lg" style={{ color: 'white' }} />
              <span className="text-white text-xs font-semibold px-2 py-1 bg-white/20 rounded-full">
                Hot Right Now
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              What's Trending in Weddings
            </h2>
            <p className="text-white/90 text-sm">
              Discover the most popular vendors, ideas, and inspiration
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className="flex-shrink-0 px-4 py-2.5 rounded-lg border transition-all flex items-center gap-2"
                style={{
                  backgroundColor: selectedTab === tab.id 
                    ? theme.colors.accent[500]
                    : theme.semantic.background.accent,
                  borderColor: selectedTab === tab.id 
                    ? theme.colors.accent[500]
                    : theme.semantic.border.light,
                  color: selectedTab === tab.id ? 'white' : theme.semantic.text.primary
                }}
              >
                <Icon name={tab.icon} size="sm" />
                <span className="text-sm font-medium">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Trending Vendors */}
        {filteredContent.vendors.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 
                className="text-lg font-bold flex items-center gap-2"
                style={{ color: theme.semantic.text.primary }}
              >
                <Icon name="star" size="sm" style={{ color: theme.colors.accent[500] }} />
                Trending Vendors
              </h2>
              {selectedTab === 'all' && (
                <button
                  onClick={() => setSelectedTab('vendors')}
                  className="text-sm font-medium"
                  style={{ color: theme.colors.accent[600] }}
                >
                  View All
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContent.vendors.map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} layout="responsive" />
              ))}
            </div>
          </div>
        )}

        {/* Trending Ideas */}
        {filteredContent.ideas.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 
                className="text-lg font-bold flex items-center gap-2"
                style={{ color: theme.semantic.text.primary }}
              >
                <Icon name="sparkles" size="sm" style={{ color: theme.colors.secondary[500] }} />
                Trending Ideas
              </h2>
              {selectedTab === 'all' && (
                <button
                  onClick={() => setSelectedTab('ideas')}
                  className="text-sm font-medium"
                  style={{ color: theme.colors.secondary[600] }}
                >
                  View All
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContent.ideas.map((idea) => (
                <Card 
                  key={idea.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-xl transition-all"
                  onClick={() => navigate(idea.route)}
                >
                  <div className="relative">
                    <img 
                      src={idea.image} 
                      alt={idea.title}
                      className="w-full h-48 object-cover"
                    />
                    <div 
                      className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: theme.colors.accent[500],
                        color: 'white'
                      }}
                    >
                      {idea.category}
                    </div>
                    <div 
                      className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: 'white'
                      }}
                    >
                      <Icon name="trending" size="xs" />
                      Trending
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 
                      className="font-bold text-base mb-2 line-clamp-2"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      {idea.title}
                    </h3>
                    <div className="flex items-center gap-4 text-xs" style={{ color: theme.semantic.text.secondary }}>
                      <div className="flex items-center gap-1">
                        <Icon name="eye" size="xs" />
                        <span>{idea.views} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="heart" size="xs" />
                        <span>{idea.likes} likes</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Trending Hashtags */}
        {filteredContent.hashtags.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 
                className="text-lg font-bold flex items-center gap-2"
                style={{ color: theme.semantic.text.primary }}
              >
                <Icon name="hash" size="sm" style={{ color: theme.colors.primary[500] }} />
                Trending Hashtags
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredContent.hashtags.map((hashtag, index) => (
                <Card 
                  key={index}
                  className="p-4 cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => navigate(`/user/search?q=${encodeURIComponent(hashtag.tag)}`)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${hashtag.color}20` }}
                    >
                      <Icon name="hash" size="lg" style={{ color: hashtag.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="font-bold text-sm mb-1 truncate"
                        style={{ color: theme.semantic.text.primary }}
                      >
                        {hashtag.tag}
                      </h3>
                      <p 
                        className="text-xs"
                        style={{ color: theme.semantic.text.secondary }}
                      >
                        {hashtag.count}
                      </p>
                    </div>
                    <Icon name="chevronRight" size="sm" style={{ color: theme.semantic.text.secondary }} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Trending Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Card className="p-4 text-center">
            <div 
              className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
              style={{ backgroundColor: theme.colors.accent[100] }}
            >
              <Icon name="star" size="lg" style={{ color: theme.colors.accent[600] }} />
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: theme.semantic.text.primary }}>
              {trendingVendors.length}
            </p>
            <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
              Trending Vendors
            </p>
          </Card>
          
          <Card className="p-4 text-center">
            <div 
              className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
              style={{ backgroundColor: theme.colors.secondary[100] }}
            >
              <Icon name="sparkles" size="lg" style={{ color: theme.colors.secondary[600] }} />
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: theme.semantic.text.primary }}>
              {trendingIdeas.length}
            </p>
            <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
              Trending Ideas
            </p>
          </Card>
          
          <Card className="p-4 text-center">
            <div 
              className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
              style={{ backgroundColor: theme.colors.primary[100] }}
            >
              <Icon name="hash" size="lg" style={{ color: theme.colors.primary[600] }} />
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: theme.semantic.text.primary }}>
              {trendingHashtags.length}
            </p>
            <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
              Hot Hashtags
            </p>
          </Card>
          
          <Card className="p-4 text-center">
            <div 
              className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
              style={{ backgroundColor: theme.colors.accent[100] }}
            >
              <Icon name="trending" size="lg" style={{ color: theme.colors.accent[600] }} />
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: theme.semantic.text.primary }}>
              250K+
            </p>
            <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
              Total Views
            </p>
          </Card>
        </div>

        {/* Call to Action */}
        <Card 
          className="p-6 text-center"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary[50]} 0%, ${theme.colors.secondary[50]} 100%)`
          }}
        >
          <Icon 
            name="sparkles" 
            size="2xl" 
            className="mx-auto mb-3"
            style={{ color: theme.colors.secondary[500] }} 
          />
          <h3 
            className="text-lg font-bold mb-2"
            style={{ color: theme.semantic.text.primary }}
          >
            Stay Updated with Latest Trends
          </h3>
          <p 
            className="text-sm mb-4"
            style={{ color: theme.semantic.text.secondary }}
          >
            Follow trending vendors and save ideas for your dream wedding
          </p>
          <button
            onClick={() => navigate('/user/inspirations')}
            className="px-6 py-2.5 rounded-lg font-medium text-white"
            style={{ backgroundColor: theme.colors.secondary[500] }}
          >
            Explore More Ideas
          </button>
        </Card>
      </div>
    </div>
  );
};

export default Trending;
