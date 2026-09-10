import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useCart } from '../../../contexts/CartContext';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import { vendors } from '../../../data/vendors';

const VendorDetail = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { addToCart, isInCart } = useCart();

  const [vendor, setVendor] = useState(null);
  const [activeTab, setActiveTab] = useState('pricing');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSticky, setIsSticky] = useState(false);

  const tabsRef = useRef(null);
  const sectionsRef = useRef({});

  // Modal states
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestStatus, setRequestStatus] = useState('idle'); // idle, sending, success
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    openToOtherDates: false,
    guestCount: '100-200',
    message: ''
  });

  // Handle Scroll Locking & Lenis toggling when modal is open
  useEffect(() => {
    if (isRequestModalOpen) {
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
  }, [isRequestModalOpen]);

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

  // Mock data for vendor details
  const vendorImages = [
    'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=600&fit=crop&q=80'
  ];

  const pricingData = [
    {
      id: 1,
      name: 'Photo Package',
      description: 'Candid & Traditional',
      price: '₹25,000',
      unit: 'per day',
      icon: 'camera'
    },
    {
      id: 2,
      name: 'Photo + Video',
      description: 'Photo Package & Cinematic Video',
      price: '₹35,000',
      unit: 'per day',
      icon: 'video'
    },
    {
      id: 3,
      name: 'Pre-Wedding Shoot',
      description: '',
      price: '₹15,000',
      unit: 'per day',
      icon: 'heart'
    },
    {
      id: 4,
      name: 'Albums',
      description: '',
      price: '₹5,000',
      unit: 'per 40 pages',
      icon: 'book'
    }
  ];

  const albumsData = [
    {
      id: 1,
      name: 'Portfolio',
      imageCount: 67,
      coverImage: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=300&fit=crop&q=80'
    },
    {
      id: 2,
      name: 'Sayali',
      imageCount: 45,
      coverImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop&q=80'
    },
    {
      id: 3,
      name: 'Wedding Collection',
      imageCount: 89,
      coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop&q=80'
    },
    {
      id: 4,
      name: 'Pre-Wedding',
      imageCount: 23,
      coverImage: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=300&fit=crop&q=80'
    },
    {
      id: 5,
      name: 'Reception',
      imageCount: 56,
      coverImage: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=300&fit=crop&q=80'
    },
    {
      id: 6,
      name: 'Engagement',
      imageCount: 34,
      coverImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop&q=80'
    }
  ];

  const videoStories = [
    {
      id: 1,
      thumbnail: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=600&fit=crop&q=80',
      duration: '2:45'
    },
    {
      id: 2,
      thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=600&fit=crop&q=80',
      duration: '1:30'
    }
  ];

  const reviewsData = [
    {
      id: 1,
      name: 'Priya Sharma',
      rating: 5,
      review: 'Honestly at start I was bit skeptical. But as the time passed and I overlooked their work, my skepticism faded. Genuinely they are the feeling makers, truly astonishing work. Keep working hard!',
      timeAgo: '2 months ago',
      initial: 'P'
    },
    {
      id: 2,
      name: 'Anshika Sinha',
      rating: 1,
      review: 'This photographer took our money 10 months ago and never delivered anything. Ignored all our calls. This is fraud! We are going to file a police complaint.',
      timeAgo: '2 months ago',
      initial: 'A'
    }
  ];

  const faqData = [
    {
      id: 1,
      question: 'What all services does The Feeling Makers offer?',
      answer: 'The Feeling Makers offers Maternity Shoots, Pre wedding Films, Drone Photography'
    },
    {
      id: 2,
      question: 'What is the cost of wedding photography & video package by The Feeling Makers?',
      answer: '35,000 - per day wedding photography & video package including Candid photo shoot, traditional photography, cinematic videography'
    },
    {
      id: 3,
      question: 'What is the cost of Wedding Photography package by The Feeling Makers',
      answer: '25,000 - cost of Candid Photography and Traditional Photography'
    }
  ];

  useEffect(() => {
    const foundVendor = vendors.find(v => v.id === parseInt(vendorId));
    if (foundVendor) {
      setVendor(foundVendor);
    } else {
      navigate('/user/vendors');
    }
  }, [vendorId, navigate]);

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
    const message = `Hi! I'm interested in your ${vendor?.services?.join(', ')} services for my wedding. Can you please share more details?`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCall = () => {
    const phoneNumber = vendor?.phone || '919876543210';
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const handleMessage = () => {
    navigate(`/user/chats/${vendorId}`);
  };

  const handleSendRequest = () => {
    setRequestStatus('sending');
    
    // Connectivity: Save to vendor leads in LocalStorage
    try {
      console.log('Sending inquiry for vendor:', vendorId);
      const STORAGE_KEY = 'vendor-panel-state';
      const raw = localStorage.getItem(STORAGE_KEY);
      let vendorState = {};
      
      if (raw) {
        vendorState = JSON.parse(raw);
        console.log('Existing vendor state found');
      }
      
      const newLead = {
        id: `lead-${Date.now()}`,
        vendorId: vendorId,
        vendorName: vendor?.name || 'Wedding Vendor',
        customerName: formData.name || 'John Doe',
        email: formData.email,
        phone: formData.phone,
        eventDate: formData.date || new Date().toISOString().split('T')[0],
        eventLocation: vendor?.location || 'Indore',
        guestCount: formData.guestCount,
        message: formData.message || 'I am interested in your services.',
        status: 'New',
        createdAt: new Date().toISOString()
      };

      console.log('New lead object:', newLead);

      vendorState.leads = vendorState.leads || [];
      vendorState.leads.unshift(newLead);
      
      vendorState.notifications = vendorState.notifications || [];
      vendorState.notifications.unshift({
        id: `nt-${Date.now()}`,
        message: `New inquiry from ${newLead.customerName}`,
        time: 'Just now'
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(vendorState));
      console.log('Successfully saved to LocalStorage');
      alert('Inquiry sent! Now check the Vendor Panel -> Leads section.');
    } catch (e) {
      console.error('CRITICAL: Error saving inquiry connectivity', e);
      alert('Error saving to LocalStorage: ' + e.message);
    }

    // Success UI Flow
    setTimeout(() => {
      setRequestStatus('success');
      setTimeout(() => {
        setIsRequestModalOpen(false);
        setRequestStatus('idle');
      }, 2000);
    }, 1500);
  };

  if (!vendor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
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
          <button className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-gray-100">
            <Icon name="heart" size="sm" color="primary" />
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
          {vendor.name}
        </h1>

        <div className="flex flex-col gap-3">
          {/* Rating Section */}
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Icon key={i} name="star" size="xs" color={i < 4 ? "secondary" : "muted"} />
              ))}
            </div>
            <span className="text-xs font-medium" style={{ color: theme.semantic.text.secondary }}>No reviews yet. <button className="underline text-primary-600">Write a review</button></span>
          </div>

          {/* Location Section */}
          <div className="flex items-center gap-2">
            <Icon name="location" size="sm" style={{ color: theme.semantic.text.tertiary }} />
            <span className="text-sm underline cursor-pointer" style={{ color: theme.semantic.text.secondary }}>
              {vendor.location}
            </span>
          </div>

          {/* Promotion Section */}
          <div className="flex items-center gap-2">
            <Icon name="sparkles" size="sm" style={{ color: theme.colors.primary[500] }} />
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: theme.colors.primary[600] }}>
              1 promotion <span className="ml-2 font-black">10% discount</span>
            </span>
          </div>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 gap-3 mt-6">
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                <Icon name="money" size="sm" style={{ color: theme.semantic.text.secondary }} />
              </div>
              <p className="text-sm font-medium" style={{ color: theme.semantic.text.primary }}>Price per plate ₹1,000</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                <Icon name="users" size="sm" style={{ color: theme.semantic.text.secondary }} />
              </div>
              <p className="text-sm font-medium" style={{ color: theme.semantic.text.primary }}>20 to 2000 guests</p>
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
            {pricingData.map((item) => (
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

                <div className="text-right flex-shrink-0">
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
                </div>
              </div>
            ))}
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
              Check Availability
            </h3>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="date"
                  defaultValue="2028-04-08"
                  className="w-full p-2 sm:p-3 border rounded-lg text-sm sm:text-base"
                  style={{
                    borderColor: theme.semantic.card.border,
                    backgroundColor: theme.semantic.background.primary
                  }}
                />
              </div>
              <Button
                variant="outline"
                className="px-4 sm:px-6 text-sm sm:text-base"
                style={{
                  borderColor: theme.colors.primary[500],
                  color: theme.colors.primary[600]
                }}
              >
                Check Dates
              </Button>
            </div>
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
              Albums <span className="text-sm font-normal">3 nos.</span>
            </h2>
          </div>

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
              <span className="font-medium"> Since {vendor.experience || '2 years'}</span>
            </p>

            <p
              className="text-sm sm:text-base leading-relaxed mb-3 sm:mb-4"
              style={{ color: theme.semantic.text.secondary }}
            >
              {vendor.description || `${vendor.name} is a professional ${vendor.category} service provider in ${vendor.location}. We are committed to making your wedding day special with our exceptional services and attention to detail.`}
            </p>

            <div>
              <h4
                className="font-medium mb-2 text-sm sm:text-base"
                style={{ color: theme.semantic.text.primary }}
              >
                Services provided by {vendor.name}
              </h4>
              <div className="flex flex-wrap gap-2">
                {vendor.services?.map((service, index) => (
                  <span
                    key={index}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full"
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

          <Button
            variant="outline"
            className="w-full mt-3 sm:mt-4 text-sm sm:text-base"
          >
            View All Reviews
          </Button>
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
                        className="w-full bg-gray-50/20 rounded-[28px] border border-gray-100 focus:border-primary-500 focus:bg-white outline-none p-7 transition-all text-base font-bold text-gray-700 min-h-[140px] resize-none leading-relaxed"
                        placeholder="Tell them more about your dream wedding..."
                      />
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
    </div>
  );
};

export default VendorDetail;