import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useCart } from '../../../contexts/CartContext';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { vendors } from '../../../data/vendors';

const VendorComparison = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { addToCart, removeFromCart, isInCart, finalizeItem, isFinalized } = useCart();
  
  const [compareVendors, setCompareVendors] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availableCategories, setAvailableCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddVendor, setShowAddVendor] = useState(false);

  useEffect(() => {
    const state = location.state;
    
    if (state?.vendors && state?.category) {
      // Direct comparison from cart
      setCompareVendors(state.vendors);
      setSelectedCategory(state.category);
    } else if (state?.allCategories) {
      // Multiple categories available
      setAvailableCategories(state.allCategories);
      if (state.allCategories.length > 0) {
        const firstCategory = state.allCategories[0];
        setCompareVendors(firstCategory.vendors);
        setSelectedCategory(firstCategory.category);
      }
    } else {
      // No state provided, redirect back
      navigate('/user/cart');
    }
  }, [location.state, navigate]);

  const handleCategoryChange = (categoryData) => {
    setCompareVendors(categoryData.vendors);
    setSelectedCategory(categoryData.category);
  };

  const handleAddVendor = (vendor) => {
    if (compareVendors.length < 4 && !compareVendors.find(v => v.id === vendor.id)) {
      setCompareVendors(prev => [...prev, { ...vendor, fromCart: false }]);
    }
    setShowAddVendor(false);
  };

  const handleRemoveVendor = (vendorId) => {
    setCompareVendors(prev => prev.filter(v => v.id !== vendorId));
  };

  const handleCartAction = (vendor) => {
    if (isInCart(vendor.id)) {
      removeFromCart(vendor.id);
    } else {
      const cartItem = {
        id: vendor.id,
        name: vendor.name,
        category: vendor.services?.[0] || selectedCategory,
        price: vendor.price,
        image: vendor.image,
        rating: vendor.rating,
        location: vendor.location,
        whatsappNumber: vendor.phone || '+919876543210'
      };
      addToCart(cartItem);
    }
  };

  const handleWhatsAppContact = (vendor) => {
    const phoneNumber = vendor.phone || '919876543210';
    const message = `Hi! I'm comparing ${selectedCategory} vendors and I'm interested in your services. Can you please share more details?`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleExportComparison = () => {
    const comparisonData = {
      category: selectedCategory,
      comparedAt: new Date().toISOString(),
      vendors: compareVendors.map(vendor => ({
        name: vendor.name,
        rating: vendor.rating,
        reviews: vendor.reviews,
        price: vendor.price,
        location: vendor.location,
        verified: vendor.verified,
        comparisonScore: getComparisonScore(vendor)
      })),
      recommendation: getSmartRecommendation()?.name || 'None'
    };
    
    // Create downloadable JSON file
    const dataStr = JSON.stringify(comparisonData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `vendor-comparison-${selectedCategory.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleShareComparison = async () => {
    const shareText = `🔍 Vendor Comparison - ${selectedCategory}\n\n${compareVendors.map((vendor, index) => 
      `${index + 1}. ${vendor.name}\n   ⭐ ${vendor.rating} (${vendor.reviews} reviews)\n   💰 ${vendor.price}\n   📍 ${vendor.location}\n`
    ).join('\n')}\n🏆 Recommended: ${getSmartRecommendation()?.name || 'None'}\n\nCompared on Utsavo`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${selectedCategory} Vendor Comparison`,
          text: shareText,
        });
      } catch (err) {
        console.log('Error sharing:', err);
        // Fallback to clipboard
        navigator.clipboard.writeText(shareText);
        alert('Comparison copied to clipboard!');
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareText);
      alert('Comparison copied to clipboard!');
    }
  };

  const getAvailableVendorsForCategory = () => {
    return vendors.filter(vendor => 
      vendor.category === selectedCategory.toLowerCase().replace(/\s+/g, '-') &&
      !compareVendors.find(cv => cv.id === vendor.id)
    );
  };

  const getComparisonScore = (vendor) => {
    // Calculate overall score based on rating, reviews, and other factors
    const ratingScore = (vendor.rating / 5) * 40;
    const reviewsScore = Math.min((vendor.reviews / 100) * 30, 30);
    const verifiedScore = vendor.verified ? 20 : 0;
    const experienceScore = 10; // Mock experience score
    
    return Math.round(ratingScore + reviewsScore + verifiedScore + experienceScore);
  };

  const getSmartRecommendation = () => {
    if (compareVendors.length === 0) return null;
    
    // Calculate weighted scores for different factors
    const scoredVendors = compareVendors.map(vendor => {
      const ratingScore = vendor.rating * 20; // Max 100 points
      const reviewsScore = Math.min(vendor.reviews / 10, 30); // Max 30 points
      const verifiedScore = vendor.verified ? 20 : 0; // 20 points for verified
      const priceScore = (() => {
        const price = parseInt(vendor.price.replace(/[^\d]/g, ''));
        const maxPrice = Math.max(...compareVendors.map(v => parseInt(v.price.replace(/[^\d]/g, ''))));
        const minPrice = Math.min(...compareVendors.map(v => parseInt(v.price.replace(/[^\d]/g, ''))));
        // Lower price gets higher score (inverse relationship)
        return ((maxPrice - price) / (maxPrice - minPrice)) * 30; // Max 30 points
      })();
      
      const totalScore = ratingScore + reviewsScore + verifiedScore + priceScore;
      
      return {
        ...vendor,
        totalScore: Math.round(totalScore),
        breakdown: {
          rating: Math.round(ratingScore),
          reviews: Math.round(reviewsScore),
          verified: verifiedScore,
          price: Math.round(priceScore)
        }
      };
    });
    
    return scoredVendors.sort((a, b) => b.totalScore - a.totalScore)[0];
  };

  const getBestValue = () => {
    if (compareVendors.length === 0) return null;
    
    return compareVendors.reduce((best, current) => {
      const currentScore = getComparisonScore(current);
      const bestScore = getComparisonScore(best);
      
      // Consider both score and price
      const currentValue = currentScore / (parseInt(current.price.replace(/[^\d]/g, '')) / 1000);
      const bestValue = bestScore / (parseInt(best.price.replace(/[^\d]/g, '')) / 1000);
      
      return currentValue > bestValue ? current : best;
    });
  };

  const getHighestRated = () => {
    if (compareVendors.length === 0) return null;
    return compareVendors.reduce((highest, current) => 
      current.rating > highest.rating ? current : highest
    );
  };

  const getMostReviewed = () => {
    if (compareVendors.length === 0) return null;
    return compareVendors.reduce((most, current) => 
      current.reviews > most.reviews ? current : most
    );
  };

  if (compareVendors.length === 0) {
    return (
      <div className="min-h-screen pb-20" style={{ backgroundColor: theme.semantic.background.primary }}>
        <div className="px-4 py-4 border-b" style={{ borderBottomColor: theme.semantic.border.light }}>
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-3 p-2 rounded-full"
              style={{ backgroundColor: theme.semantic.background.accent }}
            >
              <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
            </button>
            <h1 className="text-xl font-bold" style={{ color: theme.semantic.text.primary }}>
              Vendor Comparison
            </h1>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center px-4 py-16">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="compare" size="xl" style={{ color: theme.semantic.text.secondary }} />
          </div>
          
          <h2 className="text-xl font-bold mb-2 text-center" style={{ color: theme.semantic.text.primary }}>
            No vendors to compare
          </h2>
          
          <p className="text-center mb-8 max-w-sm" style={{ color: theme.semantic.text.secondary }}>
            Add vendors to your cart to compare them side by side
          </p>
          
          <Button
            onClick={() => navigate('/user/vendors')}
            className="px-8 py-3"
            style={{ backgroundColor: theme.colors.primary[500], color: 'white' }}
          >
            Browse Vendors
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div className="px-4 py-4 border-b" style={{ borderBottomColor: theme.semantic.border.light }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center flex-1 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="mr-3 p-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: theme.semantic.background.accent }}
            >
              <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold truncate" style={{ color: theme.semantic.text.primary }}>
                Compare Vendors
              </h1>
              <p className="text-xs sm:text-sm truncate" style={{ color: theme.semantic.text.secondary }}>
                {selectedCategory} • {compareVendors.length} vendor{compareVendors.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Export Button */}
            <button
              onClick={handleExportComparison}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: theme.semantic.background.accent }}
              title="Export Comparison"
            >
              <Icon name="download" size="sm" style={{ color: theme.semantic.text.secondary }} />
            </button>
            
            {/* Share Button */}
            <button
              onClick={handleShareComparison}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: theme.semantic.background.accent }}
              title="Share Comparison"
            >
              <Icon name="share" size="sm" style={{ color: theme.semantic.text.secondary }} />
            </button>
            
            {/* Add Vendor Button */}
            {compareVendors.length < 4 && (
              <button
                onClick={() => setShowAddVendor(true)}
                className="flex items-center px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                style={{
                  backgroundColor: theme.colors.primary[100],
                  color: theme.colors.primary[700]
                }}
              >
                <Icon name="plus" size="sm" className="sm:mr-1" />
                <span className="hidden sm:inline">Add</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Category Selector */}
        {availableCategories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {availableCategories.map((categoryData) => (
              <button
                key={categoryData.category}
                onClick={() => handleCategoryChange(categoryData)}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  selectedCategory === categoryData.category ? 'shadow-sm' : ''
                }`}
                style={{
                  backgroundColor: selectedCategory === categoryData.category 
                    ? theme.colors.primary[500] 
                    : theme.colors.primary[100],
                  color: selectedCategory === categoryData.category 
                    ? 'white' 
                    : theme.colors.primary[700]
                }}
              >
                {categoryData.category} ({categoryData.vendors.length})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Insights */}
      <div className="px-4 py-4">
        <h2 className="text-lg font-semibold mb-3" style={{ color: theme.semantic.text.primary }}>
          Quick Insights
        </h2>
        
        {/* Smart Recommendation Banner */}
        {(() => {
          const recommendation = getSmartRecommendation();
          if (recommendation) {
            return (
              <div 
                className="mb-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg"
                style={{ 
                  backgroundColor: theme.colors.accent[50],
                  borderColor: theme.colors.accent[200]
                }}
                onClick={() => navigate('/user/ai-assistant')}
              >
                <div className="flex items-center mb-2">
                  <Icon name="sparkles" size="sm" className="mr-2" style={{ color: theme.colors.accent[600] }} />
                  <span className="font-semibold text-sm" style={{ color: theme.colors.accent[700] }}>
                    AI Recommendation
                  </span>
                  <span className="ml-auto text-xs" style={{ color: theme.colors.accent[600] }}>
                    Click for AI Assistant →
                  </span>
                </div>
                <p className="text-xs sm:text-sm mb-3" style={{ color: theme.colors.accent[600] }}>
                  Based on ratings, reviews, pricing, and verification status:
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base truncate" style={{ color: theme.colors.accent[800] }}>
                      {recommendation.name}
                    </p>
                    <p className="text-xs" style={{ color: theme.colors.accent[600] }}>
                      Overall Score: {recommendation.totalScore}/100
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCartAction(recommendation);
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
                    style={{
                      backgroundColor: theme.colors.accent[600],
                      color: 'white'
                    }}
                  >
                    {isInCart(recommendation.id) ? 'In Cart' : 'Choose This'}
                  </button>
                </div>
              </div>
            );
          }
          return null;
        })()}
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {/* Best Value */}
          <Card className="p-3">
            <div className="flex items-center mb-2">
              <Icon name="trophy" size="sm" className="mr-2" style={{ color: theme.colors.accent[600] }} />
              <span className="text-xs sm:text-sm font-medium" style={{ color: theme.semantic.text.primary }}>
                Best Value
              </span>
            </div>
            <p className="text-xs font-semibold truncate" style={{ color: theme.colors.accent[700] }}>
              {getBestValue()?.name}
            </p>
          </Card>
          
          {/* Highest Rated */}
          <Card className="p-3">
            <div className="flex items-center mb-2">
              <Icon name="star" size="sm" className="mr-2" style={{ color: theme.colors.secondary[600] }} />
              <span className="text-xs sm:text-sm font-medium" style={{ color: theme.semantic.text.primary }}>
                Highest Rated
              </span>
            </div>
            <p className="text-xs font-semibold truncate" style={{ color: theme.colors.secondary[700] }}>
              {getHighestRated()?.name} ({getHighestRated()?.rating}★)
            </p>
          </Card>
          
          {/* Most Reviewed */}
          <Card className="p-3">
            <div className="flex items-center mb-2">
              <Icon name="users" size="sm" className="mr-2" style={{ color: theme.colors.primary[600] }} />
              <span className="text-xs sm:text-sm font-medium" style={{ color: theme.semantic.text.primary }}>
                Most Reviewed
              </span>
            </div>
            <p className="text-xs font-semibold truncate" style={{ color: theme.colors.primary[700] }}>
              {getMostReviewed()?.name} ({getMostReviewed()?.reviews})
            </p>
          </Card>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-hide">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'pricing', label: 'Pricing' },
            { key: 'features', label: 'Features' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap pb-2 border-b-2 transition-colors text-xs sm:text-sm font-medium flex-shrink-0 px-1 ${
                activeTab === tab.key ? 'border-current' : 'border-transparent'
              }`}
              style={{ 
                color: activeTab === tab.key 
                  ? theme.colors.primary[600] 
                  : theme.semantic.text.secondary 
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Content */}
      <div className="px-4">
        {activeTab === 'overview' && (
          <div className="space-y-3 sm:space-y-4">
            {compareVendors.map((vendor) => (
              <Card key={vendor.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Vendor Image */}
                  <div className="w-full sm:w-24 h-32 sm:h-24 flex-shrink-0">
                    <img
                      src={vendor.image}
                      alt={vendor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Vendor Info */}
                  <div className="flex-1 p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base line-clamp-1" style={{ color: theme.semantic.text.primary }}>
                          {vendor.name}
                          {vendor.verified && (
                            <Icon name="verified" size="xs" className="ml-1" color="accent" />
                          )}
                        </h3>
                        <p className="text-xs sm:text-sm truncate" style={{ color: theme.semantic.text.secondary }}>
                          {vendor.location}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveVendor(vendor.id)}
                        className="p-1 rounded-full flex-shrink-0"
                        style={{ backgroundColor: theme.semantic.background.accent }}
                      >
                        <Icon name="close" size="xs" style={{ color: theme.semantic.text.secondary }} />
                      </button>
                    </div>
                    
                    {/* Rating & Price */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <Icon name="star" size="xs" color="secondary" />
                          <span className="text-xs sm:text-sm font-medium ml-1" style={{ color: theme.semantic.text.primary }}>
                            {vendor.rating}
                          </span>
                        </div>
                        <span className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                          ({vendor.reviews})
                        </span>
                      </div>
                      
                      <span className="font-bold text-sm" style={{ color: theme.colors.primary[600] }}>
                        {vendor.price}
                      </span>
                    </div>
                    
                    {/* Comparison Score */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: theme.semantic.text.secondary }}>
                          Overall Score
                        </span>
                        <span className="text-xs font-bold" style={{ color: theme.colors.accent[600] }}>
                          {getComparisonScore(vendor)}/100
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${getComparisonScore(vendor)}%`,
                            backgroundColor: theme.colors.accent[500]
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      {!isFinalized(vendor.id) ? (
                        <>
                          <button
                            onClick={() => handleCartAction(vendor)}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                              isInCart(vendor.id) ? 'opacity-60' : ''
                            }`}
                            style={{
                              backgroundColor: isInCart(vendor.id) 
                                ? theme.colors.accent[500] 
                                : theme.colors.primary[500],
                              color: 'white'
                            }}
                          >
                            {isInCart(vendor.id) ? 'Shortlisted' : 'Shortlist'}
                          </button>
                          
                          <button
                            onClick={() => finalizeItem(vendor.id)}
                            className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1"
                            style={{
                              backgroundColor: theme.colors.accent[600],
                              color: 'white'
                            }}
                          >
                            <Icon name="check" size="xs" />
                            Finalize
                          </button>
                        </>
                      ) : (
                        <button
                          className="flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                          style={{
                            backgroundColor: theme.colors.accent[500],
                            color: 'white',
                            opacity: 0.8
                          }}
                          disabled
                        >
                          <Icon name="check" size="xs" />
                          Finalized
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleWhatsAppContact(vendor)}
                        className="px-3 py-2 rounded-lg flex-shrink-0 flex items-center gap-1"
                        style={{ backgroundColor: '#25D366' }}
                      >
                        <Icon name="whatsapp" size="xs" style={{ color: 'white' }} />
                        <span className="text-xs font-medium text-white hidden sm:inline">WhatsApp</span>
                        <span className="text-xs font-medium text-white sm:hidden">Chat</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-3 sm:space-y-4">
            {compareVendors.map((vendor) => (
              <Card key={vendor.id} className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  {/* Vendor Info */}
                  <div className="flex items-center flex-1 min-w-0 mr-4">
                    <img src={vendor.image} alt={vendor.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover mr-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base truncate" style={{ color: theme.semantic.text.primary }}>
                        {vendor.name}
                      </p>
                      <div className="flex items-center">
                        <Icon name="star" size="xs" color="secondary" />
                        <span className="text-xs ml-1 mr-2" style={{ color: theme.semantic.text.secondary }}>
                          {vendor.rating} ({vendor.reviews})
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Price and Score */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="font-bold text-sm sm:text-base" style={{ color: theme.colors.primary[600] }}>
                      {vendor.price}
                    </span>
                    
                    {/* Score Bar */}
                    <div className="flex items-center gap-2">
                      <div className="w-16 sm:w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full"
                          style={{ 
                            width: `${getComparisonScore(vendor)}%`,
                            backgroundColor: theme.colors.accent[500]
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right" style={{ color: theme.semantic.text.primary }}>
                        {getComparisonScore(vendor)}
                      </span>
                    </div>
                    
                    {/* Action Button */}
                    <button
                      onClick={() => handleCartAction(vendor)}
                      className="px-3 py-1 rounded-lg text-xs font-medium"
                      style={{
                        backgroundColor: isInCart(vendor.id) 
                          ? theme.colors.accent[500] 
                          : theme.colors.primary[500],
                        color: 'white'
                      }}
                    >
                      {isInCart(vendor.id) ? 'In Cart' : 'Add'}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-3 sm:space-y-4">
            {compareVendors.map((vendor) => (
              <Card key={vendor.id} className="p-3 sm:p-4">
                <div className="flex items-center mb-4">
                  <img src={vendor.image} alt={vendor.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover mr-3 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base truncate" style={{ color: theme.semantic.text.primary }}>
                      {vendor.name}
                    </h3>
                    <p className="text-xs sm:text-sm truncate" style={{ color: theme.semantic.text.secondary }}>
                      {vendor.location}
                    </p>
                  </div>
                </div>
                
                {/* Services */}
                <div className="mb-4">
                  <h4 className="text-xs sm:text-sm font-medium mb-2" style={{ color: theme.semantic.text.primary }}>
                    Services Offered
                  </h4>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {vendor.services?.map((service) => (
                      <span
                        key={service}
                        className="px-2 py-1 text-xs rounded-full font-medium"
                        style={{
                          backgroundColor: theme.colors.primary[100],
                          color: theme.colors.primary[700]
                        }}
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Features */}
                <div>
                  <h4 className="text-xs sm:text-sm font-medium mb-2" style={{ color: theme.semantic.text.primary }}>
                    Key Features
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { feature: 'Verified', available: vendor.verified },
                      { feature: 'Same Day Delivery', available: Math.random() > 0.5 },
                      { feature: '24/7 Support', available: Math.random() > 0.3 },
                      { feature: 'Free Consultation', available: Math.random() > 0.4 }
                    ].map((item) => (
                      <div key={item.feature} className="flex items-center">
                        <Icon 
                          name={item.available ? "check" : "close"} 
                          size="xs" 
                          className="mr-2 flex-shrink-0"
                          style={{ 
                            color: item.available 
                              ? theme.colors.accent[600] 
                              : theme.semantic.text.secondary 
                          }} 
                        />
                        <span 
                          className="text-xs sm:text-sm truncate"
                          style={{ 
                            color: item.available 
                              ? theme.semantic.text.primary 
                              : theme.semantic.text.secondary 
                          }}
                        >
                          {item.feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Vendor Modal */}
      {showAddVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
          <div 
            className="w-full max-w-md rounded-t-2xl sm:rounded-2xl p-4 max-h-[80vh] sm:max-h-96 overflow-y-auto"
            style={{ backgroundColor: theme.semantic.background.primary }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold" style={{ color: theme.semantic.text.primary }}>
                Add Vendor to Compare
              </h3>
              <button
                onClick={() => setShowAddVendor(false)}
                className="p-2 rounded-full"
                style={{ backgroundColor: theme.semantic.background.accent }}
              >
                <Icon name="close" size="sm" style={{ color: theme.semantic.text.primary }} />
              </button>
            </div>
            
            <div className="space-y-3">
              {getAvailableVendorsForCategory().slice(0, 10).map((vendor) => (
                <div 
                  key={vendor.id}
                  className="flex items-center p-3 rounded-lg cursor-pointer transition-colors active:scale-95"
                  style={{ backgroundColor: theme.semantic.background.accent }}
                  onClick={() => handleAddVendor(vendor)}
                >
                  <img src={vendor.image} alt={vendor.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate" style={{ color: theme.semantic.text.primary }}>
                      {vendor.name}
                    </h4>
                    <div className="flex items-center">
                      <Icon name="star" size="xs" color="secondary" />
                      <span className="text-xs ml-1 mr-2" style={{ color: theme.semantic.text.secondary }}>
                        {vendor.rating} ({vendor.reviews})
                      </span>
                      <span className="text-xs font-medium truncate" style={{ color: theme.colors.primary[600] }}>
                        {vendor.price}
                      </span>
                    </div>
                  </div>
                  <Icon name="plus" size="sm" className="flex-shrink-0" style={{ color: theme.colors.primary[600] }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorComparison;