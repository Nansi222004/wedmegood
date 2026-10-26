import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import weddingImg from '../../../assets/wedding.webp';
import { useVendorState } from '../useVendorState';
import { vendorApi } from '../vendorApi';
import { computeProfileCompletion } from '../vendorStore';
import VendorPendingApproval from '../components/VendorPendingApproval';

// Advertisement Banner Images
import ProfileCompletionTracker from '../components/ProfileCompletionTracker';
import DailyBrief from '../components/DailyBrief';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { vendorState, refreshData, loading } = useVendorState();
  const banners = vendorState.banners || [];
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');
  const [earnings, setEarnings] = useState(null);
  const stats = vendorState.analytics || {
    profileViews: 0,
    inquiries: 0,
    bookings: 0,
    conversionRate: 0,
    reviewsCount: 0
  };
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const scrollRef = useRef(null);

  // Advertisements uploaded by the admin (Admin > Banners, shown to vendors or everyone)
  const activeBanners = banners.filter(b => b.imageUrl);

  const openBanner = (ad) => {
    if (!ad.linkUrl) return;
    if (/^https?:\/\//i.test(ad.linkUrl)) window.open(ad.linkUrl, '_blank', 'noopener,noreferrer');
    else navigate(ad.linkUrl);
  };

  // Autoscroll Logic
  useEffect(() => {
    if (activeBanners.length < 2) return;
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % activeBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.offsetWidth * currentAdIndex;
      scrollRef.current.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  }, [currentAdIndex]);

  // Earnings chart: payments recorded on bookings, from the server
  const bookingsCount = (vendorState.bookings || []).length;
  useEffect(() => {
    if (loading) return;
    let alive = true;
    vendorApi.getEarningsChart(selectedTimeRange, localStorage.getItem('vendorToken'))
      .then(r => { if (alive) setEarnings(r?.success ? r.data : { failed: true }); })
      .catch(() => { if (alive) setEarnings({ failed: true }); });
    return () => { alive = false; };
  }, [selectedTimeRange, loading, bookingsCount]);

  // Scroll Reveal Logic
  useEffect(() => {
    if (loading) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
          // Once revealed, we can stop observing this element
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const revealedElements = document.querySelectorAll('.reveal-on-scroll');
    revealedElements.forEach(el => observer.observe(el));

    return () => {
      revealedElements.forEach(el => observer.unobserve(el));
      observer.disconnect();
    };
  }, [loading, vendorState]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-rose-400 border-t-transparent rounded-full"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waking up your dashboard...</p>
      </div>
    );
  }

  if (!vendorState.isServiceProfileCompleted || vendorState.status === 'Incomplete') {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <ProfileCompletionTracker onComplete={() => refreshData()} />
      </div>
    );
  }

  if (vendorState.status === 'Pending') {
    return (
      <>
        <VendorPendingApproval />
      </>
    );
  }

  const completion = computeProfileCompletion(vendorState);
  // The daily brief reads event operations, which need an approved account with a live subscription
  const sub = vendorState.subscription;
  const canSeeBrief = vendorState.status === 'Approved' && vendorState.isActive !== false
    && sub?.status === 'Active' && !(sub?.endDate && new Date(sub.endDate) < new Date());

  const statCards = [
    { 
      label: "Views", 
      value: stats.profileViews, 
      sub: "Total Views",
      icon: "eye", 
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100",
      iconBg: "#7C3AED", 
      watermarkColor: "rgba(124, 58, 237, 0.08)",
      to: "/vendor/profile" 
    },
    { 
      label: "Leads", 
      value: stats.inquiries, 
      sub: "Inquiries",
      icon: "envelope", 
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
      iconBg: "#F59E0B", 
      watermarkColor: "rgba(245, 158, 11, 0.1)",
      to: "/vendor/leads" 
    },
    { 
      label: "Events", 
      value: stats.bookings, 
      sub: "Active Bookings",
      icon: "calendar", 
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
      iconBg: "#10B981", 
      watermarkColor: "rgba(16, 185, 129, 0.1)",
      to: "/vendor/bookings" 
    },
    { 
      label: "Rate", 
      value: stats.conversionRate + "%", 
      sub: "Conversion Rate",
      icon: "chart", 
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      iconBg: "#3B82F6", 
      watermarkColor: "rgba(59, 130, 246, 0.1)",
      to: "/vendor/leads" 
    }
  ];

  const quickActions = [
    { label: "Add Service", icon: "plus", circleBg: "#7C3AED", bg: "bg-purple-50", to: "/vendor/services" },
    { label: "Update Availability", icon: "calendar", circleBg: "#10B981", bg: "bg-emerald-50", to: "/vendor/calendar" },
    { label: "Upload Portfolio", icon: "image", circleBg: "#F59E0B", bg: "bg-amber-50", to: "/vendor/portfolio" },
    { label: "View Leads", icon: "users", circleBg: "#3B82F6", bg: "bg-blue-50", to: "/vendor/inquiries" },
    { label: "Create Quotation", icon: "checkList", circleBg: "#8B5CF6", bg: "bg-violet-50", to: "/vendor/quotes" },
    { label: "Chat with Customers", icon: "chat", circleBg: "#EC4899", bg: "bg-pink-50", to: "/vendor/chat" },
    { label: "Request Payment", icon: "money", circleBg: "#06B6D4", bg: "bg-cyan-50", to: "/vendor/earnings" },
    { label: "Mark Event Completed", icon: "check", circleBg: "#10B981", bg: "bg-emerald-50", to: "/vendor/bookings" },
  ];

  // Nice max rounding for chart scale
  const getNiceMaxVal = (val) => {
    if (val <= 1000) return 1000;
    if (val <= 10000) return 10000;
    if (val <= 50000) return 50000;
    if (val <= 100000) return 100000;
    if (val <= 150000) return 150000;
    if (val <= 200000) return 200000;
    if (val <= 300000) return 300000;
    if (val <= 500000) return 500000;
    if (val <= 1000000) return 1000000;
    const order = Math.pow(10, Math.floor(Math.log10(val)));
    return Math.ceil(val / order) * order;
  };

  const formatYValue = (value) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`.replace('.0', '');
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}K`;
    }
    return `₹${Math.round(value)}`;
  };

  const getSvgPath = (points) => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const RANGE_OPTIONS = [['week', 'Last 7 Days'], ['month', 'This Month'], ['year', 'This Year']];
  const RANGE_HEADLINE = { week: 'Received in the last 7 days', month: 'Received this month', year: 'Received this year' };
  const RANGE_EMPTY = { week: 'in the last 7 days', month: 'this month', year: 'this year' };

  // Earnings Overview: a running total of the payments recorded on bookings, up to today
  const renderEarningsChart = () => {
    const data = earnings && !earnings.failed && earnings.range === selectedTimeRange ? earnings : null;
    const t = data?.totals;
    const buckets = data?.buckets || [];

    let running = 0;
    const cumulative = buckets.map(b => (b.future ? null : (running += b.received)));

    const svgWidth = 500;
    const svgHeight = 100;
    const paddingLeft = 45;
    const paddingRight = 10;
    const paddingTop = 10;
    const paddingBottom = 6;
    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop - paddingBottom;
    const niceMax = getNiceMaxVal(Math.max(running, 1000));

    const xAt = (idx) => paddingLeft + (buckets.length > 1 ? idx / (buckets.length - 1) : 0) * chartWidth;
    const yAt = (val) => paddingTop + chartHeight - (val / niceMax) * chartHeight;
    const svgPoints = cumulative
      .map((val, idx) => (val === null ? null : { x: xAt(idx), y: yAt(val), idx }))
      .filter(Boolean);
    const linePath = getSvgPath(svgPoints);
    const fillPath = svgPoints.length > 1
      ? `${linePath} L ${svgPoints[svgPoints.length - 1].x} ${paddingTop + chartHeight} L ${svgPoints[0].x} ${paddingTop + chartHeight} Z`
      : '';
    // Dots on the days (or months) money came in, and on today
    const dots = svgPoints.filter((p, i) => buckets[p.idx].received > 0 || i === svgPoints.length - 1);
    // Month: a label every week; year: every quarter; week: every day
    const labelIdx = selectedTimeRange === 'week'
      ? buckets.map((_, i) => i)
      : (selectedTimeRange === 'month' ? [0, 7, 14, 21, buckets.length - 1] : [0, 3, 6, 9, 11]).filter(i => i < buckets.length);
    const pctX = (x) => `${(x / svgWidth) * 100}%`;
    const pctY = (y) => `${(y / svgHeight) * 100}%`;
    const up = (t?.changePercent ?? 0) >= 0;

    return (
      <div className="reveal-on-scroll rounded-2xl p-3 sm:p-4 bg-white border border-slate-100/80 shadow-xs font-sans w-full max-w-full overflow-hidden">
        <div className="flex justify-between items-center">
          <h3 className="text-xs sm:text-sm font-sans font-bold text-slate-800 tracking-tight">Earnings Overview</h3>

          {/* Custom Time Range Selector */}
          <div className="relative">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              aria-label="Period"
              className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-600 font-extrabold text-[10px] sm:text-xs py-1 px-2.5 pr-7 rounded-full border border-slate-200 outline-none cursor-pointer transition-colors"
            >
              {RANGE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
              <Icon name="chevronDown" size="xs" />
            </div>
          </div>
        </div>

        {/* Value and Percentage Row */}
        <div className="flex justify-between items-end gap-2 mt-2 mb-1">
          <div>
            <span className="text-xl sm:text-2xl font-heading font-black text-slate-900 tracking-tight leading-none">
              {t ? `₹${t.received.toLocaleString('en-IN')}` : '₹…'}
            </span>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider leading-none">{RANGE_HEADLINE[selectedTimeRange]}</p>
          </div>
          {t && t.changePercent !== null && (
            <div className={`flex items-center gap-0.5 font-extrabold text-[9px] sm:text-[10px] pb-0.5 text-right ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
              <span>{up ? '+' : '−'}{Math.abs(t.changePercent)}% vs {t.compareLabel}</span>
              <span className="text-xs leading-none font-bold">{up ? '↑' : '↓'}</span>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="relative w-full h-24 sm:h-28 mt-2 select-none">
          {!data ? (
            earnings?.failed ? (
              <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-slate-400">Could not load your earnings. Pull down or reopen the page to try again.</div>
            ) : (
              <div className="absolute inset-0 rounded-xl bg-slate-50 animate-pulse" />
            )
          ) : (
            <>
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="chartPurpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {[0, 0.5, 1].map((level, i) => (
                  <line
                    key={i}
                    x1={paddingLeft}
                    y1={yAt(level * niceMax)}
                    x2={svgWidth - paddingRight}
                    y2={yAt(level * niceMax)}
                    stroke="#F1F5F9"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {fillPath && <path d={fillPath} fill="url(#chartPurpleGradient)" />}
                {linePath && (
                  <path d={linePath} stroke="#7C3AED" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                )}
              </svg>

              {/* Y-axis labels (HTML, so they are not stretched with the chart) */}
              {[0, 0.5, 1].map((level, i) => (
                <span
                  key={i}
                  className="absolute -translate-y-1/2 text-[9px] font-bold text-slate-400 leading-none text-right"
                  style={{ top: pctY(yAt(level * niceMax)), left: 0, width: `calc(${pctX(paddingLeft)} - 6px)` }}
                >
                  {formatYValue(level * niceMax)}
                </span>
              ))}

              {/* Points: hover or tap for the amount */}
              {dots.map(p => {
                const b = buckets[p.idx];
                return (
                  <span
                    key={p.idx}
                    title={`${b.label}: ₹${b.received.toLocaleString('en-IN')} received · ₹${cumulative[p.idx].toLocaleString('en-IN')} so far`}
                    className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7C3AED] ring-2 ring-white cursor-default"
                    style={{ left: pctX(p.x), top: pctY(p.y) }}
                  />
                );
              })}

              {t.received === 0 && (
                <div className="absolute inset-0 flex items-center justify-center px-4" style={{ paddingLeft: pctX(paddingLeft) }}>
                  <div className="bg-white/90 rounded-lg px-2.5 py-1 text-center">
                  <p className="text-[11px] font-bold text-slate-500">No payments recorded {RANGE_EMPTY[selectedTimeRange]}</p>
                  <p className="text-[10px] text-slate-400">Record the payments you receive on each booking to see them here.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* X-axis labels */}
        <div className="relative h-3.5 mt-1">
          {data && labelIdx.map(i => (
            <span
              key={i}
              className={`absolute text-[9px] font-bold leading-none whitespace-nowrap ${buckets[i].future ? 'text-slate-300' : 'text-slate-400'} ${i === 0 ? '' : i === buckets.length - 1 ? '-translate-x-full' : '-translate-x-1/2'}`}
              style={{ left: pctX(xAt(i)) }}
            >
              {selectedTimeRange === 'week' ? buckets[i].label.split(' ')[0] : buckets[i].label}
            </span>
          ))}
        </div>

        {/* Breakdown boxes */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-3">
          <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-xl bg-slate-50/60 border border-slate-100/50 hover:bg-slate-50 transition-all">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100/80 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Icon name="bag" size="xs" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-[13px] font-sans font-black text-slate-800 truncate leading-tight tracking-tight">
                {t ? t.payments : '…'}
              </p>
              <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5">Payments</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-xl bg-slate-50/60 border border-slate-100/50 hover:bg-slate-50 transition-all" title={t ? `Still due on ${t.dueBookings} booking(s)` : undefined}>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-amber-50 text-amber-500 border border-amber-100/80 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Icon name="clock" size="xs" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-[13px] font-sans font-black text-slate-800 truncate leading-tight tracking-tight">
                {t ? `₹${t.due.toLocaleString('en-IN')}` : '…'}
              </p>
              <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5">To collect</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-xl bg-slate-50/60 border border-slate-100/50 hover:bg-slate-50 transition-all">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-blue-50 text-blue-500 border border-blue-100/80 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Icon name="calendar" size="xs" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-[13px] font-sans font-black text-slate-800 truncate leading-tight tracking-tight">
                {t ? `₹${t.newBookingsValue.toLocaleString('en-IN')}` : '…'}
              </p>
              <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5 truncate">
                {t ? `${t.newBookings} booked` : 'Booked'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 sm:space-y-5 animate-in fade-in duration-500 pb-20 sm:pb-0 w-full max-w-full overflow-x-hidden px-0.5">
      <style>{`
        .font-heading { font-family: 'Poppins', sans-serif; }
        .font-sans { font-family: 'Poppins', sans-serif; }

        @keyframes flipIn {
          0% {
            opacity: 0;
            transform: perspective(1000px) rotateY(90deg) scale(0.95);
          }
          70% {
            transform: perspective(1000px) rotateY(-10deg) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: perspective(1000px) rotateY(0deg) scale(1);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal-active {
          opacity: 1;
          transform: translateY(0);
        }
        
        .card-premium {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }
      `}</style>
      
      {canSeeBrief && <DailyBrief />}

      {/* Advertisement carousel (admin uploads) */}
      {activeBanners.length > 0 && (
        <div className="rounded-xl overflow-hidden relative shadow-md w-full max-w-full bg-slate-100" aria-label="Advertisements">
          <div
            ref={scrollRef}
            className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth"
          >
            {activeBanners.map((ad) => (
              <div
                key={ad._id}
                className={`min-w-full h-40 sm:h-52 relative snap-center overflow-hidden ${ad.linkUrl ? 'cursor-pointer' : ''}`}
                onClick={() => openBanner(ad)}
              >
                <img src={ad.imageUrl} alt={ad.title || 'Advertisement'} className="absolute inset-0 h-full w-full object-cover" />
                {(ad.title || ad.description) && (
                  <div className={`absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/30 to-transparent p-4 sm:p-6 flex flex-col justify-end ${activeBanners.length > 1 ? 'pb-8' : ''}`}>
                    {ad.title && <h4 className="text-white text-lg sm:text-2xl font-black tracking-tight leading-tight">{ad.title}</h4>}
                    {ad.description && <p className="text-white/85 text-[11px] sm:text-xs font-semibold mt-1 line-clamp-2">{ad.description}</p>}
                  </div>
                )}
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-[9px] font-bold text-white uppercase tracking-wider">Ad</span>
              </div>
            ))}
          </div>

          {activeBanners.length > 1 && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
              {activeBanners.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Show advertisement ${i + 1}`}
                  onClick={() => setCurrentAdIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${i === currentAdIndex ? 'w-5 bg-white shadow-sm' : 'w-1.5 bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-5 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <div
            key={stat.label}
            className={`rounded-xl p-2 sm:p-3 h-16 sm:h-20 group cursor-pointer border transition-all duration-300 hover:scale-[1.02] hover:shadow-md relative overflow-hidden flex items-center justify-between shadow-2xs ${stat.bgColor} ${stat.borderColor}`}
            style={{ 
              animation: 'flipIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              animationDelay: `${i * 0.12}s`,
              opacity: 0
            }}
            onClick={() => navigate(stat.to)}
          >
            {/* Concentric Circle Waves in Background */}
            <div className="absolute -right-6 -bottom-6 w-28 sm:w-32 h-28 sm:h-32 rounded-full pointer-events-none group-hover:scale-110 transition-transform duration-500" style={{ background: stat.watermarkColor }}></div>
            <div className="absolute -right-12 -bottom-12 w-36 sm:w-44 h-36 sm:h-44 rounded-full pointer-events-none" style={{ background: stat.watermarkColor }}></div>

            {/* Left Content: Title + Value + Subtitle */}
            <div className="relative z-10 flex flex-col justify-center min-w-0 flex-1 py-0.5">
              <h3 className="text-[11px] sm:text-sm font-heading font-extrabold text-slate-700 tracking-tight leading-none mb-1 sm:mb-1.5 truncate">{stat.label}</h3>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1.5 min-w-0 mt-0.5 sm:mt-0">
                <span className="text-lg sm:text-2xl font-heading font-black text-slate-900 tracking-tight truncate leading-none">{stat.value}</span>
                <span className="text-[9px] sm:text-[11px] font-sans font-bold text-slate-500 truncate leading-none mt-0.5 sm:mt-0 uppercase tracking-wider">{stat.sub}</span>
              </div>
            </div>

            {/* Right Content: Solid Icon Badge */}
            <div 
              className="relative z-10 ml-1.5 sm:ml-2 h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-xs flex-shrink-0 group-hover:rotate-6 transition-transform duration-300"
              style={{ background: stat.iconBg }}
            >
              <Icon name={stat.icon} size="sm" color="currentColor" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Card (Professional - Black Typography) */}
      <div 
        className="reveal-on-scroll rounded-2xl !px-1.5 !pt-3 !pb-1.5 bg-white border border-slate-100 shadow-sm font-sans w-full max-w-full overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3 px-3">
          <h3 className="text-[12px] font-sans font-bold text-black tracking-[0.05em] uppercase">Quick Actions</h3>
          <span onClick={() => navigate('/vendor/services')} className="text-[10px] font-semibold text-[#7C3AED] hover:underline cursor-pointer tracking-wide">View All</span>
        </div>
        <div className="flex overflow-x-auto no-scrollbar gap-1 pb-0 pt-0.5 px-1 items-start">
          {[
            { label: "ADD\nSERVICE", icon: "plus", circleBg: "#7C3AED", bg: "bg-purple-50", to: "/vendor/services" },
            { label: "UPDATE\nAVAIL", icon: "calendar", circleBg: "#10B981", bg: "bg-emerald-50", to: "/vendor/calendar" },
            { label: "UPLOAD\nPORTFOLIO", icon: "image", circleBg: "#F59E0B", bg: "bg-amber-50", to: "/vendor/portfolio" },
            { label: "VIEW\nLEADS", icon: "users", circleBg: "#3B82F6", bg: "bg-blue-50", to: "/vendor/inquiries" },
            { label: "CREATE\nQUOTE", icon: "checkList", circleBg: "#8B5CF6", bg: "bg-violet-50", to: "/vendor/quotes" },
            { label: "CHAT\nCUSTOMERS", icon: "chat", circleBg: "#EC4899", bg: "bg-pink-50", to: "/vendor/chat" },
          ].map((act, i) => (
            <div 
              key={act.label}
              className="flex flex-col items-center cursor-pointer group flex-shrink-0 min-w-[72px]"
              style={{ animation: 'scaleIn 0.5s ease-out both', animationDelay: `${0.5 + i * 0.05}s` }}
              onClick={() => navigate(act.to)}
            >
              <div 
                className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 active:scale-95 shadow-sm ${act.bg} border border-slate-100/50`}
              >
                <div 
                  className="h-7 w-7 rounded-full flex items-center justify-center text-white shadow-xs"
                  style={{ background: act.circleBg }}
                >
                  <Icon name={act.icon} size="sm" color="currentColor" />
                </div>
              </div>
              <span className="text-[8px] font-bold text-black mt-2 text-center leading-[1.1] whitespace-pre-line uppercase tracking-tight">
                {act.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Completion */}
      <div 
        className="reveal-on-scroll rounded-2xl relative overflow-hidden group shadow-md border border-purple-200/50 bg-gradient-to-br from-[#fbf9ff] via-[#f5eeff] to-[#eddfff] w-full max-w-full"
      >
        <div className="absolute bottom-0 right-2 sm:right-4 h-full w-[45%] sm:w-[40%] z-0 pointer-events-none flex items-end justify-end">
          {/* Soft purple decorative backdrop circle behind the wedding couple */}
          <div className="absolute w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-purple-300/20 -z-10 right-2 bottom-1 blur-xl"></div>
          <img
            src={weddingImg}
            alt="Wedding Couple"
            className="h-[105%] sm:h-[115%] w-auto object-contain object-bottom transition-transform duration-700 group-hover:scale-[1.02] opacity-100"
          />
        </div>

        <div className="p-3 sm:p-4 relative z-10">
          <div className="flex flex-col w-[52%] sm:w-[55%] lg:w-[58%]">
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-[8px] sm:text-[9px] font-sans font-black uppercase tracking-[0.2em] text-[#7c3aed]">Profile Strength</p>
                <span className={`text-[7px] sm:text-[8px] font-sans font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${completion > 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
                  {completion > 80 ? 'Verified' : 'Action Required'}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black text-slate-900 tracking-tighter leading-none mt-1">{completion}% Complete</h3>
            </div>

            <div className="mt-2.5 sm:mt-3 h-1.5 w-full max-w-xs sm:max-w-md rounded-full overflow-hidden bg-purple-100/50 border border-purple-200/40">
              <div className="h-full rounded-full transition-all duration-1000" style={{
                width: completion + '%',
                background: 'linear-gradient(90deg, #a78bfa, #7c3aed)',
              }}></div>
            </div>

            <div className="mt-3 sm:mt-3.5 flex flex-wrap items-center gap-2">
              <button 
                type="button" 
                className="vendor-cta rounded-full px-3.5 sm:px-5 h-8 sm:h-9 text-[8px] sm:text-[9px] font-heading font-extrabold uppercase tracking-[0.1em] text-white shadow-md shadow-purple-500/20 active:scale-95 transition-all flex items-center gap-1 bg-gradient-to-r from-[#7c3aed] to-[#9333ea] hover:from-[#6d28d9] hover:to-[#820ad9] hover:shadow-lg hover:shadow-purple-500/25"
                onClick={() => navigate('/vendor/profile')}
              >
                <Icon name="edit" size="xs" /> Optimize Profile
              </button>
              <button
                type="button"
                className="rounded-full px-3.5 sm:px-5 h-8 sm:h-9 text-[8px] sm:text-[9px] font-heading font-extrabold uppercase tracking-[0.1em] border border-purple-200/60 text-purple-700 bg-white/70 backdrop-blur-md hover:bg-white hover:border-purple-300 hover:text-purple-900 active:scale-95 transition-all"
                onClick={() => refreshData()}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Overview Graph Card */}
      {renderEarningsChart()}

      {/* Activity Grid: Enquiries & Bookings */}
      <div className="grid gap-3 sm:gap-5 lg:grid-cols-2">
        {/* New Enquiries Section */}
        <div 
          className="reveal-on-scroll bg-gradient-to-br from-indigo-50/40 to-white rounded-2xl p-3 sm:p-5 border border-indigo-100 shadow-sm font-sans w-full max-w-full overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm sm:text-base font-heading font-extrabold text-slate-900 tracking-tight uppercase">New Enquiries</h3>
            <span onClick={() => navigate('/vendor/leads')} className="text-xs font-sans font-bold text-[#7C3AED] hover:underline cursor-pointer tracking-wide">View All</span>
          </div>
          <div className="space-y-3">
            {(vendorState.leads || []).slice(0, 3).map((enq, idx) => {
              const realImages = [
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150", // Female
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150", // Male
                "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150"  // Female
              ];
              const profileImg = enq.img || realImages[idx % realImages.length];
              
              return (
              <div key={enq._id || enq.id} className="group relative flex items-start gap-2.5 p-1.5 sm:p-2 rounded-lg border border-white bg-white shadow-sm hover:border-indigo-300 hover:shadow-md transition-all duration-300">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden border border-slate-100 flex-shrink-0 bg-slate-100">
                  <img src={profileImg} alt={enq.customerName} className="h-full w-full object-cover" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-[14px] sm:text-[16px] font-heading font-extrabold text-slate-900 truncate leading-none tracking-tight">{enq.customerName}</h4>
                    <span className={`text-[9px] font-sans font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${enq.status === 'New' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{enq.status}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[11px] sm:text-[12px] font-sans font-bold text-slate-500 truncate leading-none uppercase tracking-wider">{enq.category || 'Wedding Inquiry'}</p>
                    <p className="text-[13px] sm:text-[14px] font-heading font-black text-[#7C3AED] leading-none">{enq.budget || '₹' + (enq.totalAmount || 'TBD')}</p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] sm:text-[11px] text-slate-400 font-semibold min-w-0">
                    <Icon name="calendar" size="xs" className="flex-shrink-0" />
                    <span className="flex-shrink-0">{new Date(enq.eventDate).toLocaleDateString()}</span>
                    <span className="opacity-50 flex-shrink-0">•</span>
                    <Icon name="location" size="xs" className="flex-shrink-0" />
                    <span className="truncate">{enq.eventLocation}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <button className="h-6 px-3 rounded-md bg-emerald-500 text-white text-[9px] font-bold hover:bg-emerald-600 active:scale-95 transition-all">Accept</button>
                    <button className="h-6 px-3 rounded-md bg-violet-50 text-violet-600 text-[9px] font-bold border border-violet-100 hover:bg-violet-100 active:scale-95 transition-all">Send Quote</button>
                    <button className="h-6 w-6 rounded-md bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100 hover:text-violet-500 transition-colors">
                      <Icon name="chat" size="xs" />
                    </button>
                  </div>
                </div>
              </div>
            )})}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-50">
            <button onClick={() => navigate('/vendor/leads')} className="text-[10px] font-bold text-slate-400 hover:text-[#7C3AED] transition-colors flex items-center justify-center gap-1 w-full group">
              View All Enquiries <Icon name="chevronRight" size="xs" className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Upcoming Bookings Section */}
        <div 
          className="reveal-on-scroll bg-gradient-to-br from-emerald-50/40 to-white rounded-2xl p-3 sm:p-5 border border-emerald-100 shadow-sm font-sans w-full max-w-full overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm sm:text-base font-heading font-extrabold text-slate-900 tracking-tight uppercase">Upcoming Bookings</h3>
            <span onClick={() => navigate('/vendor/bookings')} className="text-xs font-sans font-bold text-[#7C3AED] hover:underline cursor-pointer tracking-wide">View All</span>
          </div>
          <div className="space-y-3">
            {(vendorState.bookings || []).slice(0, 3).map((book) => {
              const d = new Date(book.eventDate);
              const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
              const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
              return (
              <div key={book._id || book.id} className="group flex items-center gap-2.5 p-1.5 sm:p-2 rounded-lg border border-white bg-white shadow-sm hover:border-emerald-300 hover:shadow-md transition-all duration-300">
                <div className="h-10 w-8 sm:h-12 sm:w-10 bg-slate-50 rounded-lg flex flex-col items-center justify-center border border-slate-100 flex-shrink-0">
                  <span className="text-[7px] font-bold text-slate-400 leading-none uppercase">{months[d.getMonth()]}</span>
                  <span className="text-[13px] sm:text-[14px] font-black text-slate-700 leading-none my-0.5">{d.getDate()}</span>
                  <span className="text-[7px] font-bold text-slate-400 leading-none">{days[d.getDay()]}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[14px] sm:text-[16px] font-heading font-extrabold text-slate-900 leading-tight truncate tracking-tight">{book.customerName}</h4>
                      <p className="text-[11px] sm:text-[12px] font-sans font-bold text-slate-500 truncate leading-none mt-1 uppercase tracking-wider">{book.services?.join(', ') || 'Wedding Event'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[14px] sm:text-[16px] font-heading font-black text-slate-900 leading-none tracking-tight">₹{(book.totalPrice || 0) / 1000}k</p>
                      <p className={`text-[10px] font-sans font-black leading-none mt-1 uppercase tracking-widest ${book.status === 'Confirmed' ? 'text-emerald-600' : 'text-slate-400'}`}>{book.status}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400 font-semibold truncate max-w-[120px] sm:max-w-none">
                      <Icon name="location" size="xs" />
                      <span className="truncate">{book.location}</span>
                    </div>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${book.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>{book.status}</span>
                  </div>
                </div>
              </div>
            )})}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-50">
            <button onClick={() => navigate('/vendor/bookings')} className="text-[10px] font-bold text-slate-400 hover:text-[#7C3AED] transition-colors flex items-center justify-center gap-1 w-full group">
              View All Bookings <Icon name="chevronRight" size="xs" className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
