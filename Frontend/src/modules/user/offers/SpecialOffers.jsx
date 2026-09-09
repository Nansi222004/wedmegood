import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useToast } from '../../../components/ui/Toast';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';

const SpecialOffers = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Special offers data
  const offers = [
    {
      id: 1,
      title: 'Early Bird Wedding Package',
      vendor: 'Glamour Makeup Studio',
      vendorId: 21,
      category: 'makeup',
      discount: '30% OFF',
      originalPrice: '₹25,000',
      offerPrice: '₹17,500',
      validUntil: '2026-03-31',
      description: 'Book 6 months in advance and get 30% off on bridal makeup package including trial, bridal day makeup, and hair styling.',
      features: ['Bridal Makeup', 'Hair Styling', 'Makeup Trial', 'Touch-up Kit'],
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop&q=80',
      badge: 'Limited Time',
      trending: true
    },
    {
      id: 2,
      title: 'Complete Photography Bundle',
      vendor: 'The Wedding Essence By PSF',
      vendorId: 11,
      category: 'photographers',
      discount: '25% OFF',
      originalPrice: '₹80,000',
      offerPrice: '₹60,000',
      validUntil: '2026-04-15',
      description: 'Complete wedding photography package with pre-wedding shoot, wedding day coverage, and premium album at special price.',
      features: ['Pre-Wedding Shoot', 'Wedding Day Coverage', 'Premium Album', 'Digital Copies'],
      image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&h=400&fit=crop&q=80',
      badge: 'Best Value',
      trending: true
    },
    {
      id: 3,
      title: 'Venue + Catering Combo',
      vendor: 'Grand Celebration Hall',
      vendorId: 2,
      category: 'venues',
      discount: '₹50,000 OFF',
      originalPrice: '₹2,50,000',
      offerPrice: '₹2,00,000',
      validUntil: '2026-05-31',
      description: 'Book venue and catering together and save ₹50,000. Includes venue decoration, catering for 500 guests, and complimentary valet parking.',
      features: ['Venue Booking', 'Catering for 500', 'Basic Decoration', 'Valet Parking'],
      image: 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=600&h=400&fit=crop&q=80',
      badge: 'Popular',
      trending: false
    },
    {
      id: 4,
      title: 'Destination Wedding Special',
      vendor: 'Bridal Bliss Makeup',
      vendorId: 30,
      category: 'makeup',
      discount: '20% OFF',
      originalPrice: '₹45,000',
      offerPrice: '₹36,000',
      validUntil: '2026-06-30',
      description: 'Special package for destination weddings including travel, accommodation, and makeup services for bride and family.',
      features: ['Travel Included', 'Accommodation', 'Bridal Makeup', 'Family Makeup (5 people)'],
      image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=600&h=400&fit=crop&q=80',
      badge: 'Exclusive',
      trending: true
    },
    {
      id: 5,
      title: 'Mehendi + Sangeet Package',
      vendor: 'Mehndi Magic by Riya',
      vendorId: 51,
      category: 'mehndi',
      discount: '35% OFF',
      originalPrice: '₹15,000',
      offerPrice: '₹9,750',
      validUntil: '2026-03-15',
      description: 'Combined package for mehendi and sangeet ceremonies with intricate bridal mehendi and family mehendi services.',
      features: ['Bridal Mehendi', 'Family Mehendi (10 people)', 'Sangeet Mehendi', 'Design Consultation'],
      image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&h=400&fit=crop&q=80',
      badge: 'Hot Deal',
      trending: true
    },
    {
      id: 6,
      title: 'Luxury Decor Package',
      vendor: 'Dream Decor Events',
      vendorId: 31,
      category: 'decorators',
      discount: '₹75,000 OFF',
      originalPrice: '₹3,50,000',
      offerPrice: '₹2,75,000',
      validUntil: '2026-04-30',
      description: 'Premium wedding decoration package including mandap, stage, entrance, and floral arrangements with lighting.',
      features: ['Mandap Decoration', 'Stage Setup', 'Entrance Decor', 'Floral Arrangements', 'Lighting'],
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop&q=80',
      badge: 'Premium',
      trending: false
    },
    {
      id: 7,
      title: 'DJ + Choreography Combo',
      vendor: 'Beats & Moves Entertainment',
      vendorId: 141,
      category: 'music',
      discount: '40% OFF',
      originalPrice: '₹1,20,000',
      offerPrice: '₹72,000',
      validUntil: '2026-05-15',
      description: 'Complete entertainment package with professional DJ services and choreography for sangeet performances.',
      features: ['DJ Services (2 events)', 'Choreography Sessions', 'Sound System', 'Lighting Setup'],
      image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop&q=80',
      badge: 'Super Saver',
      trending: true
    },
    {
      id: 8,
      title: 'Bridal Trousseau Styling',
      vendor: 'Elegant Touch Makeup',
      vendorId: 25,
      category: 'makeup',
      discount: '25% OFF',
      originalPrice: '₹40,000',
      offerPrice: '₹30,000',
      validUntil: '2026-03-31',
      description: 'Complete bridal styling package for all wedding functions including makeup, hair, and saree draping.',
      features: ['3 Function Makeup', 'Hair Styling', 'Saree Draping', 'Jewelry Coordination'],
      image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=400&fit=crop&q=80',
      badge: 'New',
      trending: false
    },
    {
      id: 9,
      title: 'Pre-Wedding Shoot Package',
      vendor: 'Candid Moments Studio',
      vendorId: 13,
      category: 'photographers',
      discount: '30% OFF',
      originalPrice: '₹35,000',
      offerPrice: '₹24,500',
      validUntil: '2026-04-30',
      description: 'Romantic pre-wedding photoshoot at 2 locations with costume changes and premium editing.',
      features: ['2 Locations', '2 Costume Changes', 'Premium Editing', '100 Edited Photos', 'Digital Album'],
      image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&h=400&fit=crop&q=80',
      badge: 'Trending',
      trending: true
    },
    {
      id: 10,
      title: 'Wedding Invitation Suite',
      vendor: 'Creative Cards & Invites',
      vendorId: 71,
      category: 'invitations',
      discount: '50% OFF',
      originalPrice: '₹20,000',
      offerPrice: '₹10,000',
      validUntil: '2026-03-20',
      description: 'Complete invitation package including save the dates, wedding invitations, and thank you cards with custom design.',
      features: ['Custom Design', 'Save the Dates (100)', 'Wedding Invites (500)', 'Thank You Cards (100)'],
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&h=400&fit=crop&q=80',
      badge: 'Flash Sale',
      trending: true
    },
    {
      id: 11,
      title: 'Honeymoon Photography',
      vendor: 'Travel Memories Photography',
      vendorId: 15,
      category: 'photographers',
      discount: '20% OFF',
      originalPrice: '₹50,000',
      offerPrice: '₹40,000',
      validUntil: '2026-06-30',
      description: 'Capture your honeymoon memories with professional photography services at your destination.',
      features: ['3 Days Coverage', 'All Edited Photos', 'Travel Included', 'Candid & Posed Shots'],
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=400&fit=crop&q=80',
      badge: 'Romantic',
      trending: false
    },
    {
      id: 12,
      title: 'Bridal Jewelry Package',
      vendor: 'Royal Jewels Collection',
      vendorId: 91,
      category: 'jewellery',
      discount: '15% OFF',
      originalPrice: '₹1,50,000',
      offerPrice: '₹1,27,500',
      validUntil: '2026-05-31',
      description: 'Complete bridal jewelry set including necklace, earrings, maang tikka, and bangles in traditional design.',
      features: ['Necklace Set', 'Earrings', 'Maang Tikka', 'Bangles', 'Free Cleaning Service'],
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=400&fit=crop&q=80',
      badge: 'Luxury',
      trending: false
    }
  ];

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Offers', icon: 'grid', count: offers.length },
    { id: 'makeup', name: 'Makeup', icon: 'sparkles', count: offers.filter(o => o.category === 'makeup').length },
    { id: 'photographers', name: 'Photography', icon: 'camera', count: offers.filter(o => o.category === 'photographers').length },
    { id: 'venues', name: 'Venues', icon: 'location', count: offers.filter(o => o.category === 'venues').length },
    { id: 'decorators', name: 'Decor', icon: 'star', count: offers.filter(o => o.category === 'decorators').length },
    { id: 'trending', name: 'Trending', icon: 'trending', count: offers.filter(o => o.trending).length }
  ];

  // Filter offers
  const filteredOffers = offers.filter(offer => {
    const matchesCategory = selectedCategory === 'all' || 
                           (selectedCategory === 'trending' ? offer.trending : offer.category === selectedCategory);
    const matchesSearch = searchQuery === '' || 
                         offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         offer.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         offer.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate days remaining
  const getDaysRemaining = (validUntil) => {
    const today = new Date();
    const endDate = new Date(validUntil);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleClaimOffer = (offer) => {
    showToast(`Offer claimed! Redirecting to ${offer.vendor}...`, 'success', 2000);
    setTimeout(() => {
      navigate(`/user/vendor/${offer.vendorId}`);
    }, 2000);
  };

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
            Special Offers
          </h1>
          
          <div className="w-12 sm:w-16"></div>
        </div>

        {/* Hero Banner */}
        <div 
          className="mb-6 p-6 rounded-2xl relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.secondary[500]} 0%, ${theme.colors.primary[500]} 100%)`,
            boxShadow: `0 8px 24px ${theme.colors.secondary[500]}40`
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="gift" size="lg" style={{ color: 'white' }} />
              <span className="text-white text-xs font-semibold px-2 py-1 bg-white/20 rounded-full">
                {filteredOffers.length} Active Offers
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Exclusive Wedding Deals
            </h2>
            <p className="text-white/90 text-sm">
              Save big on your dream wedding with our limited-time offers
            </p>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="flex-shrink-0 px-4 py-2 rounded-lg border transition-all flex items-center gap-2"
                style={{
                  backgroundColor: selectedCategory === category.id 
                    ? theme.colors.secondary[500]
                    : theme.semantic.background.accent,
                  borderColor: selectedCategory === category.id 
                    ? theme.colors.secondary[500]
                    : theme.semantic.border.light,
                  color: selectedCategory === category.id ? 'white' : theme.semantic.text.primary
                }}
              >
                <Icon name={category.icon} size="sm" />
                <span className="text-sm font-medium">{category.name}</span>
                <span 
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: selectedCategory === category.id 
                      ? 'rgba(255,255,255,0.2)'
                      : theme.colors.secondary[100],
                    color: selectedCategory === category.id 
                      ? 'white'
                      : theme.colors.secondary[700]
                  }}
                >
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Icon 
              name="search" 
              size="sm" 
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
              style={{ color: theme.semantic.text.secondary }}
            />
            <input
              type="text"
              placeholder="Search offers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm"
              style={{
                backgroundColor: theme.semantic.background.accent,
                borderColor: theme.semantic.border.light,
                color: theme.semantic.text.primary
              }}
            />
          </div>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOffers.map((offer) => {
            const daysRemaining = getDaysRemaining(offer.validUntil);
            
            return (
              <Card key={offer.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={offer.image} 
                      alt={offer.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Badge */}
                    <div 
                      className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: theme.colors.accent[500],
                        color: 'white'
                      }}
                    >
                      {offer.badge}
                    </div>
                    {/* Discount Badge */}
                    <div 
                      className="absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-bold"
                      style={{
                        backgroundColor: theme.colors.secondary[500],
                        color: 'white'
                      }}
                    >
                      {offer.discount}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 
                      className="text-lg font-bold mb-1"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      {offer.title}
                    </h3>
                    <p 
                      className="text-sm mb-3"
                      style={{ color: theme.semantic.text.secondary }}
                    >
                      by {offer.vendor}
                    </p>

                    <p 
                      className="text-sm mb-4 line-clamp-2"
                      style={{ color: theme.semantic.text.secondary }}
                    >
                      {offer.description}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {offer.features.slice(0, 3).map((feature, index) => (
                        <span 
                          key={index}
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: theme.colors.primary[50],
                            color: theme.colors.primary[700]
                          }}
                        >
                          {feature}
                        </span>
                      ))}
                      {offer.features.length > 3 && (
                        <span 
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: theme.colors.primary[50],
                            color: theme.colors.primary[700]
                          }}
                        >
                          +{offer.features.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-4">
                      <span 
                        className="text-2xl font-bold"
                        style={{ color: theme.colors.secondary[600] }}
                      >
                        {offer.offerPrice}
                      </span>
                      <span 
                        className="text-sm line-through"
                        style={{ color: theme.semantic.text.secondary }}
                      >
                        {offer.originalPrice}
                      </span>
                    </div>

                    {/* Validity */}
                    <div 
                      className="flex items-center gap-2 mb-4 p-2 rounded"
                      style={{ backgroundColor: theme.semantic.background.secondary }}
                    >
                      <Icon name="clock" size="sm" style={{ color: theme.colors.accent[500] }} />
                      <span 
                        className="text-xs font-medium"
                        style={{ color: theme.semantic.text.secondary }}
                      >
                        {daysRemaining > 0 
                          ? `Valid for ${daysRemaining} more days` 
                          : 'Offer expired'}
                      </span>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => handleClaimOffer(offer)}
                      variant="primary"
                      className="w-full"
                      disabled={daysRemaining === 0}
                    >
                      {daysRemaining > 0 ? 'Claim Offer' : 'Expired'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredOffers.length === 0 && (
          <div 
            className="text-center py-16 rounded-lg"
            style={{
              backgroundColor: theme.semantic.card.background,
              borderColor: theme.semantic.card.border,
              borderWidth: '1px',
              borderStyle: 'solid'
            }}
          >
            <div className="mb-4 flex justify-center">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.colors.primary[50] }}
              >
                <Icon name="gift" size="2xl" style={{ color: theme.colors.primary[500] }} />
              </div>
            </div>
            <h3 
              className="text-xl font-semibold mb-2"
              style={{ color: theme.semantic.text.primary }}
            >
              No offers found
            </h3>
            <p 
              className="text-sm mb-6"
              style={{ color: theme.semantic.text.secondary }}
            >
              Try adjusting your search or category filter
            </p>
            <Button 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              variant="primary"
            >
              View All Offers
            </Button>
          </div>
        )}
      </div>
      
      {/* Toast Component */}
      <ToastComponent />
    </div>
  );
};

export default SpecialOffers;
