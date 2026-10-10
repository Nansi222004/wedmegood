import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useCart } from '../../../contexts/CartContext';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import userApi from '../../../services/userApi';
import { toast } from '../../../components/ui/Toast';
import { getFriendlyErrorMessage } from '../../../utils/errorHandler';
import VendorAvailabilityCalendar from './VendorAvailabilityCalendar';
import usePlatformSettings from '../../../hooks/usePlatformSettings';

const VendorDetail = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { addToCart, isInCart } = useCart();
  const { user } = useAuth();
  const { ratingsEnabled } = usePlatformSettings();

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
    venueType: 'Not Specified',
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
    // Guest mode has a placeholder user but no account
    if (!user || user.isGuest) {
      toast.info('You are not logged in. Please log in to save vendors.');
      navigate('/login', { state: { from: `/user/vendor/${vendorId}` } });
      return;
    }
    const id = vendor?._id || vendorId;
    setIsFavoriteLoading(true);
    try {
      if (isFavorite) {
        const res = await userApi.removeFavorite(id);
        if (res.success) {
          setIsFavorite(false);
          toast.info('Vendor removed from favorites');
        }
      } else {
        const res = await userApi.addFavorite(id);
        if (res.success) {
          setIsFavorite(true);
          toast.success('Vendor added to favorites');
        }
      }
    } catch (err) {
      console.error('Favorite update error:', err);
      toast.error(getFriendlyErrorMessage(err, 'Could not update favorites.'));
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleReportSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!user) {
      toast.info('Please log in first to report a vendor.');
      navigate('/login', { state: { from: `/user/vendor/${vendorId}` } });
      return;
    }
    if (!reportDescription.trim()) {
      toast.warning('Please describe your issue with this vendor.');
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
        toast.success('Your complaint has been submitted.');
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
      toast.error(getFriendlyErrorMessage(err, 'Could not submit complaint.'));
      setReportStatus('idle');
    }
  };

  // Handle Scroll Locking when modal is open
  useEffect(() => {
    if (isRequestModalOpen || isReportModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isRequestModalOpen, isReportModalOpen]);

  // Pre-fill form from authenticated user profile and localStorage
  useEffect(() => {
    let userName = user?.name || '';
    let userEmail = user?.email || '';
    let userPhone = user?.phone || '';
    let userDate = user?.weddingDate ? new Date(user.weddingDate).toISOString().split('T')[0] : '';
    let userCity = user?.city || '';

    const savedDetails = localStorage.getItem('eventDetails');
    if (savedDetails) {
      try {
        const parsed = JSON.parse(savedDetails);
        userName = userName || parsed.fullName || parsed.name || '';
        userEmail = userEmail || parsed.email || '';
        userPhone = userPhone || parsed.phone || '';
        userDate = userDate || parsed.weddingDate || '';
        userCity = userCity || parsed.city || '';
      } catch (e) {
        console.error('Error parsing event details', e);
      }
    }

    setFormData(prev => ({
      ...prev,
      name: userName || prev.name,
      email: userEmail || prev.email,
      phone: userPhone || prev.phone,
      date: userDate || prev.date,
      location: userCity || prev.location || '',
      message: prev.message || `Hey there! We are interested in potentially hosting our wedding with ${vendor?.businessName || vendor?.name || 'your services'}. Could you send through information on your packages? Thanks!`
    }));
  }, [vendor, user]);

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
        rating: r.rating || null,
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
      toast.warning('Please select an event date to check availability.');
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
      toast.info('Please log in first to submit an inquiry to this vendor.');
      navigate('/login', { state: { from: `/user/vendor/${vendorId}` } });
      return;
    }

    if (!formData.phone || !formData.date) {
      toast.warning('Please enter your phone number and event date.');
      return;
    }

    setRequestStatus('sending');

    try {
      const guestNum = parseInt(formData.guestCount) || 150;
      const res = await userApi.createLead({
        vendorId: vendor?._id || vendorId,
        customerName: formData.name || user?.name || 'Customer',
        phone: formData.phone || user?.phone,
        eventDate: formData.date,
        eventLocation: formData.location || user?.city || vendor?.city || 'Indore',
        guestCount: guestNum,
        venueType: formData.venueType || 'Not Specified',
        budget: Number(formData.budget) || 0,
        requirements: formData.guestCount ? `Approx ${formData.guestCount} guests` : '',
        message: formData.message || `Inquiry for ${vendor?.businessName || 'wedding services'}`,
        referencePhotos: referencePhotos
      });

      if (res.success) {
        setRequestStatus('success');
        toast.success('Inquiry sent successfully to vendor!');
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
      toast.error(getFriendlyErrorMessage(e, 'Failed to send inquiry.'));
      setRequestStatus('idle');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-[#FAF7F2]">
        <div className="w-10 h-10 border-3 border-[#4F1325] border-t-transparent animate-spin rounded-full mb-3" />
        <p className="text-xs font-semibold text-stone-600 tracking-wide">Loading vendor profile...</p>
      </div>
    );
  }

  if (fetchError || !vendor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center bg-[#FAF7F2]">
        <div className="w-14 h-14 rounded-full bg-[#4F1325]/10 text-[#4F1325] flex items-center justify-center mb-4">
          <Icon name="alertTriangle" size="md" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#4F1325] mb-2">Vendor Not Found</h2>
        <p className="text-sm text-stone-500 mb-6 max-w-sm">
          {fetchError || 'The vendor you are looking for does not exist or has not yet been approved.'}
        </p>
        <button
          onClick={() => navigate('/user/vendors')}
          className="px-6 py-2.5 rounded-full bg-[#4F1325] text-white text-xs font-bold shadow-md hover:bg-[#651731] transition-all cursor-pointer"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-800 pb-28">
      <div className="max-w-[430px] md:max-w-4xl mx-auto">
        {/* Hero Image Section */}
        <div className="relative">
          <div className="w-full h-72 sm:h-96 md:h-[400px] overflow-hidden md:rounded-b-3xl shadow-xs bg-stone-900">
            <img
              src={vendorImages[currentImageIndex] || '/dashboardbackgroundimage.webp'}
              alt={vendor?.businessName || vendor?.name}
              className="w-full h-full object-cover"
            />
            {/* Video Overlay - Bottom Left */}
            {videoStories.length > 0 && (
              <div className="absolute bottom-4 left-4">
                <div className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-white">
                  <Icon name="play" size="sm" />
                </div>
              </div>
            )}
          </div>

          {/* Top Left Verified Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
            <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-white/50 text-[11px] font-bold text-stone-800">
              <span className="text-[#D4AF37]">★</span>
              <span>Utsavo Verified</span>
            </div>
          </div>

          {/* Top Right Action Pills (Clean glassmorphism, no redundant back button) */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
            <button
              onClick={() => setIsReportModalOpen(true)}
              title="Report Vendor"
              className="w-9 h-9 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/20 transition-all cursor-pointer"
            >
              <Icon name="alertTriangle" size="xs" />
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: vendor?.businessName || 'Utsavo Vendor', url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  toast.info('Vendor link copied to clipboard!');
                }
              }}
              title="Share Vendor"
              className="w-9 h-9 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/20 transition-all cursor-pointer"
            >
              <Icon name="share" size="xs" />
            </button>
            <button
              onClick={handleToggleFavorite}
              disabled={isFavoriteLoading}
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              className={`w-9 h-9 backdrop-blur-md rounded-full flex items-center justify-center shadow-md border transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-red-500 border-red-400 text-white scale-105'
                  : 'bg-black/40 hover:bg-black/60 border-white/20 text-white'
              }`}
            >
              {isFavoriteLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
              ) : (
                <Icon name="heart" size="xs" style={{ color: isFavorite ? '#ffffff' : undefined }} />
              )}
            </button>
          </div>

          {/* Image Counter - Bottom Right */}
          <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-white/20">
            {currentImageIndex + 1} / {vendorImages.length || 1}
          </div>
        </div>

        {/* Thumbnail Carousel if multiple images */}
        {vendorImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-2.5 scrollbar-hide bg-white/70 border-b border-stone-200/70">
            {vendorImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                  currentImageIndex === idx ? 'border-[#4F1325] scale-105 shadow-xs' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Urgency & Social Proof Banner */}
        <div className="bg-gradient-to-r from-[#FFF5F6] via-[#FAF6F0] to-[#FFF5F6] border-b border-stone-200/80 px-4 sm:px-6 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#4F1325]/10 flex items-center justify-center flex-shrink-0 text-[#4F1325]">
                <Icon name="sparkles" size="xs" />
              </div>
              <p className="text-xs font-medium text-stone-700 truncate">
                High demand for upcoming wedding dates • Fast responses
              </p>
            </div>
            <button
              onClick={() => handleTabClick('pricing')}
              className="text-xs font-bold text-[#4F1325] underline decoration-[#4F1325]/40 hover:opacity-80 flex-shrink-0 cursor-pointer"
            >
              Check Dates
            </button>
          </div>
        </div>

        {/* Main Vendor Details Header */}
        <div className="px-4 sm:px-6 pt-5 pb-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {ratingsEnabled && (
                <span className="inline-flex items-center gap-1 bg-[#4F1325] text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                  <span className="text-[#ECC880]">★</span> {vendor?.rating && vendor.rating > 0 ? vendor.rating : 'New'}
                </span>
              )}
              <span className="text-xs font-semibold text-stone-500">
                ({vendor?.reviewCount ?? vendor?.reviews?.length ?? 0} reviews)
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-stone-600 bg-white border border-stone-200/80 px-2.5 py-0.5 rounded-full font-medium">
                <Icon name="location" size="xs" className="text-[#4F1325]" />
                <span>{vendor?.city || vendor?.location || 'Indore'}</span>
              </span>
              {vendor?.category && (
                <span className="inline-flex items-center text-xs text-[#4F1325] bg-[#FAF6F0] border border-[#4F1325]/15 px-2.5 py-0.5 rounded-full font-semibold">
                  {typeof vendor.category === 'object' ? vendor.category.name : vendor.category}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#4F1325] tracking-tight leading-snug mt-1">
              {vendor?.businessName || vendor?.name}
            </h1>

            {vendor?.pricing?.notes && (
              <div className="flex items-center gap-2">
                <Icon name="sparkles" size="xs" className="text-[#4F1325]" />
                <span className="text-xs font-bold text-[#4F1325] tracking-wide">
                  {vendor.pricing.notes}
                </span>
              </div>
            )}
          </div>

          {/* Highlight Cards */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-stone-200/80 bg-white shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] text-[#4F1325] flex items-center justify-center flex-shrink-0">
                <Icon name="money" size="sm" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Starting Price</p>
                <p className="text-sm sm:text-base font-serif font-bold text-[#4F1325] truncate">
                  {vendor?.pricing?.range ? `₹${vendor.pricing.range}` : (vendor?.startingPrice ? `₹${vendor.startingPrice.toLocaleString()}` : (vendor?.price || 'Upon Request'))}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-stone-200/80 bg-white shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] text-[#4F1325] flex items-center justify-center flex-shrink-0">
                <Icon name="users" size="sm" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Experience</p>
                <p className="text-sm sm:text-base font-semibold text-stone-800 truncate">
                  {vendor?.businessDetails?.teamSize ? `${vendor.businessDetails.teamSize} team members` : (vendor?.experience ? `${vendor.experience} exp` : 'Verified Partner')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          ref={tabsRef}
          className="sticky top-[53px] z-30 bg-[#FAF7F2]/95 backdrop-blur-md border-y border-stone-200/80 px-4 sm:px-6 transition-all"
        >
          <div className="flex gap-6 overflow-x-auto scrollbar-hide">
            {[
              { key: 'pricing', label: 'Pricing & Packages' },
              { key: 'projects', label: `Portfolio (${albumsData.length || '0'})` },
              { key: 'about', label: 'About Vendor' },
              { key: 'reviews', label: `Reviews (${reviewsData.length})` }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`whitespace-nowrap py-3 border-b-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'border-[#4F1325] text-[#4F1325] font-bold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="px-4 sm:px-6 py-5 space-y-8">
          {/* Pricing Section */}
          <div ref={el => sectionsRef.current['pricing'] = el} className="scroll-mt-28">
            <h2 className="text-lg sm:text-xl font-serif font-bold text-[#4F1325] mb-3">
              Pricing & Packages
            </h2>

            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-200/80 shadow-xs space-y-4">
              {pricingData.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm font-semibold text-stone-700">
                    {vendor?.startingPrice ? `Starting from ₹${vendor.startingPrice.toLocaleString()}` : 'Custom proposals tailored for your celebration.'}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">Submit an inquiry or contact vendor directly to discuss custom dates & packages.</p>
                </div>
              ) : (
                pricingData.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-b-0 gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] text-[#4F1325] flex items-center justify-center flex-shrink-0">
                        <Icon name={item.icon} size="sm" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm sm:text-base text-stone-800 line-clamp-1">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                      <div className="font-serif font-bold text-base sm:text-lg text-[#4F1325]">
                        {item.price}
                      </div>
                      <div className="text-[11px] text-stone-400 font-medium">
                        {item.unit}
                      </div>
                      <button
                        onClick={() => handleInquireService(item)}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-full bg-[#4F1325] hover:bg-[#651731] text-white shadow-xs active:scale-95 transition-all cursor-pointer mt-0.5"
                      >
                        Request Quote
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Vendor Availability Calendar with Weather Forecast & Rainfall Alerts */}
            <div className="mt-5">
              <VendorAvailabilityCalendar
                vendorId={vendor?._id || vendorId}
                vendorName={vendor?.businessName}
                vendorCity={vendor?.city}
                initialDate={selectedEventDate}
                onSelectDate={(dateStr, isAvail, weather) => {
                  setSelectedEventDate(dateStr);
                  setFormData(prev => ({ ...prev, eventDate: dateStr, date: dateStr }));
                  setAvailabilityStatus({
                    available: isAvail,
                    message: isAvail
                      ? `Selected date (${dateStr}) is available for booking!`
                      : `Selected date (${dateStr}) is booked or unavailable.`
                  });
                  if (isAvail) {
                    toast.success(`Date selected: ${dateStr}. Ready to submit inquiry!`);
                  }
                }}
              />
            </div>
          </div>

          {/* Projects / Albums Section */}
          <div ref={el => sectionsRef.current['projects'] = el} className="scroll-mt-28">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-serif font-bold text-[#4F1325]">
                Portfolio & Albums {albumsData.length > 0 && <span className="text-xs font-normal text-stone-500">({albumsData.length} albums)</span>}
              </h2>
            </div>

            {albumsData.length === 0 ? (
              <div className="rounded-2xl p-6 text-center border border-dashed border-stone-200 bg-white mb-6">
                <Icon name="image" size="md" className="mx-auto mb-2 text-stone-400" />
                <p className="text-sm font-semibold text-stone-600">No portfolio albums uploaded yet.</p>
                <p className="text-xs text-stone-400 mt-1">Vendor will upload past wedding photography and media soon.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {albumsData.map((album) => (
                  <div key={album.id} className="relative group rounded-2xl overflow-hidden shadow-xs border border-stone-200/80 bg-stone-100">
                    <div className="aspect-square w-full overflow-hidden">
                      <img
                        src={album.coverImage}
                        alt={album.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Image Count Badge */}
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1">
                      <Icon name="image" size="xs" />
                      <span>{album.imageCount}</span>
                    </div>

                    {/* Album Name */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                      <span className="text-white font-medium text-xs line-clamp-1">
                        {album.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Video Stories */}
            {videoStories.length > 0 && (
              <div className="mt-5">
                <h3 className="text-base font-serif font-bold text-[#4F1325] mb-3">
                  Video Highlights
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {videoStories.map((video) => (
                    <div key={video.id} className="relative flex-shrink-0 w-28 h-44 rounded-2xl overflow-hidden shadow-xs border border-stone-200/80 bg-stone-900">
                      <img
                        src={video.thumbnail}
                        alt="Video story"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-[#4F1325] shadow-md">
                          <Icon name="play" size="sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Quote CTA */}
            <div className="rounded-2xl p-4 mt-5 bg-gradient-to-r from-[#FAF6F0] to-[#FFF5F6] border border-[#4F1325]/15 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#4F1325]/10 text-[#4F1325] flex items-center justify-center flex-shrink-0">
                  <Icon name="message" size="sm" />
                </div>
                <div>
                  <p className="font-bold text-sm text-stone-800">Require custom requirements?</p>
                  <p className="text-xs text-stone-500">Chat with vendor for personalized proposals</p>
                </div>
              </div>
              <button
                onClick={handleMessage}
                className="px-4 py-2 rounded-full bg-[#4F1325] hover:bg-[#651731] text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex-shrink-0 cursor-pointer"
              >
                Chat Now
              </button>
            </div>
          </div>

          {/* About Section */}
          <div ref={el => sectionsRef.current['about'] = el} className="scroll-mt-28">
            <h2 className="text-lg sm:text-xl font-serif font-bold text-[#4F1325] mb-3">
              About Vendor
            </h2>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#4F1325] bg-[#FAF6F0] px-3 py-1.5 rounded-xl border border-[#4F1325]/10 w-fit">
                <Icon name="verified" size="xs" />
                <span>Verified on Utsavo Since {vendor?.businessDetails?.years ? `${vendor.businessDetails.years} years` : (vendor?.experience || 'Official Partner')}</span>
              </div>

              <p className="text-sm text-stone-600 leading-relaxed">
                {vendor?.description || `${vendor?.businessName || vendor?.name || 'This vendor'} is a premium wedding service provider in ${vendor?.city || vendor?.location || 'Indore'}. Dedicated to crafting unforgettable moments for your celebration.`}
              </p>

              {vendor?.services && vendor.services.length > 0 && (
                <div className="pt-2">
                  <h4 className="font-semibold text-xs text-stone-700 uppercase tracking-wider mb-2">
                    Services & Expertise
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {vendor.services.map((service, index) => {
                      const label = typeof service === 'object' ? (service?.name || service?.category || 'Service') : service;
                      return (
                        <span
                          key={index}
                          className="px-3 py-1 text-xs font-medium rounded-full bg-[#FAF6F0] text-[#4F1325] border border-[#4F1325]/15"
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
          <div ref={el => sectionsRef.current['reviews'] = el} className="scroll-mt-28">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-serif font-bold text-[#4F1325]">
                Verified Reviews
              </h2>
            </div>

            {reviewsData.length === 0 ? (
              <div className="rounded-2xl p-6 text-center border border-dashed border-stone-200 bg-white">
                <div className="w-12 h-12 rounded-full bg-[#FAF6F0] text-[#4F1325] flex items-center justify-center mx-auto mb-3">
                  <Icon name="star" size="md" />
                </div>
                <h3 className="font-bold text-sm text-stone-800 mb-1">
                  No Reviews Yet
                </h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Book this vendor through Utsavo to be the first couple to share verified feedback!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviewsData.map((review) => (
                  <div key={review.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F1325] to-[#7B1D3A] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                          {review.initial}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-stone-800">{review.name}</h4>
                          <p className="text-[11px] text-stone-400">Reviewed {review.timeAgo}</p>
                        </div>
                      </div>
                      {ratingsEnabled && review.rating && (
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-full text-xs font-bold text-amber-800">
                          <span>★</span> {review.rating}
                        </div>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed pt-1">
                      {review.review}
                    </p>

                    {review.photos?.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {review.photos.map((p, pIdx) => (
                          <img
                            key={pIdx}
                            src={p}
                            alt="Review attachment"
                            className="w-14 h-14 rounded-xl object-cover border border-stone-200"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FAQ Section */}
          {faqData.length > 0 && (
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-[#4F1325] mb-3">
                Frequently Asked Questions
              </h2>

              <div className="space-y-2.5">
                {faqData.map((faq) => (
                  <details
                    key={faq.id}
                    className="group rounded-2xl bg-white border border-stone-200/80 shadow-xs overflow-hidden"
                  >
                    <summary className="p-4 cursor-pointer font-semibold text-xs sm:text-sm text-stone-800 flex items-center justify-between group-open:text-[#4F1325]">
                      <span>{faq.question}</span>
                      <span className="text-stone-400 group-open:rotate-180 transition-transform text-sm">▾</span>
                    </summary>
                    <div className="px-4 pb-4 text-xs sm:text-sm text-stone-600 border-t border-stone-100 pt-3 leading-relaxed">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer - Fixed at bottom-0 without gap */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/80 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] px-4 py-3">
          <div className="flex items-center gap-3 max-w-[430px] md:max-w-4xl mx-auto">
            {/* Call Button */}
            <button
              onClick={handleCall}
              aria-label="Call Vendor"
              className="w-12 h-12 rounded-full border border-stone-200 bg-[#FAF6F0] text-[#4F1325] flex items-center justify-center hover:bg-[#FAF0E4] active:scale-95 transition-transform flex-shrink-0 cursor-pointer shadow-xs"
            >
              <Icon name="phone" size="sm" />
            </button>

            {/* Request Pricing Button */}
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="flex-1 h-12 rounded-full font-bold text-white bg-gradient-to-r from-[#4F1325] via-[#651731] to-[#4F1325] shadow-md shadow-[#4F1325]/25 hover:shadow-lg active:scale-95 transition-all text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Request Pricing</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Message Button */}
            <button
              onClick={handleMessage}
              aria-label="Message Vendor"
              className="w-12 h-12 rounded-full border border-stone-200 bg-[#FAF6F0] text-[#4F1325] flex items-center justify-center hover:bg-[#FAF0E4] active:scale-95 transition-transform relative flex-shrink-0 cursor-pointer shadow-xs"
            >
              <Icon name="chat" size="sm" />
            </button>
          </div>
        </div>

      </div>

      {/* Request Pricing Modal - True Bottom Sheet Internal Scroll */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl overflow-hidden flex flex-col h-[85vh] sm:h-auto sm:max-h-[85vh] shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Modal Header - Fixed at top of white card */}
            <div className="shrink-0 px-6 pt-6 pb-4 border-b border-stone-100 flex items-start justify-between bg-[#FAF6F0]/80">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-0.5">{vendor?.businessName || vendor?.name}</p>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#4F1325]">Request Pricing</h2>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
              >
                <Icon name="close" size="xs" />
              </button>
            </div>

            {/* Modal Body - Scrollable white page area */}
            <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0 space-y-5" data-lenis-prevent>
              {requestStatus === 'success' ? (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 text-emerald-600 shadow-xs">
                    <Icon name="check" size="md" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">Inquiry Submitted!</h3>
                  <p className="text-stone-500 text-xs sm:text-sm max-w-xs">
                    {vendor?.businessName || vendor?.name} has received your details and will get back to you with tailored pricing.
                  </p>
                  <button
                    onClick={() => setIsRequestModalOpen(false)}
                    className="mt-6 px-8 py-3 rounded-full bg-[#4F1325] text-white text-xs font-bold shadow-md hover:bg-[#651731] transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-stone-500 leading-relaxed font-medium">
                    Fill this form and <span className="font-bold text-stone-800">{vendor?.businessName || vendor?.name}</span> will contact you with package availability.
                  </p>

                  <div className="space-y-4">
                    {/* Input Groups */}
                    <div>
                      <label className="text-[11px] uppercase font-bold text-stone-500 mb-1.5 block tracking-wider">Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full h-11 bg-[#FAF7F2]/60 rounded-xl border border-stone-200 focus:border-[#4F1325] focus:bg-white outline-none px-4 text-sm font-semibold text-stone-800 transition-all placeholder:text-stone-400"
                        placeholder="Your Name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] uppercase font-bold text-stone-500 mb-1.5 block tracking-wider">Phone Number *</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full h-11 bg-[#FAF7F2]/60 rounded-xl border border-stone-200 focus:border-[#4F1325] focus:bg-white outline-none px-4 text-sm font-semibold text-stone-800 transition-all placeholder:text-stone-400"
                          placeholder="Your number"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] uppercase font-bold text-stone-500 mb-1.5 block tracking-wider">Email Address</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full h-11 bg-[#FAF7F2]/60 rounded-xl border border-stone-200 focus:border-[#4F1325] focus:bg-white outline-none px-4 text-sm font-semibold text-stone-800 transition-all placeholder:text-stone-400"
                          placeholder="name@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] uppercase font-bold text-stone-500 mb-1.5 block tracking-wider">Event Date *</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full h-11 bg-[#FAF7F2]/60 rounded-xl border border-stone-200 focus:border-[#4F1325] focus:bg-white outline-none px-4 text-sm font-semibold text-stone-800 transition-all"
                        required
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          id="openToOtherDates"
                          checked={formData.openToOtherDates}
                          onChange={(e) => setFormData({ ...formData, openToOtherDates: e.target.checked })}
                          className="w-4 h-4 rounded text-[#4F1325] focus:ring-[#4F1325] border-stone-300"
                        />
                        <label htmlFor="openToOtherDates" className="text-xs text-stone-600 font-medium">I am open to nearby dates</label>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] uppercase font-bold text-stone-500 mb-2 block tracking-wider">Approx. Guest Count</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['0-100', '100-200', '200-300', '300+'].map(count => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => setFormData({ ...formData, guestCount: count })}
                            className={`h-10 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              formData.guestCount === count
                                ? 'bg-[#4F1325] border-[#4F1325] text-white shadow-xs'
                                : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                            }`}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] uppercase font-bold text-stone-500 mb-2 block tracking-wider">
                        Venue Setup (Indoor / Outdoor)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'Indoor', label: '🏛️ Indoor', sub: 'Banquet' },
                          { id: 'Outdoor', label: '🌿 Outdoor', sub: 'Lawn' },
                          { id: 'Both', label: '✨ Hybrid', sub: 'Both' }
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, venueType: item.id }))}
                            className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                              formData.venueType === item.id
                                ? 'bg-[#FAF6F0] border-[#4F1325] text-[#4F1325] shadow-xs'
                                : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                            }`}
                          >
                            <span>{item.label}</span>
                            <span className="text-[10px] font-normal opacity-70">{item.sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] uppercase font-bold text-stone-500 mb-1.5 block tracking-wider">Message for Vendor</label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full bg-[#FAF7F2]/60 rounded-xl border border-stone-200 focus:border-[#4F1325] focus:bg-white outline-none p-3.5 text-xs sm:text-sm font-medium text-stone-800 transition-all min-h-[90px] resize-none leading-relaxed placeholder:text-stone-400"
                        placeholder="Tell them more about your dream wedding..."
                      />
                    </div>

                    <div>
                      <label className="text-[11px] uppercase font-bold text-stone-500 mb-1.5 block tracking-wider">
                        Inspiration / Reference Photos (Optional)
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {referencePhotos.map((url, idx) => (
                          <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-stone-200">
                            <img src={url} alt="Reference" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setReferencePhotos(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] shadow"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <label className="w-14 h-14 rounded-xl border-2 border-dashed border-stone-300 hover:border-[#4F1325] flex flex-col items-center justify-center cursor-pointer transition-colors bg-stone-50/60">
                          {isUploadingPhoto ? (
                            <div className="w-4 h-4 border-2 border-[#4F1325] border-t-transparent animate-spin rounded-full" />
                          ) : (
                            <>
                              <Icon name="camera" size="xs" className="text-stone-400" />
                              <span className="text-[9px] font-bold text-stone-500 mt-0.5">+ Photo</span>
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
                                toast.error(getFriendlyErrorMessage(err, 'Photo upload failed.'));
                              } finally {
                                setIsUploadingPhoto(false);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <span className="text-[10.5px] text-stone-400">Upload reference outfits, decor themes, or venue style</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Sticky Footer for Button */}
            {requestStatus !== 'success' && (
              <div className="shrink-0 px-6 py-4 bg-white border-t border-stone-100">
                <button
                  onClick={handleSendRequest}
                  disabled={requestStatus === 'sending'}
                  className="w-full py-3.5 text-white rounded-2xl font-bold text-sm bg-gradient-to-r from-[#4F1325] via-[#651731] to-[#4F1325] shadow-lg shadow-[#4F1325]/25 hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {requestStatus === 'sending' ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Submit Inquiry</span>
                      <Icon name="send" size="xs" />
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
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 animate-scale-up">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF6F0]/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shadow-xs">
                  <Icon name="alertTriangle" size="xs" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-800">Report Vendor</h3>
                  <p className="text-[11px] text-stone-500">Official dispute submission to Utsavo Trust & Safety</p>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-200/60 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {reportStatus === 'success' ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Icon name="check" size="md" />
                </div>
                <h4 className="text-lg font-serif font-bold text-stone-800 mb-2">Complaint Submitted</h4>
                <p className="text-xs text-stone-600 mb-6">
                  Your grievance against <span className="font-semibold">{vendor?.businessName || vendor?.name}</span> has been logged under ID review. Our grievance officer will review and update your account.
                </p>
                <button
                  onClick={() => {
                    setIsReportModalOpen(false);
                    setReportStatus('idle');
                  }}
                  className="px-6 py-2 rounded-full bg-[#4F1325] text-white text-xs font-bold hover:bg-[#651731] transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1.5 uppercase tracking-wider">
                    Complaint Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2]/60 border border-stone-200 rounded-xl text-xs font-medium text-stone-700 outline-none focus:border-[#4F1325] focus:bg-white transition-all"
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
                  <label className="block text-xs font-bold text-stone-600 mb-1.5 uppercase tracking-wider">
                    Detailed Explanation <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Describe what occurred, including dates, missed commitments, or financial discrepancies..."
                    rows={4}
                    required
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2]/60 border border-stone-200 rounded-xl text-xs font-medium text-stone-700 outline-none focus:border-[#4F1325] focus:bg-white transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1.5 uppercase tracking-wider">
                    Evidence / Proof (Screenshots, Receipts)
                  </label>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {reportEvidence.map((url, idx) => (
                      <div key={idx} className="relative w-12 h-12 rounded-xl overflow-hidden border border-stone-200 group">
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
                    <label className="w-12 h-12 rounded-xl border-2 border-dashed border-stone-300 hover:border-red-500 flex flex-col items-center justify-center cursor-pointer transition-colors bg-stone-50">
                      {isUploadingEvidence ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent animate-spin rounded-full" />
                      ) : (
                        <>
                          <Icon name="camera" size="xs" className="text-stone-400" />
                          <span className="text-[9px] font-bold text-stone-500 mt-0.5">+ Add</span>
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
                            toast.error(getFriendlyErrorMessage(err, 'Evidence upload failed.'));
                          } finally {
                            setIsUploadingEvidence(false);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportStatus === 'sending'}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
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