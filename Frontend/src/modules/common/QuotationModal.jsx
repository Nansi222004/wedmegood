import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import { userApi } from '../../services/userApi';
import { vendorApi } from '../vendor/vendorApi';
import { toast } from '../../components/ui/Toast';

const QuotationModal = ({
  quote,
  isOpen,
  onClose,
  isVendor = false,
  onAccept,
  onReject,
  token
}) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Lock background scroll and listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !quote) return null;

  const quoteNum = quote.quotationNumber || `QT-${(quote._id || '').slice(-6).toUpperCase()}`;
  const vendor = quote.vendorId || {};
  const lead = quote.leadId || {};
  const customer = quote.userId || {};

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      if (isVendor) {
        await vendorApi.downloadQuotePdf(quote._id, token || localStorage.getItem('vendorToken'));
      } else {
        await userApi.downloadQuotePdf(quote._id);
      }
      toast.success('Quotation PDF downloaded successfully');
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error(err.message || 'Failed to download PDF quotation');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const statusColors = {
    'Draft': 'bg-slate-100 text-slate-700 border-slate-200',
    'Pending': 'bg-amber-100 text-amber-800 border-amber-200',
    'Sent': 'bg-blue-100 text-blue-800 border-blue-200',
    'Accepted': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Rejected': 'bg-rose-100 text-rose-800 border-rose-200',
    'Expired': 'bg-slate-100 text-slate-500 border-slate-200'
  };

  const items = Array.isArray(quote.items) && quote.items.length > 0 ? quote.items : [
    { service: 'Wedding Service Package', description: quote.notes || '', price: quote.totalAmount, quantity: 1, amount: quote.totalAmount }
  ];

  const totalAmount = Number(quote.totalAmount || 0);
  const advanceAmount = Number(quote.advancePaymentAmount || 0);
  const remainingBalance = Math.max(0, totalAmount - advanceAmount);

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* Clickable Backdrop overlay covering entire window */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity print:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Box Centered in Viewport */}
      <div 
        className="relative z-10 bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 print:border-none print:shadow-none print:max-w-none print:max-h-none print:overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Topbar Actions (hidden on print) */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/90 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-[#E91E63] shrink-0">
              <Icon name="fileText" size="sm" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Official Quotation View</h2>
              <p className="text-[11px] text-slate-500 font-mono">{quoteNum}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="text-xs flex items-center gap-1.5 rounded-xl cursor-pointer"
            >
              <Icon name="printer" size="xs" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={downloadingPdf}
              onClick={handleDownloadPdf}
              className="text-xs flex items-center gap-1.5 rounded-xl border-[#E91E63] text-[#E91E63] hover:bg-rose-50 cursor-pointer"
            >
              <Icon name="download" size="xs" />
              <span>{downloadingPdf ? 'Exporting...' : 'PDF'}</span>
            </Button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
              title="Close quotation"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Quotation Document Container */}
        <div className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto print:overflow-visible print:p-0">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#E91E63] tracking-tight">UTSAVO</h1>
              <p className="text-xs text-slate-500 mt-0.5">Plan Every Wedding Moment, Book Every Perfect Vendor.</p>
              <div className="mt-3 text-xs text-slate-600">
                <p className="font-bold text-slate-800">{vendor.businessName || vendor.fullName || 'Wedding Vendor'}</p>
                <p>{vendor.city || 'India'}</p>
                <p className="text-slate-400">Verified Platform Partner</p>
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColors[quote.status] || 'bg-slate-100 text-slate-700'}`}>
                {quote.status}
              </span>
              <p className="text-sm font-bold text-slate-800 font-mono">{quoteNum}</p>
              <p className="text-xs text-slate-500">
                Date: {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
              </p>
              <p className="text-xs text-slate-500">
                Valid Until: {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '14 Days'}
              </p>
            </div>
          </div>

          {/* Client & Event Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 text-xs">
            <div>
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Client Details</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">
                {customer.name || customer.fullName || lead.customerName || 'Valued Customer'}
              </p>
              <p className="text-slate-600 mt-1">Location: {lead.eventLocation || customer.city || 'To be confirmed'}</p>
              {lead.guestCount > 0 && <p className="text-slate-600">Guest Count: {lead.guestCount} guests</p>}
            </div>

            <div>
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Event Schedule</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">
                {lead.eventDate ? new Date(lead.eventDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Date upon agreement'}
              </p>
              <p className="text-slate-600 mt-1">Service Type: {lead.category || 'Wedding Service'}</p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Service & Description</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800">{item.service || 'Service Item'}</p>
                      {item.description && <p className="text-slate-500 mt-0.5">{item.description}</p>}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700">₹{(Number(item.price) || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-center font-medium text-slate-700">{item.quantity || 1}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      ₹{(Number(item.amount) || ((Number(item.price) || 0) * (Number(item.quantity) || 1))).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pt-4 border-t border-slate-200">
            {/* Terms & Payment Conditions */}
            <div className="sm:max-w-xs space-y-3 text-xs text-slate-600">
              <div>
                <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block mb-1">Payment & Cancellation Terms</span>
                <p className="text-slate-700 leading-relaxed">{quote.terms || 'Advance booking deposit required to lock dates. Balance payable upon milestone completion.'}</p>
              </div>

              {quote.cancellationTerms && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block mb-1">Cancellation Policy</span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{quote.cancellationTerms}</p>
                </div>
              )}

              {/* Milestone Terms */}
              {Array.isArray(quote.milestonePaymentTerms) && quote.milestonePaymentTerms.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block mb-1.5">Milestone Schedule</span>
                  <div className="space-y-1">
                    {quote.milestonePaymentTerms.map((m, mIdx) => (
                      <div key={mIdx} className="flex justify-between text-[11px] bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <span className="font-semibold text-slate-700">{m.stage || `Stage ${mIdx + 1}`} ({m.percentage}%)</span>
                        <span className="font-bold text-slate-900">₹{Number(m.amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Financial Summary Card */}
            <div className="sm:w-72 bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-medium text-slate-800">
                  ₹{(Number(quote.subtotal) || totalAmount).toLocaleString('en-IN')}
                </span>
              </div>

              {(Number(quote.discountAmount) || 0) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount {quote.discountPercent ? `(${quote.discountPercent}%)` : ''}:</span>
                  <span className="font-medium">-₹{(Number(quote.discountAmount) || 0).toLocaleString('en-IN')}</span>
                </div>
              )}

              {(Number(quote.taxAmount) || 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax {quote.taxRatePercent ? `(${quote.taxRatePercent}%)` : ''}:</span>
                  <span className="font-medium text-slate-800">+₹{(Number(quote.taxAmount) || 0).toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                <span>Total Contract Value:</span>
                <span className="text-[#E91E63]">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>

              {advanceAmount > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>Advance Required:</span>
                    <span>₹{advanceAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-bold">
                    <span>Remaining Balance:</span>
                    <span className="text-slate-900">₹{remainingBalance.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons for Customer (Accept / Decline) */}
          {!isVendor && ['Sent', 'Pending'].includes(quote.status) && (
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3 print:hidden">
              <Button
                variant="outline"
                disabled={isProcessingAction}
                onClick={async () => {
                  if (onReject) {
                    setIsProcessingAction(true);
                    await onReject(quote);
                    setIsProcessingAction(false);
                    onClose();
                  }
                }}
                className="w-full sm:w-auto text-xs text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
              >
                Decline Quote
              </Button>
              <Button
                disabled={isProcessingAction}
                onClick={async () => {
                  if (onAccept) {
                    setIsProcessingAction(true);
                    await onAccept(quote);
                    setIsProcessingAction(false);
                    onClose();
                  }
                }}
                className="w-full sm:w-auto text-xs font-bold bg-[#E91E63] hover:bg-[#D81B60] cursor-pointer"
              >
                Accept & Proceed to Booking
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QuotationModal;
