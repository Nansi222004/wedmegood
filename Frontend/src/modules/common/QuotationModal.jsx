import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import { userApi } from '../../services/userApi';
import { vendorApi } from '../vendor/vendorApi';
import { toast } from '../../components/ui/Toast';
import { useDragToScroll } from '../../hooks/useDragToScroll';
import QuotationDocument from './QuotationDocument';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Customers may not keep copies of a quotation. A web page cannot block screenshots (the mobile app
 * can), so the sheet is hidden while the window is not in focus or Print Screen is pressed, and the
 * viewer's own name and phone are watermarked across it.
 */
function useHideWhenNotFocused(active) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (!active) return undefined;
    let timer;
    const hide = () => setHidden(true);
    const show = () => setHidden(false);
    const onVisibility = () => (document.hidden ? hide() : show());
    const onKey = (e) => {
      if (e.key === 'PrintScreen') {
        hide();
        clearTimeout(timer);
        timer = setTimeout(show, 2500);
      }
    };
    window.addEventListener('blur', hide);
    window.addEventListener('focus', show);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('keyup', onKey);
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('blur', hide);
      window.removeEventListener('focus', show);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('keyup', onKey);
      window.removeEventListener('keydown', onKey);
    };
  }, [active]);
  return hidden;
}

const QuotationModal = ({
  quote,
  isOpen,
  onClose,
  isVendor = false,
  onAccept,
  onReject,
  onRequestRevision,
  token
}) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [revisionNote, setRevisionNote] = useState(null);
  const scrollRef = useDragToScroll(isOpen);
  const { user } = useAuth();
  const protectedView = isOpen && !isVendor;
  const hidden = useHideWhenNotFocused(protectedView);
  const viewerMark = protectedView && user
    ? `${user.name || 'Utsavo user'} · ${user.phone || user.email || ''} · Utsavo · Do not share`
    : null;

  // Lock background scroll, pause Lenis, and listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      if (window.lenis && typeof window.lenis.stop === 'function') {
        window.lenis.stop();
      }
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (window.lenis && typeof window.lenis.start === 'function') {
        window.lenis.start();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen || !quote) return null;

  const quoteNum = quote.quotationNumber || `QT-${(quote._id || '').slice(-6).toUpperCase()}`;

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

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      data-lenis-prevent="true"
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
        data-lenis-prevent="true"
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
            {isVendor && (
            <>
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
            </>
            )}
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
        <div 
          ref={scrollRef}
          data-lenis-prevent="true"
          style={{ overscrollBehavior: 'contain' }}
          className={`flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar print:overflow-visible print:p-0 ${isVendor ? 'select-text' : 'select-none print:hidden'}`}
          onContextMenu={isVendor ? undefined : (e) => e.preventDefault()}
          onCopy={isVendor ? undefined : (e) => e.preventDefault()}
        >
          <div className="relative">
            <div className={hidden ? 'blur-xl transition-[filter]' : 'transition-[filter]'}>
              <QuotationDocument quote={quote} quoteNum={quoteNum} viewerMark={viewerMark} />
            </div>
            {hidden && (
              <div className="absolute inset-0 flex items-start justify-center pt-24">
                <p className="px-4 py-2 rounded-xl bg-white/95 border border-slate-200 shadow-sm text-xs font-semibold text-slate-700 text-center max-w-xs">
                  The quotation is hidden while this window is not in focus. Quotations cannot be downloaded, shared or captured.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons for Customer (Accept / Decline) */}
          {!isVendor && onRequestRevision && ['Sent', 'Pending'].includes(quote.status) && revisionNote !== null && (
            <div className="pt-4 border-t border-slate-200 space-y-2 print:hidden">
              <label className="text-xs font-bold text-slate-700 block">What would you like the vendor to change?</label>
              <textarea
                rows={3}
                maxLength={1000}
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="e.g. Please remove the photo booth and add 2 more hours of coverage"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs resize-none focus:outline-none focus:border-[#E91E63]"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRevisionNote(null)} className="text-xs cursor-pointer">Cancel</Button>
                <Button
                  disabled={isProcessingAction || revisionNote.trim().length < 3}
                  onClick={async () => {
                    setIsProcessingAction(true);
                    const ok = await onRequestRevision(quote, revisionNote.trim());
                    setIsProcessingAction(false);
                    if (ok !== false) {
                      setRevisionNote(null);
                      onClose();
                    }
                  }}
                  className="text-xs font-bold bg-[#E91E63] hover:bg-[#D81B60] cursor-pointer"
                >
                  Send to vendor
                </Button>
              </div>
            </div>
          )}

          {!isVendor && ['Sent', 'Pending'].includes(quote.status) && revisionNote === null && (
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3 print:hidden">
              {onRequestRevision && (
                <Button
                  variant="outline"
                  disabled={isProcessingAction}
                  onClick={() => setRevisionNote('')}
                  className="w-full sm:w-auto text-xs text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  Request Changes
                </Button>
              )}
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
