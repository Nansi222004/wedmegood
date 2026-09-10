export const newsCategories = [
  { id: 'all', name: 'All', color: '#6366f1' },
  { id: 'trends', name: 'Trends', color: '#ec4899' },
  { id: 'offers', name: 'Offers', color: '#10b981' },
  { id: 'updates', name: 'Updates', color: '#f59e0b' },
  { id: 'vendor-news', name: 'Vendor News', color: '#8b5cf6' }
];

export const newsData = [
  {
    id: 1,
    title: "Top 10 Wedding Color Palettes for 2024",
    category: "trends",
    categoryName: "Wedding Trends",
    description: "Discover the most popular color combinations that are trending this wedding season.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=250&fit=crop&crop=center",
    date: "2024-02-03",
    timeAgo: "2 hours ago",
    readTime: "3 min read"
  },
  {
    id: 2,
    title: "Exclusive 30% Off on Premium Photography Packages",
    category: "offers",
    categoryName: "Offers",
    description: "Limited time offer on wedding photography services from top-rated photographers.",
    image: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=250&fit=crop&crop=center",
    date: "2024-02-03",
    timeAgo: "4 hours ago",
    readTime: "2 min read"
  },
  {
    id: 3,
    title: "New Feature: AI-Powered Vendor Matching",
    category: "updates",
    categoryName: "Platform Updates",
    description: "Our new AI system helps you find the perfect vendors based on your preferences and budget.",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop&crop=center",
    date: "2024-02-02",
    timeAgo: "1 day ago",
    readTime: "4 min read"
  },
  {
    id: 4,
    title: "Minimalist Wedding Decor Ideas That Wow",
    category: "trends",
    categoryName: "Wedding Trends",
    description: "Less is more - create stunning wedding aesthetics with minimalist decor approaches.",
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=250&fit=crop&crop=center",
    date: "2024-02-02",
    timeAgo: "1 day ago",
    readTime: "5 min read"
  },
  {
    id: 5,
    title: "Featured Vendor: Elegant Events by Priya",
    category: "vendor-news",
    categoryName: "Vendor News",
    description: "Meet our vendor of the month who has been creating magical wedding experiences.",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=250&fit=crop&crop=center",
    date: "2024-02-01",
    timeAgo: "2 days ago",
    readTime: "3 min read"
  },
  {
    id: 6,
    title: "Flash Sale: Bridal Makeup Services Up to 50% Off",
    category: "offers",
    categoryName: "Offers",
    description: "Don't miss out on incredible savings from top makeup artists in your city.",
    image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=250&fit=crop&crop=center",
    date: "2024-02-01",
    timeAgo: "2 days ago",
    readTime: "2 min read"
  },
  {
    id: 7,
    title: "Sustainable Wedding Planning Tips",
    category: "trends",
    categoryName: "Wedding Trends",
    description: "Plan an eco-friendly wedding that's beautiful and environmentally conscious.",
    image: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=400&h=250&fit=crop&crop=center",
    date: "2024-01-31",
    timeAgo: "3 days ago",
    readTime: "6 min read"
  },
  {
    id: 8,
    title: "New Venue Partners Added in Mumbai & Delhi",
    category: "updates",
    categoryName: "Platform Updates",
    description: "Explore 50+ new premium wedding venues now available for booking.",
    image: "https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=400&h=250&fit=crop&crop=center",
    date: "2024-01-30",
    timeAgo: "4 days ago",
    readTime: "3 min read"
  },
  {
    id: 9,
    title: "Destination Wedding Packages Starting ₹2.5L",
    category: "offers",
    categoryName: "Offers",
    description: "Make your dream destination wedding affordable with our exclusive packages.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop&crop=center",
    date: "2024-01-29",
    timeAgo: "5 days ago",
    readTime: "4 min read"
  },
  {
    id: 10,
    title: "Winter Wedding Fashion: What's Hot Right Now",
    category: "trends",
    categoryName: "Wedding Trends",
    description: "Stay stylish and warm with the latest winter wedding fashion trends.",
    image: "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=250&fit=crop&crop=center",
    date: "2024-01-28",
    timeAgo: "6 days ago",
    readTime: "4 min read"
  }
];

export const getNewsByCategory = (category) => {
  if (category === 'all') return newsData;
  return newsData.filter(news => news.category === category);
};

export const getCategoryColor = (categoryId) => {
  const category = newsCategories.find(cat => cat.id === categoryId);
  return category ? category.color : '#6366f1';
};