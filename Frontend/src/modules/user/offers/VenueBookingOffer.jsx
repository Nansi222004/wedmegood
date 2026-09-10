import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useToast } from '../../../components/ui/Toast';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import { vendors } from '../../../data/vendors';

const VenueBookingOffer = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();
  
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get all venues
  const allVenues = vendors.filter(vendor => vendor.category === 'venues');

  // Venue offers data
  const venueOffers = [
    {
      id: 1,
      venue: allVenues[0],
      venueId: 1,
      offerTitle: 'Early Bird Special',
      discount: '40% OFF',
      originalPrice: '₹2,50,000',
      offerPrice: '₹1,50,000',
      savings: '₹1,00,000',
      validUntil: '2026-03-31',
      features: [
        'Venue for 2 functions',
        'Catering for 500 guests',
        'Basic decoration included',
        'Complimentary valet parking',
        'Bridal room access'
      ],
      terms: 'Book 6 months in advance',
      badge: 'Best Value',
      popular: true
    },
    {
      id: 2,
      venue: allVenues[2],
      venueId: 3,
      offerTitle: 'Luxury Package Deal',
      discount: '₹1,50,000 OFF',
      originalPrice: '₹4,50,000',
      offerPrice: '₹3,00,000',
      savings: '₹1,50,000',
      validUntil: '2026-04-30',
      features: [
        'Premium venue booking',
        'Luxury accommodation (10 rooms)',
        'Catering for 800 guests',
        'Premium decoration',
        'Spa access for bride & groom'
      ],
      terms: 'Valid for destination weddings',
      badge: 'Luxury',
      popular: true
    },
    {
      id: 3,
      venue: allVenues[1],
      venueId: 2,
      offerTitle: 'Weekend Special',
      discount: '30% OFF',
      originalPrice: '₹1,80,000',
      offerPrice: '₹1,26,000',
      savings: '₹54,000',
      validUntil: '2026-05-15',
      features: [
        'Venue for 1 day',
        'Catering for 400 guests',
        'Stage decoration',
        'Sound system included',
        'Parking for 100 vehicles'
      ],
      terms: 'Valid for Friday-Sunday bookings',
      badge: 'Weekend Deal',
      popular: false
    },
    {
      id: 4,
      venue: allVenues[4],
      venueId: 5,
      offerTitle: 'Monsoon Magic Offer',
      discount: '50% OFF',
      originalPrice: '₹3,00,000',
      offerPrice: '₹1,50,000',
      savings: '₹1,50,000',
      validUntil: '2026-08-31',
      features: [
        'Indoor venue booking',
        'Catering for 600 guests',
        'Rain-proof setup',
        'Climate control',
        'Backup power supply'
      ],
      terms: 'Valid for July-September weddings',
      badge: 'Seasonal',
      popular: true
    },
    {
      id: 5,
      venue: allVenues[5],
      venueId: 6,
      offerTitle: 'Intimate Wedding Package',
      discount: '35% OFF',
      originalPrice: '₹1,20,000',
      offerPrice: '₹78,000',
      savings: '₹42,000',
      validUntil: '2026-06-30',
      features: [
        'Boutique venue',
        'Catering for 150 guests',
        'Elegant decoration',
        'Personalized service',
        'Photography area'
      ],
      terms: 'For weddings under 200 guests',
      badge: 'Intimate',
      popular: false
    },
    {
      id: 6,
      venue: allVenues[7],
      venueId: 8,
      offerTitle: 'Royal Heritage Package',
      discount: '₹2,00,000 OFF',
      originalPrice: '₹6,00,000',
      offerPrice: '₹4,00,000',
      savings: '₹2,00,000',
      validUntil: '2026-12-31',
      features: [
        'Heritage property venue',
        'Royal theme decoration',
        'Catering for 1000 guests',
        'Traditional entertainment',
        'Heritage photo locations'
      ],
      terms: 'Minimum 3-day booking required',
      badge: 'Heritage',
      popular: true
    },
    {
      id: 7,
      venue: allVenues[3],
      venueId: 4,
      offerTitle: 'Garden Wedding Special',
      discount: '25% OFF',
      originalPrice: '₹2,00,000',
      offerPrice: '₹1,50,000',
      savings: '₹50,000',
      validUntil: '2026-04-15',
      features: [
        'Beautiful garden venue',
        'Outdoor setup',
        'Catering for 500 guests',
        'Floral decoration',
        'Natural lighting'
      ],
      terms: 'Valid for day weddings only',
      badge: 'Outdoor',
      popular: false
    },
    {
      id: 8,
      venue: allVenues[6],
      venueId: 7,
      offerTitle: 'Banquet Hall Combo',
      discount: '45% OFF',
      originalPrice: '₹1,60,000',
      offerPrice: '₹88,000',
      savings: '₹72,000',
      validUntil: '2026-05-31',
      features: [
        'AC banquet hall',
        'Catering for 350 guests',
        'Stage & mandap setup',
        'LED lighting',
        'DJ setup area'
      ],
      terms: 'Book venue + catering together',
      badge: 'Combo Deal',
      popular: true
    }
  ];

  // Filter options
  const filters = [
    { id: 'all', name: 'All Offers', count: venueOffers.length },
    { id: 'popular', name: 'Most Popular', count: venueOffers.filter(o => o.popular).length },
    { id: 'luxury', name: 'Luxury', count: venueOffers.filter(o => parseInt(o.offerPrice.replace(/[^\d]/g, '')) >= 300000).length },
    { id: 'budget', name: 'Budget Friendly', count: venueOffers.filter(o => parseInt(o.offerPrice.replace(/[^\d]/g, '')) < 150000).length }
  ];

  // Filter offers
  const filteredOffers = venueOffers.filter(offer => {
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'popular' && offer.popular) ||
      (selectedFilter === 'luxury' && parseInt(offer.offerPrice.replace(/[^\d]/g, '')) >= 300000) ||
      (selectedFilter === 'budget' && parseInt(offer.offerPrice.replace(/[^\d]/g, '')) < 150000);
    
    const matchesSearch = searchQuery === '' ||
      offer.venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.offerTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.venue.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Calculate days remaining
  const getDaysRemaining = (validUntil) => {
    const today = new Date();
    const endDate = new Date(validUntil);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleBookNow = (offer) => {
    showToast(`Booking ${offer.venue.name}...`, 'success', 2000);
    setTimeout(() => {
      navigate(`/user/vendor/${offer.venueId}`);
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
            Venue Booking Offers
          </h1>
          
          <div className="w-12 sm:w-16"></div>
        </div>

        {/* Hero Banner */}
        <div 
          className="mb-6 p-6 rounded-2xl relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary[500]} 0%, ${theme.colors.accent[500]} 100%)`,
            boxShadow: `0 8px 24px ${theme.colors.primary[500]}40`
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="location" size="lg" style={{ color: 'white' }} />
              <span className="text-white text-xs font-semibold px-2 py-1 bg-white/20 rounded-full">
                {filteredOffers.length} Exclusive Deals
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Exclusive Venue Booking Offers
            </h2>
            <p className="text-white/90 text-sm">
              Save up to 50% on premium wedding venues
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold mb-1" style={{ color: theme.colors.accent[600] }}>
              {venueOffers.length}
            </p>
            <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
              Active Offers
            </p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold mb-1" style={{ color: theme.colors.secondary[600] }}>
              50%
            </p>
            <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
              Max Discount
            </p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold mb-1" style={{ color: theme.colors.primary[600] }}>
              ₹2L
            </p>
            <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
              Max Savings
            </p>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className="flex-shrink-0 px-4 py-2 rounded-lg border transition-all flex items-center gap-2"
                style={{
                  backgroundColor: selectedFilter === filter.id 
                    ? theme.colors.primary[500]
                    : theme.semantic.background.accent,
                  borderColor: selectedFilter === filter.id 
                    ? theme.colors.primary[500]
                    : theme.semantic.border.light,
                  color: selectedFilter === filter.id ? 'white' : theme.semantic.text.primary
                }}
              >
                <span className="text-sm font-medium">{filter.name}</span>
                <span 
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: selectedFilter === filter.id 
                      ? 'rgba(255,255,255,0.2)'
                      : theme.colors.primary[100],
                    color: selectedFilter === filter.id 
                      ? 'white'
                      : theme.colors.primary[700]
                  }}
                >
                  {filter.count}
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
              placeholder="Search venues..."
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
        <div className="space-y-4">
          {filteredOffers.map((offer) => {
            const daysRemaining = getDaysRemaining(offer.validUntil);
            
            return (
              <Card key={offer.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="md:flex">
                  {/* Image */}
                  <div className="relative md:w-2/5">
                    <img 
                      src={offer.venue.image} 
                      alt={offer.venue.name}
                      className="w-full h-64 md:h-full object-cover"
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
                      className="absolute top-3 right-3 px-3 py-2 rounded-lg text-lg font-bold"
                      style={{
                        backgroundColor: theme.colors.secondary[500],
                        color: 'white'
                      }}
                    >
                      {offer.discount}
                    </div>
                    {offer.popular && (
                      <div 
                        className="absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                        style={{
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: 'white'
                        }}
                      >
                        <Icon name="star" size="xs" />
                        Popular
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 md:w-3/5 flex flex-col">
                    <div className="flex-1">
                      <h3 
                        className="text-xl font-bold mb-1"
                        style={{ color: theme.semantic.text.primary }}
                      >
                        {offer.venue.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="location" size="xs" style={{ color: theme.semantic.text.secondary }} />
                        <p 
                          className="text-sm"
                          style={{ color: theme.semantic.text.secondary }}
                        >
                          {offer.venue.location}
                        </p>
                      </div>

                      <h4 
                        className="text-lg font-semibold mb-3"
                        style={{ color: theme.colors.primary[600] }}
                      >
                        {offer.offerTitle}
                      </h4>

                      {/* Features */}
                      <div className="mb-4">
                        <p className="text-xs font-semibold mb-2" style={{ color: theme.semantic.text.secondary }}>
                          Package Includes:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {offer.features.map((feature, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <Icon name="check" size="xs" style={{ color: theme.colors.accent[500], marginTop: '2px' }} />
                              <span className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Terms */}
                      <div 
                        className="p-2 rounded mb-4"
                        style={{ backgroundColor: theme.colors.primary[50] }}
                      >
                        <p className="text-xs" style={{ color: theme.colors.primary[700] }}>
                          <span className="font-semibold">Terms:</span> {offer.terms}
                        </p>
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div>
                      <div className="flex items-baseline gap-2 mb-2">
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
                        <span 
                          className="text-sm font-semibold"
                          style={{ color: theme.colors.accent[600] }}
                        >
                          Save {offer.savings}
                        </span>
                      </div>

                      {/* Validity */}
                      <div 
                        className="flex items-center gap-2 mb-3 p-2 rounded"
                        style={{ backgroundColor: theme.semantic.background.secondary }}
                      >
                        <Icon name="clock" size="sm" style={{ color: theme.colors.accent[500] }} />
                        <span 
                          className="text-xs font-medium"
                          style={{ color: theme.semantic.text.secondary }}
                        >
                          {daysRemaining > 0 
                            ? `Offer valid for ${daysRemaining} more days` 
                            : 'Offer expired'}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleBookNow(offer)}
                          variant="primary"
                          className="flex-1"
                          disabled={daysRemaining === 0}
                        >
                          {daysRemaining > 0 ? 'Book Now' : 'Expired'}
                        </Button>
                        <Button
                          onClick={() => navigate(`/user/vendor/${offer.venueId}`)}
                          variant="outline"
                          className="px-4"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
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
                <Icon name="location" size="2xl" style={{ color: theme.colors.primary[500] }} />
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
              Try adjusting your search or filter
            </p>
            <Button 
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('all');
              }}
              variant="primary"
            >
              View All Offers
            </Button>
          </div>
        )}

        {/* Call to Action */}
        <Card 
          className="mt-8 p-6 text-center"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.accent[50]} 0%, ${theme.colors.primary[50]} 100%)`
          }}
        >
          <Icon 
            name="gift" 
            size="2xl" 
            className="mx-auto mb-3"
            style={{ color: theme.colors.primary[500] }} 
          />
          <h3 
            className="text-lg font-bold mb-2"
            style={{ color: theme.semantic.text.primary }}
          >
            Need Help Choosing?
          </h3>
          <p 
            className="text-sm mb-4"
            style={{ color: theme.semantic.text.secondary }}
          >
            Our wedding planners can help you find the perfect venue
          </p>
          <button
            onClick={() => navigate('/user/help')}
            className="px-6 py-2.5 rounded-lg font-medium text-white"
            style={{ backgroundColor: theme.colors.primary[500] }}
          >
            Contact Us
          </button>
        </Card>
      </div>
      
      {/* Toast Component */}
      <ToastComponent />
    </div>
  );
};

export default VenueBookingOffer;
