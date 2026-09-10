import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../../contexts/CartContext';
import { useTheme } from '../../../hooks/useTheme';
import { useLenisContext } from '../../../providers/LenisProvider';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';

const Checkout = () => {
  const { cartState, clearCart } = useCart();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get Lenis instance to disable it for this page
  const lenis = useLenisContext();
  
  // Get checkout items from location state or cart
  const checkoutItems = location.state?.items || cartState.items || [];

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    eventDate: '',
    eventLocation: '',
    guestCount: '',
    specialRequests: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Disable Lenis smooth scrolling for checkout page
  useEffect(() => {
    if (lenis) {
      lenis.stop();
    }

    // Re-enable Lenis when component unmounts
    return () => {
      if (lenis) {
        lenis.start();
      }
    };
  }, [lenis]);

  // Redirect if no items to checkout
  useEffect(() => {
    if (checkoutItems.length === 0 && !showSuccess) {
      navigate('/user/cart', { replace: true });
    }
  }, [checkoutItems.length, showSuccess, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatPrice = (priceString) => {
    const match = priceString.match(/₹([\d,]+)/);
    return match ? parseInt(match[1].replace(/,/g, '')) : 0;
  };

  const getTotalPrice = () => {
    return checkoutItems.reduce((total, item) => {
      const price = formatPrice(item.price);
      return total + (price * (item.quantity || 1));
    }, 0);
  };

  const handleWhatsAppContact = (item) => {
    const message = encodeURIComponent(
      `Hi! I want to book your ${item.category.toLowerCase()} service "${item.name}" for my wedding.\n\nEvent Details:\n- Date: ${formData.eventDate || 'To be decided'}\n- Location: ${formData.eventLocation || 'To be decided'}\n- Guests: ${formData.guestCount || 'To be decided'}\n- Contact: ${formData.phone}\n\nSpecial Requests: ${formData.specialRequests || 'None'}\n\nPlease confirm availability and share the booking process.`
    );
    const whatsappUrl = `https://wa.me/${item.whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSubmitBooking = async () => {
    if (!formData.name || !formData.phone) {
      alert('Please fill in your name and phone number');
      return;
    }

    setIsSubmitting(true);

    // Save to Vendor Side (LocalStorage for prototype)
    try {
      const STORAGE_KEY = 'vendor-panel-state';
      const raw = localStorage.getItem(STORAGE_KEY);
      let vendorState = raw ? JSON.parse(raw) : null;
      
      if (vendorState) {
        // Create new booking record
        const newBooking = {
          id: `bk-${Date.now()}`,
          customerName: formData.name,
          eventDate: formData.eventDate || 'TBD',
          location: formData.eventLocation || 'TBD',
          services: checkoutItems.map(item => item.name),
          totalPrice: getTotalPrice(),
          status: 'Pending'
        };

        // Create notification for vendor
        const newNotification = {
          id: `nt-${Date.now()}`,
          message: `New booking confirmed from ${formData.name} for ${checkoutItems.length} services.`,
          time: 'Just now'
        };

        // Update state
        vendorState.bookings = [newBooking, ...(vendorState.bookings || [])];
        vendorState.notifications = [newNotification, ...(vendorState.notifications || [])];
        
        // Update analytics
        if (vendorState.analytics) {
          vendorState.analytics.bookings = (vendorState.analytics.bookings || 0) + 1;
        }

        // Save back
        localStorage.setItem(STORAGE_KEY, JSON.stringify(vendorState));
        console.log('Booking saved to vendor side successfully');
      }
    } catch (error) {
      console.error('Error saving to vendor side:', error);
    }

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Separate cart clearing from navigation
      setTimeout(() => {
        // Clear cart first
        clearCart();
        
        // Then navigate after a small delay
        setTimeout(() => {
          navigate('/user/home', { replace: true });
        }, 100);
      }, 2500);
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div 
        className="w-full min-h-screen"
        style={{ backgroundColor: theme.semantic.background.primary }}
      >
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: theme.colors.primary[50] }}
          >
            <Icon name="check" size="xl" style={{ color: theme.colors.primary[500] }} />
          </div>
          
          <h2 
            className="text-2xl font-bold mb-4 text-center"
            style={{ color: theme.semantic.text.primary }}
          >
            Booking Request Sent!
          </h2>
          
          <p 
            className="text-center mb-8 max-w-sm"
            style={{ color: theme.semantic.text.secondary }}
          >
            Your booking requests have been sent to the vendors. They will contact you shortly to confirm availability and details.
          </p>
          
          <div className="text-center">
            <p 
              className="text-sm mb-4"
              style={{ color: theme.semantic.text.secondary }}
            >
              Redirecting to home page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full min-h-screen"
      style={{ 
        backgroundColor: theme.semantic.background.primary
      }}
    >
      {/* Header */}
      <div 
        className="sticky top-0 z-50 px-4 py-3 border-b"
        style={{ 
          backgroundColor: `${theme.semantic.background.primary}f0`,
          borderBottomColor: theme.semantic.border.light,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        <div className="flex items-center w-full">
          <button
            onClick={() => navigate(-1)}
            className="mr-3 p-2 rounded-full touch-friendly"
            style={{ 
              backgroundColor: theme.semantic.background.accent,
              minHeight: '44px',
              minWidth: '44px'
            }}
          >
            <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: theme.semantic.text.primary }}>
            Checkout ({checkoutItems.length} {checkoutItems.length === 1 ? 'service' : 'services'})
          </h1>
        </div>
      </div>

      <div 
        className="px-4 py-4 pb-32"
      >
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Forms (Mobile: Full width, Desktop: 2/3) */}
            <div className="lg:col-span-2 space-y-6 w-full">
              {/* Contact Information */}
              <Card>
                <div className="p-4 sm:p-6">
                  <h2 
                    className="text-lg font-bold mb-4 flex items-center"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    <Icon name="user" size="sm" className="mr-2" />
                    Contact Information
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Input
                        label="Full Name *"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    
                    <Input
                      label="Phone Number *"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      required
                    />
                    
                    <Input
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>
              </Card>

              {/* Event Details */}
              <Card>
                <div className="p-4 sm:p-6">
                  <h2 
                    className="text-lg font-bold mb-4 flex items-center"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    <Icon name="calendar" size="sm" className="mr-2" />
                    Event Details
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Event Date"
                      name="eventDate"
                      type="date"
                      value={formData.eventDate}
                      onChange={handleInputChange}
                    />
                    
                    <Input
                      label="Expected Guest Count"
                      name="guestCount"
                      type="number"
                      value={formData.guestCount}
                      onChange={handleInputChange}
                      placeholder="Number of guests"
                    />
                    
                    <div className="sm:col-span-2">
                      <Input
                        label="Event Location"
                        name="eventLocation"
                        value={formData.eventLocation}
                        onChange={handleInputChange}
                        placeholder="Enter event location"
                      />
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label 
                        className="block text-sm font-medium mb-2"
                        style={{ color: theme.semantic.text.primary }}
                      >
                        Special Requests
                      </label>
                      <textarea
                        name="specialRequests"
                        value={formData.specialRequests}
                        onChange={handleInputChange}
                        placeholder="Any special requirements or requests..."
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                        style={{
                          borderColor: theme.semantic.border.default,
                          backgroundColor: theme.semantic.background.primary,
                          color: theme.semantic.text.primary,
                          focusRingColor: theme.colors.primary[500]
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Contact Vendors Individually - Mobile/Tablet Only */}
              <div className="lg:hidden">
                <Card>
                  <div className="p-4 sm:p-6">
                    <h2 
                      className="text-lg font-bold mb-4 flex items-center"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      <Icon name="whatsapp" size="sm" className="mr-2" />
                      Contact Vendors Directly
                    </h2>
                    
                    <div className="space-y-3">
                      {checkoutItems.map((item) => (
                        <div key={`whatsapp-${item.id}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border" style={{ borderColor: theme.semantic.border.light }}>
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=96&h=96&fit=crop&q=80';
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p 
                                className="font-medium text-sm line-clamp-1"
                                style={{ color: theme.semantic.text.primary }}
                              >
                                {item.name}
                              </p>
                              <p 
                                className="text-xs"
                                style={{ color: theme.semantic.text.secondary }}
                              >
                                {item.category}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleWhatsAppContact(item)}
                            className="w-full sm:w-auto py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center transition-colors border touch-friendly"
                            style={{
                              borderColor: '#25D366',
                              color: '#25D366',
                              backgroundColor: 'transparent',
                              minHeight: '44px'
                            }}
                          >
                            <Icon name="whatsapp" size="sm" className="mr-2" />
                            WhatsApp
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Right Column - Order Summary (Mobile: Full width, Desktop: 1/3) */}
            <div className="lg:col-span-1 w-full">
              <div className="sticky top-20">
                {/* Order Summary */}
                <Card>
                  <div className="p-4 sm:p-6">
                    <h2 
                      className="text-lg font-bold mb-4 flex items-center"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      <Icon name="cart" size="sm" className="mr-2" />
                      Order Summary
                    </h2>
                    
                    <div className="space-y-4 mb-4">
                      {checkoutItems.map((item) => (
                        <div key={item.id} className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/48x48?text=No+Image';
                              }}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 
                              className="font-medium text-sm line-clamp-1 mb-1"
                              style={{ color: theme.semantic.text.primary }}
                            >
                              {item.name}
                            </h3>
                            <p 
                              className="text-xs"
                              style={{ color: theme.semantic.text.secondary }}
                            >
                              {item.category}
                            </p>
                          </div>
                          
                          <div 
                            className="font-bold text-sm text-right"
                            style={{ color: theme.colors.primary[600] }}
                          >
                            ₹{formatPrice(item.price).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div 
                      className="border-t pt-4"
                      style={{ borderTopColor: theme.semantic.border.light }}
                    >
                      <div className="flex justify-between items-center">
                        <span 
                          className="text-lg font-bold"
                          style={{ color: theme.semantic.text.primary }}
                        >
                          Total
                        </span>
                        <span 
                          className="text-lg font-bold"
                          style={{ color: theme.colors.primary[600] }}
                        >
                          ₹{getTotalPrice().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Contact Vendors - Desktop Only */}
                <div className="hidden lg:block mt-6">
                  <Card>
                    <div className="p-4 sm:p-6">
                      <h2 
                        className="text-lg font-bold mb-4 flex items-center"
                        style={{ color: theme.semantic.text.primary }}
                      >
                        <Icon name="whatsapp" size="sm" className="mr-2" />
                        Contact Vendors
                      </h2>
                      
                      <div className="space-y-3">
                        {checkoutItems.map((item) => (
                          <div key={`whatsapp-desktop-${item.id}`} className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/32x32?text=No+Image';
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p 
                                  className="font-medium text-xs line-clamp-1"
                                  style={{ color: theme.semantic.text.primary }}
                                >
                                  {item.name}
                                </p>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleWhatsAppContact(item)}
                              className="w-full py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center transition-colors border touch-friendly"
                              style={{
                                borderColor: '#25D366',
                                color: '#25D366',
                                backgroundColor: 'transparent',
                                minHeight: '36px'
                              }}
                            >
                              <Icon name="whatsapp" size="xs" className="mr-1" />
                              WhatsApp
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Single Primary CTA - Sticky Bottom Action for All Devices */}
      <div 
        className="fixed bottom-16 left-0 right-0 p-4 border-t"
        style={{ 
          backgroundColor: `${theme.semantic.background.primary}f0`,
          borderTopColor: theme.semantic.border.light,
          zIndex: 50,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        <button
          onClick={handleSubmitBooking}
          disabled={isSubmitting || !formData.name || !formData.phone}
          className="w-full py-4 rounded-lg text-base font-bold flex items-center justify-center transition-colors touch-friendly"
          style={{
            backgroundColor: theme.colors.primary[500],
            color: 'white',
            opacity: (isSubmitting || !formData.name || !formData.phone) ? 0.6 : 1,
            minHeight: '52px'
          }}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
              Sending Booking Request...
            </>
          ) : (
            'Confirm Booking Request'
          )}
        </button>
      </div>
    </div>
  );
};

export default Checkout;