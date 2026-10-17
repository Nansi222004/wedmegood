import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QuotationDocument from './QuotationDocument';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Read-only quotation opened from a vendor's share link. No login, no customer contact details.
const SharedQuote = () => {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true, quote: null, error: '' });

  useEffect(() => {
    fetch(`${API_BASE_URL}/public/quotes/${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(res => {
        if (!res.success) throw new Error(res.message || 'Quotation not found');
        const q = res.data;
        setState({
          loading: false,
          error: '',
          quote: {
            ...q,
            createdAt: q.sentAt,
            vendorId: q.vendor || {},
            leadId: q.event ? { eventDate: q.event.date, category: q.event.service, eventLocation: q.event.city, guestCount: q.event.guests } : {},
            userId: {}
          }
        });
      })
      .catch(err => setState({ loading: false, quote: null, error: err.message || 'Quotation not found' }));
  }, [token]);

  const { loading, quote, error } = state;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:py-10">
      <div className="max-w-3xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="h-8 w-8 border-2 border-slate-300 border-t-[#E91E63] rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center">
            <h1 className="text-lg font-bold text-slate-900">This quotation is not available</h1>
            <p className="text-sm text-slate-500 mt-1">The link may be wrong, or the vendor has withdrawn it.</p>
            <Link to="/" className="inline-block mt-4 text-sm font-bold text-[#E91E63]">Go to Utsavo</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {quote.superseded && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
                The vendor has sent a newer version of this quotation. This one is kept for reference only.
              </div>
            )}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <QuotationDocument quote={quote} quoteNum={quote.quotationNumber} />
            </div>
            <p className="text-center text-[11px] text-slate-500">
              To accept this quotation, open it in the Utsavo app under My Quotes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedQuote;
