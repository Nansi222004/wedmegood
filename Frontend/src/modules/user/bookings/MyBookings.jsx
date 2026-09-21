import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import userApi from '../../../services/userApi';
import { toast } from '../../../components/ui/Toast';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import QuotationModal from '../../common/QuotationModal';
import WeatherForecastCard from '../../common/WeatherForecastCard';
import { getFriendlyErrorMessage } from '../../../utils/errorHandler';

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
  const [quoteToAccept, setQuoteToAccept] = useState(null);
  const [quoteToReject, setQuoteToReject] = useState(null);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedBookingDetail, setSelectedBookingDetail] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [eligibleReviewIds, setEligibleReviewIds] = useState(new Set());
  const [selectedQuoteForModal, setSelectedQuoteForModal] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadsRes, quotesRes, bookingsRes, eligibleRes] = await Promise.allSettled([
        userApi.getUserLeads(),
        userApi.getUserQuotes(),
        userApi.getUserBookings(),
        userApi.getEligibleReviewBookings()
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
      if (eligibleRes.status === 'fulfilled' && eligibleRes.value?.success) {
        const eligibleList = eligibleRes.value.data?.eligibleBookings || [];
        setEligibleReviewIds(new Set(eligibleList.map(b => (b._id || b).toString())));
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

  const handleAcceptQuote = (quote) => {
    if (quote?._id) setQuoteToAccept(quote);
  };

  const confirmAcceptQuote = async () => {
    if (!quoteToAccept?._id) return;
    const quoteId = quoteToAccept._id;
    const quoteSnapshot = quoteToAccept;
    setActionLoading(quoteId);
    try {
      const res = await userApi.acceptQuote(quoteId);
      if (res.success) {
        const booking = res.data?.booking;
        const advanceRequired = res.data?.advancePaymentAmount ?? booking?.advancePaymentRequired ?? (Number(quoteSnapshot.advancePaymentAmount) || 0);
        setQuoteToAccept(null);
        await loadData();

        if (advanceRequired > 0 && booking?._id) {
          toast.info(`Quote accepted! Redirecting to complete advance payment of ₹${advanceRequired.toLocaleString('en-IN')}.`);
          navigate('/user/checkout', {
            state: {
              bookingId: booking._id,
              booking: booking,
              payableAmount: advanceRequired,
              items: [{
                id: `${booking._id}-advance`,
                name: `Advance Payment for ${quoteSnapshot.vendorId?.businessName || 'Wedding Vendor'}`,
                category: 'Booking Advance',
                price: `₹${advanceRequired.toLocaleString('en-IN')}`,
                quantity: 1,
                whatsappNumber: quoteSnapshot.vendorId?.phone || ''
              }]
            }
          });
        } else {
          toast.success('Congratulations! Your quote was accepted. Awaiting vendor schedule confirmation.');
          setActiveTab('bookings');
        }
      } else {
        throw new Error(res.message || 'Failed to accept quote');
      }
    } catch (e) {
      console.error('Error accepting quote:', e);
      toast.error(getFriendlyErrorMessage(e, 'Failed to accept quote'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectQuote = (quote) => {
    if (quote?._id) setQuoteToReject(quote);
  };

  const confirmRejectQuote = async () => {
    if (!quoteToReject?._id) return;
    const quoteId = quoteToReject._id;
    setActionLoading(quoteId);
    try {
      const res = await userApi.rejectQuote(quoteId);
      if (res.success) {
        toast.info('Quote declined.');
        setQuoteToReject(null);
        await loadData();
      } else {
        throw new Error(res.message || 'Failed to decline quote');
      }
    } catch (e) {
      console.error('Error declining quote:', e);
      toast.error(getFriendlyErrorMessage(e, 'Failed to decline quote'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelBooking = (booking) => {
    if (booking?._id) {
      setBookingToCancel(booking);
      setCancelReason('');
    }
  };

  const confirmCancelBooking = async () => {
    if (!bookingToCancel?._id) return;
    const trimmedReason = cancelReason.trim();
    if (!trimmedReason) {
      toast.warning('Please provide a reason for cancelling this booking.');
      return;
    }

    const bookingId = bookingToCancel._id;
    setActionLoading(bookingId);
    try {
      const res = await userApi.cancelBooking(bookingId, trimmedReason);
      if (res.success) {
        toast.success('Booking cancelled successfully.');
        setBookingToCancel(null);
        setCancelReason('');
        await loadData();
      } else {
        throw new Error(res.message || 'Failed to cancel booking');
      }
    } catch (e) {
      console.error('Error cancelling booking:', e);
      toast.error(getFriendlyErrorMessage(e, 'Failed to cancel booking'));
    } finally {
      setActionLoading(null);
    }
  };

  const handlePayNow = (booking) => {
    const payableAmount = (booking.outstandingBalance !== undefined && booking.outstandingBalance !== null)
      ? booking.outstandingBalance
      : (booking.totalPrice || 0);

    if (payableAmount <= 0) {
      toast.info('This booking is already fully paid.');
      return;
    }

    navigate('/user/checkout', {
      state: {
        bookingId: booking._id,
        booking: booking,
        payableAmount,
        items: (booking.services && booking.services.length > 0 ? booking.services : ['Wedding Services']).map((srv, idx) => ({
          id: `${booking._id}-${idx}`,
          name: srv,
          category: 'Booked Service',
          price: `₹${payableAmount.toLocaleString('en-IN')}`,
          quantity: 1,
          whatsappNumber: booking.vendorId?.phone || ''
        }))
      }
    });
  };

  const handleDownloadReceipt = async (booking) => {
    try {
      setReceiptLoading(true);
      const res = await userApi.getBookingReceipt(booking._id);
      if (res.success && res.data) {
        const rcpt = res.data;
        const customerName = rcpt.customer?.name || user?.name || user?.fullName || 'Customer';
        const vendorName = rcpt.vendor?.businessName || booking.vendorId?.businessName || 'Wedding Vendor';
        const receiptNo = rcpt.receiptNumber || `RCP-${booking._id.slice(-8).toUpperCase()}`;
        const eventDateStr = rcpt.booking?.eventDate ? new Date(rcpt.booking.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBD';
        const issueDateStr = rcpt.issuedAt ? new Date(rcpt.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-IN');
        const amountPaid = rcpt.payment?.amount || booking.paidAmount || booking.totalPrice || 0;

        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Payment Receipt – ${receiptNo}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 32px; color: #1e293b; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #E91E63; padding-bottom: 16px; margin-bottom: 24px; }
    .brand { font-size: 24px; font-weight: 900; color: #E91E63; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; color: #64748b; font-weight: 600; margin-top: 2px; }
    .inv-info { text-align: right; }
    .inv-info p { margin: 2px 0; font-size: 12px; color: #64748b; }
    .inv-info .inv-no { font-size: 16px; font-weight: 800; color: #0f172a; }
    .section-title { font-size: 11px; font-weight: 800; color: #E91E63; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 24px; }
    .info-row { display: flex; flex-direction: column; }
    .info-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
    .info-val { font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { background: #f8fafc; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; padding: 10px 14px; text-align: left; }
    td { padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
    .amount { font-weight: 800; text-align: right; }
    .status-badge { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 10px; font-weight: 800; text-transform: uppercase; background: #ecfdf5; color: #047857; }
    .footer { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Utsavo / WedMeGood</div>
      <div class="brand-sub">Official Event Technology & Payment Receipt</div>
    </div>
    <div class="inv-info">
      <p class="inv-no">${receiptNo}</p>
      <p>Issued: ${issueDateStr}</p>
      <p>Status: <span class="status-badge">Payment Verified</span></p>
    </div>
  </div>

  <p class="section-title">Customer & Vendor Information</p>
  <div class="info-grid">
    <div class="info-row"><span class="info-label">Billed To</span><span class="info-val">${customerName}</span></div>
    <div class="info-row"><span class="info-label">Service Provider</span><span class="info-val">${vendorName} (${rcpt.vendor?.category || 'Vendor'})</span></div>
    <div class="info-row"><span class="info-label">Customer Contact</span><span class="info-val">${rcpt.customer?.phone || rcpt.customer?.email || 'Registered Customer'}</span></div>
    <div class="info-row"><span class="info-label">Vendor Location</span><span class="info-val">${rcpt.vendor?.city || 'India'}</span></div>
  </div>

  <p class="section-title">Booking Details</p>
  <div class="info-grid">
    <div class="info-row"><span class="info-label">Booking ID</span><span class="info-val">${booking._id}</span></div>
    <div class="info-row"><span class="info-label">Event Date</span><span class="info-val">${eventDateStr}</span></div>
    <div class="info-row"><span class="info-label">Location / Venue</span><span class="info-val">${rcpt.booking?.location || booking.location || 'Venue pending'}</span></div>
    <div class="info-row"><span class="info-label">Services</span><span class="info-val">${(rcpt.booking?.services || booking.services || ['Wedding Services']).join(', ')}</span></div>
  </div>

  <p class="section-title">Payment Transaction Summary</p>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Transaction ID</th>
        <th>Method</th>
        <th class="amount">Paid Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Confirmed Booking Payment</strong></td>
        <td><span style="font-family: monospace;">${rcpt.payment?.transactionId || 'Razorpay Online'}</span></td>
        <td>${rcpt.payment?.paymentMethod || 'Razorpay'}</td>
        <td class="amount">₹${Number(amountPaid).toLocaleString('en-IN')}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    WedMeGood Event Tech Pvt. Ltd. · Support: support@wedmegood.com · This is an authorized digital receipt.
  </div>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Receipt_${customerName.replace(/\s+/g, '_')}_${receiptNo}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Official payment receipt downloaded!');
      } else {
        throw new Error(res.message || 'Receipt not available');
      }
    } catch (err) {
      console.error('Error downloading receipt:', err);
      toast.error(err.message || 'Unable to load receipt for this booking.');
    } finally {
      setReceiptLoading(false);
    }
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
          {quotes.length > 1 && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-rose-200 flex items-center justify-center text-[#E91E63] shrink-0">
                  <Icon name="columns" size="sm" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Multi-Vendor Quotation Matrix</h4>
                  <p className="text-[11px] text-slate-500">You have {quotes.length} official quotations. Compare pricing, services, terms, and date availability side-by-side.</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => navigate('/user/quotes/compare')}
                className="w-full sm:w-auto text-xs font-bold bg-[#E91E63] hover:bg-[#D81B60] shrink-0 flex items-center gap-1.5"
              >
                <Icon name="columns" size="xs" />
                Compare Quotes Matrix
              </Button>
            </div>
          )}
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

                      {/* Event Weather Forecast (Open-Meteo, Informational Advisory) */}
                      {inquiry.eventDate && (
                        <WeatherForecastCard
                          eventDate={inquiry.eventDate}
                          location={inquiry.eventLocation || inquiry.vendorId?.city}
                          venueType={inquiry.venueType || 'Not Specified'}
                        />
                      )}

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

                          {/* Quick Actions & Official Quotation Triggers */}
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            <button
                              type="button"
                              onClick={() => setSelectedQuoteForModal(quote)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Icon name="fileText" size="xs" /> View Official Quotation
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await userApi.downloadQuotePdf(quote._id);
                                  toast.success('Official quotation PDF downloaded successfully!');
                                } catch (err) {
                                  toast.error('Failed to download PDF quotation');
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-[#E91E63] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Icon name="download" size="xs" /> Download PDF
                            </button>
                            {(Number(quote.advancePaymentAmount) || 0) > 0 && (
                              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                                Advance Required: ₹{Number(quote.advancePaymentAmount).toLocaleString('en-IN')}
                              </span>
                            )}
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
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-3.5 font-bold text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                onClick={() => handleAcceptQuote(quote)}
                              >
                                {actionLoading === quote._id ? (
                                  <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                                ) : (
                                  <>
                                    <Icon name="check" size="xs" color="white" />
                                    {(Number(quote.advancePaymentAmount) || 0) > 0
                                      ? `Accept & Pay Advance (₹${Number(quote.advancePaymentAmount).toLocaleString('en-IN')})`
                                      : 'Accept Quote'}
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
                const totalAmount = Number(booking.packageTotal ?? booking.totalPrice ?? 0);
                const paidAmount = Number(booking.paidAmount ?? 0);
                const totalRefunded = Number(booking.totalRefunded ?? booking.refundAmount ?? 0);
                const outstanding = Number(booking.outstandingBalance ?? Math.max(0, totalAmount - paidAmount));
                const isPaid = booking.paymentStatus === 'Paid' || (totalAmount > 0 && paidAmount >= totalAmount && outstanding === 0);
                const isCancelled = booking.status === 'Cancelled';
                const isEligibleForReview = eligibleReviewIds.has(booking._id.toString()) || booking.status === 'Completed';
                const hasReceipt = paidAmount > 0 || isPaid;

                return (
                  <Card
                    key={booking._id}
                    className="overflow-hidden rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="p-6 md:p-8">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusBadge(booking.status)}`}>
                              {booking.status}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getPaymentBadge(isPaid ? 'Paid' : booking.paymentStatus)}`}>
                              Payment: {isPaid ? 'Paid' : (booking.paymentStatus || 'Pending')}
                            </span>
                            {hasReceipt && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-[#6D3BFF] border border-purple-100">
                                🛡️ {booking.escrowStatus || 'Escrow Protected'}
                              </span>
                            )}
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

                      {/* Financial Transparency Summary Bar */}
                      <div className={`grid ${totalRefunded > 0 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-2 sm:gap-4 my-4 p-3 sm:p-4 bg-slate-50/90 rounded-2xl border border-slate-100 text-center sm:text-left`}>
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Package Total</span>
                          <span className="text-sm sm:text-base md:text-lg font-black text-slate-900">
                            ₹{totalAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="border-x border-slate-200/70 px-2 sm:px-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Paid to Date</span>
                          <span className="text-sm sm:text-base md:text-lg font-black text-emerald-700">
                            ₹{paidAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        {totalRefunded > 0 && (
                          <div className="border-r border-slate-200/70 px-2 sm:px-4">
                            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block">Refunded</span>
                            <span className="text-sm sm:text-base md:text-lg font-black text-purple-700">
                              ₹{totalRefunded.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Balance Due</span>
                          <span className={`text-sm sm:text-base md:text-lg font-black ${outstanding === 0 ? 'text-slate-500' : 'text-rose-600'}`}>
                            {outstanding === 0 ? '₹0 (Settled)' : `₹${outstanding.toLocaleString('en-IN')}`}
                          </span>
                        </div>
                      </div>

                      {/* Event Weather Forecast (Open-Meteo, Informational Advisory) */}
                      {booking.eventDate && (
                        <WeatherForecastCard
                          eventDate={booking.eventDate}
                          location={booking.location || booking.vendorId?.city}
                          venueType={booking.venueType || 'Not Specified'}
                        />
                      )}

                      {/* Services booked */}
                      <div className="bg-slate-50/60 rounded-2xl p-4 mb-5 border border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Booked Services</span>
                          {booking.guestCount && (
                            <span className="text-xs font-bold text-slate-500">Guests: {booking.guestCount}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
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
                      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                        <button
                          onClick={() => setSelectedBookingDetail(booking)}
                          className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          <Icon name="document" size="xs" />
                          View Details & Ledger
                        </button>

                        {hasReceipt && (
                          <button
                            onClick={() => handleDownloadReceipt(booking)}
                            disabled={receiptLoading}
                            className="px-4 py-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            <Icon name="download" size="xs" />
                            {receiptLoading ? 'Generating...' : 'Receipt'}
                          </button>
                        )}

                        {!isPaid && !isCancelled && outstanding > 0 && (
                          <button
                            onClick={() => handlePayNow(booking)}
                            className="px-5 py-2.5 bg-[#E91E63] hover:bg-[#D81B60] text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-pink-200 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Icon name="creditCard" size="xs" color="white" />
                            {booking.status === 'Pending' && paidAmount === 0 && (booking.advancePaymentRequired || 0) > 0
                              ? `Pay Advance (₹${Number(booking.advancePaymentRequired).toLocaleString('en-IN')})`
                              : paidAmount > 0
                              ? `Pay Balance (₹${outstanding.toLocaleString('en-IN')})`
                              : `Pay ₹${outstanding.toLocaleString('en-IN')}`}
                          </button>
                        )}

                        {isPaid && (
                          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 text-xs font-bold">
                            <Icon name="check" size="xs" /> Paid in Full
                          </div>
                        )}

                        {!isCancelled && isEligibleForReview && (
                          <button
                            onClick={() => navigate('/user/account/reviews', { state: { bookingId: booking._id } })}
                            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md shadow-amber-100 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Icon name="star" size="xs" color="white" />
                            Write Review
                          </button>
                        )}

                        {!isCancelled && booking.status !== 'Completed' && (
                          <button
                            disabled={actionLoading === booking._id}
                            onClick={() => handleCancelBooking(booking)}
                            className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-bold transition-all"
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
      {/* Dedicated Authoritative Quote Acceptance Breakdown Modal */}
      {quoteToAccept && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#E91E63] bg-pink-50 px-2.5 py-1 rounded-full">
                  Official Quotation
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  Review & Accept Quotation
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Vendor: <span className="font-bold text-slate-800">{quoteToAccept.vendorId?.businessName || 'Wedding Vendor'}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuoteToAccept(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Authoritative Financial Reconciliation Breakdown */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-5">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                Financial Schedule & Terms
              </h4>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Total Contract Value:</span>
                  <span className="text-base font-black text-slate-900">
                    ₹{(quoteToAccept.totalAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-y border-slate-200/60">
                  <div>
                    <span className="text-slate-800 font-bold block">
                      Amount Due Now (Advance):
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {(Number(quoteToAccept.advancePaymentAmount) || 0) > 0
                        ? `Required to lock date (${quoteToAccept.advancePaymentPercent ? `${quoteToAccept.advancePaymentPercent}%` : 'Advance'})`
                        : 'No upfront advance required'}
                    </span>
                  </div>
                  <span className={`text-base font-black ${(Number(quoteToAccept.advancePaymentAmount) || 0) > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                    ₹{(Number(quoteToAccept.advancePaymentAmount) || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <div>
                    <span className="text-slate-600 font-medium block">
                      Remaining Balance (Due Later):
                    </span>
                    <span className="text-[10px] text-slate-400">Payable as per event milestones</span>
                  </div>
                  <span className="text-base font-black text-slate-900">
                    ₹{Math.max(0, (quoteToAccept.totalAmount || 0) - (Number(quoteToAccept.advancePaymentAmount) || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Milestone Payment Schedule if defined */}
            {quoteToAccept.milestonePaymentTerms && quoteToAccept.milestonePaymentTerms.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Payment Milestones</p>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {quoteToAccept.milestonePaymentTerms.map((m, idx) => (
                    <div key={idx} className="flex justify-between items-center px-3 py-2 border-b border-slate-100 last:border-b-0">
                      <span className="font-semibold text-slate-700">{m.stage || `Stage ${idx + 1}`} ({m.percentage}%)</span>
                      <span className="font-bold text-slate-900">₹{Number(m.amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terms and Cancellation Notice */}
            <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 mb-6 text-xs text-amber-900">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <span>🛡️</span>
                <span>Booking & Payment Policy</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                {quoteToAccept.cancellationTerms || 'Accepting this quotation creates a Pending booking record. If an advance is required, your booking is officially confirmed upon verified payment receipt.'}
              </p>
              {quoteToAccept.validUntil && (
                <p className="text-[10px] font-bold text-amber-700 mt-1">
                  ⏳ Quote valid until: {new Date(quoteToAccept.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setQuoteToAccept(null)}
                className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={!!actionLoading}
                onClick={confirmAcceptQuote}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-200 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                ) : (
                  <Icon name="check" size="xs" color="white" />
                )}
                {(Number(quoteToAccept.advancePaymentAmount) || 0) > 0
                  ? `Accept & Pay Advance (₹${Number(quoteToAccept.advancePaymentAmount).toLocaleString('en-IN')})`
                  : 'Accept Quote & Submit Booking'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reject Quote Modal */}
      <ConfirmModal
        isOpen={!!quoteToReject}
        title="Decline Quote"
        message="Are you sure you want to decline this quote? This action cannot be undone."
        confirmText={actionLoading ? 'Declining...' : 'Decline Quote'}
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={confirmRejectQuote}
        onCancel={() => setQuoteToReject(null)}
      />

      {/* Cancel Booking Form Modal (Replaces window.prompt) */}
      {bookingToCancel && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center">
                <Icon name="close" size="sm" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">Cancel Booking</h3>
                <p className="text-xs text-slate-400 font-semibold">Vendor: {bookingToCancel.vendorId?.businessName || 'Wedding Vendor'}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4 font-medium">
              Please share a reason for cancelling this booking. This will help the vendor and our support team assist you better.
            </p>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., Change of wedding date, found another service..."
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium text-slate-800 placeholder:text-slate-400 mb-5 resize-none transition-all"
              autoFocus
            />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={actionLoading === bookingToCancel._id}
                onClick={() => setBookingToCancel(null)}
                className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={actionLoading === bookingToCancel._id || !cancelReason.trim()}
                onClick={confirmCancelBooking}
                className="px-6 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-200 disabled:opacity-50 active:scale-95 transition-all flex items-center gap-2"
              >
                {actionLoading === bookingToCancel._id ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Selected Booking Details & Financial Ledger Modal */}
      {selectedBookingDetail && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setSelectedBookingDetail(null)}
        >
          <div
            className="bg-white rounded-[2rem] max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-6 my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusBadge(selectedBookingDetail.status)}`}>
                    {selectedBookingDetail.status}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getPaymentBadge(selectedBookingDetail.paymentStatus)}`}>
                    Payment: {selectedBookingDetail.paymentStatus || 'Pending'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#6D3BFF] border border-purple-100 flex items-center gap-1">
                    🛡️ Escrow Protected
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {selectedBookingDetail.vendorId?.businessName || 'Wedding Vendor'}
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Category: <strong className="text-slate-700">{selectedBookingDetail.vendorId?.category || 'Wedding Service'}</strong> · Location: <strong className="text-slate-700">{selectedBookingDetail.location || selectedBookingDetail.vendorId?.city || 'India'}</strong>
                </p>
              </div>

              <button
                onClick={() => setSelectedBookingDetail(null)}
                className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors shrink-0"
              >
                <Icon name="close" size="xs" />
              </button>
            </div>

            {/* Financial Ledger & Money Transparency Grid */}
            {/* Financial Ledger & Money Transparency Grid */}
            <div className={`grid ${selectedBookingDetail.totalRefunded > 0 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'} gap-4`}>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Agreed Package</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  ₹{Number(selectedBookingDetail.packageTotal ?? selectedBookingDetail.totalPrice ?? 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Contracted price with vendor</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Verified Paid to Date</p>
                <p className="text-2xl font-black text-emerald-800 mt-1">
                  ₹{Number(selectedBookingDetail.paidAmount ?? 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5 flex items-center gap-1">
                  <Icon name="check" size="xs" /> Authenticated via Razorpay
                </p>
              </div>

              {selectedBookingDetail.totalRefunded > 0 && (
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100">
                  <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest">Refunds & Reversals</p>
                  <p className="text-2xl font-black text-purple-900 mt-1">
                    ₹{Number(selectedBookingDetail.totalRefunded).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-purple-600 mt-0.5">Returned to source account</p>
                </div>
              )}

              <div className={`p-4 rounded-2xl border ${
                (selectedBookingDetail.outstandingBalance ?? 0) === 0
                  ? 'bg-slate-50 border-slate-100'
                  : 'bg-rose-50 border-rose-100'
              }`}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outstanding Balance Due</p>
                <p className={`text-2xl font-black mt-1 ${
                  (selectedBookingDetail.outstandingBalance ?? 0) === 0 ? 'text-slate-700' : 'text-rose-600'
                }`}>
                  {(selectedBookingDetail.outstandingBalance ?? 0) === 0
                    ? '₹0 (Settled)'
                    : `₹${Number(selectedBookingDetail.outstandingBalance).toLocaleString('en-IN')}`}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {(selectedBookingDetail.outstandingBalance ?? 0) === 0 ? 'No pending balance' : 'Payable online before event'}
                </p>
              </div>
            </div>

            {/* Escrow Custody Status Notice */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Icon name="check" size="xs" />
              </div>
              <div className="text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900 block font-bold mb-0.5">
                  Escrow Custody Status: {selectedBookingDetail.escrowStatus || (selectedBookingDetail.paidAmount > 0 ? 'Held in Escrow' : 'Awaiting Payment')}
                </strong>
                Customer funds ({selectedBookingDetail.escrowHeldAmount !== undefined ? `₹${Number(selectedBookingDetail.escrowHeldAmount).toLocaleString('en-IN')}` : `₹${Number(selectedBookingDetail.paidAmount || 0).toLocaleString('en-IN')}`}) are held safely in platform escrow and disbursed to the vendor upon successful event completion.
              </div>
            </div>

            {/* Event Details & Logistics */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Event & Booking Details</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block">Event Date</span>
                  <span className="font-bold text-slate-800">
                    {selectedBookingDetail.eventDate ? new Date(selectedBookingDetail.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Location</span>
                  <span className="font-bold text-slate-800">
                    {selectedBookingDetail.location || selectedBookingDetail.vendorId?.city || 'TBD'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Guests Expected</span>
                  <span className="font-bold text-slate-800">
                    {selectedBookingDetail.guestCount || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Booking Reference</span>
                  <span className="font-mono font-bold text-slate-700 text-[11px]">
                    {selectedBookingDetail._id?.slice(-8).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-slate-400 font-bold text-xs block mb-1.5">Contracted Services</span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedBookingDetail.services || ['Wedding Services']).map((srv, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white rounded-lg text-xs font-bold text-slate-700 border border-slate-200">
                      {srv}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Verified Payment Transactions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Verified Payment Transactions</h4>
                <span className="text-[11px] font-bold text-slate-400">Official Gateway Records</span>
              </div>

              {selectedBookingDetail.verifiedPayments && selectedBookingDetail.verifiedPayments.length > 0 ? (
                <div className="space-y-2">
                  {selectedBookingDetail.verifiedPayments.map((p, pIdx) => {
                    const isSuccess = p.status === 'Completed' || p.status === 'Paid';
                    return (
                      <div key={p._id || pIdx} className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                            isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                          }`}>
                            <span className="font-bold">{isSuccess ? '✓' : '✗'}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{p.paymentMethod || 'Razorpay Online'}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                isSuccess ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                              }`}>
                                {p.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              ID: {p.razorpayPaymentId || p._id} · {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-slate-900">₹{Number(p.amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (selectedBookingDetail.paidAmount > 0 || selectedBookingDetail.paymentStatus === 'Paid') ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <span className="font-bold">✓</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">Online Payment via Razorpay</span>
                      <p className="text-[10px] text-slate-400">Status: Verified Paid</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-900">
                    ₹{(selectedBookingDetail.paidAmount || selectedBookingDetail.totalPrice || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                  No online payments recorded yet for this booking.
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedBookingDetail(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all"
              >
                Close
              </button>

              {(selectedBookingDetail.paidAmount > 0 || selectedBookingDetail.paymentStatus === 'Paid') && (
                <button
                  type="button"
                  disabled={receiptLoading}
                  onClick={() => handleDownloadReceipt(selectedBookingDetail)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                >
                  <Icon name="download" size="xs" />
                  {receiptLoading ? 'Downloading...' : 'Download Official Receipt'}
                </button>
              )}

              {selectedBookingDetail.status !== 'Cancelled' && (selectedBookingDetail.outstandingBalance ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const b = selectedBookingDetail;
                    setSelectedBookingDetail(null);
                    handlePayNow(b);
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#E91E63] hover:bg-[#D81B60] text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-pink-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Icon name="creditCard" size="xs" color="white" />
                  Pay Balance ₹{Number(selectedBookingDetail.outstandingBalance).toLocaleString('en-IN')}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Official Quotation Modal */}
      {selectedQuoteForModal && (
        <QuotationModal
          isOpen={Boolean(selectedQuoteForModal)}
          onClose={() => setSelectedQuoteForModal(null)}
          quote={selectedQuoteForModal}
          isVendor={false}
          onAccept={(q) => handleAcceptQuote(q)}
          onReject={(q) => handleRejectQuote(q)}
        />
      )}
    </div>
  );
};

export default MyBookings;
