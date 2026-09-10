import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../../contexts/CartContext';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';

const Cart = () => {
  const { cartState, removeFromCart, updateQuantity, getTotalPrice, addToCart, clearCart, unfinalizeItem, finalizeItem } = useCart();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [removingItems, setRemovingItems] = useState(new Set());
  const [expandedAddOns, setExpandedAddOns] = useState(new Set());
  const [activeTab, setActiveTab] = useState('shortlisted'); // 'shortlisted' or 'finalized'

  // Debug: Log cart state
  console.log('Cart state:', cartState);

  // Test function to add sample vendors for testing comparison
  const addTestVendors = () => {
    const testVendors = [
      {
        id: 101,
        name: 'Test Photographer 1',
        category: 'photographers',
        price: '₹25,000',
        image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400',
        rating: 4.5,
        location: 'Indore',
        phone: '+919876543210'
      },
      {
        id: 102,
        name: 'Test Photographer 2', 
        category: 'photographers',
        price: '₹30,000',
        image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400',
        rating: 4.7,
        location: 'Bhopal',
        phone: '+919876543211'
      },
      {
        id: 103,
        name: 'Test Makeup Artist 1',
        category: 'makeup',
        price: '₹15,000',
        image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
        rating: 4.6,
        location: 'Indore',
        phone: '+919876543212'
      },
      {
        id: 104,
        name: 'Test Makeup Artist 2',
        category: 'makeup',
        price: '₹18,000',
        image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400',
        rating: 4.8,
        location: 'Bhopal',
        phone: '+919876543213'
      }
    ];
    
    testVendors.forEach(vendor => addToCart(vendor));
  };

  // Get vendors grouped by category for comparison
  const getVendorsByCategory = () => {
    const grouped = {};
    cartState.items.forEach(item => {
      // Normalize category name to handle case sensitivity and variations
      let category = item.category;
      
      // Normalize common category variations
      if (category) {
        category = category.toLowerCase().trim();
        
        // Map variations to standard categories
        const categoryMappings = {
          'wedding photography': 'photographers',
          'photography': 'photographers',
          'photographer': 'photographers',
          'photographers': 'photographers',
          'bridal makeup': 'makeup',
          'makeup artist': 'makeup',
          'makeup artists': 'makeup',
          'makeup': 'makeup',
          'venue': 'venues',
          'venues': 'venues',
          'banquet hall': 'venues',
          'wedding venue': 'venues',
          'invitations': 'invites-gifts',
          'invitation': 'invites-gifts',
          'premium invitations': 'invites-gifts',
          'elegant designs': 'invites-gifts',
          'gifts': 'invites-gifts',
          'invites-gifts': 'invites-gifts'
        };
        
        category = categoryMappings[category] || category;
      }
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    console.log('Grouped vendors by category (normalized):', grouped);
    return grouped;
  };

  const vendorsByCategory = getVendorsByCategory();
  const categoriesWithMultipleVendors = Object.entries(vendorsByCategory).filter(([category, vendors]) => vendors.length >= 2);
  
  console.log('Categories with multiple vendors:', categoriesWithMultipleVendors);

  const handleCompareVendors = (category, vendors) => {
    navigate('/user/vendor-comparison', { 
      state: { 
        category,
        vendors: vendors.map(v => ({ ...v, fromCart: true }))
      } 
    });
  };

  const handleRemoveItem = async (itemId) => {
    setRemovingItems(prev => new Set([...prev, itemId]));
    
    // Add a small delay for visual feedback
    setTimeout(() => {
      removeFromCart(itemId);
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }, 300);
  };

  const handleWhatsAppContact = (item) => {
    const message = encodeURIComponent(
      `Hi! I found your ${item.category.toLowerCase()} service "${item.name}" on Utsavo and I'm interested in booking it for my wedding. Could you please share more details about availability and pricing?`
    );
    const whatsappUrl = `https://wa.me/${item.whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEditSelection = (item) => {
    // Navigate back to vendor category with this item highlighted
    navigate(`/user/vendors/${item.category.toLowerCase().replace(/\s+/g, '-')}`, {
      state: { highlightItem: item.id }
    });
  };

  const toggleAddOns = (itemId) => {
    setExpandedAddOns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleBookAll = () => {
    navigate('/user/checkout', { state: { items: cartState.items } });
  };

  const formatPrice = (priceString) => {
    const match = priceString.match(/₹([\d,]+)/);
    return match ? `₹${match[1]}` : priceString;
  };

  const getPriceUnit = (priceString) => {
    if (priceString.includes('per day')) return 'per day';
    if (priceString.includes('per function')) return 'per function';
    if (priceString.includes('per event')) return 'per event';
    return '';
  };

  // Mock add-ons data (in real app, this would come from the vendor/service)
  const getAddOnsForItem = (item) => {
    const addOnsByCategory = {
      'Wedding Photographers': [
        { id: 'extra-hours', name: 'Extra Hours', price: '₹2,000/hour' },
        { id: 'premium-album', name: 'Premium Album', price: '₹5,000' },
        { id: 'drone-shots', name: 'Drone Photography', price: '₹8,000' }
      ],
      'Bridal Makeup Artists': [
        { id: 'trial-session', name: 'Trial Session', price: '₹1,500' },
        { id: 'hair-styling', name: 'Hair Styling', price: '₹2,000' },
        { id: 'saree-draping', name: 'Saree Draping', price: '₹1,000' }
      ],
      'Wedding Venues': [
        { id: 'decoration', name: 'Premium Decoration', price: '₹15,000' },
        { id: 'sound-system', name: 'Sound System', price: '₹5,000' },
        { id: 'parking', name: 'Valet Parking', price: '₹3,000' }
      ]
    };
    
    return addOnsByCategory[item.category] || [];
  };

  if (cartState.items.length === 0) { 
    return (
      <div className="min-h-screen pb-20" style={{ backgroundColor: theme.semantic.background.primary }}>
        {/* Header */}
        <div 
          className="px-4 py-4 border-b"
          style={{ 
            backgroundColor: theme.semantic.background.primary,
            borderBottomColor: theme.semantic.border.light,
          }}
        >
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-3 p-2 rounded-full"
              style={{ backgroundColor: theme.semantic.background.accent }}
            >
              <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
            </button>
            <h1 className="text-xl font-bold" style={{ color: theme.semantic.text.primary }}>
              My Cart
            </h1>
          </div>
        </div>

        {/* Empty Cart State */}
        <div className="flex flex-col items-center justify-center px-4 py-12">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="cart" size="xl" style={{ color: theme.semantic.text.secondary }} />
          </div>
          
          <h2 
            className="text-xl font-bold mb-2 text-center"
            style={{ color: theme.semantic.text.primary }}
          >
            Your cart is empty
          </h2>
          
          <p 
            className="text-center mb-8 max-w-sm"
            style={{ color: theme.semantic.text.secondary }}
          >
            Discover amazing vendors and services for your perfect wedding
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            <Button
              onClick={() => navigate('/user/vendors')}
              className="flex-1 py-3 px-6"
              style={{
                backgroundColor: theme.colors.primary[500],
                color: 'white'
              }}
            >
              Browse Vendors
            </Button>
            
            {/* Test Button for Development */}
            <Button
              onClick={addTestVendors}
              variant="outline"
              className="flex-1 py-3 px-6"
            >
              <span className="hidden sm:inline">Add Test Vendors</span>
              <span className="sm:hidden">Test Data</span>
            </Button>
          </div>
          
          {/* Clear Cart Button for Testing - Only show if cart has items */}
          {cartState.items.length > 0 && (
            <Button
              onClick={clearCart}
              variant="outline"
              className="mt-3 px-6 py-2"
              style={{
                borderColor: theme.colors.red?.[300] || '#fca5a5',
                color: theme.colors.red?.[600] || '#dc2626'
              }}
            >
              Clear Cart
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div 
        className="px-4 py-4 border-b"
        style={{ 
          backgroundColor: theme.semantic.background.primary,
          borderBottomColor: theme.semantic.border.light,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-3 p-2 rounded-full"
              style={{ backgroundColor: theme.semantic.background.accent }}
            >
              <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
            </button>
            <div>
              <h1 className="text-xl font-bold" style={{ color: theme.semantic.text.primary }}>
                My Cart
              </h1>
              <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                {activeTab === 'shortlisted' 
                  ? `${cartState.totalItems} shortlisted • ${Object.keys(vendorsByCategory).length} categor${Object.keys(vendorsByCategory).length !== 1 ? 'ies' : 'y'}`
                  : `${cartState.finalizedItems?.length || 0} finalized vendor${(cartState.finalizedItems?.length || 0) !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
          
          {/* Comparison Button - Only show in shortlisted tab */}
          {activeTab === 'shortlisted' && categoriesWithMultipleVendors.length > 0 && (
            <button
              onClick={() => {
                if (categoriesWithMultipleVendors.length === 1) {
                  const [category, vendors] = categoriesWithMultipleVendors[0];
                  handleCompareVendors(category, vendors);
                } else {
                  navigate('/user/vendor-comparison', { 
                    state: { 
                      allCategories: categoriesWithMultipleVendors.map(([category, vendors]) => ({
                        category,
                        vendors: vendors.map(v => ({ ...v, fromCart: true }))
                      }))
                    } 
                  });
                }
              }}
              className="flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm"
              style={{
                backgroundColor: theme.colors.accent[500],
                color: 'white'
              }}
            >
              <Icon name="compare" size="sm" className="mr-2" />
              <span className="hidden sm:inline">Compare</span>
              <span className="sm:hidden">Compare</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                {categoriesWithMultipleVendors.length}
              </span>
            </button>
          )}
        </div>
        
        {/* Comparison Info Banner - Improved */}
        {categoriesWithMultipleVendors.length > 0 && (
          <div 
            className="p-3 rounded-lg flex items-start"
            style={{ backgroundColor: theme.colors.accent[50] }}
          >
            <Icon name="lightbulb" size="sm" className="mr-3 mt-0.5 flex-shrink-0" style={{ color: theme.colors.accent[600] }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium mb-1" style={{ color: theme.colors.accent[700] }}>
                Compare vendors in same category
              </p>
              <div className="flex flex-wrap gap-2">
                {categoriesWithMultipleVendors.map(([category, vendors], index) => (
                  <span 
                    key={category}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: theme.colors.accent[100],
                      color: theme.colors.accent[700]
                    }}
                  >
                    {vendors.length} {category.charAt(0).toUpperCase() + category.slice(1)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4 pb-2 border-b" style={{ borderBottomColor: theme.semantic.border.light }}>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('shortlisted')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'shortlisted' ? 'shadow-sm' : ''
            }`}
            style={{
              backgroundColor: activeTab === 'shortlisted' 
                ? theme.colors.primary[500] 
                : theme.semantic.background.accent,
              color: activeTab === 'shortlisted' 
                ? 'white' 
                : theme.semantic.text.secondary
            }}
          >
            <Icon name="heart" size="xs" />
            Shortlisted ({cartState.items.length})
          </button>
          
          <button
            onClick={() => setActiveTab('finalized')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'finalized' ? 'shadow-sm' : ''
            }`}
            style={{
              backgroundColor: activeTab === 'finalized' 
                ? theme.colors.accent[600] 
                : theme.semantic.background.accent,
              color: activeTab === 'finalized' 
                ? 'white' 
                : theme.semantic.text.secondary
            }}
          >
            <Icon name="check" size="xs" />
            Finalized ({cartState.finalizedItems?.length || 0})
          </button>
        </div>
      </div>

      {/* Finalized Tab Content */}
      {activeTab === 'finalized' && (
        <div className="px-4 py-6">
          {cartState.finalizedItems && cartState.finalizedItems.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.semantic.text.primary }}>
                    Ready to Book
                  </h2>
                  <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                    {cartState.finalizedItems.length} vendor{cartState.finalizedItems.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
                <button
                  onClick={() => navigate('/user/checkout', { state: { items: cartState.finalizedItems, isFinalized: true } })}
                  className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                  style={{
                    backgroundColor: theme.colors.accent[600],
                    color: 'white'
                  }}
                >
                  <Icon name="calendar" size="xs" />
                  Book All
                </button>
              </div>

              <div className="space-y-3">
                {cartState.finalizedItems.map((item) => (
                  <Card 
                    key={item.id}
                    className="overflow-hidden"
                    style={{
                      borderLeft: `4px solid ${theme.colors.accent[500]}`,
                      boxShadow: `0 2px 8px ${theme.semantic.card.shadow}20`
                    }}
                  >
                    <div className="flex items-center p-4 gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=128&h=128&fit=crop&q=80';
                        }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1 truncate" style={{ color: theme.semantic.text.primary }}>
                          {item.name}
                        </h3>
                        <p className="text-sm mb-1 truncate" style={{ color: theme.semantic.text.secondary }}>
                          {item.category}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center">
                            <Icon name="star" size="xs" color="secondary" />
                            <span className="text-xs ml-1" style={{ color: theme.semantic.text.secondary }}>
                              {item.rating}
                            </span>
                          </div>
                          <span style={{ color: theme.semantic.text.tertiary }}>•</span>
                          <span className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                            {item.location}
                          </span>
                        </div>
                        <p className="text-base font-bold" style={{ color: theme.colors.primary[600] }}>
                          {item.price}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => navigate('/user/checkout', { state: { items: [item], isFinalized: true } })}
                          className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
                          style={{
                            backgroundColor: theme.colors.accent[600],
                            color: 'white'
                          }}
                        >
                          Book Now
                        </button>
                        <button
                          onClick={() => unfinalizeItem(item.id)}
                          className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
                          style={{
                            backgroundColor: theme.semantic.background.accent,
                            color: theme.semantic.text.secondary
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: theme.semantic.background.accent }}
              >
                <Icon name="check" size="xl" style={{ color: theme.semantic.text.secondary }} />
              </div>
              
              <h2 
                className="text-xl font-bold mb-2 text-center"
                style={{ color: theme.semantic.text.primary }}
              >
                No Finalized Vendors
              </h2>
              
              <p 
                className="text-center mb-8 max-w-sm"
                style={{ color: theme.semantic.text.secondary }}
              >
                Compare vendors and finalize your choices to see them here
              </p>
              
              <Button
                onClick={() => setActiveTab('shortlisted')}
                className="px-8 py-3"
                style={{
                  backgroundColor: theme.colors.primary[500],
                  color: 'white'
                }}
              >
                View Shortlisted
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Shortlisted Tab Content */}
      {activeTab === 'shortlisted' && (
        <>
      {/* Finalized Vendors Section */}
      {cartState.finalizedItems && cartState.finalizedItems.length > 0 && false && (
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.semantic.text.primary }}>
                <Icon name="check" size="sm" style={{ color: theme.colors.accent[600] }} />
                Finalized Vendors
              </h2>
              <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                {cartState.finalizedItems.length} vendor{cartState.finalizedItems.length !== 1 ? 's' : ''} ready to book
              </p>
            </div>
            <button
              onClick={() => navigate('/user/checkout', { state: { items: cartState.finalizedItems, isFinalized: true } })}
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              style={{
                backgroundColor: theme.colors.accent[600],
                color: 'white'
              }}
            >
              <Icon name="calendar" size="xs" />
              Book All
            </button>
          </div>

          <div className="space-y-3">
            {cartState.finalizedItems.map((item) => (
              <Card 
                key={item.id}
                className="overflow-hidden"
                style={{
                  borderLeft: `4px solid ${theme.colors.accent[500]}`,
                  boxShadow: `0 2px 8px ${theme.semantic.card.shadow}20`
                }}
              >
                <div className="flex items-center p-3 gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=128&h=128&fit=crop&q=80';
                    }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate" style={{ color: theme.semantic.text.primary }}>
                      {item.name}
                    </h3>
                    <p className="text-xs truncate" style={{ color: theme.semantic.text.secondary }}>
                      {item.category}
                    </p>
                    <p className="text-sm font-bold mt-1" style={{ color: theme.colors.primary[600] }}>
                      {item.price}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate('/user/checkout', { state: { items: [item], isFinalized: true } })}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        backgroundColor: theme.colors.accent[600],
                        color: 'white'
                      }}
                    >
                      Book Now
                    </button>
                    <button
                      onClick={() => unfinalizeItem(item.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        backgroundColor: theme.semantic.background.accent,
                        color: theme.semantic.text.secondary
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Shortlisted Vendors Section */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: theme.semantic.text.primary }}>
              Shortlisted Vendors
            </h2>
            <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
              Compare and finalize your choices
            </p>
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="px-4 py-4 space-y-6">
        {cartState.items.map((item) => (
          <Card 
            key={item.id}
            className={`overflow-hidden transition-all duration-300 ${
              removingItems.has(item.id) ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
            }`}
            style={{
              boxShadow: `0 4px 20px -3px ${theme.semantic.card.shadow}30`
            }}
          >
            {/* 1. Hero Image at Top */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=400&fit=crop&q=80';
                }}
              />
              
              {/* Remove Button - Top Right */}
              <button
                onClick={() => handleRemoveItem(item.id)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                style={{ 
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)'
                }}
                disabled={removingItems.has(item.id)}
              >
                <Icon name="close" size="xs" style={{ color: 'white' }} />
              </button>

              {/* Service Tag */}
              <div 
                className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  backdropFilter: 'blur(4px)'
                }}
              >
                {item.category}
              </div>
            </div>

            {/* 2. Service Details */}
            <div className="p-4">
              <div className="mb-4">
                <h3 
                  className="font-bold text-lg mb-2 line-clamp-2"
                  style={{ color: theme.semantic.text.primary }}
                >
                  {item.name}
                </h3>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    {/* Location */}
                    <div className="flex items-center">
                      <Icon name="location" size="xs" className="mr-1" style={{ color: theme.semantic.text.secondary }} />
                      <span 
                        className="text-sm"
                        style={{ color: theme.semantic.text.secondary }}
                      >
                        {item.location}
                      </span>
                    </div>
                    
                    {/* Rating */}
                    <div className="flex items-center">
                      <Icon name="star" size="xs" style={{ color: '#fbbf24' }} />
                      <span 
                        className="text-sm ml-1 font-medium"
                        style={{ color: theme.semantic.text.secondary }}
                      >
                        {item.rating}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Pricing */}
                <div className="mb-4">
                  <div className="flex items-baseline space-x-2">
                    <span 
                      className="text-2xl font-bold"
                      style={{ color: theme.colors.primary[600] }}
                    >
                      {formatPrice(item.price)}
                    </span>
                    {getPriceUnit(item.price) && (
                      <span 
                        className="text-sm"
                        style={{ color: theme.semantic.text.secondary }}
                      >
                        {getPriceUnit(item.price)}
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. Action Buttons */}
                <div className="space-y-3">
                  {/* Primary Actions */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleEditSelection(item)}
                      className="flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 border"
                      style={{
                        borderColor: theme.colors.primary[300],
                        color: theme.colors.primary[600],
                        backgroundColor: theme.colors.primary[50]
                      }}
                    >
                      <Icon name="plan" size="xs" className="mr-2" />
                      Edit Selection
                    </button>
                    
                    <button
                      onClick={() => handleWhatsAppContact(item)}
                      className="flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center"
                      style={{
                        backgroundColor: '#25D366',
                        color: 'white'
                      }}
                    >
                      <Icon name="whatsapp" size="xs" className="mr-2" />
                      Contact
                    </button>
                  </div>
                  
                  {/* Finalize Button */}
                  <button
                    onClick={() => {
                      finalizeItem(item.id);
                      setActiveTab('finalized');
                    }}
                    className="w-full py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center"
                    style={{
                      backgroundColor: theme.colors.accent[600],
                      color: 'white'
                    }}
                  >
                    <Icon name="check" size="xs" className="mr-2" />
                    Finalize This Vendor
                  </button>
                  
                  {/* Comparison Button - Show if there are other vendors in same category */}
                  {(() => {
                    const sameCategory = cartState.items.filter(cartItem => 
                      cartItem.category === item.category && cartItem.id !== item.id
                    );
                    if (sameCategory.length > 0) {
                      return (
                        <button
                          onClick={() => {
                            const vendorsToCompare = [item, ...sameCategory].map(v => ({ ...v, fromCart: true }));
                            navigate('/user/vendor-comparison', { 
                              state: { 
                                category: item.category,
                                vendors: vendorsToCompare
                              } 
                            });
                          }}
                          className="w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center border"
                          style={{
                            borderColor: theme.colors.secondary[300],
                            color: theme.colors.secondary[600],
                            backgroundColor: theme.colors.secondary[50]
                          }}
                        >
                          <Icon name="compare" size="xs" className="mr-2" />
                          Compare with {sameCategory.length} other{sameCategory.length > 1 ? 's' : ''}
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* 5. Add-ons Section */}
                {getAddOnsForItem(item).length > 0 && (
                  <div className="mt-4 pt-4 border-t" style={{ borderTopColor: theme.semantic.border.light }}>
                    <button
                      onClick={() => toggleAddOns(item.id)}
                      className="w-full flex items-center justify-between py-2 text-left"
                    >
                      <span 
                        className="text-sm font-medium"
                        style={{ color: theme.semantic.text.primary }}
                      >
                        Add-ons & Extras
                      </span>
                      <Icon 
                        name="chevronDown" 
                        size="xs" 
                        className={`transition-transform duration-200 ${
                          expandedAddOns.has(item.id) ? 'rotate-180' : ''
                        }`}
                        style={{ color: theme.semantic.text.secondary }} 
                      />
                    </button>
                    
                    {expandedAddOns.has(item.id) && (
                      <div className="mt-3 space-y-2">
                        {getAddOnsForItem(item).map((addon) => (
                          <div 
                            key={addon.id}
                            className="flex items-center justify-between py-2 px-3 rounded-lg"
                            style={{ backgroundColor: theme.semantic.background.accent }}
                          >
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`${item.id}-${addon.id}`}
                                className="mr-3 w-4 h-4 rounded"
                                style={{ accentColor: theme.colors.primary[500] }}
                              />
                              <label 
                                htmlFor={`${item.id}-${addon.id}`}
                                className="text-sm"
                                style={{ color: theme.semantic.text.primary }}
                              >
                                {addon.name}
                              </label>
                            </div>
                            <span 
                              className="text-sm font-medium"
                              style={{ color: theme.colors.primary[600] }}
                            >
                              {addon.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 6. Cart Summary - Sticky Bottom */}
      <div 
        className="fixed bottom-16 left-0 right-0 z-40"
        style={{ backgroundColor: theme.semantic.background.primary }}
      >
        {/* Summary Card */}
        <div className="px-4 py-4">
          <Card 
            className="p-4"
            style={{
              boxShadow: `0 -4px 20px -3px ${theme.semantic.card.shadow}40`,
              border: `1px solid ${theme.colors.primary[200]}`
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <span 
                  className="text-lg font-bold block"
                  style={{ color: theme.semantic.text.primary }}
                >
                  Total: ₹{getTotalPrice().toLocaleString()}
                </span>
                <span 
                  className="text-sm"
                  style={{ color: theme.semantic.text.secondary }}
                >
                  {cartState.totalItems} service{cartState.totalItems !== 1 ? 's' : ''} selected
                </span>
              </div>
              
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.colors.primary[100] }}
              >
                <Icon name="rings" size="md" style={{ color: theme.colors.primary[600] }} />
              </div>
            </div>
            
            <button
              onClick={handleBookAll}
              className="w-full py-4 rounded-lg text-base font-bold transition-all duration-200 flex items-center justify-center"
              style={{
                backgroundColor: theme.colors.primary[500],
                color: 'white'
              }}
            >
              <Icon name="sparkles" size="sm" className="mr-2" />
              Book All Services
            </button>
          </Card>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default Cart;