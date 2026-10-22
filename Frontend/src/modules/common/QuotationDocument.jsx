// The quotation sheet itself: shared by the in-app quotation modal and the public share-link page.
const fmtDate = (d, opts = { day: '2-digit', month: 'short', year: 'numeric' }) =>
  d ? new Date(d).toLocaleDateString('en-IN', opts) : null;
const rupees = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;
const lineAmount = (item) => Number(item.amount) || ((Number(item.price) || 0) * (Number(item.quantity) || 1));

const statusColors = {
  'Draft': 'bg-slate-100 text-slate-700 border-slate-200',
  'Pending': 'bg-amber-100 text-amber-800 border-amber-200',
  'Sent': 'bg-blue-100 text-blue-800 border-blue-200',
  'Revision Requested': 'bg-amber-100 text-amber-800 border-amber-200',
  'Accepted': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Rejected': 'bg-rose-100 text-rose-800 border-rose-200',
  'Superseded': 'bg-slate-100 text-slate-500 border-slate-200',
  'Expired': 'bg-slate-100 text-slate-500 border-slate-200'
};

const ItemsTable = ({ items, startAt = 1 }) => (
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
            <td className="py-3 px-3 font-bold text-slate-400">{idx + startAt}</td>
            <td className="py-3 px-3">
              <p className="font-bold text-slate-800">
                {item.service || 'Service Item'}
                {item.kind && !['Included', 'Optional extra'].includes(item.kind) && (
                  <span className="ml-1.5 align-middle px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold uppercase">{item.kind}</span>
                )}
              </p>
              {item.description && <p className="text-slate-500 mt-0.5">{item.description}</p>}
            </td>
            <td className="py-3 px-3 text-right font-medium text-slate-700">{rupees(item.price)}</td>
            <td className="py-3 px-3 text-center font-medium text-slate-700">{item.quantity || 1}{item.unit ? ` ${item.unit}` : ''}</td>
            <td className="py-3 px-3 text-right font-bold text-slate-900">{rupees(lineAmount(item))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const DETAIL_SECTIONS = [
  ['scopeIncluded', 'What is included'],
  ['exclusions', 'Not included'],
  ['customerResponsibilities', 'You will need to arrange'],
  ['setupTime', 'Setup time'],
  ['dismantleTime', 'Dismantle time'],
  ['overtimeCharges', 'Overtime charges']
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Faint diagonal text repeated across the sheet (pointer-events off so nothing underneath is blocked) */
const Watermark = ({ text, className }) => (
  <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden select-none ${className}`}>
    <div className="absolute -inset-1/2 flex flex-wrap content-start gap-x-16 gap-y-20 -rotate-[24deg]">
      {Array.from({ length: 60 }, (_, i) => (
        <span key={i} className="whitespace-nowrap">{text}</span>
      ))}
    </div>
  </div>
);

/**
 * `viewerMark` (customer view only): the viewer's name and phone, repeated faintly so a screenshot
 * can be traced back to who took it.
 */
const QuotationDocument = ({ quote, quoteNum, viewerMark }) => {
  const vendor = quote.vendorId || {};
  const lead = quote.leadId || {};
  const customer = quote.userId || {};

  const allItems = Array.isArray(quote.items) && quote.items.length > 0 ? quote.items : [
    { service: 'Wedding Service Package', description: quote.notes || '', price: quote.totalAmount, quantity: 1, amount: quote.totalAmount }
  ];
  const items = allItems.filter(it => it.kind !== 'Optional extra');
  const extras = allItems.filter(it => it.kind === 'Optional extra');
  const details = DETAIL_SECTIONS.filter(([key]) => quote[key]);
  const photos = Array.isArray(quote.referencePhotos) ? quote.referencePhotos : [];

  const totalAmount = Number(quote.totalAmount || 0);
  const advanceAmount = Number(quote.advancePaymentAmount || 0);
  const remainingBalance = Math.max(0, totalAmount - advanceAmount);
  // Accept and pay the advance within 7 days of the quotation; after that a new quotation is shared
  const issuedAt = quote.sentAt || quote.createdAt;
  const payBy = quote.validUntil || (issuedAt ? new Date(new Date(issuedAt).getTime() + 7 * DAY_MS) : null);
  const payByText = fmtDate(payBy, { day: 'numeric', month: 'short', year: 'numeric' });
  const noCancellation = quote.cancellationAllowed === false;

  return (
    <div className="relative space-y-6">
      <Watermark
        className="text-[22px] font-black uppercase text-[#E91E63]/[0.06] print:text-[#E91E63]/10"
        text={`Note · Accept & pay advance within 7 days${payByText ? ` (by ${payByText})` : ''} · New quotation after that`}
      />
      {viewerMark && <Watermark className="text-[11px] font-semibold text-slate-900/[0.07]" text={viewerMark} />}
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
          {quote.version > 1 && <p className="text-xs text-slate-500">Version {quote.version}</p>}
          <p className="text-xs text-slate-500">Date: {fmtDate(quote.createdAt) || 'N/A'}</p>
          <p className="text-xs text-slate-500">Valid Until: {fmtDate(quote.validUntil) || '7 Days'}</p>
        </div>
      </div>

      <div className="relative p-3 rounded-2xl border border-dashed border-[#E91E63]/40 bg-[#FFF5F8]/80 text-xs text-[#7A1B3A]">
        <span className="font-bold">Note: </span>
        Accept this quotation and pay the advance within 7 days of the quotation date{payByText ? <>, that is by <b>{payByText}</b></> : ''}.
        After that a new quotation will be shared; the price may stay the same or change, because market prices are not the same every day.
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
            {fmtDate(lead.eventDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) || 'Date upon agreement'}
          </p>
          <p className="text-slate-600 mt-1">Service Type: {lead.category || 'Wedding Service'}</p>
        </div>
      </div>

      {quote.status === 'Revision Requested' && quote.revisionRequest?.note && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <span className="font-bold">Changes requested:</span> {quote.revisionRequest.note}
        </div>
      )}

      <ItemsTable items={items} />

      {extras.length > 0 && (
        <div className="space-y-2">
          <div>
            <span className="font-bold uppercase tracking-wider text-amber-600 text-[10px]">Optional extras</span>
            <p className="text-[11px] text-slate-500">Available on request. These are not included in the total below.</p>
          </div>
          <ItemsTable items={extras} startAt={items.length + 1} />
        </div>
      )}

      {details.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {details.map(([key, label]) => (
            <div key={key} className="p-3 rounded-xl border border-slate-200">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block mb-1">{label}</span>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{quote[key]}</p>
            </div>
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <div>
          <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block mb-1.5">Reference photos from the vendor</span>
          <div className="flex flex-wrap gap-2">
            {photos.map(url => (
              <img key={url} src={url} alt="" className="h-20 w-20 rounded-xl object-cover border border-slate-200" />
            ))}
          </div>
        </div>
      )}

      {/* Totals Breakdown */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pt-4 border-t border-slate-200">
        {/* Terms & Payment Conditions */}
        <div className="sm:max-w-xs space-y-3 text-xs text-slate-600">
          <div>
            <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block mb-1">Payment & Cancellation Terms</span>
            <p className="text-slate-700 leading-relaxed">{quote.terms || 'Advance booking deposit required to lock dates. Balance payable upon milestone completion.'}</p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block mb-1">Cancellation Policy</span>
            {noCancellation ? (
              <p className="text-[11px] leading-relaxed font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
                No cancellation for this booking. The vendor has switched cancellation off (for example on a peak date). If you cancel, the full amount is payable.
              </p>
            ) : (
              <p className="text-slate-600 text-[11px] leading-relaxed">
                <span className="font-semibold text-emerald-700">Cancellation allowed. </span>
                {quote.cancellationTerms || 'As per the cancellation policy accepted with this quotation.'}
              </p>
            )}
          </div>

          {/* Milestone Terms */}
          {Array.isArray(quote.milestonePaymentTerms) && quote.milestonePaymentTerms.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block mb-1.5">Milestone Schedule</span>
              <div className="space-y-1">
                {quote.milestonePaymentTerms.map((m, mIdx) => (
                  <div key={mIdx} className="flex justify-between text-[11px] bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-700">{m.stage || `Stage ${mIdx + 1}`} ({m.percentage}%)</span>
                    <span className="font-bold text-slate-900">{rupees(m.amount)}</span>
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
            <span className="font-medium text-slate-800">{rupees(Number(quote.subtotal) || totalAmount)}</span>
          </div>

          {(Number(quote.discountAmount) || 0) > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount {quote.discountPercent ? `(${quote.discountPercent}%)` : ''}:</span>
              <span className="font-medium">-{rupees(quote.discountAmount)}</span>
            </div>
          )}

          {(Number(quote.taxAmount) || 0) > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>GST / Tax {quote.taxRatePercent ? `(${quote.taxRatePercent}%)` : ''}:</span>
              <span className="font-medium text-slate-800">+{rupees(quote.taxAmount)}</span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
            <span>Total Contract Value:</span>
            <span className="text-[#E91E63]">{rupees(totalAmount)}</span>
          </div>

          {(Number(quote.optionalExtrasTotal) || 0) > 0 && (
            <div className="flex justify-between text-amber-700 text-[11px] font-semibold">
              <span>Optional extras if added:</span>
              <span>+{rupees(quote.optionalExtrasTotal)}</span>
            </div>
          )}

          {/* Server-reconciled financial details or quotation advance terms */}
          {quote.financial ? (
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500">Advance Status:</span>
                <span className={quote.financial.advancePaid ? 'text-emerald-700 font-extrabold' : quote.financial.advanceRequired > 0 ? 'text-amber-700 font-extrabold' : 'text-slate-700'}>
                  {quote.financial.advancePaid ? `Advance Paid (${rupees(quote.financial.advanceRequired)})` : quote.financial.advanceRequired > 0 ? `Advance Pending (${rupees(quote.financial.advanceRequired)})` : 'Zero Advance'}
                </span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Verified Received:</span>
                <span className="text-emerald-700">{rupees(quote.financial.amountReceived)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Outstanding Balance:</span>
                <span className={quote.financial.outstandingBalance === 0 ? 'text-slate-500' : 'text-rose-600'}>
                  {rupees(quote.financial.outstandingBalance)}
                </span>
              </div>
              {quote.financial.bookingStatus && (
                <div className="flex justify-between text-[11px] font-bold text-slate-500 pt-1 border-t border-slate-100">
                  <span>Booking Status:</span>
                  <span className={quote.financial.bookingStatus === 'Confirmed' ? 'text-emerald-700' : 'text-amber-700'}>
                    {quote.financial.bookingStatus}
                  </span>
                </div>
              )}
            </div>
          ) : advanceAmount > 0 ? (
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <div className="flex justify-between text-amber-700 font-bold">
                <span>Advance Required:</span>
                <span>{rupees(advanceAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-bold">
                <span>Remaining Balance:</span>
                <span className="text-slate-900">{rupees(remainingBalance)}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default QuotationDocument;
