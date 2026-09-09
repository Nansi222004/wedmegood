import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';

const UserHome = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [checklistStats, setChecklistStats] = useState({ completed: 0, total: 71 });

  // Load checklist stats from localStorage
  useEffect(() => {
    const loadChecklistStats = () => {
      const savedTasks = localStorage.getItem('weddingChecklistTasks');
      if (savedTasks) {
        const tasks = JSON.parse(savedTasks);
        const completed = tasks.filter(task => task.completed).length;
        setChecklistStats({ completed, total: tasks.length });
      }
    };

    loadChecklistStats();
    
    // Listen for storage changes (when checklist is updated)
    window.addEventListener('storage', loadChecklistStats);
    
    return () => {
      window.removeEventListener('storage', loadChecklistStats);
    };
  }, []);

  // Image error handler
  const handleImageError = (e, fallbackUrl) => {
    if (e.target.src !== fallbackUrl) {
      e.target.src = fallbackUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop&q=80';
    }
  };

  // Data arrays will be added here
  const topCategories = [
    { id: 'venues', name: 'Wedding Venues', image: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?w=200&h=200&fit=crop&q=80', route: '/user/vendors/venues' },
    { id: 'photographers', name: 'Wedding Photographers', image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=200&h=200&fit=crop&q=80', route: '/user/vendors/photographers' },
    { id: 'makeup', name: 'Bridal Makeup', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&h=200&fit=crop&q=80', route: '/user/vendors/makeup' },
    { id: 'decorators', name: 'Wedding Decorators', image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=200&h=200&fit=crop&q=80', route: '/user/vendors/decorators' },
    { id: 'catering', name: 'Catering', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=200&h=200&fit=crop&q=80', route: '/user/vendors/catering' },
    { id: 'mehndi', name: 'Mehndi Artists', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=200&h=200&fit=crop&q=80', route: '/user/vendors/mehndi' },
    { id: 'jewellery', name: 'Bridal Jewellery', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&h=200&fit=crop&q=80', route: '/user/vendors/jewellery' },
    { id: 'invitations', name: 'Invitations', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=200&h=200&fit=crop&q=80', route: '/user/vendors/invitations' },
    { id: 'music', name: 'Music & DJ', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=200&h=200&fit=crop&q=80', route: '/user/vendors/music' },
    { id: 'choreography', name: 'Choreography', image: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=200&h=200&fit=crop&q=80', route: '/user/vendors/choreography' }
  ];
 
  const planningTools = [
    { id: 'e-invites', title: 'Build your Digital E-Invites', subtitle: "Let's get started", icon: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=100&h=100&fit=crop&q=80', bgColor: '#F0F9FF', route: '/user/e-invites' },
    { id: 'shortlist', title: 'Your shortlisted vendors', subtitle: 'Browse vendors', icon: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=100&h=100&fit=crop&q=80', bgColor: '#F5F3FF', route: '/user/shortlist' },
    { id: 'favourites', title: 'Your favourite vendors', subtitle: 'Add a favourite', icon: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=100&h=100&fit=crop&q=80', bgColor: '#FFF1F2', route: '/user/favourites' },
    { id: 'groups', title: 'Family Planning Groups', subtitle: 'Collaborate with family', icon: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=100&h=100&fit=crop&q=80', bgColor: '#F0FDF4', route: '/user/family/groups' }
  ];
 
  const venues = [
    { id: 1, name: 'Essentia Luxury Hotel Indore', location: 'Indore', price: '₹ 2,050', priceType: 'per function', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=400&fit=crop&q=80', route: '/user/vendor/1' },
    { id: 2, name: 'Sarai Resort Indore', location: 'Dhar Road', price: '₹ 800', priceType: 'per plate', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=400&fit=crop&q=80', route: '/user/vendor/2' },
    { id: 3, name: 'Royal Palace Gardens', location: 'Vijay Nagar', price: '₹ 1,500', priceType: 'per plate', image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=600&h=400&fit=crop&q=80', route: '/user/vendor/3' },
    { id: 4, name: 'Grand Celebration Banquet', location: 'AB Road', price: '₹ 1,200', priceType: 'per plate', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=400&fit=crop&q=80', route: '/user/vendor/4' },
    { id: 5, name: 'Radisson Blu Hotel', location: 'Ring Road', price: '₹ 3,000', priceType: 'per function', image: 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=600&h=400&fit=crop&q=80', route: '/user/vendor/5' },
    { id: 6, name: 'Sayaji Hotel', location: 'RNT Marg', price: '₹ 1,800', priceType: 'per plate', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=400&fit=crop&q=80', route: '/user/vendor/6' },
    { id: 7, name: 'Brilliant Convention Centre', location: 'Bypass Road', price: '₹ 900', priceType: 'per plate', image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=600&h=400&fit=crop&q=80', route: '/user/vendor/7' },
    { id: 8, name: 'Usha Kiran Palace', location: 'Lashkar', price: '₹ 4,500', priceType: 'per function', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=400&fit=crop&q=80', route: '/user/vendor/8' },
    { id: 9, name: 'Lemon Tree Hotel', location: 'Scheme 54', price: '₹ 1,100', priceType: 'per plate', image: 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=600&h=400&fit=crop&q=80', route: '/user/vendor/9' },
    { id: 10, name: 'Pride Hotel', location: 'South Tukoganj', price: '₹ 1,400', priceType: 'per plate', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=400&fit=crop&q=80', route: '/user/vendor/10' }
  ];

  const weddingIdeas = [
    { id: 1, title: 'Bridal Lehenga Inspiration', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&h=500&fit=crop&q=80', route: '/user/inspirations/1' },
    { id: 2, title: 'Mehndi Design Ideas', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=500&fit=crop&q=80', route: '/user/inspirations/2' },
    { id: 3, title: 'Bridal Jewelry Trends', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=500&fit=crop&q=80', route: '/user/inspirations/3' },
    { id: 4, title: 'Groom Sherwani Styles', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&q=80', route: '/user/inspirations/4' },
    { id: 5, title: 'Wedding Mandap Decor', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=500&fit=crop&q=80', route: '/user/inspirations/5' },
    { id: 6, title: 'Sangeet Outfit Ideas', image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=500&fit=crop&q=80', route: '/user/inspirations/6' },
    { id: 7, title: 'Bridal Hairstyles', image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=500&fit=crop&q=80', route: '/user/inspirations/7' },
    { id: 8, title: 'Wedding Photography Poses', image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=500&fit=crop&q=80', route: '/user/inspirations/8' },
    { id: 9, title: 'Reception Decor', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=500&fit=crop&q=80', route: '/user/inspirations/9' },
    { id: 10, title: 'Bridal Bouquet Ideas', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=500&fit=crop&q=80', route: '/user/inspirations/10' }
  ];

  const realWeddings = [
    { id: 1, coupleName: 'Priya & Rahul', city: 'Mumbai', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop&q=80', route: '/user/real-weddings/1' },
    { id: 2, coupleName: 'Ananya & Arjun', city: 'Jaipur', image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&h=600&fit=crop&q=80', route: '/user/real-weddings/2' },
    { id: 3, coupleName: 'Meera & Karan', city: 'Udaipur', image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=600&fit=crop&q=80', route: '/user/real-weddings/3' },
    { id: 4, coupleName: 'Sneha & Vikram', city: 'Delhi', image: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&h=600&fit=crop&q=80', route: '/user/real-weddings/4' },
    { id: 5, coupleName: 'Riya & Aditya', city: 'Bangalore', image: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=800&h=600&fit=crop&q=80', route: '/user/real-weddings/5' },
    { id: 6, coupleName: 'Divya & Rohan', city: 'Goa', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop&q=80', route: '/user/real-weddings/6' },
    { id: 7, coupleName: 'Kavya & Siddharth', city: 'Hyderabad', image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&h=600&fit=crop&q=80', route: '/user/real-weddings/7' },
    { id: 8, coupleName: 'Ishita & Aman', city: 'Pune', image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=600&fit=crop&q=80', route: '/user/real-weddings/8' },
    { id: 9, coupleName: 'Nisha & Varun', city: 'Chandigarh', image: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&h=600&fit=crop&q=80', route: '/user/real-weddings/9' },
    { id: 10, coupleName: 'Pooja & Akash', city: 'Indore', image: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=800&h=600&fit=crop&q=80', route: '/user/real-weddings/10' }
  ];

  const bridalLooks = [
    { id: 1, title: 'Bridal Makeup', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=500&fit=crop&q=80', route: '/user/bridal-looks/makeup' },
    { id: 2, title: 'Hairstyles', image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=500&fit=crop&q=80', route: '/user/bridal-looks/hairstyles' },
    { id: 3, title: 'Jewellery', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=500&fit=crop&q=80', route: '/user/bridal-looks/jewellery' },
    { id: 4, title: 'Mehndi Designs', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=500&fit=crop&q=80', route: '/user/bridal-looks/mehndi' },
    { id: 5, title: 'Bridal Sarees', image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=500&fit=crop&q=80', route: '/user/bridal-looks/sarees' },
    { id: 6, title: 'Bridal Lehengas', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&h=500&fit=crop&q=80', route: '/user/bridal-looks/lehengas' },
    { id: 7, title: 'Bridal Accessories', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=500&fit=crop&q=80', route: '/user/bridal-looks/accessories' },
    { id: 8, title: 'Bridal Footwear', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=500&fit=crop&q=80', route: '/user/bridal-looks/footwear' },
    { id: 9, title: 'Bridal Nails', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=500&fit=crop&q=80', route: '/user/bridal-looks/nails' },
    { id: 10, title: 'Bridal Dupatta Draping', image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=500&fit=crop&q=80', route: '/user/bridal-looks/dupatta' }
  ];

  const decorInspirations = [
    { id: 1, title: 'Mandap Decor', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=500&fit=crop&q=80', route: '/user/decor/mandap' },
    { id: 2, title: 'Floral Setups', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=500&fit=crop&q=80', route: '/user/decor/floral' },
    { id: 3, title: 'Stage Decor', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=500&fit=crop&q=80', route: '/user/decor/stage' },
    { id: 4, title: 'Lighting Ideas', image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&h=500&fit=crop&q=80', route: '/user/decor/lighting' },
    { id: 5, title: 'Entrance Decor', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=500&fit=crop&q=80', route: '/user/decor/entrance' },
    { id: 6, title: 'Table Settings', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=500&fit=crop&q=80', route: '/user/decor/table' },
    { id: 7, title: 'Ceiling Decor', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=500&fit=crop&q=80', route: '/user/decor/ceiling' },
    { id: 8, title: 'Photo Booth Ideas', image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&h=500&fit=crop&q=80', route: '/user/decor/photobooth' },
    { id: 9, title: 'Backdrop Designs', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=500&fit=crop&q=80', route: '/user/decor/backdrop' },
    { id: 10, title: 'Aisle Decor', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=500&fit=crop&q=80', route: '/user/decor/aisle' }
  ];

  const trendingVendors = [
    { id: 1, name: 'The Wedding Filmer', city: 'Mumbai', rating: 4.9, image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&h=400&fit=crop&q=80', route: '/user/vendor/trending-1' },
    { id: 2, name: 'Makeup by Priya', city: 'Delhi', rating: 4.8, image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop&q=80', route: '/user/vendor/trending-2' },
    { id: 3, name: 'Decor Dreams', city: 'Bangalore', rating: 4.9, image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=600&h=400&fit=crop&q=80', route: '/user/vendor/trending-3' },
    { id: 4, name: 'Royal Caterers', city: 'Indore', rating: 4.7, image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&h=400&fit=crop&q=80', route: '/user/vendor/trending-4' },
    { id: 5, name: 'Elegant Events', city: 'Jaipur', rating: 4.8, image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&h=400&fit=crop&q=80', route: '/user/vendor/trending-5' },
    { id: 6, name: 'Bridal Bliss Studio', city: 'Pune', rating: 4.9, image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop&q=80', route: '/user/vendor/trending-6' },
    { id: 7, name: 'Perfect Planners', city: 'Hyderabad', rating: 4.7, image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=600&h=400&fit=crop&q=80', route: '/user/vendor/trending-7' },
    { id: 8, name: 'Gourmet Catering Co', city: 'Chennai', rating: 4.8, image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&h=400&fit=crop&q=80', route: '/user/vendor/trending-8' },
    { id: 9, name: 'Candid Captures', city: 'Goa', rating: 4.9, image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&h=400&fit=crop&q=80', route: '/user/vendor/trending-9' },
    { id: 10, name: 'Glamour Makeup Artists', city: 'Kolkata', rating: 4.8, image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop&q=80', route: '/user/vendor/trending-10' }
  ];

  const planningBanners = [
    { id: 1, title: 'Plan Your Wedding Budget', subtitle: 'Smart tools to manage expenses', image: 'https://images.unsplash.com/photo-1554224311-beee415c201f?w=800&h=300&fit=crop&q=80', route: '/user/tools/budget' },
    { id: 2, title: 'Checklist for Your Big Day', subtitle: 'Never miss a detail', image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=300&fit=crop&q=80', route: '/user/tools/checklist' },
    { id: 3, title: 'Talk to Verified Vendors', subtitle: 'Get instant quotes', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=300&fit=crop&q=80', route: '/user/vendors' }
  ];

  const weddingFeed = [
    { id: 1, title: 'Elegant Bridal Lehenga', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&h=500&fit=crop&q=80', route: '/user/feed/1' },
    { id: 2, title: 'Groom Sherwani Ideas', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&q=80', route: '/user/feed/2' },
    { id: 3, title: 'Wedding Invitation Design', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=500&fit=crop&q=80', route: '/user/feed/3' },
    { id: 4, title: 'Reception Decor Ideas', image: 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=400&h=500&fit=crop&q=80', route: '/user/feed/4' },
    { id: 5, title: 'Bridal Bouquet Trends', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=500&fit=crop&q=80', route: '/user/feed/5' },
    { id: 6, title: 'Sangeet Outfit Inspiration', image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=500&fit=crop&q=80', route: '/user/feed/6' },
    { id: 7, title: 'Mehndi Ceremony Decor', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=500&fit=crop&q=80', route: '/user/feed/7' },
    { id: 8, title: 'Bridal Jewelry Sets', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=500&fit=crop&q=80', route: '/user/feed/8' },
    { id: 9, title: 'Wedding Cake Designs', image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=500&fit=crop&q=80', route: '/user/feed/9' },
    { id: 10, title: 'Couple Photography Poses', image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=500&fit=crop&q=80', route: '/user/feed/10' },
    { id: 11, title: 'Haldi Ceremony Ideas', image: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=400&h=500&fit=crop&q=80', route: '/user/feed/11' },
    { id: 12, title: 'Wedding Table Settings', image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&h=500&fit=crop&q=80', route: '/user/feed/12' }
  ];

  const makeupArtists = [
    { id: 1, name: 'Glamour Studio by Priya', location: 'Vijay Nagar', price: '₹ 25,000', priceType: 'per day', rating: 4.9, reviews: 156, image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop&q=80', route: '/user/makeup/1' },
    { id: 2, name: 'Bridal Bliss Makeup', location: 'AB Road', price: '₹ 18,000', priceType: 'per day', rating: 4.8, reviews: 203, image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=400&fit=crop&q=80', route: '/user/makeup/2' },
    { id: 3, name: 'Elegant Touch Studio', location: 'Palasia', price: '₹ 30,000', priceType: 'per day', rating: 4.9, reviews: 178, image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop&q=80', route: '/user/makeup/3' },
    { id: 4, name: 'Royal Bridal Makeup', location: 'Scheme 54', price: '₹ 22,000', priceType: 'per day', rating: 4.7, reviews: 134, image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=400&fit=crop&q=80', route: '/user/makeup/4' },
    { id: 5, name: 'Radiance Makeup Studio', location: 'Ring Road', price: '₹ 28,000', priceType: 'per day', rating: 4.8, reviews: 189, image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop&q=80', route: '/user/makeup/5' },
    { id: 6, name: 'Diva Makeup Artistry', location: 'South Tukoganj', price: '₹ 20,000', priceType: 'per day', rating: 4.9, reviews: 221, image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=400&fit=crop&q=80', route: '/user/makeup/6' },
    { id: 7, name: 'Perfect Look Studio', location: 'Treasure Island', price: '₹ 26,000', priceType: 'per day', rating: 4.8, reviews: 167, image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop&q=80', route: '/user/makeup/7' },
    { id: 8, name: 'Glamorous Bride', location: 'Sapna Sangeeta', price: '₹ 24,000', priceType: 'per day', rating: 4.7, reviews: 145, image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=400&fit=crop&q=80', route: '/user/makeup/8' },
    { id: 9, name: 'Bridal Glow Studio', location: 'Rau', price: '₹ 19,000', priceType: 'per day', rating: 4.8, reviews: 198, image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop&q=80', route: '/user/makeup/9' },
    { id: 10, name: 'Elite Makeup Artists', location: 'Bypass Road', price: '₹ 32,000', priceType: 'per day', rating: 4.9, reviews: 234, image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=400&fit=crop&q=80', route: '/user/makeup/10' }
  ];

  const decorators = [
    { id: 1, name: 'Dream Decor Events', location: 'Indore', price: '₹ 1,50,000', priceType: 'per event', rating: 4.9, reviews: 89, image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop&q=80', route: '/user/decorator/1' },
    { id: 2, name: 'Royal Decorations', location: 'Vijay Nagar', price: '₹ 2,00,000', priceType: 'per event', rating: 4.8, reviews: 112, image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=600&h=400&fit=crop&q=80', route: '/user/decorator/2' },
    { id: 3, name: 'Elegant Events Decor', location: 'AB Road', price: '₹ 1,75,000', priceType: 'per event', rating: 4.9, reviews: 95, image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop&q=80', route: '/user/decorator/3' },
    { id: 4, name: 'Floral Fantasy', location: 'Palasia', price: '₹ 1,25,000', priceType: 'per event', rating: 4.7, reviews: 78, image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=600&h=400&fit=crop&q=80', route: '/user/decorator/4' },
    { id: 5, name: 'Grand Celebrations', location: 'Ring Road', price: '₹ 2,50,000', priceType: 'per event', rating: 4.9, reviews: 134, image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop&q=80', route: '/user/decorator/5' },
    { id: 6, name: 'Perfect Decor Studio', location: 'Scheme 54', price: '₹ 1,80,000', priceType: 'per event', rating: 4.8, reviews: 101, image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=600&h=400&fit=crop&q=80', route: '/user/decorator/6' },
    { id: 7, name: 'Luxury Events Decor', location: 'South Tukoganj', price: '₹ 2,20,000', priceType: 'per event', rating: 4.9, reviews: 118, image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop&q=80', route: '/user/decorator/7' },
    { id: 8, name: 'Blossom Decorations', location: 'Treasure Island', price: '₹ 1,60,000', priceType: 'per event', rating: 4.7, reviews: 87, image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=600&h=400&fit=crop&q=80', route: '/user/decorator/8' },
    { id: 9, name: 'Majestic Decor', location: 'Rau', price: '₹ 1,40,000', priceType: 'per event', rating: 4.8, reviews: 93, image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop&q=80', route: '/user/decorator/9' },
    { id: 10, name: 'Opulent Events', location: 'Bypass Road', price: '₹ 3,00,000', priceType: 'per event', rating: 4.9, reviews: 156, image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=600&h=400&fit=crop&q=80', route: '/user/decorator/10' }
  ];

  const photographerCollections = [
    { id: 1, title: 'Top Rated Photographers', count: '19 Vendors', image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=300&h=300&fit=crop&q=80', route: '/user/photographers/top-rated' },
    { id: 2, title: 'Value For Money', count: '10 Vendors', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop&q=80', route: '/user/photographers/value' },
    { id: 3, title: 'Luxury Wedding Photographers', count: '10 Vendors', image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=300&h=300&fit=crop&q=80', route: '/user/photographers/luxury' }
  ];

  const venueCollections = [
    { id: 1, title: 'Luxury Wedding Venues', count: '9 Vendors', image: 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=300&h=300&fit=crop&q=80', route: '/user/venues/luxury' },
    { id: 2, title: 'Budget Wedding Venues', count: '7 Vendors', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=300&h=300&fit=crop&q=80', route: '/user/venues/budget' },
    { id: 3, title: 'Beach Wedding Destinations', count: '15 Vendors', image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=300&h=300&fit=crop&q=80', route: '/user/venues/beach' }
  ];

  const photographers = [
    { id: 1, name: 'The Wedding Essence By PSF', location: 'Indore', price: '₹ 50,000', priceType: 'per day', image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&h=400&fit=crop&q=80', route: '/user/photographer/1' },
    { id: 2, name: 'Himanshu Bhargav Films', location: 'MG Road', price: '₹ 40,000', priceType: 'per day', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop&q=80', route: '/user/photographer/2' },
    { id: 3, name: 'Candid Moments Studio', location: 'Vijay Nagar', price: '₹ 45,000', priceType: 'per day', image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&h=400&fit=crop&q=80', route: '/user/photographer/3' },
    { id: 4, name: 'Royal Photography', location: 'AB Road', price: '₹ 35,000', priceType: 'per day', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop&q=80', route: '/user/photographer/4' },
    { id: 5, name: 'Picture Perfect Studios', location: 'Palasia', price: '₹ 55,000', priceType: 'per day', image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&h=400&fit=crop&q=80', route: '/user/photographer/5' },
    { id: 6, name: 'Dream Capture Films', location: 'Ring Road', price: '₹ 48,000', priceType: 'per day', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop&q=80', route: '/user/photographer/6' },
    { id: 7, name: 'Elite Wedding Films', location: 'Scheme 54', price: '₹ 60,000', priceType: 'per day', image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&h=400&fit=crop&q=80', route: '/user/photographer/7' },
    { id: 8, name: 'Moments Photography', location: 'South Tukoganj', price: '₹ 38,000', priceType: 'per day', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop&q=80', route: '/user/photographer/8' },
    { id: 9, name: 'Artistic Vision Studios', location: 'Treasure Island', price: '₹ 52,000', priceType: 'per day', image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&h=400&fit=crop&q=80', route: '/user/photographer/9' },
    { id: 10, name: 'Cinematic Weddings', location: 'Bypass Road', price: '₹ 65,000', priceType: 'per day', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop&q=80', route: '/user/photographer/10' }
  ];

  const trendingToday = [
    { id: 1, hashtag: '#bridal-jewellery', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=300&fit=crop&q=80', route: '/user/trending/bridal-jewellery' },
    { id: 2, hashtag: '#wedding-decor', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop&q=80', route: '/user/trending/wedding-decor' },
    { id: 3, hashtag: '#bridal-makeup', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop&q=80', route: '/user/trending/bridal-makeup' },
    { id: 4, hashtag: '#wedding-photography', image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=300&fit=crop&q=80', route: '/user/trending/photography' },
    { id: 5, hashtag: '#mehndi-designs', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=300&fit=crop&q=80', route: '/user/trending/mehndi' },
    { id: 6, hashtag: '#bridal-lehenga', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&h=300&fit=crop&q=80', route: '/user/trending/lehenga' },
    { id: 7, hashtag: '#wedding-venues', image: 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=400&h=300&fit=crop&q=80', route: '/user/trending/venues' },
    { id: 8, hashtag: '#groom-style', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&q=80', route: '/user/trending/groom' },
    { id: 9, hashtag: '#wedding-invitations', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop&q=80', route: '/user/trending/invitations' },
    { id: 10, hashtag: '#sangeet-night', image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=300&fit=crop&q=80', route: '/user/trending/sangeet' }
  ];

  const interestingReads = [
    { id: 1, title: 'Pink Lehenga We Can\'t Stop Staring At!', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&h=300&fit=crop&q=80', route: '/user/reads/1' },
    { id: 2, title: 'Baraat Entry Ideas That Will Wow Your Guests', image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=300&fit=crop&q=80', route: '/user/reads/2' },
    { id: 3, title: 'Latest Mehndi Design Trends', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=300&fit=crop&q=80', route: '/user/reads/3' },
    { id: 4, title: 'Top 10 Wedding Venues in Indore', image: 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=400&h=300&fit=crop&q=80', route: '/user/reads/4' },
    { id: 5, title: 'Bridal Makeup Tips for Perfect Look', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop&q=80', route: '/user/reads/5' },
    { id: 6, title: 'Groom Fashion Trends 2026', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&q=80', route: '/user/reads/6' },
    { id: 7, title: 'Budget Wedding Planning Guide', image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=300&fit=crop&q=80', route: '/user/reads/7' },
    { id: 8, title: 'Destination Wedding Ideas', image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&h=300&fit=crop&q=80', route: '/user/reads/8' },
    { id: 9, title: 'Wedding Photography Poses Guide', image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=300&fit=crop&q=80', route: '/user/reads/9' },
    { id: 10, title: 'Sangeet Choreography Ideas', image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=300&fit=crop&q=80', route: '/user/reads/10' }
  ];

  return (
    <div className="min-h-screen pb-32 px-4 space-y-8" style={{ backgroundColor: '#EAE1D8' }}>
      
      {/* 1. Top Category Icons - Editorial Circles */}
      <div className="pt-6">
        <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-4">
          {topCategories.map((category) => (
            <div
              key={category.id}
              onClick={() => navigate(category.route)}
              className="flex-shrink-0 cursor-pointer active:scale-95 transition-all text-center"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden mb-2 p-1 bg-white shadow-sm ring-1 ring-black/5">
                <img
                  src={category.image}
                  alt={category.name}
                  loading="lazy"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=64&h=64&fit=crop&q=80';
                  }}
                />
              </div>
              <p 
                className="text-[9px] w-16 font-black uppercase tracking-wider text-[#3D2B2B]/60"
                style={{ fontFamily: '"Outfit", sans-serif' }}
              >
                {category.name.split(' ')[1] || category.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Wedding Planning Tools - Boutique Arched Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <h2 className="text-xl font-bold tracking-tight text-[#3D2B2B]" style={{ fontFamily: '"Playfair Display", serif' }}>
             Planning Tools
           </h2>
           <span className="text-[10px] font-black uppercase tracking-widest text-[#3D2B2B]/30">Editorial Guide</span>
        </div>
        
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
          {planningTools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => navigate(tool.route)}
              className="flex-shrink-0 w-40 overflow-hidden cursor-pointer active:scale-95 transition-all"
            >
              <div className="bg-white rounded-t-[3rem] rounded-b-[1rem] p-4 shadow-sm border border-white/50 aspect-[4/5] flex flex-col items-center text-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#EAE1D8]">
                  <img 
                    src={tool.icon} 
                    alt={tool.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-[#3D2B2B] leading-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                    {tool.title}
                  </h3>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#3D2B2B]/30" style={{ fontFamily: '"Outfit", sans-serif' }}>
                    {tool.subtitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Family Planning Groups Actions - Minimalist Card */}
        <div className="relative group">
          <div 
            className="p-6 rounded-[2rem] bg-white shadow-sm border border-white overflow-hidden relative"
          >
             {/* Subtle Ornament */}
             <div className="absolute top-0 right-0 w-16 h-16 bg-[#EAE1D8]/20 rounded-bl-full pointer-events-none" />

            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#EAE1D8]/30">
                 <Icon name="plan" size="sm" style={{ color: '#3D2B2B' }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#3D2B2B]" style={{ fontFamily: '"Playfair Display", serif' }}>
                  Family Planning
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#3D2B2B]/30" style={{ fontFamily: '"Outfit", sans-serif' }}>
                   Collaborative Dashboard
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => navigate('/user/family/create-group')}
                className="flex-1 py-2.5 px-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 bg-[#3D2B2B] text-white"
              >
                New Group
              </button>
              <button
                onClick={() => navigate('/user/family/groups')}
                className="flex-1 py-2.5 px-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 bg-[#EAE1D8]/40 text-[#3D2B2B] border border-black/5"
              >
                View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. High-Density Vendor Discovery (Venues & Photographers) */}
      <div className="space-y-10">
        {/* Venues Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#3D2B2B]" style={{ fontFamily: '"Playfair Display", serif' }}>
              Venues Indore
            </h2>
            <button 
              onClick={() => navigate('/user/vendors')}
              className="text-[10px] font-black uppercase tracking-widest text-[#3D2B2B]/40 hover:text-[#3D2B2B]"
            >
              See All
            </button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {venues.map((venue) => (
              <div
                key={venue.id}
                onClick={() => navigate(venue.route)}
                className="flex-shrink-0 w-52 cursor-pointer active:scale-95 transition-all group"
              >
                <div className="relative overflow-hidden rounded-[2rem] aspect-[4/3] shadow-sm ring-1 ring-black/5">
                  <img
                    src={venue.image}
                    alt={venue.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full">
                     <span className="text-[8px] font-black uppercase tracking-widest text-[#3D2B2B]">{venue.location}</span>
                  </div>
                </div>
                <div className="pt-4 px-2 space-y-1">
                  <h3 className="text-sm font-bold text-[#3D2B2B] line-clamp-1" style={{ fontFamily: '"Playfair Display", serif' }}>{venue.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-[#BE185D]">{venue.price}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#3D2B2B]/30">{venue.priceType}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Photographers Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#3D2B2B]" style={{ fontFamily: '"Playfair Display", serif' }}>
              Photographers
            </h2>
            <button 
              onClick={() => navigate('/user/photographers')}
              className="text-[10px] font-black uppercase tracking-widest text-[#3D2B2B]/40 hover:text-[#3D2B2B]"
            >
              See All
            </button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {photographers.map((photographer) => (
              <div
                key={photographer.id}
                onClick={() => navigate(photographer.route)}
                className="flex-shrink-0 w-52 cursor-pointer active:scale-95 transition-all group"
              >
                <div className="relative overflow-hidden rounded-[2rem] aspect-[4/3] shadow-sm ring-1 ring-black/5">
                  <img
                    src={photographer.image}
                    alt={photographer.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="pt-4 px-2 space-y-1">
                  <h3 className="text-sm font-bold text-[#3D2B2B] line-clamp-1" style={{ fontFamily: '"Playfair Display", serif' }}>{photographer.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-[#BE185D]">{photographer.price}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#3D2B2B]/30">{photographer.priceType}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Wedding Checklist - Premium Editorial Card */}
      <div className="py-6">
        <div 
          className="relative overflow-hidden p-8 rounded-[3rem] shadow-xl border border-white"
          style={{ backgroundColor: 'white' }}
        >
          {/* Ornamental Background Circle */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#EAE1D8]/40 rounded-full blur-3xl opacity-50" />
          
          <div className="relative flex justify-between items-center mb-8">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-[#3D2B2B]" style={{ fontFamily: '"Playfair Display", serif' }}>
                Your Checklist
              </h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#3D2B2B]/30" style={{ fontFamily: '"Outfit", sans-serif' }}>
                 Tasks & Milestones
              </p>
            </div>
            <div className="w-16 h-16 rounded-full border-[3px] border-[#EAE1D8] flex items-center justify-center bg-white shadow-soft">
              <span className="text-[#3D2B2B] font-black text-sm" style={{ fontFamily: '"Outfit", sans-serif' }}>
                {checklistStats.total > 0 ? Math.round((checklistStats.completed / checklistStats.total) * 100) : 0}%
              </span>
            </div>
          </div>
          
          <div className="bg-[#EAE1D8]/20 rounded-2xl p-5 border border-[#3D2B2B]/5">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3D2B2B]/40" style={{ fontFamily: '"Outfit", sans-serif' }}>Focus Items</h4>
              <button
                onClick={() => navigate('/user/tools/checklist')}
                className="text-[9px] font-black uppercase tracking-widest text-[#3D2B2B]"
              >
                OPEN
              </button>
            </div>
            <div className="space-y-3">
              {[
                { task: 'Research Planners', done: false },
                { task: 'Set Budget', done: true }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${item.done ? 'bg-[#3D2B2B] border-[#3D2B2B]' : 'border-[#3D2B2B]/10'}`}>
                    {item.done && <span className="text-white text-[8px]">✓</span>}
                  </div>
                  <span className={`text-[11px] font-bold ${item.done ? 'text-[#3D2B2B]/20 line-through' : 'text-[#3D2B2B]/60'}`}>
                    {item.task}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 7. Photographers Collections in Indore */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          Photographers Collections in Indore
        </h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {photographerCollections.map((collection, index) => (
            <div
              key={collection.id}
              onClick={() => navigate(collection.route)}
              className="flex-shrink-0 w-36 cursor-pointer active:scale-95 transition-transform overflow-hidden"
              style={{ 
                backgroundColor: index === 0 ? theme.colors.primary[500] : index === 1 ? theme.colors.secondary[500] : theme.colors.primary[400],
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                height: '150px'
              }}
            >
              <div className="relative h-full p-3 flex flex-col">
                <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-2 border-4 border-white/30">
                  <img
                    src={collection.image}
                    alt={collection.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xs font-semibold text-white text-center mb-1">{collection.title}</h3>
                <p className="text-xs text-white/90 text-center">{collection.count}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NEW: Bridal Makeup Artists */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          Bridal Makeup Artists in your city
        </h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 mb-4">
          {makeupArtists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => navigate(artist.route)}
              className="flex-shrink-0 w-52 cursor-pointer active:scale-95 transition-transform"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}
            >
              <div className="relative overflow-hidden">
                <img
                  src={artist.image}
                  alt={artist.name}
                  loading="lazy"
                  className="w-full h-36 object-cover"
                  onError={(e) => handleImageError(e, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop&q=80')}
                />
                <div className="absolute top-2 right-2 bg-white px-2 py-1 flex items-center gap-1 shadow-sm">
                  <span className="text-yellow-500 text-xs">⭐</span>
                  <span className="text-xs font-semibold text-gray-900">{artist.rating}</span>
                  <span className="text-xs text-gray-500">({artist.reviews})</span>
                </div>
              </div>
              <div className="p-2 bg-white">
                <h3 className="text-xs font-semibold text-gray-900 mb-1">{artist.name}</h3>
                <p className="text-xs text-gray-600 mb-1">{artist.location}</p>
                <p className="text-sm font-semibold text-pink-600">
                  {artist.price} <span className="text-xs font-normal text-gray-600">{artist.priceType}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate('/user/vendors/makeup')}
          className="w-full py-3 text-center text-sm font-semibold text-orange-500 border border-orange-500 active:scale-95 transition-transform"
        >
          View all makeup artists →
        </button>
      </div>

      {/* NEW: Special Offer Banner */}
      <div className="px-4 py-6">
        <div
          onClick={() => navigate('/user/special-offers')}
          className="relative overflow-hidden cursor-pointer active:scale-95 transition-transform"
          style={{ 
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
          }}
        >
          <div className="p-6 text-center">
            <div className="mb-2">
              <div className="w-12 h-12 mx-auto rounded-full overflow-hidden">
                <img src="https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=100&h=100&fit=crop&q=80" alt="Offer" className="w-full h-full object-cover" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Limited Time Offer!</h3>
            <p className="text-sm text-gray-700 mb-1">Book 3 vendors and get</p>
            <p className="text-lg font-bold text-pink-600 mb-3">20% OFF on total booking</p>
            <button className="px-6 py-2 bg-pink-600 text-white font-semibold text-sm">
              Claim Offer
            </button>
          </div>
        </div>
      </div>

      {/* NEW: Wedding Decorators */}
      <div className="px-4 py-6 bg-gray-50">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          Top Wedding Decorators
        </h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 mb-4">
          {decorators.map((decorator) => (
            <div
              key={decorator.id}
              onClick={() => navigate(decorator.route)}
              className="flex-shrink-0 w-52 cursor-pointer active:scale-95 transition-transform"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}
            >
              <div className="relative overflow-hidden">
                <img
                  src={decorator.image}
                  alt={decorator.name}
                  loading="lazy"
                  className="w-full h-36 object-cover"
                  onError={(e) => handleImageError(e, 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop&q=80')}
                />
                <div className="absolute top-2 right-2 bg-white px-2 py-1 flex items-center gap-1 shadow-sm">
                  <span className="text-yellow-500 text-xs">⭐</span>
                  <span className="text-xs font-semibold text-gray-900">{decorator.rating}</span>
                  <span className="text-xs text-gray-500">({decorator.reviews})</span>
                </div>
              </div>
              <div className="p-2 bg-white">
                <h3 className="text-xs font-semibold text-gray-900 mb-1">{decorator.name}</h3>
                <p className="text-xs text-gray-600 mb-1">{decorator.location}</p>
                <p className="text-sm font-semibold text-pink-600">
                  {decorator.price} <span className="text-xs font-normal text-gray-600">{decorator.priceType}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate('/user/vendors/decorators')}
          className="w-full py-3 text-center text-sm font-semibold text-orange-500 border border-orange-500 bg-white active:scale-95 transition-transform"
        >
          View all decorators →
        </button>
      </div>

      {/* 8. Trending Today */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-900">
          Trending Today
        </h2>
        <p className="text-pink-600 font-medium mb-4">#bridal-jewellery</p>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 mb-4">
          {trendingToday.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(item.route)}
              className="flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}
            >
              <div className="relative overflow-hidden w-40">
                <img
                  src={item.image}
                  alt={item.hashtag}
                  loading="lazy"
                  className="w-full h-28 object-cover"
                  onError={(e) => handleImageError(e, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=300&fit=crop&q=80')}
                />
                <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1">
                  <p className="text-xs font-semibold text-white">{item.hashtag}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate('/user/trending')}
          className="w-full py-3 text-center text-sm font-semibold text-orange-500 border border-orange-500 active:scale-95 transition-transform"
        >
          View all trending today →
        </button>
      </div>

      {/* 9. Utsavo Promotional Banner */}
      <div className="px-4 py-6">
        <div
          onClick={() => navigate('/user/venue-booking-offer')}
          className="relative overflow-hidden cursor-pointer active:scale-95 transition-transform"
          style={{ 
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            background: 'linear-gradient(135deg, #f5f5dc 0%, #e8d5b7 100%)'
          }}
        >
          <div className="p-6 text-center">
            <div className="mb-3">
              <div className="w-10 h-10 mx-auto rounded-full overflow-hidden">
                <img src="https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=100&h=100&fit=crop&q=80" alt="Utsavo" className="w-full h-full object-cover" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">BOOKED your VENUE?</h3>
            <p className="text-sm text-gray-700 mb-1">Get <span className="font-bold">FREE Wedding Decor</span></p>
            <p className="text-sm text-gray-700 mb-4"><span className="font-bold">Moodboard</span> for all your functions</p>
            <button className="px-6 py-2 bg-green-600 text-white font-semibold text-sm">
              Download Now
            </button>
          </div>
        </div>
      </div>

      {/* 10. Utsavo Services */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          Utsavo Services
        </h2>
        
        {/* Genie Services */}
        <div
          onClick={() => navigate('/user/genie-services')}
          className="relative overflow-hidden cursor-pointer active:scale-95 transition-transform mb-4"
          style={{ boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)' }}
        >
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=300&fit=crop&q=80"
            alt="Genie Services"
            loading="lazy"
            className="w-full h-44 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <h3 className="text-xl font-bold text-white mb-2">Genie Services</h3>
            <p className="text-sm text-white/95">Plan your dream wedding in your budget</p>
          </div>
        </div>

        {/* Venue Booking Service */}
        <div
          onClick={() => navigate('/user/venue-booking')}
          className="relative overflow-hidden cursor-pointer active:scale-95 transition-transform w-56"
          style={{ boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)' }}
        >
          <img
            src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop&q=80"
            alt="Venue Booking Service"
            loading="lazy"
            className="w-full h-36 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-base font-bold text-white mb-1">Venue Booking Service</h3>
            <p className="text-xs text-white/95">Best Price Guaranteed</p>
          </div>
        </div>
      </div>

      {/* Remaining sections will be added after next 3 screenshots */}

      {/* 11. Wedding Ideas */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          Wedding ideas
        </h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {weddingIdeas.map((idea) => (
            <div
              key={idea.id}
              onClick={() => navigate(idea.route)}
              className="flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}
            >
              <div className="relative overflow-hidden w-36">
                <img
                  src={idea.image}
                  alt={idea.title}
                  loading="lazy"
                  className="w-full h-44 object-cover"
                  onError={(e) => handleImageError(e, 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&h=500&fit=crop&q=80')}
                />
              </div>
              <div className="p-2 bg-white">
                <p className="text-xs font-medium text-gray-900">{idea.title}</p>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate('/user/inspirations')}
          className="w-full py-3 mt-4 text-center text-sm font-semibold text-orange-500 border border-orange-500 active:scale-95 transition-transform"
        >
          View all wedding ideas →
        </button>
      </div>

      {/* NEW: Bridal Looks & Styling */}
      <div className="px-4 py-6 bg-gray-50">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          Bridal Looks & Styling Ideas
        </h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {bridalLooks.map((look) => (
            <div
              key={look.id}
              onClick={() => navigate(look.route)}
              className="flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}
            >
              <div className="relative overflow-hidden w-32">
                <img
                  src={look.image}
                  alt={look.title}
                  loading="lazy"
                  className="w-full h-40 object-cover"
                  onError={(e) => handleImageError(e, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=500&fit=crop&q=80')}
                />
              </div>
              <div className="p-2 bg-white">
                <p className="text-xs font-medium text-gray-900">{look.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NEW: Planning Tools Banner */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => navigate('/user/tools/budget')}
            className="relative overflow-hidden cursor-pointer active:scale-95 transition-transform p-4"
            style={{ 
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              minHeight: '120px'
            }}
          >
            <div className="w-8 h-8 mb-2 rounded-full overflow-hidden">
              <img src="https://images.unsplash.com/photo-1554224311-beee415c201f?w=100&h=100&fit=crop&q=80" alt="Budget" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Budget Planner</h3>
            <p className="text-xs text-gray-600">Track expenses</p>
          </div>
          <div
            onClick={() => navigate('/user/tools/checklist')}
            className="relative overflow-hidden cursor-pointer active:scale-95 transition-transform p-4"
            style={{ 
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
              minHeight: '120px'
            }}
          >
            <div className="w-8 h-8 mb-2 rounded-full overflow-hidden">
              <img src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=100&h=100&fit=crop&q=80" alt="Checklist" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Checklist</h3>
            <p className="text-xs text-gray-600">Stay organized</p>
          </div>
        </div>
      </div>

      {/* NEW: Decor Inspirations */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          Decor & Theme Inspirations
        </h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {decorInspirations.map((decor) => (
            <div
              key={decor.id}
              onClick={() => navigate(decor.route)}
              className="flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}
            >
              <div className="relative overflow-hidden w-32">
                <img
                  src={decor.image}
                  alt={decor.title}
                  loading="lazy"
                  className="w-full h-40 object-cover"
                  onError={(e) => handleImageError(e, 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=500&fit=crop&q=80')}
                />
              </div>
              <div className="p-2 bg-white">
                <p className="text-xs font-medium text-gray-900">{decor.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 12. Featured Video */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          Featured Video
        </h2>
        <div
          onClick={() => navigate('/user/featured-video')}
          className="relative overflow-hidden cursor-pointer active:scale-95 transition-transform"
          style={{ boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)' }}
        >
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=500&fit=crop&q=80"
            alt="Featured Wedding Video"
            loading="lazy"
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
              <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-pink-600 border-b-8 border-b-transparent ml-1"></div>
            </div>
          </div>
          <div className="absolute top-4 left-4">
            <p className="text-white/80 text-sm">Utsavo</p>
          </div>
        </div>
      </div>

      {/* 13. Interesting Reads */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          Interesting reads
        </h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 mb-4">
          {interestingReads.map((read) => (
            <div
              key={read.id}
              onClick={() => navigate(read.route)}
              className="flex-shrink-0 w-60 cursor-pointer active:scale-95 transition-transform"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}
            >
              <div className="relative overflow-hidden">
                <img
                  src={read.image}
                  alt={read.title}
                  loading="lazy"
                  className="w-full h-36 object-cover"
                  onError={(e) => handleImageError(e, 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&h=300&fit=crop&q=80')}
                />
              </div>
              <div className="p-2 bg-white">
                <p className="text-sm font-medium text-gray-900">{read.title}</p>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate('/user/reads')}
          className="w-full py-3 text-center text-sm font-semibold text-orange-500 border border-orange-500 active:scale-95 transition-transform"
        >
          View all interesting reads →
        </button>
      </div>

      {/* NEW: Trending Vendors */}
      <div className="px-4 py-6 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Trending Vendors
          </h2>
          <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 font-semibold flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
            </svg>
            HOT
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {trendingVendors.map((vendor) => (
            <div
              key={vendor.id}
              onClick={() => navigate(vendor.route)}
              className="flex-shrink-0 w-44 cursor-pointer active:scale-95 transition-transform"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}
            >
              <div className="relative overflow-hidden">
                <img
                  src={vendor.image}
                  alt={vendor.name}
                  loading="lazy"
                  className="w-full h-32 object-cover"
                  onError={(e) => handleImageError(e, 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&h=400&fit=crop&q=80')}
                />
                <div className="absolute top-2 left-2 bg-pink-600 text-white px-2 py-1 text-xs font-semibold">
                  TRENDING
                </div>
                <div className="absolute top-2 right-2 bg-white px-2 py-1 flex items-center gap-1 shadow-sm">
                  <span className="text-yellow-500 text-xs">⭐</span>
                  <span className="text-xs font-semibold text-gray-900">{vendor.rating}</span>
                </div>
              </div>
              <div className="p-2 bg-white">
                <h3 className="text-xs font-semibold text-gray-900 mb-1">{vendor.name}</h3>
                <p className="text-xs text-gray-600">{vendor.city}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NEW: Wedding Inspiration Feed */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          More Wedding Inspiration
        </h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {weddingFeed.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(item.route)}
              className="flex-shrink-0 w-36 cursor-pointer active:scale-95 transition-transform"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}
            >
              <div className="relative overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-44 object-cover"
                  onError={(e) => handleImageError(e, 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&h=500&fit=crop&q=80')}
                />
              </div>
              <div className="p-2 bg-white">
                <p className="text-xs font-medium text-gray-900">{item.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NEW: Quick Actions */}
      <div className="px-4 py-6 bg-gradient-to-br from-purple-50 to-pink-50">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 text-center">
          Quick Actions
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div
            onClick={() => navigate('/user/vendors')}
            className="bg-white p-4 text-center cursor-pointer active:scale-95 transition-transform"
            style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="w-8 h-8 mx-auto mb-2 rounded-full overflow-hidden">
              <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=100&h=100&fit=crop&q=80" alt="Find Vendors" className="w-full h-full object-cover" />
            </div>
            <p className="text-xs font-semibold text-gray-900">Find Vendors</p>
          </div>
          <div
            onClick={() => navigate('/user/shortlist')}
            className="bg-white p-4 text-center cursor-pointer active:scale-95 transition-transform"
            style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="w-8 h-8 mx-auto mb-2 rounded-full overflow-hidden">
              <img src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=100&h=100&fit=crop&q=80" alt="Shortlist" className="w-full h-full object-cover" />
            </div>
            <p className="text-xs font-semibold text-gray-900">Shortlist</p>
          </div>
          <div
            onClick={() => navigate('/user/chats')}
            className="bg-white p-4 text-center cursor-pointer active:scale-95 transition-transform"
            style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="w-8 h-8 mx-auto mb-2 rounded-full overflow-hidden">
              <img src="https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=100&h=100&fit=crop&q=80" alt="Chat" className="w-full h-full object-cover" />
            </div>
            <p className="text-xs font-semibold text-gray-900">Chat</p>
          </div>
        </div>
      </div>

      {/* 14. Rate Your Experience */}
      <div className="px-4 py-6">
        <div 
          className="p-8 text-center"
          style={{ 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <h2 className="text-xl font-semibold mb-6 text-white">
            Rate your experience with us
          </h2>
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center active:scale-110 transition-transform"
                onClick={() => {}}
              >
                <svg className="w-6 h-6 text-white opacity-60" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 15. Real Weddings We Love */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          Real weddings we love
        </h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {realWeddings.map((wedding) => (
            <div
              key={wedding.id}
              onClick={() => navigate(wedding.route)}
              className="flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}
            >
              <div className="relative overflow-hidden w-60">
                <img
                  src={wedding.image}
                  alt={`${wedding.coupleName} Wedding`}
                  loading="lazy"
                  className="w-full h-64 object-cover"
                  onError={(e) => handleImageError(e, 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop&q=80')}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-sm font-semibold text-white">{wedding.coupleName}</h3>
                  <p className="text-xs text-white/90">{wedding.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default UserHome;