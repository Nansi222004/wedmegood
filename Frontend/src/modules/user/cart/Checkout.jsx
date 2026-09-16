import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../../contexts/CartContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../hooks/useTheme';
import { useLenisContext } from '../../../providers/LenisProvider';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import userApi from '../../../services/userApi';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const { cartState, clearCart } = useCart();
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get Lenis instance to disable it for this page
  const lenis = useLenisContext();
  
  // Passed booking from MyBookings or cart items
  const bookingData = location.state?.booking;
  const bookingId = location.state?.bookingId || bookingData?._id;
  const checkoutItems = location.state?.items || cartState.items || [];

  const [formData, setFormData] = useState({
    name: bookingData?.customerName || user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    eventDate: bookingData?.eventDate ? new Date(bookingData.eventDate).toISOString().split('T')[0] : '',
    eventLocation: bookingData?.location || 'Indore',
    guestCount: bookingData?.guestCount ? String(bookingData.guestCount) : '',
    specialRequests: bookingData?.notes || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Disable Lenis smooth scrolling for checkout page
  useEffect(() => {
    if (lenis) {
      lenis.stop();
    }

    return () => {
      if (lenis) {
        lenis.start();
      }
    };
  }, [lenis]);

  // Redirect if no items and no booking
  useEffect(() => {
    if (!bookingId && checkoutItems.length === 0 && !showSuccess) {
      navigate('/user/cart', { replace: true });
    }
  }, [bookingId, checkoutItems.length, showSuccess, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatPrice = (priceString) => {
    if (!priceString) return 0;
    if (typeof priceString === 'number') return priceString;
    const match = priceString.match(/₹([\d,]+)/);
    return match ? parseInt(match[1].replace(/,/g, '')) : 0;
  };

  const getTotalPrice = () => {
    if (bookingData?.totalPrice) {
      return bookingData.totalPrice;
    }
    return checkoutItems.reduce((total, item) => {
      const price = formatPrice(item.price);
      return total + (price * (item.quantity || 1));
    }, 0);
  };

  const handleWhatsAppContact = (item) => {
    const message = encodeURIComponent(
      `Hi! I want to confirm payment/booking for "${item.name}". Contact: ${formData.phone}`
    );
    const whatsappUrl = `https://wa.me/${(item.whatsappNumber || '919876543210').replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSubmitBooking = async () => {
    if (!bookingId) {
      alert('To complete a secure payment, please accept an official quote from a vendor in "My Bookings" first.');
      navigate('/user/bookings');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // 2. Create server-side order (Backend is source of truth for money!)
      const orderRes = await userApi.createPaymentOrder(bookingId);
      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.message || 'Failed to create payment order');
      }

      const { order, key } = orderRes;

      // 3. Open Razorpay Checkout
      const options = {
        key: key || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Utsavo / WedMeGood',
        description: `Booking Payment: ${orderRes.booking?.customerName || 'Wedding Services'}`,
        order_id: order.id,
        prefill: {
          name: formData.name || user?.name || '',
          email: formData.email || user?.email || '',
          contact: formData.phone || user?.phone || ''
        },
        theme: {
          color: '#E91E63'
        },
        handler: async (response) => {
          try {
            // 4. Server-Side HMAC SHA256 Signature Verification
            const verifyRes = await userApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: bookingId
            });

            if (verifyRes.success) {
              clearCart();
              setShowSuccess(true);
              setTimeout(() => {
                navigate('/user/account/payments', { replace: true });
              }, 2500);
            } else {
              throw new Error(verifyRes.message || 'Payment verification failed');
            }
          } catch (verErr) {
            console.error('Payment verification failed:', verErr);
            alert('Payment verification failed: ' + verErr.message);
          } finally {
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (failRes) => {
        console.error('Payment failed:', failRes);
        alert('Payment failed: ' + (failRes.error?.description || 'Transaction unsuccessful'));
        setIsSubmitting(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Payment initiation error:', err);
      alert(err.message || 'Failed to start payment process');
      setIsSubmitting(false);
    }
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
          disabled={isSubmitting}
          className="w-full py-4 rounded-xl text-base font-bold flex items-center justify-center transition-colors touch-friendly shadow-lg"
          style={{
            backgroundColor: theme.colors.primary[500],
            color: 'white',
            opacity: isSubmitting ? 0.6 : 1,
            minHeight: '52px'
          }}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
              Processing Secure Payment...
            </>
          ) : (
            `Pay ₹${getTotalPrice().toLocaleString()} via Razorpay`
          )}
        </button>
      </div>
    </div>
  );
};

export default Checkout;