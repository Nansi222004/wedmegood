// How each service of a requirement is described to the customer
export const SERVICE_STATUS = {
  'Awaiting Response': { label: 'Finding vendor', tone: 'blue' },
  New: { label: 'Vendor notified', tone: 'green' },
  Accepted: { label: 'Vendor accepted', tone: 'green' },
  Contacted: { label: 'Vendor in touch', tone: 'green' },
  'Quote Sent': { label: 'Quote received', tone: 'purple' },
  'Details Requested': { label: 'Details needed', tone: 'amber' },
  Exploring: { label: 'Choose a vendor', tone: 'amber' },
  Unassigned: { label: 'Needs your input', tone: 'red' },
  Booked: { label: 'Booked', tone: 'solid' },
  Rejected: { label: 'Closed', tone: 'grey' },
  Closed: { label: 'Closed', tone: 'grey' },
  Cancelled: { label: 'Removed', tone: 'grey' }
};

export const TONE_CLASSES = {
  blue: 'bg-sky-50 text-sky-700 border-sky-100',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  purple: 'bg-violet-50 text-violet-700 border-violet-100',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  red: 'bg-rose-50 text-rose-700 border-rose-200',
  solid: 'bg-emerald-600 text-white border-emerald-600',
  grey: 'bg-stone-100 text-stone-500 border-stone-200'
};

export const DOT_CLASSES = {
  blue: 'bg-sky-500',
  green: 'bg-emerald-500',
  purple: 'bg-violet-500',
  amber: 'bg-amber-500',
  red: 'bg-rose-500',
  solid: 'bg-emerald-600',
  grey: 'bg-stone-300'
};

export const statusOf = (status) => SERVICE_STATUS[status] || { label: status, tone: 'grey' };

export const TERMINAL = ['Booked', 'Closed', 'Cancelled', 'Rejected'];

export const formatDate = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  (d ? new Date(d).toLocaleDateString('en-IN', opts) : '');

export const formatMoney = (n) => (Number(n) > 0 ? `₹${Number(n).toLocaleString('en-IN')}` : '');

export const HEADING_FONT = { fontFamily: '"Playfair Display", Georgia, serif' };
