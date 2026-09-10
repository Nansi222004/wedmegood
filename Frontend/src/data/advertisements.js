// Advertisement data - Future-ready for backend integration
// This can be easily replaced with API calls later

export const advertisements = [
  {
    id: 1,
    type: 'venue',
    title: 'Premium Wedding Venues',
    image: 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=800&h=300&fit=crop&crop=center&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=300&fit=crop&crop=center&q=80',
    caption: 'Premium Wedding Venues in Indore',
    sponsor: 'Sponsored',
    link: '/user/vendors/venues',
    location: 'Indore',
    category: 'venues',
    priority: 1,
    isActive: true,
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  },
  {
    id: 2,
    type: 'photographer',
    title: 'Professional Photography',
    image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&h=300&fit=crop&crop=center&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=300&fit=crop&crop=center&q=80',
    caption: 'Exclusive Photography Partners',
    sponsor: 'Ad',
    link: '/user/vendors/photographers',
    location: 'Indore',
    category: 'photographers',
    priority: 2,
    isActive: true,
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  },
  {
    id: 3,
    type: 'decor',
    title: 'Luxury Wedding Decor',
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=300&fit=crop&crop=center&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=300&fit=crop&crop=center&q=80',
    caption: 'Luxury Decor Specialists',
    sponsor: 'Sponsored',
    link: '/user/vendors/decorators',
    location: 'Indore',
    category: 'decorators',
    priority: 3,
    isActive: true,
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  },
  {
    id: 4,
    type: 'makeup',
    title: 'Professional Makeup Artists',
    image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=300&fit=crop&crop=center&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=300&fit=crop&crop=center&q=80',
    caption: 'Professional Makeup Artists',
    sponsor: 'Ad',
    link: '/user/vendors/makeup-artists',
    location: 'Indore',
    category: 'makeup',
    priority: 4,
    isActive: true,
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  },
  {
    id: 5,
    type: 'catering',
    title: 'Premium Catering Services',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=300&fit=crop&crop=center&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=300&fit=crop&crop=center&q=80',
    caption: 'Exquisite Wedding Catering',
    sponsor: 'Sponsored',
    link: '/user/vendors/catering',
    location: 'Indore',
    category: 'catering',
    priority: 5,
    isActive: true,
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  },
  {
    id: 6,
    type: 'music',
    title: 'Wedding Entertainment',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=300&fit=crop&crop=center&q=80',
    fallbackImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=300&fit=crop&crop=center&q=80',
    caption: 'Live Music & Entertainment',
    sponsor: 'Ad',
    link: '/user/vendors/entertainment',
    location: 'Indore',
    category: 'entertainment',
    priority: 6,
    isActive: true,
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  }
];

// Helper functions for future backend integration
export const getActiveAdvertisements = (location = 'Indore') => {
  return advertisements.filter(ad => 
    ad.isActive && 
    ad.location === location &&
    new Date(ad.startDate) <= new Date() &&
    new Date(ad.endDate) >= new Date()
  ).sort((a, b) => a.priority - b.priority);
};

export const getAdvertisementsByCategory = (category, location = 'Indore') => {
  return advertisements.filter(ad => 
    ad.isActive && 
    ad.category === category &&
    ad.location === location
  );
};

export const getAdvertisementById = (id) => {
  return advertisements.find(ad => ad.id === id);
};

// Future API integration points
export const advertisementAPI = {
  // These functions can be replaced with actual API calls later
  fetchAdvertisements: async (location = 'Indore') => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getActiveAdvertisements(location));
      }, 500);
    });
  },
  
  trackAdvertisementView: async (adId) => {
    // Track advertisement views for analytics
    console.log(`Advertisement ${adId} viewed`);
    return Promise.resolve();
  },
  
  trackAdvertisementClick: async (adId) => {
    // Track advertisement clicks for analytics
    console.log(`Advertisement ${adId} clicked`);
    return Promise.resolve();
  }
};