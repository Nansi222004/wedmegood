import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useCart } from '../../../contexts/CartContext';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import userApi from '../../../services/userApi';

const VendorDetail = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { addToCart, isInCart } = useCart();
  const { user } = useAuth();

  const [vendor, setVendor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [activeTab, setActiveTab] = useState('pricing');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSticky, setIsSticky] = useState(false);

  const tabsRef = useRef(null);
  const sectionsRef = useRef({});

  // Modal states
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestStatus, setRequestStatus] = useState('idle'); // idle, sending, success
  const [referencePhotos, setReferencePhotos] = useState([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    openToOtherDates: false,
    guestCount: '100-200',
    message: ''
  });

  // Favorite state
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  // Complaint / Report modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState('Unprofessional Behavior');
  const [reportDescription, setReportDescription] = useState('');
  const [reportEvidence, setReportEvidence] = useState([]);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [reportStatus, setReportStatus] = useState('idle'); // idle, sending, success

  // Check favorite status on mount/change
  useEffect(() => {
    const id = vendor?._id || vendorId;
    if (user && id) {
      userApi.checkFavorite(id)
        .then(res => {
          if (res.success) {
            setIsFavorite(Boolean(res.isFavorite));
          }
        })
        .catch(err => console.error('Error checking favorite status:', err));
    }
  }, [user, vendor, vendorId]);

  const handleToggleFavorite = async () => {
    if (!user) {
      alert('Please log in first to save vendors to your favorites.');
      navigate('/login', { state: { from: `/user/vendor/${vendorId}` } });
      return;
    }
    const id = vendor?._id || vendorId;
    setIsFavoriteLoading(true);
    try {
      if (isFavorite) {
        const res = await userApi.removeFavorite(id);
        if (res.success) setIsFavorite(false);
      } else {
        const res = await userApi.addFavorite(id);
        if (res.success) setIsFavorite(true);
      }
    } catch (err) {
      console.error('Favorite update error:', err);
      alert('Could not update favorites: ' + (err.message || ''));
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleReportSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!user) {
      alert('Please log in first to report a vendor.');
      navigate('/login', { state: { from: `/user/vendor/${vendorId}` } });
      return;
    }
    if (!reportDescription.trim()) {
      alert('Please describe your issue with this vendor.');
      return;
    }
    setReportStatus('sending');
    try {
      const res = await userApi.createComplaint({
        vendorId: vendor?._id || vendorId,
        category: reportCategory,
        description: reportDescription.trim(),
        evidence: reportEvidence
      });
      if (res.success) {
        setReportStatus('success');
        setTimeout(() => {
          setIsReportModalOpen(false);
          setReportStatus('idle');
          setReportDescription('');
          setReportEvidence([]);
        }, 2000);
      } else {
        throw new Error(res.message || 'Failed to submit complaint');
      }
    } catch (err) {
      console.error('Complaint submit error:', err);
      alert('Could not submit complaint: ' + (err.message || 'Server error'));
      setReportStatus('idle');
    }
  };

  // Handle Scroll Locking & Lenis toggling when modal is open
  useEffect(() => {
    if (isRequestModalOpen || isReportModalOpen) {
      document.body.style.overflow = 'hidden';
      // Use window.lenis.stop() if available to pause smooth scroll
      if (window.lenis && typeof window.lenis.stop === 'function') {
        window.lenis.stop();
      }
    } else {
      document.body.style.overflow = '';
      // Resume Lenis smooth scroll
      if (window.lenis && typeof window.lenis.start === 'function') {
        window.lenis.start();
      }
    }

    return () => {
      document.body.style.overflow = '';
      if (window.lenis && typeof window.lenis.start === 'function') {
        window.lenis.start();
      }
    };
  }, [isRequestModalOpen, isReportModalOpen]);

  // Pre-fill form from localStorage
  useEffect(() => {
    const savedDetails = localStorage.getItem('eventDetails');
    if (savedDetails) {
      try {
        const parsed = JSON.parse(savedDetails);
        setFormData(prev => ({
          ...prev,
          name: parsed.fullName || parsed.name || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
          date: parsed.weddingDate || '',
          message: `Hey there! We are interested in potentially hosting our wedding at your ${vendor?.category || 'venue'}. Could you send through information on your packages? Thanks!`
        }));
      } catch (e) {
        console.error('Error parsing event details', e);
      }
    }
  }, [vendor]);

  // Dynamic data for vendor details derived strictly from MongoDB document (NO MOCKS)
  const vendorImages = (vendor?.portfolio && vendor.portfolio.length > 0)
    ? vendor.portfolio.filter(p => p.type === 'Photo' || !p.type).map(p => p.url).filter(Boolean)
    : (vendor?.profileImage ? [vendor.profileImage] : []);

  const pricingData = (() => {
    const list = [];
    if (vendor?.services && vendor.services.length > 0) {
      vendor.services.forEach((srv, srvIdx) => {
        const catName = typeof srv.category === 'object' ? (srv.category?.name || '') : (srv.category || '');
        if (srv.packages && srv.packages.length > 0) {
          srv.packages.forEach((pkg, pkgIdx) => {
            list.push({
              id: `${srvIdx}-${pkgIdx}`,
              name: pkg.name || srv.name,
              description: (pkg.features || []).join(' • ') || catName,
              price: pkg.price ? `₹${pkg.price.toLocaleString()}` : (vendor.pricing?.range ? `₹${vendor.pricing.range}` : 'Contact for price'),
              unit: 'per event',
              icon: 'camera'
            });
          });
        } else {
          const srvPrice = (typeof srv.price === 'number')
            ? srv.price
            : (srv.price?.discounted || srv.price?.original);
          list.push({
            id: srv._id || srvIdx,
            name: srv.name || 'Service Package',
            description: (srv.features || []).join(' • ') || srv.shortDescription || catName,
            price: srvPrice ? `₹${srvPrice.toLocaleString()}` : (vendor.pricing?.range ? `₹${vendor.pricing.range}` : (vendor.startingPrice ? `Starting ₹${vendor.startingPrice.toLocaleString()}` : 'Contact for price')),
            unit: 'per event',
            icon: 'camera'
          });
        }
      });
    }
    return list;
  })();

  const albumsData = (vendor?.portfolio && vendor.portfolio.length > 0)
    ? [{
        id: 'portfolio-main',
        name: `${vendor.businessName || 'Vendor'} Portfolio`,
        imageCount: vendor.portfolio.filter(p => p.type === 'Photo' || !p.type).length,
        coverImage: vendor.portfolio[0]?.url || vendor.profileImage
      }]
    : [];

  const videoStories = (vendor?.portfolio && vendor.portfolio.some(p => p.type === 'Video'))
    ? vendor.portfolio.filter(p => p.type === 'Video').map((v, i) => ({
        id: i + 1,
        thumbnail: v.url || vendor.profileImage,
        duration: 'HD Video'
      }))
    : [];

  const reviewsData = (vendor?.reviews && vendor.reviews.length > 0)
    ? vendor.reviews.map((r, idx) => ({
        id: r._id || idx,
        name: r.userId?.name || 'Verified Couple',
        rating: r.rating || 5,
        review: r.comment || '',
        timeAgo: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Recently',
        initial: (r.userId?.name || 'U')[0].toUpperCase(),
        reply: r.reply,
        photos: r.photos || []
      }))
    : [];

  // Dynamically generated FAQs based on real vendor fields
  const faqData = (() => {
    const faqs = [];
    if (vendor?.businessName) {
      const srvs = Array.isArray(vendor?.services) && vendor.services.length > 0
        ? vendor.services.map(s => s.name || s.category).filter(Boolean).join(', ')
        : (vendor?.selectedCategories?.map(c => c.categoryName).join(', ') || vendor?.category);
      if (srvs) {
        faqs.push({
          id: 1,
          question: `What services does ${vendor.businessName} offer?`,
          answer: `${vendor.businessName} provides ${srvs}.`
        });
      }
      if (vendor.pricing?.range || vendor.startingPrice) {
        const pr = vendor.pricing?.range ? `₹${vendor.pricing.range}` : `Starting from ₹${vendor.startingPrice.toLocaleString()}`;
        faqs.push({
          id: 2,
          question: `What is the estimated pricing for ${vendor.businessName}?`,
          answer: `Estimated pricing is ${pr}${vendor.pricing?.notes ? ` (${vendor.pricing.notes})` : ''}. Custom quotes can be requested via Send Inquiry.`
        });
      }
      if (vendor.city || (vendor.businessDetails?.serviceCities && vendor.businessDetails.serviceCities.length > 0)) {
        const cities = [vendor.city, ...(vendor.businessDetails?.serviceCities || [])].filter(Boolean).join(', ');
        faqs.push({
          id: 3,
          question: `Which locations does ${vendor.businessName} cover?`,
          answer: `${vendor.businessName} primarily serves ${cities}. Destination events are available upon inquiry.`
        });
      }
      if (vendor.businessDetails?.years) {
        faqs.push({
          id: 4,
          question: `How many years of experience does ${vendor.businessName} have?`,
          answer: `${vendor.businessName} has over ${vendor.businessDetails.years} years of professional experience in wedding services.`
        });
      }
    }
    return faqs;
  })();

  // Real date availability state
  const [selectedEventDate, setSelectedEventDate] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState(null); // null, { available: bool, message: string }
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const handleCheckAvailability = async (targetDate) => {
    const checkDate = targetDate || selectedEventDate;
    if (!checkDate) {
      alert('Please select an event date to check availability.');
      return;
    }
    setIsCheckingAvailability(true);
    try {
      const res = await userApi.getVendorAvailability(vendor?._id || vendorId, { date: checkDate });
      if (res.success) {
        setAvailabilityStatus({
          available: res.isAvailable,
          message: res.isAvailable 
            ? `Available on ${checkDate}! You can proceed to send inquiry or book.`
            : `Unavailable on ${checkDate} (${res.reason || 'Existing Confirmed Booking'}). You can still inquire for nearby dates.`
        });
      }
    } catch (err) {
      console.error('Error checking availability:', err);
      setAvailabilityStatus({
        available: false,
        message: 'Could not verify date availability. Please submit an inquiry.'
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  useEffect(() => {
    const loadVendor = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const res = await userApi.getVendorById(vendorId);
        if (res.success && res.data) {
          setVendor(res.data);
        } else {
          setFetchError('Vendor not found or inactive');
        }
      } catch (err) {
        console.error('Error fetching vendor:', err);
        setFetchError(err.message || 'Vendor not found');
      } finally {
        setIsLoading(false);
      }
    };

    if (vendorId) {
      loadVendor();
    }
  }, [vendorId]);

  useEffect(() => {
    const handleScroll = () => {
      if (tabsRef.current) {
        const tabsTop = tabsRef.current.offsetTop;
        const scrollTop = window.pageYOffset;
        setIsSticky(scrollTop > tabsTop - 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    const section = sectionsRef.current[tab];
    if (section) {
      const headerHeight = 120; // Approximate header + tabs height
      const elementPosition = section.offsetTop - headerHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleWhatsAppContact = () => {
    const phoneNumber = vendor?.phone || '919876543210';
    const srvNames = Array.isArray(vendor?.services) ? vendor.services.map(s => s.name || s).join(', ') : 'services';
    const message = `Hi! I'm interested in your ${srvNames} services for my wedding. Can you please share more details?`;
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCall = () => {
    const phoneNumber = vendor?.phone || '919876543210';
    window.open(`tel:${phoneNumber.replace(/[^0-9]/g, '')}`, '_self');
  };

  const handleMessage = () => {
    navigate(`/user/chats/${vendorId}`);
  };

  const handleInquireService = (item) => {
    setFormData(prev => ({
      ...prev,
      message: `Inquiry for package "${item.name}" (${item.price}): `
    }));
    setIsRequestModalOpen(true);
  };

  const handleSendRequest = async () => {
    if (!user) {
      alert('Please log in first to submit an inquiry to this vendor');
      navigate('/login', { state: { from: `/user/vendor/${vendorId}` } });
      return;
    }

    if (!formData.phone || !formData.date) {
      alert('Please enter your phone number and event date');
      return;
    }

    setRequestStatus('sending');

    try {
      const guestNum = parseInt(formData.guestCount) || 150;
      const res = await userApi.createLead({
        vendorId: vendor?._id || vendorId,
        customerName: formData.name || user?.name || 'Valued Customer',
        phone: formData.phone || user?.phone,
        eventDate: formData.date,
        eventLocation: vendor?.city || 'Indore',
        guestCount: guestNum,
        budget: 0,
        requirements: formData.guestCount ? `Approx ${formData.guestCount} guests` : '',
        message: formData.message || `Inquiry for ${vendor?.businessName || 'wedding services'}`,
        referencePhotos: referencePhotos
      });

      if (res.success) {
        setRequestStatus('success');
        setTimeout(() => {
          setIsRequestModalOpen(false);
          setRequestStatus('idle');
          setReferencePhotos([]);
        }, 2000);
      } else {
        throw new Error(res.message || 'Failed to submit inquiry');
      }
    } catch (e) {
      console.error('Error submitting inquiry to backend:', e);
      alert('Failed to send inquiry: ' + (e.message || 'Server error'));
      setRequestStatus('idle');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-[#E91E63] border-t-transparent animate-spin rounded-full mb-3"></div>
        <p className="text-sm font-semibold text-slate-500">Loading vendor details...</p>
      </div>
    );
  }

  if (fetchError || !vendor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-slate-50">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <Icon name="alertTriangle" size="lg" className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Vendor Not Found</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-sm">
          {fetchError || 'The vendor you are looking for does not exist or has not yet been approved.'}
        </p>
        <Button onClick={() => navigate('/user/vendors')}>Return to Vendors Marketplace</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Hero Image Section */}
      <div className="relative">
        <div className="w-full h-72 sm:h-96 overflow-hidden">
          <img
            src={vendorImages[currentImageIndex]}
            alt={vendor.name}
            className="w-full h-full object-cover"
          />
          {/* Video Overlay - Bottom Left */}
          <div className="absolute bottom-4 left-4">
            <div className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
              <Icon name="play" size="sm" color="white" />
            </div>
          </div>
        </div>

        {/* Top Control Bar Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-black/30 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/20"
          >
            <Icon name="arrowLeft" size="sm" />
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setIsReportModalOpen(true)}
              title="Report Vendor"
              className="w-10 h-10 bg-black/30 backdrop-blur-md text-white hover:text-red-400 rounded-full flex items-center justify-center border border-white/20 transition-colors"
            >
              <Icon name="alertTriangle" size="sm" />
            </button>
            <button className="w-10 h-10 bg-black/30 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/20">
              <Icon name="share" size="sm" />
            </button>
          </div>
        </div>

        {/* Hired & Save Overlay - Top Right over image */}
        <div className="absolute top-16 right-4 flex items-center gap-3 z-10">
          <button className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg border border-gray-100">
            <Icon name="verified" size="xs" color="primary" />
            <span className="text-[10px] font-bold text-gray-800">Hired?</span>
          </button>
          <button
            onClick={handleToggleFavorite}
            disabled={isFavoriteLoading}
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            className={`w-9 h-9 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-gray-100 transition-all ${
              isFavorite ? 'bg-red-50 text-red-500 scale-105' : 'bg-white/90 text-gray-400 hover:text-red-500'
            }`}
          >
            {isFavoriteLoading ? (
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent animate-spin rounded-full" />
            ) : (
              <Icon name="heart" size="sm" style={{ color: isFavorite ? '#ef4444' : undefined }} />
            )}
          </button>
        </div>

        {/* Image Counter - Bottom Right */}
        <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs border border-white/30">
          {currentImageIndex + 1} / {vendorImages.length}
        </div>
      </div>

      {/* Urgency Banner */}
      <div className="px-4 py-3 border-b" style={{ backgroundColor: '#f0f9ff', borderColor: '#e0f2fe' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
            <Icon name="party" size="xs" style={{ color: '#f97316' }} />
          </div>
          <p className="text-xs font-medium" style={{ color: '#0369a1' }}>
            One couple is considering this venue right now. <button className="font-bold underline">Save your date</button>
          </p>
        </div>
      </div>

      {/* Main Vendor Details */}
      <div className="px-5 pt-6 pb-2">
        <h1
          className="text-2xl font-bold mb-3"
          style={{ color: theme.semantic.text.primary }}
        >
          {vendor?.businessName || vendor?.name}
        </h1>

        <div className="flex flex-col gap-3">
          {/* Rating Section */}
          <div className="flex items-center gap-2">
            <span className="text-[#E91E63] text-sm font-black">
              {vendor?.rating && vendor.rating > 0 ? `★ ${vendor.rating}` : '★ New'}
            </span>
            <span className="text-xs font-semibold" style={{ color: theme.semantic.text.secondary }}>
              ({vendor?.reviewCount ?? vendor?.reviews?.length ?? 0} verified reviews)
            </span>
          </div>

          {/* Location Section */}
          <div className="flex items-center gap-2">
            <Icon name="location" size="sm" style={{ color: theme.semantic.text.tertiary }} />
            <span className="text-sm font-medium" style={{ color: theme.semantic.text.secondary }}>
              {vendor?.city || vendor?.location || 'Indore'}
            </span>
          </div>

          {/* Promotion Section */}
          {vendor?.pricing?.notes && (
            <div className="flex items-center gap-2">
              <Icon name="sparkles" size="sm" style={{ color: theme.colors.primary[500] }} />
              <span className="text-xs font-bold tracking-wide" style={{ color: theme.colors.primary[600] }}>
                {vendor.pricing.notes}
              </span>
            </div>
          )}
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                <Icon name="money" size="sm" style={{ color: theme.semantic.text.secondary }} />
              </div>
              <p className="text-sm font-medium" style={{ color: theme.semantic.text.primary }}>
                {vendor?.pricing?.range ? `₹${vendor.pricing.range}` : (vendor?.startingPrice ? `Starting ₹${vendor.startingPrice.toLocaleString()}` : (vendor?.price || 'Contact for price'))}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                <Icon name="users" size="sm" style={{ color: theme.semantic.text.secondary }} />
              </div>
              <p className="text-sm font-medium" style={{ color: theme.semantic.text.primary }}>
                {vendor?.businessDetails?.teamSize ? `${vendor.businessDetails.teamSize} team members` : (vendor?.experience ? `${vendor.experience} experience` : 'Verified Vendor')}
              </p>
            </div>
          </div>
        </div>

        {/* Popular Badge */}
        <div className="mt-4 flex items-center gap-2">
          <Icon name="arrow" size="xs" className="rotate-45" style={{ color: theme.semantic.text.secondary }} />
          <span className="text-xs font-semibold text-gray-500 italic">Popular in your area</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        ref={tabsRef}
        className={`px-4 py-3 ${isSticky ? 'shadow-md' : ''}`}
        style={{ backgroundColor: theme.semantic.background.primary }}
      >
        <div className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide">
          {[
            { key: 'pricing', label: 'Pricing' },
            { key: 'projects', label: 'Projects' },
            { key: 'about', label: 'About' },
            { key: 'reviews', label: 'Reviews' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`whitespace-nowrap pb-2 border-b-2 transition-colors text-sm sm:text-base ${activeTab === tab.key
                ? 'border-current font-medium'
                : 'border-transparent'
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

      {/* Content Sections */}
      <div className="px-4 pb-40">
        {/* Pricing Section */}
        <div
          ref={el => sectionsRef.current['pricing'] = el}
          className="mb-6 sm:mb-8"
        >
          <h2
            className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4"
            style={{ color: theme.semantic.text.primary }}
          >
            Pricing Info
          </h2>

          <div
            className="rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4"
            style={{ backgroundColor: theme.semantic.card.background }}
          >
            {pricingData.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm font-medium text-slate-500">
                  {vendor?.startingPrice ? `Starting from ₹${vendor.startingPrice.toLocaleString()}` : 'No fixed packages listed. Custom pricing available.'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Submit an inquiry or contact vendor for a customized proposal.</p>
              </div>
            ) : (
              pricingData.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: theme.colors.primary[100] }}
                    >
                      <Icon name={item.icon} size="sm" color="primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="font-medium text-sm sm:text-base line-clamp-1"
                        style={{ color: theme.semantic.text.primary }}
                      >
                        {item.name}
                      </h3>
                      {item.description && (
                        <p
                          className="text-xs sm:text-sm line-clamp-1"
                          style={{ color: theme.semantic.text.secondary }}
                        >
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    <div
                      className="font-bold text-sm sm:text-lg"
                      style={{ color: theme.semantic.text.primary }}
                    >
                      {item.price}
                    </div>
                    <div
                      className="text-xs sm:text-sm"
                      style={{ color: theme.semantic.text.secondary }}
                    >
                      {item.unit}
                    </div>
                    <button
                      onClick={() => handleInquireService(item)}
                      className="px-3 py-1 text-xs font-semibold rounded-lg shadow-xs hover:opacity-90 active:scale-95 transition-all mt-1"
                      style={{ backgroundColor: theme.colors.primary[600], color: 'white' }}
                    >
                      Request Quote
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Check Availability */}
          <div
            className="rounded-2xl p-4 sm:p-6 mt-4 sm:mt-6"
            style={{ backgroundColor: theme.semantic.card.background }}
          >
            <h3
              className="text-base sm:text-lg font-semibold mb-3 sm:mb-4"
              style={{ color: theme.semantic.text.primary }}
            >
              Check Date Availability
            </h3>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="date"
                  value={selectedEventDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedEventDate(e.target.value)}
                  className="w-full p-2 sm:p-3 border rounded-lg text-sm sm:text-base"
                  style={{
                    borderColor: theme.semantic.card.border,
                    backgroundColor: theme.semantic.background.primary
                  }}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => handleCheckAvailability()}
                disabled={isCheckingAvailability || !selectedEventDate}
                className="px-4 sm:px-6 text-sm sm:text-base"
                style={{
                  borderColor: theme.colors.primary[500],
                  color: theme.colors.primary[600]
                }}
              >
                {isCheckingAvailability ? 'Checking...' : 'Check Availability'}
              </Button>
            </div>

            {availabilityStatus && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs sm:text-sm font-medium border flex items-center gap-2 ${
                  availabilityStatus.available
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <Icon
                  name={availabilityStatus.available ? 'check' : 'alertTriangle'}
                  size="xs"
                  className={availabilityStatus.available ? 'text-emerald-600' : 'text-amber-600'}
                />
                <span>{availabilityStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Projects Section */}
        <div
          ref={el => sectionsRef.current['projects'] = el}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2
              className="text-lg sm:text-xl font-semibold"
              style={{ color: theme.semantic.text.primary }}
            >
              Albums {albumsData.length > 0 && <span className="text-sm font-normal">({albumsData.length} items)</span>}
            </h2>
          </div>

          {albumsData.length === 0 ? (
            <div
              className="rounded-2xl p-6 text-center border border-dashed border-slate-200 mb-6"
              style={{ backgroundColor: theme.semantic.card.background }}
            >
              <Icon name="image" size="md" color="gray" className="mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-500">No portfolio albums uploaded yet.</p>
              <p className="text-xs text-slate-400 mt-1">Vendor will upload past wedding photography and media soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
              {albumsData.map((album) => (
                <div key={album.id} className="relative">
                  <div className="aspect-square rounded-xl overflow-hidden">
                    <img
                      src={album.coverImage}
                      alt={album.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Image Count Badge */}
                  <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <Icon name="image" size="xs" />
                    {album.imageCount}
                  </div>

                  {/* Album Name */}
                  <div className="absolute bottom-2 left-2">
                    <span className="text-white font-medium text-xs sm:text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                      {album.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            className="w-full mb-4 sm:mb-6 text-sm sm:text-base"
          >
            View All Albums →
          </Button>

          {/* Video Stories */}
          <h3
            className="text-base sm:text-lg font-semibold mb-3 sm:mb-4"
            style={{ color: theme.semantic.text.primary }}
          >
            Video Stories
          </h3>

          <div className="flex gap-3 overflow-x-auto">
            {videoStories.map((video) => (
              <div key={video.id} className="relative flex-shrink-0">
                <div className="w-24 h-36 sm:w-32 sm:h-48 rounded-xl overflow-hidden">
                  <img
                    src={video.thumbnail}
                    alt="Video story"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <Icon name="play" size="sm" color="white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Quote CTA */}
          <div
            className="rounded-2xl p-3 sm:p-4 mt-4 sm:mt-6 border-2 border-dashed"
            style={{ borderColor: theme.colors.primary[300] }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: theme.colors.primary[100] }}
                >
                  <Icon name="message" size="sm" color="primary" />
                </div>
                <span
                  className="font-medium text-sm sm:text-base"
                  style={{ color: theme.semantic.text.primary }}
                >
                  Require Custom quote?
                </span>
              </div>
              <Button
                size="sm"
                className="text-sm"
                style={{
                  backgroundColor: theme.colors.primary[500],
                  color: 'white'
                }}
              >
                Chat Now
              </Button>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div
          ref={el => sectionsRef.current['about'] = el}
          className="mb-6 sm:mb-8"
        >
          <h2
            className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4"
            style={{ color: theme.semantic.text.primary }}
          >
            About
          </h2>

          <div
            className="rounded-2xl p-4 sm:p-6"
            style={{ backgroundColor: theme.semantic.card.background }}
          >
            <p className="mb-3 sm:mb-4 text-sm sm:text-base">
              <span className="font-medium">Been on </span>
              <span style={{ color: theme.colors.primary[600] }}>Utsavo</span>
              <span className="font-medium"> Since {vendor?.businessDetails?.years ? `${vendor.businessDetails.years} years` : (vendor?.experience || 'Verified Partner')}</span>
            </p>

            <p
              className="text-sm sm:text-base leading-relaxed mb-3 sm:mb-4"
              style={{ color: theme.semantic.text.secondary }}
            >
              {vendor?.description || `${vendor?.businessName || vendor?.name || 'This vendor'} is a professional wedding service provider in ${vendor?.city || vendor?.location || 'Indore'}. Dedicated to making your wedding memorable.`}
            </p>

            {vendor?.services && vendor.services.length > 0 && (
              <div>
                <h4
                  className="font-medium mb-2 text-sm sm:text-base"
                  style={{ color: theme.semantic.text.primary }}
                >
                  Services provided by {vendor?.businessName || vendor?.name}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {vendor.services.map((service, index) => {
                    const label = typeof service === 'object' ? (service?.name || service?.category || 'Service') : service;
                    return (
                      <span
                        key={index}
                        className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full"
                        style={{
                          backgroundColor: theme.colors.primary[100],
                          color: theme.colors.primary[700]
                        }}
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div
          ref={el => sectionsRef.current['reviews'] = el}
          className="mb-6 sm:mb-8"
        >
          <h2
            className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4"
            style={{ color: theme.semantic.text.primary }}
          >
            Reviews
          </h2>

          {reviewsData.length === 0 ? (
            <div
              className="rounded-2xl p-6 text-center border border-dashed border-slate-200"
              style={{ backgroundColor: theme.semantic.card.background }}
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Icon name="star" size="md" color="gray" />
              </div>
              <h3 className="font-semibold text-sm mb-1" style={{ color: theme.semantic.text.primary }}>
                No Reviews Yet
              </h3>
              <p className="text-xs max-w-xs mx-auto" style={{ color: theme.semantic.text.secondary }}>
                Book this vendor through Utsavo to be the first couple to share verified feedback!
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {reviewsData.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl p-4 sm:p-6"
                  style={{ backgroundColor: theme.semantic.card.background }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0"
                      style={{ backgroundColor: theme.colors.primary[500] }}
                    >
                      {review.initial}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="font-medium text-sm sm:text-base truncate"
                          style={{ color: theme.semantic.text.primary }}
                        >
                          {review.name}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {[...Array(5)].map((_, i) => (
                            <Icon
                              key={i}
                              name="star"
                              size="xs"
                              color={i < review.rating ? "secondary" : "gray"}
                            />
                          ))}
                          <span className="text-xs sm:text-sm ml-1">{review.rating}</span>
                        </div>
                      </div>

                      <p
                        className="text-xs sm:text-sm mb-2"
                        style={{ color: theme.semantic.text.secondary }}
                      >
                        Reviewed {review.timeAgo}
                      </p>
                    </div>

                    <button className="flex-shrink-0">
                      <Icon name="share" size="sm" />
                    </button>
                  </div>

                  <p
                    className="text-sm sm:text-base leading-relaxed"
                    style={{ color: theme.semantic.text.primary }}
                  >
                    {review.review}
                  </p>

                  {review.photos?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {review.photos.map((p, pIdx) => (
                        <img
                          key={pIdx}
                          src={p}
                          alt="Review attachment"
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                        />
                      ))}
                    </div>
                  )}

                  {review.review.length > 100 && (
                    <button
                      className="text-sm mt-2"
                      style={{ color: theme.colors.primary[600] }}
                    >
                      Read More
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <div className="mb-6 sm:mb-8">
          <h2
            className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4"
            style={{ color: theme.semantic.text.primary }}
          >
            Frequently Asked Questions
          </h2>

          <div className="space-y-2 sm:space-y-3">
            {faqData.map((faq) => (
              <details
                key={faq.id}
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: theme.semantic.card.background }}
              >
                <summary
                  className="p-3 sm:p-4 cursor-pointer font-medium text-sm sm:text-base"
                  style={{ color: theme.semantic.text.primary }}
                >
                  {faq.question}
                </summary>
                <div
                  className="px-3 sm:px-4 pb-3 sm:pb-4 text-xs sm:text-sm"
                  style={{ color: theme.semantic.text.secondary }}
                >
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Action Footer */}
      <div
        className="fixed bottom-20 left-0 right-0 p-4 z-50"
        style={{
          backgroundColor: theme.semantic.background.primary,
          borderColor: theme.semantic.border.light
        }}
      >
        <div className="flex items-center gap-4 max-w-md mx-auto">
          {/* Call Button */}
          <button
            onClick={handleCall}
            className="w-12 h-12 rounded-full border flex items-center justify-center transition-transform active:scale-95"
            style={{ borderColor: theme.semantic.border.light, backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="phone" size="sm" style={{ color: theme.colors.primary[500] }} />
          </button>

          {/* Main Pricing Button */}
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="flex-1 h-12 rounded-full font-bold text-white shadow-lg transition-transform active:scale-95"
            style={{
              backgroundColor: theme.colors.primary[500],
              boxShadow: `0 4px 15px ${theme.colors.primary[500]}40`
            }}
          >
            Request pricing
          </button>

          {/* Message Button */}
          <button
            onClick={handleMessage}
            className="w-12 h-12 rounded-full border flex items-center justify-center relative transition-transform active:scale-95"
            style={{ borderColor: theme.semantic.border.light, backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="chat" size="sm" style={{ color: theme.colors.primary[500] }} />
            {/* Notification Badge if any */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-[8px] text-white">1</span>
            </div>
          </button>
        </div>
      </div>

      {/* Request Pricing Modal - True Bottom Sheet Internal Scroll */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[40px] sm:rounded-[32px] overflow-hidden flex flex-col h-[85vh] sm:h-auto sm:max-h-[85vh] shadow-2xl animate-in slide-in-from-bottom duration-500">
            {/* Modal Header - Fixed at top of white card */}
            <div className="shrink-0 px-8 pt-10 pb-6 border-b border-gray-50 flex items-start justify-between bg-white">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1 leading-none">{vendor.name}</p>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Request pricing</h2>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            {/* Modal Body - Scrollable white page area */}
            <div className="flex-1 overflow-y-auto px-8 pt-6 pb-6 min-h-0" data-lenis-prevent>
              {requestStatus === 'success' ? (
                <div className="py-24 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 shadow-sm">
                    <Icon name="check" size="lg" style={{ color: '#10b981' }} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3">Request Sent!</h3>
                  <p className="text-gray-500 font-bold text-base px-4">The vendor will contact you shortly.</p>
                  <button
                    onClick={() => setIsRequestModalOpen(false)}
                    className="mt-12 w-full h-15 bg-gray-900 text-white rounded-2xl font-black shadow-lg"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <p className="text-[14px] text-gray-400 leading-relaxed font-semibold">
                    Fill this form and <span className="font-extrabold text-gray-700">{vendor.name}</span> will contact you shortly. All the information provided will be treated confidentially.
                  </p>

                  <div className="space-y-7">
                    {/* Input Groups */}
                    <div className="relative">
                      <label className="text-[11px] uppercase font-bold text-gray-400 mb-3 block tracking-widest px-1">Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full h-15 bg-gray-50/20 rounded-2xl border border-gray-100 focus:border-primary-500 focus:bg-white outline-none px-6 transition-all text-base font-bold text-gray-800 placeholder:text-gray-400"
                        placeholder="e.g. Jai Sri Ram"
                      />
                    </div>

                    <div className="relative">
                      <label className="text-[11px] uppercase font-bold text-gray-400 mb-3 block tracking-widest px-1">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full h-15 bg-gray-50/20 rounded-2xl border border-gray-100 focus:border-primary-500 focus:bg-white outline-none px-6 transition-all text-base font-bold text-gray-800 placeholder:text-gray-400"
                        placeholder="nana@na.com"
                      />
                    </div>

                    <div className="relative">
                      <label className="text-[11px] uppercase font-bold text-gray-400 mb-3 block tracking-widest px-1">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full h-15 bg-gray-50/20 rounded-2xl border border-gray-100 focus:border-primary-500 focus:bg-white outline-none px-6 transition-all text-base font-bold text-gray-800 placeholder:text-gray-400"
                        placeholder="Your number"
                      />
                    </div>

                    <div className="relative">
                      <label className="text-[11px] uppercase font-bold text-gray-400 mb-3 block tracking-widest px-1">Wedding Date</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full h-15 bg-gray-50/20 rounded-2xl border border-gray-100 focus:border-primary-500 focus:bg-white outline-none px-6 transition-all text-base font-bold text-gray-800"
                      />
                      <div className="flex items-center gap-4 mt-5 px-1">
                        <input
                          type="checkbox"
                          id="openToOtherDates"
                          checked={formData.openToOtherDates}
                          onChange={(e) => setFormData({ ...formData, openToOtherDates: e.target.checked })}
                          className="w-6 h-6 rounded-md border-gray-100 text-primary-500 focus:ring-primary-500"
                        />
                        <label htmlFor="openToOtherDates" className="text-[15px] font-bold text-gray-600">I am open to other dates</label>
                      </div>
                      <button className="text-[14px] font-black text-primary-600 mt-5 px-1 hover:underline underline-offset-8">I haven't decided on a date yet</button>
                    </div>

                    <div>
                      <label className="text-[11px] uppercase font-bold text-gray-400 mb-4 block tracking-widest px-1">Approx. Guest Count</label>
                      <div className="grid grid-cols-4 gap-3">
                        {['0-100', '100-200', '200-300', '300+'].map(count => (
                          <button
                            key={count}
                            onClick={() => setFormData({ ...formData, guestCount: count })}
                            className={`h-14 rounded-2xl text-[13px] font-black border-2 transition-all ${formData.guestCount === count
                                ? 'bg-primary-50 border-primary-500 text-primary-600 shadow-md transform scale-105'
                                : 'bg-gray-50/50 border-transparent text-gray-400'
                              }`}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative">
                      <label className="text-[11px] uppercase font-bold text-gray-400 mb-3 block tracking-widest px-1">Message for vendor</label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full bg-gray-50/20 rounded-[28px] border border-gray-100 focus:border-primary-500 focus:bg-white outline-none p-7 transition-all text-base font-bold text-gray-700 min-h-[120px] resize-none leading-relaxed"
                        placeholder="Tell them more about your dream wedding..."
                      />
                    </div>

                    <div className="relative">
                      <label className="text-[11px] uppercase font-bold text-gray-400 mb-2 block tracking-widest px-1">
                        Inspiration / Reference Photos (Optional)
                      </label>
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        {referencePhotos.map((url, idx) => (
                          <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200">
                            <img src={url} alt="Reference" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setReferencePhotos(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shadow"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-500 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50">
                          {isUploadingPhoto ? (
                            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent animate-spin rounded-full" />
                          ) : (
                            <>
                              <Icon name="camera" size="xs" className="text-gray-400" />
                              <span className="text-[9px] font-bold text-gray-500 mt-1">+ Photo</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            disabled={isUploadingPhoto}
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (!files || files.length === 0) return;
                              setIsUploadingPhoto(true);
                              try {
                                for (const file of Array.from(files)) {
                                  const res = await userApi.uploadImage(file);
                                  if (res.success && res.data?.url) {
                                    setReferencePhotos(prev => [...prev, res.data.url]);
                                  }
                                }
                              } catch (err) {
                                console.error('Photo upload failed:', err);
                                alert('Photo upload failed: ' + err.message);
                              } finally {
                                setIsUploadingPhoto(false);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <span className="text-[11px] text-gray-400 px-1">Upload reference outfits, decor themes, or venue style</span>
                    </div>

                    {/* Button moved to footer */}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Footer for Button */}
            {requestStatus !== 'success' && (
              <div className="shrink-0 px-8 py-6 bg-white border-t border-gray-50">
                <button
                  onClick={handleSendRequest}
                  disabled={requestStatus === 'sending'}
                  style={{ backgroundColor: '#e11d48' }}
                  className="w-full py-5 text-white rounded-[24px] font-black text-xl shadow-[0_20px_40px_-15px_rgba(225,29,72,0.4)] flex items-center justify-between px-9 transition-all active:scale-[0.95]"
                >
                  {requestStatus === 'sending' ? (
                    <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : (
                    <>
                      <span className="tracking-tight text-white">Send Request</span>
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center -mr-2 shadow-inner pointer-events-none">
                        <Icon name="send" size="xs" color="white" />
                      </div>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report / Complaint Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-scale-up">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow-sm">
                  <Icon name="alertTriangle" size="sm" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Report Vendor</h3>
                  <p className="text-xs text-slate-500">Official dispute submission to Utsavo Trust & Safety</p>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {reportStatus === 'success' ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                  <Icon name="check" size="md" />
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-2">Complaint Submitted</h4>
                <p className="text-sm text-slate-600 mb-6">
                  Your grievance against <span className="font-semibold">{vendor?.businessName || vendor?.name}</span> has been logged under ID review. Our grievance officer will review and update your account.
                </p>
                <button
                  onClick={() => {
                    setIsReportModalOpen(false);
                    setReportStatus('idle');
                  }}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Complaint Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-red-500 focus:bg-white transition-all"
                  >
                    <option value="Unprofessional Behavior">Unprofessional Behavior</option>
                    <option value="Pricing Dispute">Pricing Dispute / Overcharging</option>
                    <option value="Service Delivery Issue">Service Delivery Issue</option>
                    <option value="Communication Failure">Communication Failure / Ghosting</option>
                    <option value="Breach of Agreement">Breach of Agreement</option>
                    <option value="Other">Other Grievance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Detailed Explanation <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Describe what occurred, including dates, missed commitments, or financial discrepancies..."
                    rows={4}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-red-500 focus:bg-white transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Evidence / Proof (Screenshots, Receipts)
                  </label>
                  <div className="flex items-center gap-3 flex-wrap">
                    {reportEvidence.map((url, idx) => (
                      <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setReportEvidence(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <label className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 hover:border-red-500 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50">
                      {isUploadingEvidence ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent animate-spin rounded-full" />
                      ) : (
                        <>
                          <Icon name="camera" size="xs" className="text-slate-400" />
                          <span className="text-[9px] font-bold text-slate-500 mt-0.5">+ Add</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={isUploadingEvidence}
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          setIsUploadingEvidence(true);
                          try {
                            for (const file of Array.from(files)) {
                              const res = await userApi.uploadImage(file);
                              if (res.success && res.data?.url) {
                                setReportEvidence(prev => [...prev, res.data.url]);
                              }
                            }
                          } catch (err) {
                            console.error('Evidence upload failed:', err);
                            alert('Evidence upload failed: ' + err.message);
                          } finally {
                            setIsUploadingEvidence(false);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportStatus === 'sending'}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-200 transition-all flex items-center gap-2"
                  >
                    {reportStatus === 'sending' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit Grievance</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDetail;