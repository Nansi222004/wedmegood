import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import { userApi } from '../../../services/userApi';
import { toast } from '../../../components/ui/Toast';
import QuotationModal from '../../common/QuotationModal';
import { getFriendlyErrorMessage } from '../../../utils/errorHandler';

const QuotationComparison = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [quotes, setQuotes] = useState([]);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModalQuote, setActiveModalQuote] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [availabilityMap, setAvailabilityMap] = useState({});

  useEffect(() => {
    const loadQuotes = async () => {
      try {
        setLoading(true);
        const res = await userApi.getUserQuotes();
        if (res.success && Array.isArray(res.data)) {
          setQuotes(res.data);
          // Check if initial quote IDs passed in navigation state
          const stateIds = location.state?.quoteIds;
          if (Array.isArray(stateIds) && stateIds.length > 0) {
            setSelectedQuoteIds(stateIds.slice(0, 4));
          } else if (res.data.length > 0) {
            // Default select first up to 3 quotes
            setSelectedQuoteIds(res.data.slice(0, 3).map(q => q._id));
          }
        }
      } catch (err) {
        console.error('Failed to load quotes for comparison:', err);
        toast.error('Could not load quotes for comparison');
      } finally {
        setLoading(false);
      }
    };

    loadQuotes();
  }, [location.state]);

  // Check real-time date availability for selected quotes
  useEffect(() => {
    const checkAvailabilityForQuotes = async () => {
      const selected = quotes.filter(q => selectedQuoteIds.includes(q._id));
      const newAvail = { ...availabilityMap };

      for (const q of selected) {
        const vendorId = q.vendorId?._id || q.vendorId;
        const eventDate = q.leadId?.eventDate;
        if (vendorId && eventDate && !newAvail[q._id]) {
          try {
            const dateStr = new Date(eventDate).toISOString().split('T')[0];
            const res = await userApi.getVendorAvailability(vendorId, { date: dateStr });
            if (res.success) {
              newAvail[q._id] = {
                isAvailable: res.isAvailable,
                weather: res.weather
              };
            }
          } catch (e) {
            newAvail[q._id] = { isAvailable: null };
          }
        }
      }
      setAvailabilityMap(newAvail);
    };

    if (selectedQuoteIds.length > 0 && quotes.length > 0) {
      checkAvailabilityForQuotes();
    }
  }, [selectedQuoteIds, quotes]);

  const toggleSelectQuote = (id) => {
    if (selectedQuoteIds.includes(id)) {
      if (selectedQuoteIds.length <= 2) {
        toast.info('Select at least 2 quotes to compare');
        return;
      }
      setSelectedQuoteIds(prev => prev.filter(qId => qId !== id));
    } else {
      if (selectedQuoteIds.length >= 4) {
        toast.warning('You can compare up to 4 quotes simultaneously');
        return;
      }
      setSelectedQuoteIds(prev => [...prev, id]);
    }
  };

  const handleAcceptQuote = async (quote) => {
    setActionLoading(quote._id);
    try {
      const res = await userApi.acceptQuote(quote._id);
      if (res.success) {
        const booking = res.data?.booking;
        const advanceRequired = res.data?.advancePaymentAmount ?? booking?.advancePaymentRequired ?? (Number(quote.advancePaymentAmount) || 0);

        if (advanceRequired > 0 && booking?._id) {
          toast.info(`Quote accepted! Redirecting to complete advance payment of ₹${advanceRequired.toLocaleString('en-IN')}.`);
          navigate('/user/checkout', {
            state: {
              bookingId: booking._id,
              booking,
              payableAmount: advanceRequired,
              items: [{
                id: `${booking._id}-advance`,
                name: `Advance Payment for ${quote.vendorId?.businessName || 'Wedding Vendor'}`,
                category: 'Booking Advance',
                price: `₹${advanceRequired.toLocaleString('en-IN')}`,
                quantity: 1,
                whatsappNumber: quote.vendorId?.phone || ''
              }]
            }
          });
        } else {
          toast.success(res.message || 'Quote accepted successfully! Awaiting vendor schedule confirmation.');
          navigate('/user/bookings', { state: { tab: 'bookings' } });
        }
      } else {
        throw new Error(res.message || 'Failed to accept quote');
      }
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, 'Failed to accept quote'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectQuote = async (quote) => {
    setActionLoading(quote._id);
    try {
      const res = await userApi.rejectQuote(quote._id);
      if (res.success) {
        toast.info('Quote rejected.');
        setQuotes(prev => prev.map(q => q._id === quote._id ? { ...q, status: 'Rejected' } : q));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to reject quote');
    } finally {
      setActionLoading(null);
    }
  };

  const comparedQuotes = quotes.filter(q => selectedQuoteIds.includes(q._id));

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-[#E91E63] border-t-transparent animate-spin rounded-full mb-3" />
        <p className="text-sm font-bold text-slate-500">Loading Quotation Comparison Matrix...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-6 px-3 sm:px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => navigate('/user/bookings')}
            className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 mb-2"
          >
            ← Back to Inquiries & Bookings
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Quotation Comparison Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Compare vendor proposals side-by-side to make the best decision for your event.
          </p>
        </div>

        {/* Quick Selection Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Comparing ({comparedQuotes.length}):</span>
          {quotes.map(q => {
            const isSelected = selectedQuoteIds.includes(q._id);
            const vName = q.vendorId?.businessName || 'Vendor';
            return (
              <button
                key={q._id}
                onClick={() => toggleSelectQuote(q._id)}
                className={`text-xs px-3 py-1 rounded-full font-bold transition-all border ${
                  isSelected
                    ? 'bg-[#E91E63] text-white border-[#E91E63] shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {vName}
              </button>
            );
          })}
        </div>
      </div>

      {comparedQuotes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto my-12">
          <Icon name="fileText" size="lg" className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Quotations Selected</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Select at least 2 quotes to compare services, pricing, and availability.
          </p>
          <Button size="sm" onClick={() => setSelectedQuoteIds(quotes.slice(0, 2).map(q => q._id))}>
            Select Recent Quotes
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="p-4 w-48 text-xs font-bold text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-50/90 backdrop-blur-xs">
                    Parameters
                  </th>
                  {comparedQuotes.map(quote => (
                    <th key={quote._id} className="p-4 min-w-[240px] max-w-[280px]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center overflow-hidden shrink-0">
                          {quote.vendorId?.profileImage ? (
                            <img src={quote.vendorId.profileImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Icon name="user" size="sm" className="text-[#E91E63]" />
                          )}
                        </div>
                        <div className="truncate">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {quote.vendorId?.businessName || 'Wedding Vendor'}
                          </h3>
                          <p className="text-[11px] text-slate-500">{quote.vendorId?.city || 'India'}</p>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {/* 1. Total Price */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-600 sticky left-0 bg-white">Total Package Price</td>
                  {comparedQuotes.map(q => (
                    <td key={q._id} className="p-4 font-black text-slate-900 text-base">
                      ₹{(Number(q.totalAmount) || 0).toLocaleString('en-IN')}
                      {q.taxRatePercent > 0 && (
                        <span className="block text-[10px] font-normal text-slate-400">Includes {q.taxRatePercent}% GST</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* 2. Discounts */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-600 sticky left-0 bg-white">Promotional Discount</td>
                  {comparedQuotes.map(q => (
                    <td key={q._id} className="p-4">
                      {(Number(q.discountAmount) || 0) > 0 ? (
                        <span className="text-emerald-700 font-bold">
                          -₹{(Number(q.discountAmount) || 0).toLocaleString('en-IN')} {q.discountPercent ? `(${q.discountPercent}%)` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* 3. Event Date Availability */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-600 sticky left-0 bg-white">Date Availability</td>
                  {comparedQuotes.map(q => {
                    const avail = availabilityMap[q._id];
                    return (
                      <td key={q._id} className="p-4">
                        {avail ? (
                          avail.isAvailable ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <span>✓ Available</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                              <span>✕ Busy / Conflict</span>
                            </div>
                          )
                        ) : (
                          <span className="text-slate-400 text-[11px]">Checking schedule...</span>
                        )}
                        {avail?.weather?.rainfallAlert && (
                          <span className="block text-[10px] text-amber-700 font-bold mt-1">🌧️ Rain forecast on date</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* 4. Advance Required */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-600 sticky left-0 bg-white">Advance Deposit</td>
                  {comparedQuotes.map(q => (
                    <td key={q._id} className="p-4 font-semibold text-slate-800">
                      {(Number(q.advancePaymentAmount) || 0) > 0 ? (
                        <span>₹{(Number(q.advancePaymentAmount) || 0).toLocaleString('en-IN')} {q.advancePaymentPercent ? `(${q.advancePaymentPercent}%)` : ''}</span>
                      ) : (
                        <span className="text-slate-500">₹0 (Pay on Event)</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* 5. Included Services */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-600 sticky left-0 bg-white">Included Line Items</td>
                  {comparedQuotes.map(q => (
                    <td key={q._id} className="p-4">
                      <ul className="space-y-1.5">
                        {(q.items || []).map((it, idx) => (
                          <li key={idx} className="text-slate-700">
                            <strong>• {it.service}</strong> {it.quantity > 1 ? `(x${it.quantity})` : ''}
                            {it.description && <span className="block text-[10px] text-slate-400">{it.description}</span>}
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>

                {/* 6. Rating & Reviews */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-600 sticky left-0 bg-white">Vendor Reputation</td>
                  {comparedQuotes.map(q => (
                    <td key={q._id} className="p-4">
                      <div className="flex items-center gap-1 font-bold text-slate-800">
                        <span className="text-amber-500">★</span>
                        <span>{q.vendorId?.rating || '4.8'}</span>
                        <span className="text-slate-400 font-normal">({q.vendorId?.reviewCount || 0} reviews)</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 7. Validity */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-600 sticky left-0 bg-white">Validity & Expiry</td>
                  {comparedQuotes.map(q => (
                    <td key={q._id} className="p-4 text-slate-600">
                      {q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '14 Days'}
                    </td>
                  ))}
                </tr>

                {/* 8. Actions */}
                <tr className="bg-slate-50/70">
                  <td className="p-4 font-bold text-slate-600 sticky left-0 bg-slate-50/90">Decision Actions</td>
                  {comparedQuotes.map(q => {
                    const canAccept = ['Sent', 'Pending'].includes(q.status);
                    return (
                      <td key={q._id} className="p-4 space-y-2">
                        <div className="flex flex-col gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveModalQuote(q)}
                            className="w-full text-xs rounded-xl"
                          >
                            View Official Quote
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => userApi.downloadQuotePdf(q._id)}
                            className="w-full text-xs rounded-xl text-slate-600"
                          >
                            Download PDF
                          </Button>
                          {canAccept && (
                            <Button
                              size="sm"
                              disabled={actionLoading === q._id}
                              onClick={() => handleAcceptQuote(q)}
                              className="w-full text-xs rounded-xl font-bold bg-[#E91E63] hover:bg-[#D81B60]"
                            >
                              {actionLoading === q._id ? 'Accepting...' : 'Accept Quote'}
                            </Button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for viewing single quote */}
      {activeModalQuote && (
        <QuotationModal
          quote={activeModalQuote}
          isOpen={Boolean(activeModalQuote)}
          onClose={() => setActiveModalQuote(null)}
          onAccept={handleAcceptQuote}
          onReject={handleRejectQuote}
        />
      )}
    </div>
  );
};

export default QuotationComparison;
