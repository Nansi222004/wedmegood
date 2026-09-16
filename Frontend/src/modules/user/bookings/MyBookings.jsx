import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import userApi from '../../../services/userApi';

const MyBookings = ({ initialTab = 'quotes' }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(initialTab); // 'quotes' or 'bookings'

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [inquiries, setInquiries] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // quoteId or bookingId being processed

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadsRes, quotesRes, bookingsRes] = await Promise.allSettled([
        userApi.getUserLeads(),
        userApi.getUserQuotes(),
        userApi.getUserBookings()
      ]);

      if (leadsRes.status === 'fulfilled' && leadsRes.value?.success) {
        setInquiries(leadsRes.value.data || []);
      }
      if (quotesRes.status === 'fulfilled' && quotesRes.value?.success) {
        setQuotes(quotesRes.value.data || []);
      }
      if (bookingsRes.status === 'fulfilled' && bookingsRes.value?.success) {
        setBookings(bookingsRes.value.data || []);
      }
    } catch (e) {
      console.error('Error loading user bookings & quotes:', e);
      setError('Unable to load your bookings. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const findQuoteForLead = (leadId) => {
    return quotes.find(q => {
      const qLeadId = q.leadId?._id || q.leadId;
      return qLeadId && qLeadId.toString() === leadId.toString();
    });
  };

  const handleAcceptQuote = async (quote) => {
    if (!quote?._id) return;
    if (!window.confirm('Accept this quote and confirm your booking with the vendor?')) return;

    setActionLoading(quote._id);
    try {
      const res = await userApi.acceptQuote(quote._id);
      if (res.success) {
        alert('Congratulations! Your quote was accepted and your booking has been created in MongoDB.');
        await loadData();
        setActiveTab('bookings');
      } else {
        throw new Error(res.message || 'Failed to accept quote');
      }
    } catch (e) {
      console.error('Error accepting quote:', e);
      alert('Error accepting quote: ' + (e.message || 'Server error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectQuote = async (quote) => {
    if (!quote?._id) return;
    if (!window.confirm('Are you sure you want to decline this quote?')) return;

    setActionLoading(quote._id);
    try {
      const res = await userApi.rejectQuote(quote._id);
      if (res.success) {
        alert('Quote declined.');
        await loadData();
      } else {
        throw new Error(res.message || 'Failed to decline quote');
      }
    } catch (e) {
      console.error('Error declining quote:', e);
      alert('Error declining quote: ' + (e.message || 'Server error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelBooking = async (booking) => {
    if (!booking?._id) return;
    const reason = window.prompt('Please provide a reason for cancelling this booking:');
    if (!reason) return;

    setActionLoading(booking._id);
    try {
      const res = await userApi.cancelBooking(booking._id, reason);
      if (res.success) {
        alert('Booking cancelled successfully.');
        await loadData();
      } else {
        throw new Error(res.message || 'Failed to cancel booking');
      }
    } catch (e) {
      console.error('Error cancelling booking:', e);
      alert('Error cancelling booking: ' + (e.message || 'Server error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handlePayNow = (booking) => {
    // Navigate to checkout with the real booking document
    navigate('/user/checkout', {
      state: {
        bookingId: booking._id,
        booking: booking,
        items: (booking.services || []).map((srv, idx) => ({
          id: `${booking._id}-${idx}`,
          name: srv,
          category: 'Booked Service',
          price: `₹${booking.totalPrice.toLocaleString()}`,
          quantity: 1,
          whatsappNumber: booking.vendorId?.phone || '919876543210'
        }))
      }
    });
  };

  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'accepted':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'quote sent':
      case 'sent':
      case 'quoted':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'contacted':
        return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-700 border border-red-200';
      case 'completed':
        return 'bg-purple-100 text-purple-700 border border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const getPaymentBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'partial':
        return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'refunded':
        return 'bg-purple-100 text-purple-700 border border-purple-200';
      default:
        return 'bg-orange-100 text-orange-700 border border-orange-200';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Icon name="user" size="lg" className="text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Please Log In</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-sm">
          You must be logged in to view your quotes, inquiries, and confirmed bookings.
        </p>
        <Button onClick={() => navigate('/login')}>Log In</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-[#E91E63] border-t-transparent animate-spin rounded-full mb-3"></div>
        <p className="text-sm font-semibold text-slate-500">Loading your marketplace pipeline...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 md:max-w-4xl md:mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">My Bookings & Quotes</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">
            Real-time inquiries, official vendor quotations, and confirmed events.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={loadData}
          className="self-start sm:self-auto flex items-center gap-2"
        >
          <Icon name="refresh" size="xs" /> Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="font-bold underline text-xs">Retry</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 mb-8 space-x-8">
        <button
          onClick={() => setActiveTab('quotes')}
          className={`pb-4 text-sm font-bold tracking-wide transition-all relative ${
            activeTab === 'quotes' ? 'text-[#E91E63]' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          Quotes & Inquiries ({inquiries.length})
          {activeTab === 'quotes' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E91E63] rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-4 text-sm font-bold tracking-wide transition-all relative ${
            activeTab === 'bookings' ? 'text-[#E91E63]' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          Confirmed Bookings ({bookings.length})
          {activeTab === 'bookings' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E91E63] rounded-full" />
          )}
        </button>
      </div>

      {/* TAB 1: QUOTES & INQUIRIES */}
      {activeTab === 'quotes' && (
        <>
          {inquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 px-6">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                <Icon name="mail" size="lg" className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Inquiries Sent Yet</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">
                Browse our verified wedding vendors and request quotes for your event.
              </p>
              <Button className="mt-6 rounded-2xl px-8" onClick={() => navigate('/user/vendors')}>
                Explore Vendors
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {inquiries.map((inquiry) => {
                const quote = findQuoteForLead(inquiry._id);
                const vendorName = inquiry.vendorId?.businessName || inquiry.vendorName || 'Wedding Vendor';
                const location = inquiry.eventLocation || inquiry.vendorId?.city || 'Indore';
                const status = quote?.status === 'Accepted'
                  ? 'Confirmed'
                  : quote
                  ? 'Quotation Received'
                  : inquiry.status;

                return (
                  <Card
                    key={inquiry._id}
                    className="overflow-hidden rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="p-6 md:p-8">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                        <div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusBadge(status)}`}>
                            {status}
                          </span>
                          <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-3 leading-tight">
                            {vendorName}
                          </h3>
                          <p className="text-slate-500 font-bold text-xs flex items-center gap-2 mt-1">
                            <Icon name="location" size="xs" /> {location}
                          </p>
                        </div>
                        <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 text-left sm:text-right shrink-0">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Date</p>
                          <p className="text-slate-900 font-bold text-sm md:text-base">
                            {inquiry.eventDate ? new Date(inquiry.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50/70 rounded-2xl p-4 mb-6 border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Requirements</p>
                        <p className="text-slate-700 text-xs md:text-sm font-medium">"{inquiry.message}"</p>
                        {inquiry.guestCount > 0 && (
                          <span className="inline-block mt-2 text-[11px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-100">
                            👥 {inquiry.guestCount} Guests
                          </span>
                        )}
                        {inquiry.referencePhotos && inquiry.referencePhotos.length > 0 && (
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block w-full">Photos Attached:</span>
                            {inquiry.referencePhotos.map((photo, pIdx) => (
                              <a key={pIdx} href={photo} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 block hover:opacity-80">
                                <img src={photo} alt="Ref" className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Official Vendor Quotation */}
                      {quote && (
                        <div className="border-t border-slate-100 pt-6 mt-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div>
                              <h4 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-wider">
                                Official Vendor Quotation
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                Status: <span className="font-bold text-slate-700">{quote.status}</span>
                              </p>
                            </div>
                            <div className="sm:text-right">
                              <span className="text-2xl font-black text-emerald-600 tracking-tight">
                                ₹{(quote.totalAmount || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {quote.items && quote.items.length > 0 && (
                            <div className="space-y-2 bg-white border border-slate-100 p-4 rounded-2xl mb-6">
                              {quote.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs md:text-sm font-bold border-b border-slate-50 pb-2 last:border-none last:pb-0">
                                  <span className="text-slate-600">
                                    {item.service} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                                    {item.description && <span className="block text-[10px] font-normal text-slate-400">{item.description}</span>}
                                  </span>
                                  <span className="text-slate-900">₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {quote.status === 'Sent' || quote.status === 'Pending' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <button
                                disabled={actionLoading === quote._id}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-3.5 font-bold text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                                onClick={() => handleAcceptQuote(quote)}
                              >
                                {actionLoading === quote._id ? (
                                  <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                                ) : (
                                  <>
                                    <Icon name="checkCircle" size="xs" color="white" />
                                    Accept & Confirm Booking
                                  </>
                                )}
                              </button>
                              <button
                                disabled={actionLoading === quote._id}
                                className="w-full rounded-2xl py-3.5 font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 text-sm"
                                onClick={() => handleRejectQuote(quote)}
                              >
                                Decline Quote
                              </button>
                            </div>
                          ) : quote.status === 'Accepted' ? (
                            <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon name="check" size="sm" className="text-emerald-600" />
                                <span className="font-bold text-sm">Quote Accepted — Booking Created!</span>
                              </div>
                              <Button size="sm" onClick={() => setActiveTab('bookings')}>
                                View in Bookings
                              </Button>
                            </div>
                          ) : (
                            <div className="w-full bg-slate-100 text-slate-500 rounded-2xl py-3 text-center text-xs font-bold uppercase">
                              Quote {quote.status}
                            </div>
                          )}
                        </div>
                      )}

                      {!quote && (
                        <div className="flex items-center gap-3 text-amber-700 bg-amber-50 px-4 py-3 rounded-2xl border border-amber-100">
                          <div className="animate-pulse">
                            <Icon name="clock" size="sm" />
                          </div>
                          <span className="text-xs font-bold">Waiting for vendor to create official quotation...</span>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: CONFIRMED BOOKINGS */}
      {activeTab === 'bookings' && (
        <>
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 px-6">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                <Icon name="calendar" size="lg" className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Confirmed Bookings Yet</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">
                When you accept a quotation from a vendor, your confirmed booking will appear here with complete payment details.
              </p>
              <Button className="mt-6 rounded-2xl px-8" onClick={() => setActiveTab('quotes')}>
                View Quotes
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => {
                const vendorName = booking.vendorId?.businessName || 'Wedding Vendor';
                const location = booking.location || booking.vendorId?.city || 'Indore';
                const isPaid = booking.paymentStatus === 'Paid';
                const isCancelled = booking.status === 'Cancelled';

                return (
                  <Card
                    key={booking._id}
                    className="overflow-hidden rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="p-6 md:p-8">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                        <div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusBadge(booking.status)}`}>
                              {booking.status}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getPaymentBadge(booking.paymentStatus)}`}>
                              Payment: {booking.paymentStatus || 'Pending'}
                            </span>
                          </div>
                          <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                            {vendorName}
                          </h3>
                          <p className="text-slate-500 font-bold text-xs flex items-center gap-2 mt-1">
                            <Icon name="location" size="xs" /> {location}
                          </p>
                        </div>
                        <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 text-left sm:text-right shrink-0">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Date</p>
                          <p className="text-slate-900 font-bold text-sm md:text-base">
                            {booking.eventDate ? new Date(booking.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
                          </p>
                        </div>
                      </div>

                      {/* Services booked */}
                      <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Booked Services</span>
                          <span className="text-xl font-black text-slate-900">₹{(booking.totalPrice || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(booking.services || ['Wedding Services']).map((srv, sIdx) => (
                            <span key={sIdx} className="px-3 py-1 bg-white rounded-lg text-xs font-bold text-slate-700 border border-slate-200">
                              {srv}
                            </span>
                          ))}
                        </div>
                        {booking.cancellationReason && (
                          <p className="mt-3 text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">
                            Cancellation Reason: {booking.cancellationReason}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                        {!isPaid && !isCancelled && (
                          <button
                            onClick={() => handlePayNow(booking)}
                            className="w-full sm:w-auto px-6 py-3 bg-[#E91E63] hover:bg-[#D81B60] text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-pink-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            <Icon name="creditCard" size="xs" color="white" />
                            Pay ₹{(booking.totalPrice || 0).toLocaleString()} via Razorpay
                          </button>
                        )}

                        {isPaid && (
                          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 text-xs font-bold">
                            <Icon name="check" size="xs" /> Payment Completed
                          </div>
                        )}

                        {!isCancelled && (
                          <button
                            onClick={() => navigate('/user/account/reviews', { state: { bookingId: booking._id } })}
                            className="w-full sm:w-auto px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md shadow-amber-100 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Icon name="star" size="xs" color="white" />
                            Write Review
                          </button>
                        )}

                        {!isCancelled && booking.status !== 'Completed' && (
                          <button
                            disabled={actionLoading === booking._id}
                            onClick={() => handleCancelBooking(booking)}
                            className="w-full sm:w-auto px-4 py-3 rounded-2xl border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-bold transition-all"
                          >
                            {actionLoading === booking._id ? 'Cancelling...' : 'Cancel Booking'}
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyBookings;
