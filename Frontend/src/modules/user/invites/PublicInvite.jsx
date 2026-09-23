import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import userApi from '../../../services/userApi';

const PublicInvite = () => {
  const { slug } = useParams();

  const [invite, setInvite] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // RSVP Form State
  const [isRSVPModalOpen, setIsRSVPModalOpen] = useState(false);
  const [rsvpGuestName, setRsvpGuestName] = useState('');
  const [rsvpPhone, setRsvpPhone] = useState('');
  const [rsvpEmail, setRsvpEmail] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState('Attending');
  const [rsvpGuestCount, setRsvpGuestCount] = useState(1);
  const [rsvpNotes, setRsvpNotes] = useState('');
  const [isSubmittingRSVP, setIsSubmittingRSVP] = useState(false);
  const [rsvpSuccessMessage, setRsvpSuccessMessage] = useState('');
  const [rsvpErrorMessage, setRsvpErrorMessage] = useState('');

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPassed: false
  });

  useEffect(() => {
    if (!slug) {
      setError('Invalid invitation link');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    userApi.getPublicInvite(slug)
      .then(res => {
        if (res.success && res.data?.invite) {
          setInvite(res.data.invite);
        } else {
          setError(res.message || 'Invitation not found or is currently unpublished.');
        }
      })
      .catch(err => {
        console.error('Failed to load public invitation:', err);
        setError(err.message || 'Invitation not found or is currently unpublished.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [slug]);

  // Countdown Calculation
  useEffect(() => {
    if (!invite?.weddingDate) return;

    const calculateTime = () => {
      const weddingDateTimeStr = invite.weddingTime
        ? `${new Date(invite.weddingDate).toISOString().split('T')[0]}T${invite.weddingTime}:00`
        : invite.weddingDate;
      const targetDate = new Date(weddingDateTimeStr).getTime();
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPassed: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [invite]);

  const handleRSVPSubmit = async (e) => {
    e.preventDefault();
    setRsvpErrorMessage('');
    setRsvpSuccessMessage('');

    if (!rsvpGuestName.trim()) {
      setRsvpErrorMessage('Please enter your full name');
      return;
    }
    if (!rsvpPhone.trim()) {
      setRsvpErrorMessage('Please enter your phone number');
      return;
    }

    setIsSubmittingRSVP(true);
    try {
      const payload = {
        guestName: rsvpGuestName.trim(),
        phone: rsvpPhone.trim(),
        email: rsvpEmail.trim() || undefined,
        status: rsvpStatus,
        guestCount: parseInt(rsvpGuestCount, 10) || 1,
        notes: rsvpNotes.trim() || undefined
      };

      const res = await userApi.submitPublicRSVP(slug, payload);
      if (res.success) {
        setRsvpSuccessMessage(
          `Thank you, ${rsvpGuestName.trim()}! Your RSVP (${rsvpStatus}) has been recorded.`
        );
        // Reset form after short delay
        setTimeout(() => {
          setIsRSVPModalOpen(false);
          setRsvpSuccessMessage('');
          setRsvpGuestName('');
          setRsvpPhone('');
          setRsvpEmail('');
          setRsvpNotes('');
          setRsvpGuestCount(1);
        }, 2200);
      } else {
        throw new Error(res.message || 'Failed to submit RSVP');
      }
    } catch (err) {
      console.error('RSVP submit error:', err);
      setRsvpErrorMessage(err.message || 'Failed to submit RSVP. Please verify your details.');
    } finally {
      setIsSubmittingRSVP(false);
    }
  };

  // Custom colors or luxurious defaults
  const bgColor = invite?.backgroundColor || '#2A1810';
  const textColor = invite?.textColor || '#FFF8EE';
  const accentColor = invite?.accentColor || '#D4AF37';

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-900 text-stone-100 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mb-4"></div>
        <p className="text-stone-300 font-serif text-lg tracking-wide">Loading your wedding invitation...</p>
      </div>
    );
  }

  // Error / Not Found Screen
  if (error || !invite) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-950 text-stone-100 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 text-2xl">
          💌
        </div>
        <h1 className="text-2xl font-serif font-bold text-amber-300 mb-2">Invitation Unavailable</h1>
        <p className="text-stone-400 max-w-md mb-8">
          {error || 'This wedding invitation is not available or the link may have expired.'}
        </p>
        <Link
          to="/"
          className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium transition shadow-lg"
        >
          Explore Utsavo
        </Link>
      </div>
    );
  }

  const formattedDate = invite.weddingDate
    ? new Date(invite.weddingDate).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'Date to be announced';

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${invite.venue || ''} ${invite.venueAddress || ''}`.trim()
  )}`;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-8 px-4 sm:px-6 relative overflow-x-hidden selection:bg-amber-500 selection:text-black font-sans"
      style={{
        backgroundColor: bgColor,
        color: textColor
      }}
    >
      {/* Decorative Background Accents */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(212,175,55,0.15) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(212,175,55,0.15) 0%, transparent 40%)'
        }}
      />

      {/* Main Invitation Container */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center text-center z-10 space-y-8">
        {/* Header Ribbon */}
        <div className="space-y-2">
          <div
            className="inline-block px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-widest border"
            style={{
              borderColor: `${accentColor}50`,
              color: accentColor,
              backgroundColor: `${accentColor}15`
            }}
          >
            Wedding Celebration
          </div>
          <h2 className="text-sm font-light tracking-widest uppercase opacity-80">
            {invite.name || 'Together With Their Families'}
          </h2>
        </div>

        {/* Couple Names */}
        <div className="space-y-3 py-4 border-y w-full" style={{ borderColor: `${accentColor}30` }}>
          <p className="text-xs font-serif uppercase tracking-widest opacity-70">Cordially invite you to celebrate</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 font-serif">
            <span className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-amber-200">
              {invite.brideName || 'The Bride'}
            </span>
            <span className="text-2xl sm:text-3xl font-light italic" style={{ color: accentColor }}>
              &
            </span>
            <span className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-amber-200">
              {invite.groomName || 'The Groom'}
            </span>
          </div>
        </div>

        {/* Invitation Message */}
        {invite.message && (
          <p className="text-sm sm:text-base font-serif italic max-w-md leading-relaxed opacity-90 px-4">
            "{invite.message}"
          </p>
        )}

        {/* Countdown Timer */}
        {!timeLeft.isPassed && invite.weddingDate && (
          <div
            className="w-full py-4 px-6 rounded-2xl border backdrop-blur-md"
            style={{
              borderColor: `${accentColor}35`,
              backgroundColor: 'rgba(0,0,0,0.25)'
            }}
          >
            <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: accentColor }}>
              Countdown to the Big Day
            </p>
            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              {[
                { label: 'Days', value: timeLeft.days },
                { label: 'Hours', value: timeLeft.hours },
                { label: 'Mins', value: timeLeft.minutes },
                { label: 'Secs', value: timeLeft.seconds }
              ].map(item => (
                <div key={item.label} className="flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-amber-200">
                    {String(item.value).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider opacity-70 mt-1">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Event Details (Date, Time, Venue) */}
        <div className="w-full space-y-4">
          {/* Date & Time Card */}
          <div
            className="p-5 rounded-2xl border backdrop-blur-md flex flex-col items-center"
            style={{
              borderColor: `${accentColor}30`,
              backgroundColor: 'rgba(0,0,0,0.2)'
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            >
              📅
            </div>
            <h3 className="text-lg font-semibold text-amber-100">{formattedDate}</h3>
            {invite.weddingTime && (
              <p className="text-sm opacity-80 mt-1 font-medium">Ceremony Begins at {invite.weddingTime}</p>
            )}
          </div>

          {/* Venue Card */}
          {(invite.venue || invite.venueAddress) && (
            <div
              className="p-5 rounded-2xl border backdrop-blur-md flex flex-col items-center text-center"
              style={{
                borderColor: `${accentColor}30`,
                backgroundColor: 'rgba(0,0,0,0.2)'
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
              >
                📍
              </div>
              <h3 className="text-lg font-semibold text-amber-100">{invite.venue || 'Wedding Venue'}</h3>
              {invite.venueAddress && (
                <p className="text-xs sm:text-sm opacity-80 mt-1 max-w-sm">{invite.venueAddress}</p>
              )}
              {invite.enableMap && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition border hover:scale-105"
                  style={{
                    borderColor: accentColor,
                    backgroundColor: `${accentColor}20`,
                    color: accentColor
                  }}
                >
                  View on Google Maps ↗
                </a>
              )}
            </div>
          )}

          {/* Dresscode Card */}
          {invite.dresscode && (
            <div
              className="p-4 rounded-xl border backdrop-blur-md flex items-center justify-center gap-3 text-sm"
              style={{
                borderColor: `${accentColor}25`,
                backgroundColor: 'rgba(0,0,0,0.15)'
              }}
            >
              <span style={{ color: accentColor }}>✨</span>
              <span className="font-medium opacity-90">Dress Code: {invite.dresscode}</span>
            </div>
          )}

          {/* Host Contact (Only visible if enabled by host) */}
          {invite.enableContact && (invite.contactPerson || invite.contactPhone) && (
            <div
              className="p-4 rounded-xl border backdrop-blur-md flex flex-col items-center text-center text-xs opacity-80"
              style={{
                borderColor: `${accentColor}25`,
                backgroundColor: 'rgba(0,0,0,0.15)'
              }}
            >
              <span className="font-semibold uppercase tracking-wider mb-1" style={{ color: accentColor }}>
                Questions or Inquiries
              </span>
              <p>
                {invite.contactPerson} {invite.contactPhone && `• ${invite.contactPhone}`}
              </p>
            </div>
          )}
        </div>

        {/* RSVP Section */}
        {invite.enableRSVP ? (
          <div className="w-full pt-4 pb-8">
            {invite.isExpired ? (
              <div
                className="py-4 px-6 rounded-2xl border text-center font-medium"
                style={{
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#fca5a5'
                }}
              >
                RSVP deadline for this wedding ceremony has passed.
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsRSVPModalOpen(true)}
                className="w-full py-4 px-8 rounded-2xl font-bold text-base uppercase tracking-wider shadow-2xl transition transform hover:scale-[1.02] active:scale-[0.98] border"
                style={{
                  backgroundColor: accentColor,
                  color: '#1A0C06',
                  borderColor: accentColor
                }}
              >
                RSVP Now
              </button>
            )}
          </div>
        ) : (
          <div className="text-xs opacity-60 italic pt-4">RSVP is not required for this event.</div>
        )}

        {/* Footer Brand */}
        <div className="pt-8 border-t w-full flex flex-col items-center opacity-60 text-xs" style={{ borderColor: `${accentColor}20` }}>
          <p>Created with Utsavo Digital Invitations</p>
        </div>
      </div>

      {/* RSVP Modal Dialog */}
      {isRSVPModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-md rounded-3xl p-6 sm:p-8 border shadow-2xl relative overflow-hidden"
            style={{
              backgroundColor: '#1E120B',
              borderColor: `${accentColor}40`,
              color: '#FFF8EE'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                if (!isSubmittingRSVP) {
                  setIsRSVPModalOpen(false);
                  setRsvpErrorMessage('');
                }
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-stone-300 transition"
              aria-label="Close RSVP modal"
            >
              ✕
            </button>

            <h3 className="text-xl font-serif font-bold text-amber-200 mb-1">Confirm Your Attendance</h3>
            <p className="text-xs text-stone-400 mb-6">
              Please respond so the hosts can plan for your warm welcome.
            </p>

            {rsvpSuccessMessage ? (
              <div className="py-8 px-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center text-xl">
                  ✓
                </div>
                <h4 className="text-base font-bold text-emerald-300">RSVP Received</h4>
                <p className="text-xs text-stone-300 leading-relaxed">{rsvpSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleRSVPSubmit} className="space-y-4">
                {rsvpErrorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs leading-relaxed">
                    {rsvpErrorMessage}
                  </div>
                )}

                {/* Attendance Options */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-2">
                    Will You Attend? *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Attending', 'Not Attending', 'Maybe'].map(statusOption => (
                      <button
                        key={statusOption}
                        type="button"
                        onClick={() => setRsvpStatus(statusOption)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition ${
                          rsvpStatus === statusOption
                            ? 'border-amber-400 bg-amber-400 text-stone-950 font-bold shadow'
                            : 'border-stone-700 bg-stone-900/60 text-stone-300 hover:border-stone-500'
                        }`}
                      >
                        {statusOption}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={rsvpGuestName}
                    onChange={e => setRsvpGuestName(e.target.value)}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-900/80 border border-stone-700 focus:border-amber-400 focus:outline-none text-sm text-white"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={rsvpPhone}
                    onChange={e => setRsvpPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-900/80 border border-stone-700 focus:border-amber-400 focus:outline-none text-sm text-white"
                  />
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1">
                    Email Address <span className="opacity-60 lowercase font-normal">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={rsvpEmail}
                    onChange={e => setRsvpEmail(e.target.value)}
                    placeholder="ramesh@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-900/80 border border-stone-700 focus:border-amber-400 focus:outline-none text-sm text-white"
                  />
                </div>

                {/* Guest Count (Only for Attending / Maybe) */}
                {rsvpStatus !== 'Not Attending' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1">
                      Total Attending Guests (Including You)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={rsvpGuestCount}
                        onChange={e => setRsvpGuestCount(Number(e.target.value))}
                        className="flex-1 accent-amber-400"
                      />
                      <span className="w-8 text-center font-bold text-amber-200">{rsvpGuestCount}</span>
                    </div>
                  </div>
                )}

                {/* Dietary / Notes */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1">
                    Dietary Preferences / Warm Wishes <span className="opacity-60 lowercase font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={rsvpNotes}
                    onChange={e => setRsvpNotes(e.target.value)}
                    placeholder="e.g. Vegetarian, looking forward to celebrating!"
                    className="w-full px-4 py-2 rounded-xl bg-stone-900/80 border border-stone-700 focus:border-amber-400 focus:outline-none text-sm text-white resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingRSVP}
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg transition bg-amber-400 hover:bg-amber-500 text-stone-950 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingRSVP ? 'Submitting RSVP...' : 'Confirm RSVP'}
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

export default PublicInvite;
