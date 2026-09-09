export const homeBanners = [
  {
    id: 'trending-styles',
    type: 'single',
    images: ['https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=320&fit=crop&crop=center&q=80'],
    title: 'Trending Wedding Styles',
    subtitle: 'Discover the latest wedding trends',
    clickAction: '/user/news'
  },
  {
    id: 'top-vendors',
    type: 'carousel',
    images: [
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=320&fit=crop&crop=center&q=80',
      'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&h=320&fit=crop&crop=center&q=80',
      'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=320&fit=crop&crop=center&q=80'
    ],
    title: 'Top Vendors This Season',
    subtitle: 'Handpicked professionals for your special day',
    clickAction: '/user/vendors'
  },
  {
    id: 'plan-smarter',
    type: 'single',
    images: ['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=320&fit=crop&crop=center&q=80'],
    title: 'Plan Smarter, Celebrate Better',
    subtitle: 'Smart tools for your perfect wedding',
    clickAction: '/user/requirements'
  },
  {
    id: 'venue-inspiration',
    type: 'carousel',
    images: [
      'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=800&h=320&fit=crop&crop=center&q=80',
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800&h=320&fit=crop&crop=center&q=80',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=800&h=320&fit=crop&crop=center&q=80'
    ],
    title: 'Dream Venues Await',
    subtitle: 'Find your perfect wedding destination',
    clickAction: '/user/vendors/venues'
  },
  {
    id: 'bridal-inspiration',
    type: 'single',
    images: ['https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=800&h=320&fit=crop&crop=center&q=80'],
    title: 'Bridal Beauty Inspiration',
    subtitle: 'Look stunning on your special day',
    clickAction: '/user/vendors/makeup'
  },
  {
    id: 'wedding-decor',
    type: 'carousel',
    images: [
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=320&fit=crop&crop=center&q=80',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=320&fit=crop&crop=center&q=80',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=320&fit=crop&crop=center&q=80'
    ],
    title: 'Magical Wedding Decor',
    subtitle: 'Transform your venue into a fairytale',
    clickAction: '/user/vendors/decorators'
  }
];

export const getBannerById = (id) => {
  return homeBanners.find(banner => banner.id === id);
};

export const getRandomBanners = (count = 3) => {
  const shuffled = [...homeBanners].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};