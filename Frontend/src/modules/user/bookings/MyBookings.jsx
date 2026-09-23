import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/ui/Icon';
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

  // Master-detail view for Quotation Details matching Screenshot 3 Right
  const [selectedQuoteForDetails, setSelectedQuoteForDetails] = useState(null);

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
        setSelectedQuoteForDetails(null);
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
        if (selectedQuoteForDetails?.quote?._id === quoteId) {
          setSelectedQuoteForDetails(null);
        }
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
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #551E43; padding-bottom: 16px; margin-bottom: 24px; }
    .brand { font-size: 24px; font-weight: 900; color: #551E43; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; color: #64748b; font-weight: 600; margin-top: 2px; }
    .inv-info { text-align: right; }
    .inv-info p { margin: 2px 0; font-size: 12px; color: #64748b; }
    .inv-info .inv-no { font-size: 16px; font-weight: 800; color: #0f172a; }
    .section-title { font-size: 11px; font-weight: 800; color: #551E43; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
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

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-transparent">
        <div className="w-16 h-16 rounded-full bg-[#F3EBF9] text-[#7A2A70] flex items-center justify-center mb-4 shadow-sm">
          <Icon name="user" size="lg" />
        </div>
        <h2 
          className="text-2xl font-bold text-[#401332] mb-2"
          style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
        >
          Please Log In
        </h2>
        <p className="text-sm text-[#7A6876] mb-6 max-w-sm">
          You must be logged in to view your quotes, inquiries, and confirmed bookings.
        </p>
        <Button onClick={() => navigate('/login')} className="bg-[#551E43] hover:bg-[#401332] text-white">
          Log In
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-transparent">
        <div className="w-10 h-10 border-4 border-[#551E43] border-t-transparent animate-spin rounded-full mb-3"></div>
        <p className="text-xs font-semibold text-[#7A6876]">Loading your wedding bookings & quotes...</p>
      </div>
    );
  }

  // VIEW 1: Master-Detail "Quotation Details" View matching Screenshot 3 Right
  if (selectedQuoteForDetails) {
    const { quote, inquiry } = selectedQuoteForDetails;
    const vendorName = quote?.vendorId?.businessName || inquiry?.vendorId?.businessName || inquiry?.vendorName || 'Wedding Vendor';
    const location = inquiry?.eventLocation || quote?.vendorId?.city || inquiry?.vendorId?.city || 'Indore';
    const totalAmount = Number(quote?.totalAmount || 0);
    const advanceAmount = Number(quote?.advancePaymentAmount || 0);
    const eventDate = inquiry?.eventDate || quote?.eventDate;

    return (
      <div className="min-h-screen pb-32 px-4 sm:px-6 pt-3 max-w-2xl mx-auto space-y-4 bg-transparent animate-in fade-in duration-200">
        {/* Top Back Row */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedQuoteForDetails(null)}
            className="w-10 h-10 rounded-full bg-white border border-[#F2E5EC] shadow-sm flex items-center justify-center text-[#401332] active:scale-95 transition-all hover:bg-[#FAF6F8] cursor-pointer shrink-0"
            aria-label="Back to quotes"
          >
            <Icon name="chevronLeft" size="sm" />
          </button>
          <h1 
            className="text-2xl sm:text-3xl font-bold text-[#401332]"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            Quotation Details
          </h1>
        </div>

        {/* Status & Received Date Header */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#F3EBF9] text-[#7A2A70] border border-[#E9D6F0]">
            QUOTATION RECEIVED
          </span>
          <span className="text-xs text-[#8A7987]">
            {quote?.createdAt ? `Received on ${new Date(quote.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
          </span>
        </div>

        {/* Vendor Header Card */}
        <div className="flex items-center gap-3.5 py-1">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-[#FAF6F0] border border-[#F2E5EC] shadow-xs flex items-center justify-center shrink-0">
            {quote?.vendorId?.images?.[0] || quote?.vendorId?.avatar ? (
              <img 
                src={quote?.vendorId?.images?.[0] || quote?.vendorId?.avatar} 
                alt={vendorName} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-[#F3EBF9] text-[#7A2A70] flex items-center justify-center font-bold text-sm">
                {vendorName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h2 
              className="text-xl font-bold text-[#2E1026] leading-tight"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              {vendorName}
            </h2>
            <p className="text-xs text-[#7A6876] flex items-center gap-1 mt-0.5">
              <Icon name="location" size="xs" /> {location}
            </p>
          </div>
        </div>

        {/* Event Date Panel */}
        <div className="bg-[#F4F5F8] rounded-2xl p-4 flex items-center gap-3 border border-[#EBECEF]">
          <div className="w-10 h-10 rounded-xl bg-white text-[#7A2A70] flex items-center justify-center shadow-xs shrink-0">
            <Icon name="calendar" size="sm" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-[#8A7987] tracking-wider">Event Date</p>
            <p className="text-sm font-bold text-[#2E1026] mt-0.5">
              {eventDate ? new Date(eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date to be confirmed'}
            </p>
          </div>
        </div>

        {/* Your Requirements Panel */}
        {inquiry?.message && (
          <div className="bg-[#F4F5F8] rounded-2xl p-4 border border-[#EBECEF] space-y-2">
            <div className="flex items-center gap-2 text-[#7A2A70]">
              <Icon name="fileText" size="xs" />
              <span className="text-[10px] font-black uppercase tracking-wider text-[#8A7987]">Your Requirements</span>
            </div>
            <p className="text-xs sm:text-sm text-[#4A3D47] leading-relaxed">
              "{inquiry.message}"
            </p>
            {inquiry.guestCount > 0 && (
              <p className="text-xs font-semibold text-[#7A6876] flex items-center gap-1.5 pt-1">
                <span>👥</span> {inquiry.guestCount} Guests
              </p>
            )}
          </div>
        )}

        {/* Official Vendor Quotation Section */}
        <div className="space-y-3 pt-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#551E43]">
              Official Vendor Quotation
            </h3>
            <p className="text-[11px] text-[#7A6876] mt-0.5">
              Status: <span className="font-semibold text-[#2E1026]">{quote?.status || 'Sent'}</span>
            </p>
          </div>

          <div className="text-3xl sm:text-4xl font-black text-[#047857] tracking-tight">
            ₹{totalAmount.toLocaleString('en-IN')}
          </div>

          <button
            type="button"
            onClick={() => setSelectedQuoteForModal(quote)}
            className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#E5D5DC] text-[#2E1026] text-xs font-bold flex items-center justify-center gap-2 shadow-xs hover:bg-[#FAF6F8] transition-all cursor-pointer"
          >
            <span>☆</span>
            <span>View Official Quotation</span>
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
            className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#E5D5DC] text-[#2E1026] text-xs font-bold flex items-center justify-center gap-2 shadow-xs hover:bg-[#FAF6F8] transition-all cursor-pointer"
          >
            <Icon name="download" size="xs" />
            <span>Download PDF</span>
          </button>

          {advanceAmount > 0 && (
            <div className="bg-[#FEF3C7] text-[#B45309] rounded-xl p-3 text-xs font-bold flex items-center gap-2 border border-[#FDE68A]">
              <span>⚠️</span>
              <span>Advance Required: ₹{advanceAmount.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>

        {/* Package Details Section */}
        <div className="bg-white rounded-2xl p-5 border border-[#F2E5EC] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F2E5EC]">
            <span className="text-sm font-bold text-[#2E1026]">Package Details</span>
            <span className="text-sm font-black text-[#2E1026]">
              ₹{totalAmount.toLocaleString('en-IN')}
            </span>
          </div>

          {quote?.items && quote.items.length > 0 ? (
            <div className="space-y-3">
              {quote.items.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-baseline text-xs sm:text-sm font-bold text-[#2E1026]">
                    <span>{item.service} {item.quantity > 1 ? `(x${item.quantity})` : ''}</span>
                    <span>₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-[#7A6876] leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-bold text-[#2E1026]">
                {quote?.packageTitle || 'Wedding Package'}
              </p>
              <p className="text-xs text-[#7A6876] leading-relaxed">
                {quote?.description || 'Full coverage, edited deliverables, and professional service as per quotation.'}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons: Accept / Decline */}
        {quote?.status === 'Sent' || quote?.status === 'Pending' ? (
          <div className="space-y-2.5 pt-2">
            <button
              disabled={actionLoading === quote._id}
              onClick={() => handleAcceptQuote(quote)}
              className="w-full py-3.5 px-6 rounded-xl bg-[#047857] hover:bg-[#065F46] active:scale-[0.99] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              {actionLoading === quote._id ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
              ) : (
                <>
                  <Icon name="check" size="xs" color="white" />
                  <span>
                    {advanceAmount > 0
                      ? `Accept & Pay Advance (₹${advanceAmount.toLocaleString('en-IN')})`
                      : 'Accept Quote'}
                  </span>
                </>
              )}
            </button>

            <button
              disabled={actionLoading === quote._id}
              onClick={() => handleRejectQuote(quote)}
              className="w-full py-3 px-6 rounded-xl bg-white border border-[#401332] text-[#401332] hover:bg-[#FAF6F8] active:scale-[0.99] text-sm font-bold flex items-center justify-center transition-all cursor-pointer"
            >
              Decline Quote
            </button>
          </div>
        ) : quote?.status === 'Accepted' ? (
          <div className="p-4 rounded-2xl bg-[#DCFCE7] border border-[#86EFAC] text-[#15803D] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <Icon name="check" size="sm" />
              <span>Quote Accepted — Booking Created!</span>
            </div>
            <button
              onClick={() => {
                setSelectedQuoteForDetails(null);
                setActiveTab('bookings');
              }}
              className="px-3 py-1.5 rounded-xl bg-[#15803D] text-white text-xs font-bold"
            >
              View in Bookings
            </button>
          </div>
        ) : null}

        {/* Need Help Card */}
        <div className="bg-white rounded-2xl p-4 border border-[#F2E5EC] shadow-sm flex items-center gap-3.5 mt-4">
          <div className="w-10 h-10 rounded-full bg-[#F3EBF9] text-[#7A2A70] flex items-center justify-center shrink-0">
            <Icon name="phone" size="xs" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#551E43]">Need help?</h4>
            <p className="text-[11px] text-[#7A6876] mt-0.5 leading-tight">
              Our team is here to assist you with any queries regarding this quotation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // VIEW 2: Main My Bookings & Quotes Layout matching Screenshot 2 & Screenshot 3 Left
  return (
    <div className="min-h-screen pb-32 px-4 sm:px-6 pt-3 max-w-2xl mx-auto space-y-5 bg-transparent">
      {/* Page Heading & Refresh Button matching Screenshots */}
      <div className="space-y-3">
        <div>
          <h1 
            className="text-2xl sm:text-3xl font-bold text-[#401332] leading-tight"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            My Bookings & Quotes
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6876] mt-1 font-medium">
            Real-time inquiries, official vendor quotations, and confirmed events.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E5D5DC] text-[#401332] font-semibold text-xs flex items-center gap-1.5 shadow-xs hover:bg-[#FAF6F8] transition-all cursor-pointer active:scale-95"
        >
          <Icon name="refresh" size="xs" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="font-bold underline text-xs cursor-pointer">Retry</button>
        </div>
      )}

      {/* Main Tabs matching Screenshot 2 & Screenshot 3 Left */}
      <div className="flex border-b border-[#E8DCD2] space-x-6 sm:space-x-8">
        <button
          onClick={() => setActiveTab('quotes')}
          className={`pb-2.5 text-xs sm:text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === 'quotes' ? 'text-[#401332]' : 'text-[#7A6876] hover:text-[#401332]'
          }`}
        >
          Quotes & Inquiries ({inquiries.length})
          {activeTab === 'quotes' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5B1645] rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-2.5 text-xs sm:text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === 'bookings' ? 'text-[#401332]' : 'text-[#7A6876] hover:text-[#401332]'
          }`}
        >
          Bookings ({bookings.length})
          {activeTab === 'bookings' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5B1645] rounded-full" />
          )}
        </button>
      </div>

      {/* TAB 1: QUOTES & INQUIRIES */}
      {activeTab === 'quotes' && (
        <div className="space-y-4">
          {/* Multi-Vendor Quotation Matrix Card matching Screenshot 3 Left */}
          {quotes.length > 0 && (
            <div className="p-4 rounded-2xl bg-white border border-[#F2E5EC] shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-[#F3EBF9] text-[#7A2A70] flex items-center justify-center shrink-0">
                  <Icon name="fileText" size="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-[#2E1026] uppercase tracking-wider">
                    MULTI-VENDOR QUOTATION MATRIX
                  </h4>
                  <p className="text-xs text-[#7A6876] mt-0.5 leading-relaxed">
                    You have {quotes.length} official quotation{quotes.length > 1 ? 's' : ''}. Compare pricing, services, terms, and date availability side-by-side.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/user/quotes/compare')}
                className="w-full mt-3 py-2.5 bg-[#551E43] hover:bg-[#401332] active:scale-[0.99] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span>☆</span>
                <span>Compare Quotes Matrix</span>
              </button>
            </div>
          )}

          {inquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-[#F2E5EC] px-6 shadow-sm">
              <div className="w-14 h-14 bg-[#F3EBF9] text-[#7A2A70] rounded-full flex items-center justify-center shadow-xs mb-3">
                <Icon name="mail" size="md" />
              </div>
              <h3 
                className="text-base font-bold text-[#401332]"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                No Inquiries Sent Yet
              </h3>
              <p className="text-xs text-[#7A6876] max-w-xs mx-auto mt-1 leading-relaxed">
                Browse verified wedding vendors, compare portfolios, and request custom quotations.
              </p>
              <button 
                className="mt-4 px-6 py-2.5 rounded-xl bg-[#551E43] text-white text-xs font-bold cursor-pointer hover:bg-[#401332]"
                onClick={() => navigate('/user/vendors')}
              >
                Explore Vendors
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {inquiries.map((inquiry) => {
                const quote = findQuoteForLead(inquiry._id);
                const vendorName = inquiry.vendorId?.businessName || inquiry.vendorName || 'Wedding Vendor';
                const location = inquiry.eventLocation || inquiry.vendorId?.city || 'Indore';
                const hasQuote = Boolean(quote);

                return (
                  <div
                    key={inquiry._id}
                    onClick={() => {
                      if (hasQuote) {
                        setSelectedQuoteForDetails({ quote, inquiry });
                      }
                    }}
                    className={`p-5 rounded-2xl bg-white border border-[#F2E5EC] shadow-sm transition-all relative overflow-hidden group ${
                      hasQuote ? 'cursor-pointer hover:shadow-md' : ''
                    }`}
                  >
                    {/* Status Badge & Chevron matching Screenshot 3 Left */}
                    <div className="flex items-center justify-between gap-2">
                      {hasQuote ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#F3EBF9] text-[#7A2A70]">
                          QUOTATION RECEIVED
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FEF3C7] text-[#B45309] flex items-center gap-1">
                          <span>⭐</span>
                          <span>INQUIRY SENT</span>
                        </span>
                      )}

                      {hasQuote && (
                        <div className="text-[#7A6876] group-hover:translate-x-0.5 transition-transform">
                          <Icon name="chevronRight" size="sm" />
                        </div>
                      )}
                    </div>

                    {/* Vendor Name & Location */}
                    <h3 
                      className="text-xl font-bold text-[#2E1026] mt-3 leading-tight"
                      style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                    >
                      {vendorName}
                    </h3>
                    <p className="text-xs text-[#7A6876] flex items-center gap-1.5 mt-1 font-medium">
                      <Icon name="location" size="xs" /> {location}
                    </p>

                    {/* Event Date Panel */}
                    <div className="bg-[#F4F5F8] rounded-xl p-3 flex items-center justify-between mt-3 border border-[#EBECEF]">
                      <div>
                        <p className="text-[10px] font-black uppercase text-[#8A7987] tracking-wider">EVENT DATE</p>
                        <p className="text-sm font-bold text-[#2E1026] mt-0.5">
                          {inquiry.eventDate ? new Date(inquiry.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
                        </p>
                      </div>
                      <div className="text-[#7A6876]">
                        <Icon name="calendar" size="sm" />
                      </div>
                    </div>

                    {/* Quote Amount & Advance Required Badge */}
                    {hasQuote && (
                      <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="text-[10px] font-black uppercase text-[#8A7987] tracking-wider">QUOTE AMOUNT</p>
                          <p className="text-lg font-black text-[#2E1026] mt-0.5">
                            ₹{(quote.totalAmount || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                        {(Number(quote.advancePaymentAmount) || 0) > 0 && (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                            Advance Required: ₹{Number(quote.advancePaymentAmount).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Your Requirements Panel */}
                    <div className="bg-[#F9FAFB] rounded-xl p-3.5 mt-3 border border-[#F0EDF2] space-y-1.5">
                      <p className="text-[10px] font-black text-[#8A7987] uppercase tracking-wider">YOUR REQUIREMENTS</p>
                      <p className="text-xs text-[#5C4A57] leading-relaxed">
                        "{inquiry.message}"
                      </p>
                      {inquiry.guestCount > 0 && (
                        <p className="text-xs text-[#7A6876] font-semibold flex items-center gap-1 pt-1">
                          <span>👥</span> {inquiry.guestCount} Guests
                        </p>
                      )}
                    </div>

                    {/* Informational Weather Advisory */}
                    {inquiry.eventDate && (
                      <div className="mt-3">
                        <WeatherForecastCard
                          eventDate={inquiry.eventDate}
                          location={inquiry.eventLocation || inquiry.vendorId?.city}
                          venueType={inquiry.venueType || 'Not Specified'}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CONFIRMED BOOKINGS matching Screenshot 2 */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-[#F2E5EC] px-6 shadow-sm">
              <div className="w-14 h-14 bg-[#F3EBF9] text-[#7A2A70] rounded-full flex items-center justify-center shadow-xs mb-3">
                <Icon name="calendar" size="md" />
              </div>
              <h3 
                className="text-base font-bold text-[#401332]"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                No Confirmed Bookings Yet
              </h3>
              <p className="text-xs text-[#7A6876] max-w-xs mx-auto mt-1 leading-relaxed">
                When you accept an official quotation from a vendor, your confirmed booking and payment ledger will appear here.
              </p>
              <button 
                className="mt-4 px-6 py-2.5 rounded-xl bg-[#551E43] text-white text-xs font-bold cursor-pointer hover:bg-[#401332]"
                onClick={() => setActiveTab('quotes')}
              >
                View Quotes
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const vendorName = booking.vendorId?.businessName || 'Rahul Photography';
                const location = booking.location || booking.vendorId?.city || 'Sayaji Hotel, Indore';
                const totalAmount = Number(booking.packageTotal ?? booking.totalPrice ?? 0);
                const paidAmount = Number(booking.paidAmount ?? 0);
                const totalRefunded = Number(booking.totalRefunded ?? booking.refundAmount ?? 0);
                const outstanding = Number(booking.outstandingBalance ?? Math.max(0, totalAmount - paidAmount));
                const isPaid = booking.paymentStatus === 'Paid' || (totalAmount > 0 && paidAmount >= totalAmount && outstanding === 0);
                const isCancelled = booking.status === 'Cancelled';
                const isEligibleForReview = eligibleReviewIds.has(booking._id.toString()) || booking.status === 'Completed';
                const hasReceipt = paidAmount > 0 || isPaid;

                return (
                  <div
                    key={booking._id}
                    className="p-5 rounded-2xl bg-white border border-[#F2E5EC] shadow-sm relative overflow-hidden"
                  >
                    {/* Top Badges Row matching Screenshot 2 */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#DCFCE7] text-[#15803D]">
                          {booking.status === 'Confirmed' ? 'CONFIRMED' : (booking.status || 'CONFIRMED').toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isPaid ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEF3C7] text-[#B45309]'
                        }`}>
                          PAYMENT: {isPaid ? 'PAID' : (booking.paymentStatus || 'PENDING').toUpperCase()}
                        </span>
                      </div>

                      <div className="text-slate-400">
                        <Icon name="dots" size="xs" />
                      </div>
                    </div>

                    {/* Vendor Name & Location */}
                    <h3 
                      className="text-xl sm:text-2xl font-bold text-[#2E1026] mt-3 leading-tight"
                      style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                    >
                      {vendorName}
                    </h3>
                    <p className="text-xs text-[#7A6876] flex items-center gap-1 mt-1 font-medium">
                      <Icon name="location" size="xs" /> {location}
                    </p>

                    {/* Event Date Panel */}
                    <div className="bg-[#F4F5F8] rounded-xl p-3.5 flex items-center justify-between mt-3 border border-[#EBECEF]">
                      <div>
                        <p className="text-[10px] font-black uppercase text-[#8A7987] tracking-wider">EVENT DATE</p>
                        <p className="text-sm font-bold text-[#2E1026] mt-0.5">
                          {booking.eventDate ? new Date(booking.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
                        </p>
                      </div>
                      <div className="text-[#7A6876]">
                        <Icon name="calendar" size="sm" />
                      </div>
                    </div>

                    {/* 3-Column Financial Transparency Grid matching Screenshot 2 */}
                    <div className="grid grid-cols-3 divide-x divide-[#E5E7EB] bg-[#F9FAFB] rounded-xl p-3.5 mt-3 border border-[#F0EDF2] text-center">
                      <div>
                        <span className="text-[10px] font-black text-[#8A7987] uppercase tracking-wider block">
                          PACKAGE TOTAL
                        </span>
                        <span className="text-sm sm:text-base font-black text-[#2E1026] mt-0.5 block">
                          ₹{totalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-[#8A7987] uppercase tracking-wider block">
                          PAID TO DATE
                        </span>
                        <span className="text-sm sm:text-base font-black text-[#15803D] mt-0.5 block">
                          ₹{paidAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-[#8A7987] uppercase tracking-wider block">
                          BALANCE DUE
                        </span>
                        <span className={`text-sm sm:text-base font-black mt-0.5 block ${
                          outstanding === 0 ? 'text-[#15803D]' : 'text-[#BE185D]'
                        }`}>
                          ₹{outstanding.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Booked Services Panel matching Screenshot 2 */}
                    <div className="bg-[#F9FAFB] rounded-xl p-3.5 mt-3 border border-[#F0EDF2]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-[#8A7987] uppercase tracking-wider">
                          BOOKED SERVICES
                        </span>
                        <span className="text-xs font-bold text-[#8A7987]">
                          {(booking.services && booking.services.length) || 0}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {(booking.services && booking.services.length > 0 ? booking.services : ['Candid & Cinematic Wedding Photography']).map((srv, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-2.5 text-xs font-semibold text-[#2E1026] border border-[#F0EDF2]">
                            {srv}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions Row matching Screenshot 2 */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-3">
                      {/* View Details & Ledger button */}
                      <button
                        onClick={() => setSelectedBookingDetail(booking)}
                        className="px-4 py-2 rounded-xl border border-[#9A3B66] text-[#7A1C43] hover:bg-[#FAF6F8] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>☆</span>
                        <span>View Details & Ledger</span>
                      </button>

                      {hasReceipt && (
                        <button
                          onClick={() => handleDownloadReceipt(booking)}
                          disabled={receiptLoading}
                          className="px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Icon name="download" size="xs" />
                          <span>{receiptLoading ? 'Generating...' : 'Receipt'}</span>
                        </button>
                      )}

                      {!isPaid && !isCancelled && outstanding > 0 && (
                        <button
                          onClick={() => handlePayNow(booking)}
                          className="px-4 py-2 rounded-xl bg-[#551E43] hover:bg-[#401332] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Icon name="creditCard" size="xs" color="white" />
                          <span>Pay ₹{outstanding.toLocaleString('en-IN')}</span>
                        </button>
                      )}

                      {!isCancelled && isEligibleForReview && (
                        <button
                          onClick={() => navigate('/user/account/reviews', { state: { bookingId: booking._id } })}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>★</span>
                          <span>Review</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Quote Acceptance Breakdown Modal */}
      {quoteToAccept && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#F2E5EC] animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4 border-b border-[#F2E5EC] pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#7A2A70] bg-[#F3EBF9] px-2.5 py-1 rounded-full">
                  Official Quotation
                </span>
                <h3 
                  className="text-xl font-bold text-[#401332] mt-1.5"
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                >
                  Review & Accept Quotation
                </h3>
                <p className="text-xs text-[#7A6876] mt-0.5">
                  Vendor: <span className="font-bold text-[#2E1026]">{quoteToAccept.vendorId?.businessName || 'Wedding Vendor'}</span>
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

            <div className="bg-[#FAF6F0] rounded-xl p-4 border border-[#F2E5EC] mb-4 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[#7A6876]">Total Contract Value:</span>
                <span className="text-base font-black text-[#2E1026]">
                  ₹{(quoteToAccept.totalAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-y border-[#E8DCD2]">
                <div>
                  <span className="font-bold text-[#2E1026] block">Amount Due Now (Advance):</span>
                  <span className="text-[10px] text-[#7A6876]">
                    {(Number(quoteToAccept.advancePaymentAmount) || 0) > 0
                      ? `Required to lock date (${quoteToAccept.advancePaymentPercent ? `${quoteToAccept.advancePaymentPercent}%` : 'Advance'})`
                      : 'No upfront advance required'}
                  </span>
                </div>
                <span className="text-base font-black text-[#B45309]">
                  ₹{(Number(quoteToAccept.advancePaymentAmount) || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#7A6876]">Remaining Balance:</span>
                <span className="text-base font-black text-[#2E1026]">
                  ₹{Math.max(0, (quoteToAccept.totalAmount || 0) - (Number(quoteToAccept.advancePaymentAmount) || 0)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setQuoteToAccept(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={!!actionLoading}
                onClick={confirmAcceptQuote}
                className="px-5 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                ) : (
                  <Icon name="check" size="xs" color="white" />
                )}
                <span>
                  {(Number(quoteToAccept.advancePaymentAmount) || 0) > 0
                    ? `Accept & Pay Advance (₹${Number(quoteToAccept.advancePaymentAmount).toLocaleString('en-IN')})`
                    : 'Accept Quote & Submit Booking'}
                </span>
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

      {/* Cancel Booking Form Modal */}
      {bookingToCancel && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#F2E5EC] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Icon name="close" size="sm" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2E1026]">Cancel Booking</h3>
                <p className="text-xs text-[#7A6876]">Vendor: {bookingToCancel.vendorId?.businessName || 'Wedding Vendor'}</p>
              </div>
            </div>

            <p className="text-xs text-[#5C4A57] mb-3">
              Please share a reason for cancelling this booking. This will help the vendor and our support team assist you.
            </p>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., Change of wedding date, found another service..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 mb-4 resize-none"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={actionLoading === bookingToCancel._id}
                onClick={() => setBookingToCancel(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={actionLoading === bookingToCancel._id || !cancelReason.trim()}
                onClick={confirmCancelBooking}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
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
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#F2E5EC] p-6 space-y-5 my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#F2E5EC]">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#DCFCE7] text-[#15803D]">
                    {selectedBookingDetail.status || 'CONFIRMED'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FEF3C7] text-[#B45309]">
                    Payment: {selectedBookingDetail.paymentStatus || 'Pending'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F3EBF9] text-[#7A2A70] border border-[#E9D6F0]">
                    🛡️ Escrow Protected
                  </span>
                </div>
                <h2 
                  className="text-xl sm:text-2xl font-bold text-[#401332] leading-tight"
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                >
                  {selectedBookingDetail.vendorId?.businessName || 'Wedding Vendor'}
                </h2>
                <p className="text-xs text-[#7A6876] mt-0.5">
                  Category: <strong className="text-[#2E1026]">{selectedBookingDetail.vendorId?.category || 'Wedding Service'}</strong> · Location: <strong className="text-[#2E1026]">{selectedBookingDetail.location || selectedBookingDetail.vendorId?.city || 'India'}</strong>
                </p>
              </div>

              <button
                onClick={() => setSelectedBookingDetail(null)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Financial Ledger & Money Transparency Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#F2E5EC]">
                <p className="text-[10px] font-black text-[#8A7987] uppercase tracking-wider">Total Agreed Package</p>
                <p className="text-xl font-black text-[#2E1026] mt-1">
                  ₹{Number(selectedBookingDetail.packageTotal ?? selectedBookingDetail.totalPrice ?? 0).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#DCFCE7]/60 border border-[#86EFAC]">
                <p className="text-[10px] font-black text-[#15803D] uppercase tracking-wider">Verified Paid to Date</p>
                <p className="text-xl font-black text-[#15803D] mt-1">
                  ₹{Number(selectedBookingDetail.paidAmount ?? 0).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-pink-50 border border-pink-100">
                <p className="text-[10px] font-black text-[#BE185D] uppercase tracking-wider">Outstanding Balance</p>
                <p className="text-xl font-black text-[#BE185D] mt-1">
                  ₹{Number(selectedBookingDetail.outstandingBalance ?? 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Event Logistics */}
            <div className="bg-[#F4F5F8] rounded-xl p-4 border border-[#EBECEF] space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#551E43]">Event Logistics</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[#8A7987] block">Event Date</span>
                  <span className="font-bold text-[#2E1026]">
                    {selectedBookingDetail.eventDate ? new Date(selectedBookingDetail.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8A7987] block">Location</span>
                  <span className="font-bold text-[#2E1026]">
                    {selectedBookingDetail.location || selectedBookingDetail.vendorId?.city || 'TBD'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8A7987] block">Booking ID</span>
                  <span className="font-mono font-bold text-[#2E1026]">
                    {selectedBookingDetail._id?.slice(-8).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F2E5EC]">
              <button
                type="button"
                onClick={() => setSelectedBookingDetail(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                Close
              </button>

              {(selectedBookingDetail.paidAmount > 0 || selectedBookingDetail.paymentStatus === 'Paid') && (
                <button
                  type="button"
                  disabled={receiptLoading}
                  onClick={() => handleDownloadReceipt(selectedBookingDetail)}
                  className="px-4 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Icon name="download" size="xs" />
                  <span>{receiptLoading ? 'Downloading...' : 'Receipt'}</span>
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
                  className="px-5 py-2 bg-[#551E43] hover:bg-[#401332] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Icon name="creditCard" size="xs" color="white" />
                  <span>Pay Balance ₹{Number(selectedBookingDetail.outstandingBalance).toLocaleString('en-IN')}</span>
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
