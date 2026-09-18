import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../../components/ui/Icon';
import { useVendorState } from '../useVendorState';
import { vendorApi } from '../vendorApi';

const VendorBookings = () => {
  const { refreshData } = useVendorState();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleDownloadInvoice = (booking) => {
    const totalAmount = Number(booking.packageTotal ?? booking.totalPrice ?? booking.totalAmount ?? 0);
    const paidAmount = Number(booking.paidAmount ?? 0);
    const totalRefunded = Number(booking.totalRefunded ?? 0);
    const outstanding = Number(booking.outstandingBalance ?? Math.max(0, totalAmount - paidAmount));
    const commission = Number(booking.commission ?? 0);
    const commissionPercent = booking.commissionRatePercent ?? (booking.commissionRate ? Math.round(booking.commissionRate * 100) : null);
    const commissionBasis = booking.commissionBasis || 'Gross Package Total';
    const commissionSource = booking.commissionConfigSource || 'System Record';
    const vendorNet = Number(booking.vendorEarning ?? Math.max(0, totalAmount - commission));
    const vendorAmountSettled = Number(booking.vendorAmountSettled ?? 0);
    const escrowHeldAmount = Number(booking.escrowHeldAmount ?? 0);
    const escrowStatus = booking.escrowStatus || (escrowHeldAmount > 0 ? 'Held in Escrow' : 'None Held');
    const settlementStatus = booking.settlementStatus || (vendorAmountSettled > 0 ? 'Settled' : 'Pending');

    const d = booking.eventDate ? new Date(booking.eventDate) : null;
    const fullDateStr = d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date Pending';
    const invoiceNo = `INV-${booking._id ? booking._id.slice(-6).toUpperCase() : 'XXXX'}`;
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const vendorBrand = booking.vendorId?.businessName || 'Wedding Vendor';
    const venue = booking.location || 'Venue pending';
    const customer = booking.customerName || 'Customer';
    const contact = booking.customerPhone || 'Not available';
    const guests = booking.guestCount ? `${booking.guestCount} Guests` : 'Not specified';
    const servicesStr = booking.services && booking.services.length > 0 ? booking.services.join(', ') : 'Wedding Services';

    // Build real payment transaction rows
    const paymentsList = Array.isArray(booking.payments) && booking.payments.length > 0
      ? booking.payments.filter(p => p.status === 'Completed' || p.status === 'Paid' || p.status === 'PartiallyRefunded')
      : [];

    let paymentsRowsHtml = '';
    if (paymentsList.length > 0) {
      paymentsRowsHtml = paymentsList.map((p, idx) => `
        <tr>
          <td>Payment #${idx + 1} (${p.paymentMethod || 'Razorpay'}) — Ref: ${p.razorpayPaymentId || p.transactionId || 'Verified'}</td>
          <td><span class="status-paid">${p.status === 'PartiallyRefunded' ? 'Partial Refund' : 'Paid & Verified'}</span></td>
          <td class="amount">₹${Number(p.amount || 0).toLocaleString('en-IN')}</td>
        </tr>
      `).join('');
    } else if (paidAmount > 0) {
      paymentsRowsHtml = `
        <tr>
          <td>Verified Online Payments</td>
          <td><span class="status-paid">Paid & Verified</span></td>
          <td class="amount">₹${Number(paidAmount).toLocaleString('en-IN')}</td>
        </tr>
      `;
    } else {
      paymentsRowsHtml = `
        <tr>
          <td>Verified Payments Recorded</td>
          <td><span class="status-pending">Unpaid</span></td>
          <td class="amount">₹0</td>
        </tr>
      `;
    }

    if (totalRefunded > 0) {
      paymentsRowsHtml += `
        <tr style="background: #fff1f2;">
          <td>Refunds & Reversals Processed</td>
          <td><span style="color: #e11d48; font-weight: bold; font-size: 10px;">Refunded</span></td>
          <td class="amount" style="color: #e11d48;">- ₹${totalRefunded.toLocaleString('en-IN')}</td>
        </tr>
      `;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Invoice – ${customer}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 32px; color: #1e293b; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #6D3BFF; padding-bottom: 16px; margin-bottom: 24px; }
    .brand { font-size: 22px; font-weight: 900; color: #6D3BFF; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; color: #94a3b8; font-weight: 600; margin-top: 2px; }
    .inv-info { text-align: right; }
    .inv-info p { margin: 2px 0; font-size: 12px; color: #64748b; }
    .inv-info .inv-no { font-size: 15px; font-weight: 800; color: #1e293b; }
    .section-title { font-size: 10px; font-weight: 800; color: #6D3BFF; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-bottom: 24px; }
    .info-row { display: flex; flex-direction: column; padding: 4px 0; }
    .info-label { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
    .info-val { font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { background: #f8fafc; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #64748b; padding: 10px 14px; text-align: left; }
    td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
    .amount { font-weight: 800; text-align: right; }
    .status-paid { color: #16a34a; font-weight: 800; font-size: 10px; text-transform: uppercase; }
    .status-due { color: #d97706; font-weight: 800; font-size: 10px; text-transform: uppercase; }
    .status-pending { color: #94a3b8; font-weight: 800; font-size: 10px; text-transform: uppercase; }
    .outstanding-row { background: #fff1f2; }
    .outstanding-row td { color: #e11d48; font-weight: 800; }
    .settlement-row { background: #f8fafc; font-size: 12px; color: #475569; }
    .footer { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; background: #ede9fe; color: #6D3BFF; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">${vendorBrand}</div>
      <div class="brand-sub">Vendor Portal · Wedding & Event Services</div>
    </div>
    <div class="inv-info">
      <p class="inv-no">${invoiceNo}</p>
      <p>Date: ${today}</p>
      <p>Event: ${fullDateStr}</p>
    </div>
  </div>
  <p class="section-title">Booking Details</p>
  <div class="info-grid">
    <div class="info-row"><span class="info-label">Customer</span><span class="info-val">${customer}</span></div>
    <div class="info-row"><span class="info-label">Contact</span><span class="info-val">${contact}</span></div>
    <div class="info-row"><span class="info-label">Venue</span><span class="info-val">${venue}</span></div>
    <div class="info-row"><span class="info-label">Event Date</span><span class="info-val">${fullDateStr}</span></div>
    <div class="info-row"><span class="info-label">Guests</span><span class="info-val">${guests}</span></div>
    <div class="info-row"><span class="info-label">Services</span><span class="info-val">${servicesStr}</span></div>
  </div>
  <p class="section-title">Financial Summary & Payment Ledger</p>
  <table>
    <thead><tr><th>Description</th><th>Status</th><th class="amount">Amount</th></tr></thead>
    <tbody>
      <tr><td><strong>Agreed Package Total</strong></td><td><span class="badge">${booking.status || 'Confirmed'}</span></td><td class="amount">₹${totalAmount.toLocaleString('en-IN')}</td></tr>
      ${paymentsRowsHtml}
      <tr class="outstanding-row"><td><strong>Outstanding Customer Balance</strong></td><td>${outstanding === 0 ? '<span class="status-paid">Fully Settled</span>' : '<span class="status-due">Due</span>'}</td><td class="amount">₹${outstanding.toLocaleString('en-IN')}</td></tr>
      <tr class="settlement-row"><td>Platform Commission (${commissionPercent !== null ? commissionPercent + '%' : 'Unconfigured'} on ${commissionBasis})</td><td><span class="badge">${commissionSource}</span></td><td class="amount">- ₹${commission.toLocaleString('en-IN')}</td></tr>
      <tr class="settlement-row"><td><strong>Vendor Net Payable Earnings</strong></td><td><span class="badge">${settlementStatus}</span></td><td class="amount"><strong>₹${vendorNet.toLocaleString('en-IN')}</strong></td></tr>
      <tr class="settlement-row"><td>Actual Vendor Settlement Paid Out</td><td><span class="badge">${vendorAmountSettled > 0 ? 'Disbursed' : 'Pending'}</span></td><td class="amount">₹${vendorAmountSettled.toLocaleString('en-IN')}</td></tr>
      <tr class="settlement-row"><td>Escrow Custody Balance</td><td><span class="badge">${escrowStatus}</span></td><td class="amount">₹${escrowHeldAmount.toLocaleString('en-IN')}</td></tr>
    </tbody>
  </table>
  <div class="footer">Thank you for choosing ${vendorBrand} · Official System Generated Invoice</div>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${customer.replace(/\s+/g, '_')}_${invoiceNo}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Official invoice downloaded successfully!');
  };

  const handleSendReminder = (booking) => {
    if (booking.status === 'Cancelled') {
      showToast('Cannot send payment reminder for a cancelled booking.');
      return;
    }

    if (booking.paymentStatus === 'Refunded') {
      showToast('This booking has been refunded. No payment reminder can be sent.');
      return;
    }

    if (booking.hasDiscrepancy) {
      showToast('Booking financial records have an audit discrepancy. Reminder blocked until reconciled.');
      return;
    }

    const totalAmount = Number(booking.packageTotal ?? booking.totalPrice ?? booking.totalAmount ?? 0);
    const paidAmount = Number(booking.paidAmount ?? 0);
    const outstanding = booking.outstandingBalance !== undefined && booking.outstandingBalance !== null
      ? Number(booking.outstandingBalance)
      : Math.max(0, totalAmount - paidAmount);

    const rawPhone = booking.customerPhone || '';
    const phone = rawPhone.replace(/[^0-9]/g, '');

    if (!phone || phone.length < 10) {
      showToast('Customer contact number is unavailable for this booking.');
      return;
    }

    const d = booking.eventDate ? new Date(booking.eventDate) : null;
    const fullDateStr = d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'your scheduled date';
    const customer = booking.customerName || 'there';
    const vendorBrand = booking.vendorId?.businessName || 'Wedding Vendor';
    const venue = booking.location || 'your venue';

    let messageText = '';
    if (outstanding === 0) {
      messageText = `Hello ${customer} 🙏\n\nGreetings from *${vendorBrand}* regarding your upcoming wedding booking.\n\n📅 *Event Date:* ${fullDateStr}\n📍 *Venue:* ${venue}\n\n✨ *Status:* Booking is 100% Confirmed and Fully Paid (₹${totalAmount.toLocaleString('en-IN')}).\n\nWe look forward to creating wonderful memories for your special day! Feel free to reach out if you have any questions.\n\nThank you! 🌸`;
    } else {
      messageText = `Hello ${customer} 🙏\n\nThis is a gentle reminder from *${vendorBrand}* regarding your upcoming wedding booking.\n\n📅 *Event Date:* ${fullDateStr}\n📍 *Venue:* ${venue}\n\n💰 *Total Agreed Package:* ₹${totalAmount.toLocaleString('en-IN')}\n✅ *Verified Paid to Date:* ₹${paidAmount.toLocaleString('en-IN')}\n⏳ *Outstanding Balance Due:* ₹${outstanding.toLocaleString('en-IN')}\n\nKindly ensure the remaining balance is cleared before the event. Feel free to contact us for any queries.\n\nThank you! 🌸`;
    }

    const msg = encodeURIComponent(messageText);
    window.open(`https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}?text=${msg}`, '_blank', 'noopener,noreferrer');
    showToast('WhatsApp reminder opened!');
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('vendorToken');
      const res = await vendorApi.getBookings(token);
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (selectedBooking) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('details-portal-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('details-portal-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('details-portal-open');
    };
  }, [selectedBooking]);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem('vendorToken');
      const res = await vendorApi.updateBookingStatus(bookingId, newStatus, token);
      if (res.success) {
        setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: res.data.status } : b));
        setSelectedBooking(prev => prev && prev._id === bookingId ? { ...prev, status: res.data.status } : prev);
        setOpenMenu(null);
        refreshData();
      }
    } catch (err) {
      console.error('Failed to update booking status:', err);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = (b.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b._id || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' ||
        (statusFilter === 'Confirmed' ? (b.status === 'Confirmed' || b.status === 'Accepted') : b.status === statusFilter);
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'Pending').length,
      confirmed: bookings.filter(b => b.status === 'Confirmed' || b.status === 'Accepted').length,
      revenue: bookings.reduce((acc, b) => acc + (b.totalPrice || b.totalAmount || 0), 0)
    };
  }, [bookings]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Accepted': return { bg: '#F0FDF4', color: '#16A34A', border: '#DCFCE7' };
      case 'Rejected': return { bg: '#f3e8ff', color: '#E11D48', border: '#ede9fe' };
      case 'Confirmed': return { bg: '#F0F9FF', color: '#0284C7', border: '#E0F2FE' };
      case 'Pending': return { bg: '#FFFBEB', color: '#D97706', border: '#FEF3C7' };
      default: return { bg: '#F8FAFC', color: '#64748B', border: '#F1F5F9' };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-rose-400 border-t-transparent rounded-full"></div>
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Streaming Event Ledger...</p>
      </div>
    );
  }

  if (selectedBooking) {
    const booking = selectedBooking;
    const status = getStatusColor(booking.status);
    const d = booking.eventDate ? new Date(booking.eventDate) : null;
    const month = d ? d.toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'TBD';
    const dateNum = d ? d.getDate() : '--';
    const dayStr = d ? d.toLocaleString('en-US', { weekday: 'short' }) : '---';
    const fullDateStr = d ? d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date Pending';

    // Canonical financial reconciliation
    const totalAmount = Number(booking.packageTotal ?? booking.totalPrice ?? booking.totalAmount ?? 0);
    const paidAmount = Number(booking.paidAmount ?? 0);
    const totalRefunded = Number(booking.totalRefunded ?? 0);
    const outstanding = Number(booking.outstandingBalance ?? Math.max(0, totalAmount - paidAmount));
    const commission = Number(booking.commission ?? 0);
    const commissionPercent = booking.commissionRatePercent ?? (booking.commissionRate ? Math.round(booking.commissionRate * 100) : null);
    const commissionBasis = booking.commissionBasis || 'Gross Package Total';
    const commissionSource = booking.commissionConfigSource || 'System Record';
    const vendorNet = Number(booking.vendorEarning ?? Math.max(0, totalAmount - commission));
    const vendorAmountSettled = Number(booking.vendorAmountSettled ?? 0);
    const escrowHeldAmount = Number(booking.escrowHeldAmount ?? 0);
    const escrowStatus = booking.escrowStatus || (escrowHeldAmount > 0 ? 'Held in Escrow' : 'None Held');
    const settlementStatus = booking.settlementStatus || (vendorAmountSettled > 0 ? 'Settled' : 'Pending');
    const isFullyPaid = booking.isFullyPaid ?? (paidAmount >= totalAmount && totalAmount > 0);

    const customerName = booking.customerName || booking.userId?.name || booking.leadId?.name || 'Customer';
    const customerPhone = booking.customerPhone || booking.userId?.phone || '';
    const customerEmail = booking.customerEmail || booking.userId?.email || '';
    const venue = booking.location || 'Venue pending';
    const guests = booking.guestCount ? `${booking.guestCount} Guests` : 'Guest count pending';
    const servicesList = Array.isArray(booking.services) && booking.services.length > 0 ? booking.services : ['Wedding Services'];
    const paymentsList = Array.isArray(booking.payments) ? booking.payments : [];

    const paymentPercentage = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;

    return createPortal(
      <div data-lenis-prevent className="fixed top-16 bottom-[72px] lg:bottom-0 lg:left-64 inset-x-0 z-[40] bg-[#FAFAFC] scrollable-portal text-slate-800 animate-fade-in no-scrollbar touch-auto">
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

            .font-luxury-serif {
              font-family: 'Poppins', sans-serif;
            }

            .font-luxury-sans {
              font-family: 'Poppins', sans-serif;
            }

            .luxury-card {
              background: rgba(255, 255, 255, 0.96);
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
              border: none !important;
              border-radius: 24px;
              box-shadow: 0 4px 20px -4px rgba(109, 59, 255, 0.05), 0 2px 8px -2px rgba(0, 0, 0, 0.02);
              transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .luxury-card:hover {
              box-shadow: 0 6px 25px -4px rgba(109, 59, 255, 0.08), 0 3px 12px -2px rgba(0, 0, 0, 0.025);
              transform: translateY(-0.5px);
            }

            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }

            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(4px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
              animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }

            .scrollable-portal {
              overflow-y: auto !important;
              -webkit-overflow-scrolling: touch !important;
              overscroll-behavior-y: contain !important;
            }
          `}
        </style>

        <div className="max-w-4xl mx-auto space-y-4 pb-24 px-4 sm:px-6 font-luxury-sans">
          {/* Back button header row */}
          <div className="flex items-center justify-between pt-3 pb-1 px-1">
            <button
              onClick={() => setSelectedBooking(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[11px] font-medium text-[#6D3BFF] hover:text-indigo-800 transition-all active:scale-95 shadow-3xs font-luxury-sans"
            >
              <Icon name="arrowLeft" size="xs" className="w-3.5 h-3.5" /> Back to Bookings
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                ID: {booking._id?.slice(-8).toUpperCase() || 'BOOKING'}
              </span>
            </div>
          </div>

          {/* Booking Overview Card */}
          <div className="luxury-card p-4 sm:p-6 space-y-4 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex sm:flex-col items-center justify-center w-full sm:w-16 h-14 sm:h-[72px] bg-slate-50 rounded-2xl shrink-0 shadow-3xs gap-2 sm:gap-0">
                <span className="text-[9px] font-medium text-[#6D3BFF] tracking-wider uppercase font-luxury-sans">{month}</span>
                <span className="text-[22px] font-medium text-slate-950 leading-none font-luxury-sans">{dateNum}</span>
                <span className="text-[9px] font-medium text-slate-400 leading-none font-luxury-sans">{dayStr}</span>
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[20px] sm:text-[22px] font-semibold text-slate-950 tracking-tight font-luxury-sans">
                    {customerName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider bg-purple-50 text-[#6D3BFF] font-luxury-sans">
                    {booking.eventType || 'Wedding'}
                  </span>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider"
                    style={{ backgroundColor: status.bg, color: status.color }}
                  >
                    {booking.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] text-slate-600 font-luxury-sans">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon name="location" size="xs" className="w-3.5 h-3.5 text-[#6D3BFF] shrink-0" />
                    <span className="truncate">{venue}</span>
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <Icon name="users" size="xs" className="w-3.5 h-3.5 text-[#6D3BFF] shrink-0" />
                    <span className="truncate">{guests}</span>
                  </div>

                  {customerPhone && (
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon name="phone" size="xs" className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate font-medium text-slate-800">{customerPhone}</span>
                    </div>
                  )}

                  {customerEmail && (
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon name="mail" size="xs" className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate text-slate-700">{customerEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Hero Ribbon */}
            <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-luxury-sans shadow-3xs">
              <div>
                <span className="text-[20px] font-bold text-slate-950">₹{totalAmount.toLocaleString('en-IN')}</span>
                <p className="text-[9.5px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Agreed Package Price</p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isFullyPaid
                    ? 'bg-emerald-500 text-white'
                    : paidAmount > 0
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {isFullyPaid ? '100% Paid & Verified' : (paidAmount > 0 ? `Partial (₹${paidAmount.toLocaleString('en-IN')} Paid)` : 'Payment Pending')}
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative h-9 w-9">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke={isFullyPaid ? '#10B981' : '#6D3BFF'}
                        strokeWidth="3.5"
                        strokeDasharray={`${paymentPercentage}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-slate-900">{paymentPercentage}%</span>
                    </div>
                  </div>
                  <span className="text-[8px] font-medium text-slate-400 uppercase tracking-wider">Paid</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-4 gap-2.5 font-luxury-sans">
            <button
              onClick={() => {
                if (customerPhone) {
                  window.location.href = `tel:${customerPhone}`;
                } else {
                  showToast('Customer phone number not available');
                }
              }}
              className="bg-white rounded-2xl py-3 flex flex-col items-center justify-center gap-1 shadow-3xs hover:bg-slate-50 transition-all active:scale-95 border border-slate-100"
            >
              <div className="h-9 w-9 rounded-full bg-violet-50 text-[#6D3BFF] flex items-center justify-center shadow-3xs">
                <Icon name="phone" size="xs" className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-600 mt-0.5">Call</span>
            </button>

            <button
              onClick={() => {
                if (customerPhone) {
                  const p = customerPhone.replace(/[^0-9]/g, '');
                  const waUrl = `https://wa.me/${p.startsWith('91') ? p : '91' + p}?text=Hello%20${encodeURIComponent(customerName)},%20this%20is%20regarding%20your%20wedding%20booking.`;
                  window.open(waUrl, '_blank', 'noopener,noreferrer');
                } else {
                  showToast('Customer phone number not available');
                }
              }}
              className="bg-white rounded-2xl py-3 flex flex-col items-center justify-center gap-1 shadow-3xs hover:bg-slate-50 transition-all active:scale-95 border border-slate-100"
            >
              <div className="h-9 w-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-3xs">
                <Icon name="whatsapp" size="xs" className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-600 mt-0.5">WhatsApp</span>
            </button>

            <button
              onClick={() => handleDownloadInvoice(booking)}
              className="bg-white rounded-2xl py-3 flex flex-col items-center justify-center gap-1 shadow-3xs hover:bg-slate-50 transition-all active:scale-95 border border-slate-100"
            >
              <div className="h-9 w-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-3xs">
                <Icon name="download" size="xs" className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-600 mt-0.5">Invoice</span>
            </button>

            <button
              onClick={() => handleSendReminder(booking)}
              className="bg-white rounded-2xl py-3 flex flex-col items-center justify-center gap-1 shadow-3xs hover:bg-slate-50 transition-all active:scale-95 border border-slate-100"
            >
              <div className="h-9 w-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shadow-3xs">
                <Icon name="bell" size="xs" className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-600 mt-0.5">Reminder</span>
            </button>
          </div>

          {/* Event Timeline */}
          <div className="luxury-card p-4 space-y-3 font-luxury-sans">
            <h3 className="text-[11.5px] font-semibold text-slate-800 uppercase tracking-widest font-luxury-sans">Event Pipeline Progress</h3>
            <div className="relative flex justify-between items-center w-full px-2 py-2">
              <div className="absolute top-[16px] left-[20px] right-[20px] h-[2px] bg-[#ECECF4] z-0 rounded-full"></div>
              <div
                className="absolute top-[16px] left-[20px] h-[2px] bg-emerald-500 z-0 rounded-full transition-all duration-500"
                style={{ width: isFullyPaid ? '50%' : paidAmount > 0 ? '40%' : '25%' }}
              ></div>

              {[
                { label: 'Inquiry', completed: true, val: '✓', color: 'bg-emerald-500 text-white' },
                { label: 'Quote Accepted', completed: true, val: '✓', color: 'bg-emerald-500 text-white' },
                {
                  label: isFullyPaid ? '100% Paid' : paidAmount > 0 ? 'Partial Paid' : 'Payment Due',
                  completed: paidAmount > 0,
                  val: isFullyPaid ? '✓' : paidAmount > 0 ? '●' : '○',
                  color: isFullyPaid ? 'bg-emerald-500 text-white' : paidAmount > 0 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'
                },
                { label: 'Coordination', completed: false, val: '○', color: 'bg-slate-100 text-slate-400' },
                { label: 'Event Day', completed: false, val: '○', color: 'bg-slate-100 text-slate-400' },
              ].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center relative z-10 w-16 shrink-0">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-[10px] shadow-3xs transition-all duration-300 ${step.color}`}>
                    {step.val}
                  </div>
                  <span className="text-[9px] font-medium text-slate-600 mt-1.5 text-center leading-tight">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Discrepancy Note Banner if database has inconsistent values */}
          {booking.hasDiscrepancy && (
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-[12px] text-amber-900 flex items-start gap-2.5 shadow-sm">
              <span className="text-lg leading-none">⚠️</span>
              <div>
                <strong className="font-bold">Financial Audit Notice:</strong> {booking.discrepancyNote}
                {Array.isArray(booking.discrepancyReasons) && booking.discrepancyReasons.length > 0 && (
                  <ul className="list-disc list-inside mt-1 text-[11px] text-amber-800 space-y-0.5">
                    {booking.discrepancyReasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Responsive 2-Column Grid: Customer Payment & Contract vs Vendor Net & Escrow */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-luxury-sans">
            {/* Column 1: Customer Payment Breakdown */}
            <div className="luxury-card p-4 sm:p-5 space-y-3 font-luxury-sans flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-[11.5px] font-semibold text-slate-800 uppercase tracking-widest">Customer Payment Ledger</h3>
                  <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                    Customer Side
                  </span>
                </div>

                <div className="space-y-2.5 text-[12.5px] mt-3">
                  <div className="flex justify-between items-center text-slate-500 font-medium">
                    <span>Agreed Package Total</span>
                    <span className="text-slate-950 font-bold">₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-500 font-medium">
                    <span>Verified Customer Payments</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      ₹{paidAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {totalRefunded > 0 && (
                    <div className="flex justify-between items-center text-rose-600 font-medium text-[12px]">
                      <span>Refunds & Reversals Deducted</span>
                      <span className="font-bold">- ₹{totalRefunded.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className={`p-3 rounded-xl flex justify-between items-center mt-2 ${
                    outstanding === 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'
                  }`}>
                    <div>
                      <span className="font-semibold block text-[12px]">Outstanding Customer Balance</span>
                      <span className="text-[9px] text-slate-500">Remaining payable by customer</span>
                    </div>
                    <span className="text-[14px] font-bold">
                      {outstanding === 0 ? '₹0 (Settled)' : `₹${outstanding.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-[10.5px] text-slate-400 border-t border-slate-100 flex items-center justify-between">
                <span>Payment Status: <strong className="text-slate-700">{booking.paymentStatus || (isFullyPaid ? 'Paid' : 'Pending')}</strong></span>
                <span>Verified Online Records</span>
              </div>
            </div>

            {/* Column 2: Vendor Earnings & Escrow Breakdown */}
            <div className="luxury-card p-4 sm:p-5 space-y-3 font-luxury-sans flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-[11.5px] font-semibold text-slate-800 uppercase tracking-widest">Vendor Earnings & Settlement</h3>
                  <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-[#6D3BFF] uppercase">
                    Vendor Net
                  </span>
                </div>

                <div className="space-y-2.5 text-[12.5px] mt-3">
                  <div className="flex justify-between items-center text-slate-500 font-medium">
                    <span>Gross Booking Value</span>
                    <span className="text-slate-950 font-bold">₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-500 font-medium">
                    <div>
                      <span>Platform Commission {commissionPercent !== null ? `(${commissionPercent}%)` : '(Unconfigured)'}</span>
                      <span className="block text-[9.5px] text-slate-400">Basis: {commissionBasis} · Source: {commissionSource}</span>
                    </div>
                    <span className="text-slate-700 font-medium">- ₹{commission.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100/60 flex justify-between items-center text-purple-950 mt-2">
                    <div>
                      <span className="font-bold block text-[12px]">Vendor Net Payable</span>
                      <span className="text-[9px] text-purple-700">Contractual earnings payable upon event completion</span>
                    </div>
                    <span className="text-[15px] font-bold text-[#6D3BFF]">
                      ₹{vendorNet.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 font-medium text-[12px] pt-1">
                    <span>Actual Amount Settled to Vendor</span>
                    <span className="font-bold text-slate-800">
                      {vendorAmountSettled > 0 ? `₹${vendorAmountSettled.toLocaleString('en-IN')}` : '₹0 (Pending event completion)'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 font-medium text-[12px]">
                    <span>Amount Held in Escrow Custody</span>
                    <span className="font-bold text-indigo-700">₹{escrowHeldAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-[10.5px] text-slate-400 border-t border-slate-100 flex items-center justify-between">
                <span>Escrow Custody: <strong className="text-slate-700">{escrowStatus}</strong></span>
                <span>Settlement: <strong className="text-slate-700">{settlementStatus}</strong></span>
              </div>
            </div>
          </div>

          {/* Payment Schedule & Verified Transactions Ledger */}
          <div className="luxury-card p-4 sm:p-5 space-y-3 font-luxury-sans">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div>
                <h3 className="text-[11.5px] font-semibold text-slate-800 uppercase tracking-widest">Payment Schedule & Verified Transactions</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Canonical transaction records from payment gateway</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {paymentsList.length > 0 ? (
                paymentsList.map((p, pIdx) => {
                  const pDate = p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
                  const isSuccess = p.status === 'Completed' || p.status === 'Paid';

                  return (
                    <div key={p._id || pIdx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                          isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                        }`}>
                          <span className="text-[12px] font-bold">{isSuccess ? '✓' : '✗'}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12.5px] font-bold text-slate-900">
                              Payment #{pIdx + 1} — {p.paymentMethod || 'Razorpay'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase ${
                              isSuccess ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                            }`}>
                              {p.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Ref: <span className="font-mono text-slate-600">{p.razorpayPaymentId || 'Direct'}</span> · Date: {pDate}
                          </p>
                        </div>
                      </div>

                      <div className="text-right sm:pl-4">
                        <span className="text-[14px] font-bold text-slate-950">₹{Number(p.amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  );
                })
              ) : paidAmount > 0 ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <span className="text-[12px] font-bold">✓</span>
                    </div>
                    <div>
                      <span className="text-[12.5px] font-bold text-slate-900">Verified Online Payment</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Customer payment verified and recorded</p>
                    </div>
                  </div>
                  <span className="text-[14px] font-bold text-slate-950">₹{paidAmount.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 text-center text-slate-400 text-[11px]">
                  No verified payments recorded yet. The customer has not settled the package amount.
                </div>
              )}
            </div>
          </div>

          {/* Event Details & Services */}
          <div className="luxury-card p-4 sm:p-5 space-y-3 font-luxury-sans">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h3 className="text-[11.5px] font-semibold text-slate-800 uppercase tracking-widest">Event & Contract Details</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12.5px] pt-1">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Venue Location</span>
                <p className="text-slate-850 font-medium">{venue}</p>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Guest Capacity</span>
                <p className="text-slate-850 font-medium">{guests}</p>
              </div>

              <div className="sm:col-span-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Contracted Services</span>
                <div className="flex flex-wrap gap-1.5">
                  {servicesList.map((srv, sIdx) => (
                    <span key={sIdx} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium text-slate-700">
                      {srv}
                    </span>
                  ))}
                </div>
              </div>

              {booking.notes && (
                <div className="sm:col-span-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Event Notes</span>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{booking.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-6 font-luxury-sans">
            <button
              onClick={() => handleDownloadInvoice(booking)}
              className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold uppercase text-[11px] tracking-wider py-3.5 rounded-2xl text-center hover:bg-slate-50 transition-all active:scale-95 shadow-3xs flex items-center justify-center gap-2"
            >
              <Icon name="download" size="xs" className="w-4 h-4" /> Download Official Invoice
            </button>
            <button
              onClick={() => handleSendReminder(booking)}
              className="flex-1 bg-[#6D3BFF] hover:bg-[#5b2ee6] text-white font-semibold uppercase text-[11px] tracking-wider py-3.5 rounded-2xl text-center transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 shadow-[#6D3BFF]/25"
            >
              <Icon name="bell" size="xs" className="w-4 h-4" />
              {outstanding === 0 ? 'Send Confirmation Message' : 'Send Payment Reminder'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className="space-y-3">
      <style>
        {`
          @keyframes flipIn {
            0% {
              opacity: 0;
              transform: perspective(1000px) rotateX(-15deg) translateY(20px) scale(0.98);
            }
            100% {
              opacity: 1;
              transform: perspective(1000px) rotateX(0deg) translateY(0) scale(1);
            }
          }
          .animate-flip-in {
            animation: flipIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @keyframes bounceSubtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          .animate-fade-in {
            animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .animate-slide-up {
            animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          .animate-bounce-subtle {
            animation: bounceSubtle 2s ease-in-out infinite;
          }
        `}
      </style>

      {/* Header & Search Group */}
      <div className="space-y-1.5 pb-0 animate-flip-in" style={{ animationDelay: '0ms' }}>
        {/* Simple Clean Header */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-[20px] font-medium text-[#1e293b] tracking-tight leading-tight">Booking</h1>
            <p className="text-[11px] font-medium text-slate-500">Overseeing {stats.total} Secured Engagements</p>
          </div>
          <button
            onClick={fetchBookings}
            className="h-8 w-8 rounded-lg bg-white border border-slate-100 text-slate-500 hover:text-indigo-600 transition-all flex items-center justify-center active:scale-95 hover:rotate-180 duration-500 shadow-sm"
          >
            <Icon name="clock" size="xs" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-1.5 px-1 overflow-x-auto no-scrollbar">
          <div className="relative flex-shrink-0">
            <Icon name="search" size="xs" color="#94a3b8" className="absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-32 sm:w-44 h-8 pl-8 pr-3 bg-white border border-slate-100 rounded-lg text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-indigo-200 transition-all shadow-sm focus:w-40 sm:focus:w-52"
            />
          </div>
          <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-100 flex-shrink-0">
            {['All', 'Pending', 'Accepted', 'Confirmed', 'Rejected'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-all ${statusFilter === status ? 'bg-white text-indigo-600 shadow-sm border border-slate-100 scale-105' : 'text-slate-500 hover:text-slate-700 hover:scale-105'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-1">
        {[
          {
            label: 'Booked Volume',
            value: stats.revenue > 100000 ? `₹${(stats.revenue / 100000).toFixed(1)}L` : `₹${stats.revenue.toLocaleString()}`,
            trend: 'Total Revenue',
            color: 'amber',
            icon: 'money',
            path: 'M0 25 L15 15 L35 22 L55 10 L75 18 L90 5 L100 10',
            dots: [[15, 15], [35, 22], [55, 10], [75, 18], [90, 5]],
            filterTarget: 'All'
          },
          {
            label: 'Active Schedule',
            value: stats.total,
            trend: 'All Bookings',
            color: 'indigo',
            icon: 'calendar',
            path: 'M0 20 L20 25 L40 15 L60 20 L80 10 L100 15',
            dots: [[20, 25], [40, 15], [60, 20], [80, 10]],
            filterTarget: 'All'
          },
          {
            label: 'Pending Confirm',
            value: stats.pending,
            trend: 'Needs Action',
            color: 'blue',
            icon: 'clock',
            path: 'M0 15 L20 10 L40 20 L60 15 L80 25 L100 20',
            dots: [[20, 10], [40, 20], [60, 15], [80, 25]],
            filterTarget: 'Pending'
          },
          {
            label: 'Confirmed Events',
            value: stats.confirmed,
            trend: 'Secured',
            color: 'emerald',
            icon: 'check',
            path: 'M0 28 L15 22 L35 25 L55 15 L75 20 L90 8 L100 12',
            dots: [[15, 22], [35, 25], [55, 15], [75, 20], [90, 8]],
            filterTarget: 'Confirmed'
          }
        ].map((item, i) => {
          const colorStyles = {
            indigo: {
              bg: 'bg-indigo-50/50',
              bgActive: 'bg-indigo-50',
              border: 'border-none',
              borderActive: 'border-none',
              ring: 'shadow-indigo-100/50 shadow-md',
              iconBg: 'bg-white',
              text: 'text-indigo-600',
              trend: 'text-indigo-500'
            },
            blue: {
              bg: 'bg-blue-50/50',
              bgActive: 'bg-blue-50',
              border: 'border-none',
              borderActive: 'border-none',
              ring: 'shadow-blue-100/50 shadow-md',
              iconBg: 'bg-white',
              text: 'text-blue-600',
              trend: 'text-blue-500'
            },
            amber: {
              bg: 'bg-orange-50/50',
              bgActive: 'bg-orange-50',
              border: 'border-none',
              borderActive: 'border-none',
              ring: 'shadow-orange-100/50 shadow-md',
              iconBg: 'bg-white',
              text: 'text-orange-500',
              trend: 'text-orange-400'
            },
            emerald: {
              bg: 'bg-emerald-50/50',
              bgActive: 'bg-emerald-50',
              border: 'border-none',
              borderActive: 'border-none',
              ring: 'shadow-emerald-100/50 shadow-md',
              iconBg: 'bg-white',
              text: 'text-emerald-600',
              trend: 'text-emerald-500'
            },
          };
          const style = colorStyles[item.color];
          const isActive = statusFilter === item.filterTarget;

          return (
            <div
              key={i}
              onClick={() => setStatusFilter(item.filterTarget)}
              className={`relative p-2 pb-8 sm:pb-9 rounded-xl cursor-pointer transition-all duration-300 animate-flip-in ${isActive
                  ? `${style.bgActive} ${style.ring} -translate-y-0.5 scale-[1.01]`
                  : `${style.bg} hover:shadow-[0_4px_15px_-3px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 hover:scale-[1.01]`
                } flex flex-col min-h-[78px] sm:min-h-[85px] overflow-hidden`}
              style={{ animationDelay: `${(i + 1) * 100}ms` }}
            >
              {/* Top Row: Icon + Value */}
              <div className="flex items-center gap-1.5 mb-1.5 relative z-10">
                <div className={`h-5 w-5 sm:h-6 sm:w-6 rounded-md flex items-center justify-center shadow-sm ${style.iconBg} ${style.text}`}>
                  <Icon name={item.icon} size="xs" />
                </div>
                <span className={`text-[14px] sm:text-[17px] font-medium tracking-tight leading-none ${style.text}`}>{item.value}</span>
              </div>

              {/* Middle Row: Label + Trend */}
              <div className="relative z-10 flex-1 flex flex-col justify-start pl-0.5">
                <p className="text-[9px] sm:text-[11px] font-medium text-slate-800 leading-tight mb-0.5">{item.label}</p>
                <p className={`text-[8px] sm:text-[9px] font-medium ${style.trend}`}>{item.trend}</p>
              </div>

              {/* Bottom Sparkline / Wave */}
              <div className={`absolute bottom-0 left-0 right-0 h-8 sm:h-9 ${style.text} pointer-events-none transition-transform duration-500 group-hover:translate-y-1`}>
                <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full opacity-80">
                  <defs>
                    <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Gradient Fill */}
                  <path d={`${item.path} L100 30 L0 30 Z`} fill={`url(#grad-${i})`} />
                  {/* Stroke Line */}
                  <path d={item.path} fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  {/* Dots */}
                  {item.dots.map((dot, idx) => (
                    <circle key={idx} cx={dot[0]} cy={dot[1]} r="1.5" fill="currentColor" className="animate-pulse" />
                  ))}
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Booking Grid */}
      <div className="grid gap-2.5">
        {filteredBookings.length === 0 ? (
          <div className="vendor-surface rounded-2xl p-12 text-center bg-slate-50 border border-dashed border-slate-200 animate-flip-in">
            <div className="h-14 w-14 rounded-full bg-white mx-auto flex items-center justify-center text-slate-200 mb-4 shadow-sm">
              <Icon name="checkList" size="lg" />
            </div>
            <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">No active bookings</p>
            <p className="text-[11px] font-normal text-slate-300 mt-2 italic">Your event calendar is currently open for new opportunities.</p>
          </div>
        ) : (
          filteredBookings.map((booking, index) => {
            const status = getStatusColor(booking.status);
            const d = booking.eventDate ? new Date(booking.eventDate) : null;
            const month = d ? d.toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'TBD';
            const dateNum = d ? d.getDate() : '--';
            const dayStr = d ? d.toLocaleString('en-US', { weekday: 'short' }) : '---';
            const getInitials = (name) => {
              if (!name) return 'BK';
              return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            };

            return (
              <div
                key={booking._id}
                onClick={() => setSelectedBooking(booking)}
                className="rounded-2xl p-3 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_20px_rgba(109,59,255,0.04)] transition-all duration-300 hover:-translate-y-0.5 animate-flip-in cursor-pointer"
                style={{
                  backgroundColor: status.bg,
                  animationDelay: `${(index + 5) * 80}ms`
                }}
              >
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex flex-col items-center justify-center w-10 h-11 shrink-0 bg-white/90 rounded-xl shadow-3xs">
                        <span className="text-[8px] font-medium text-slate-500 tracking-wider uppercase mb-0.5">{month}</span>
                        <span className="text-[15px] font-medium text-[#1e293b] leading-none mb-0.5">{dateNum}</span>
                        <span className="text-[8px] font-medium text-slate-400 leading-none">{dayStr}</span>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-pink-50 text-[#db2777] flex items-center justify-center shrink-0 shadow-3xs">
                        <span className="text-xs font-medium tracking-tight">{getInitials(booking.customerName)}</span>
                      </div>
                      <div className="flex-1 min-w-0 font-luxury-sans">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap leading-none">
                          <h3 className="text-[13px] font-medium text-[#1e293b] tracking-tight truncate">{booking.customerName}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[8.5px] font-medium uppercase tracking-wider bg-violet-50 text-[#7C3AED]">
                            Event
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 mb-0.5">
                          <Icon name="location" size="xs" className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate text-slate-500">{booking.location || 'Venue details pending'}</span>
                        </div>
                        <div className="text-[9px] text-[#6D3BFF] font-medium uppercase tracking-wider truncate leading-none mt-0.5">
                          {booking.services?.join(' / ') || 'Standard Photography'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-dashed border-slate-200/30 sm:border-t-0 pt-2 sm:pt-0 shrink-0 font-luxury-sans">
                      <div className="flex flex-col sm:items-end">
                        <span className="text-[13px] sm:text-[15px] font-bold text-[#1e293b]">
                          ₹{(booking.packageTotal || booking.totalPrice || booking.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                        <div className="flex items-center gap-1 text-[8.5px] mt-0.5">
                          <span className="text-emerald-600 font-semibold">
                            Paid: ₹{Number(booking.paidAmount || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className={(booking.outstandingBalance ?? 0) > 0 ? 'text-rose-600 font-semibold' : 'text-slate-500'}>
                            Bal: ₹{Number(booking.outstandingBalance !== undefined ? booking.outstandingBalance : Math.max(0, (booking.packageTotal || booking.totalPrice || 0) - (booking.paidAmount || 0))).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-center" style={{ backgroundColor: status.bg === '#F8FAFC' ? '#F1F5F9' : 'rgba(255,255,255,0.7)', color: status.color }}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/20">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-[9px] font-medium uppercase tracking-wide text-indigo-600 hover:bg-slate-50 active:scale-95 transition-all shadow-3xs"
                    >
                      <Icon name="eye" size="xs" className="w-3.5 h-3.5" /> View
                    </button>
                    {booking.customerPhone ? (
                      <a
                        href={`tel:${booking.customerPhone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-[9px] font-medium uppercase tracking-wide text-slate-600 hover:bg-slate-50 active:scale-95 transition-all shadow-3xs"
                      >
                        <Icon name="phone" size="xs" className="w-3.5 h-3.5" /> Call
                      </a>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); showToast('Customer phone not available'); }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-[9px] font-medium uppercase tracking-wide text-slate-400 hover:bg-slate-50 active:scale-95 transition-all shadow-3xs"
                      >
                        <Icon name="phone" size="xs" className="w-3.5 h-3.5 text-slate-300" /> Call
                      </button>
                    )}
                    {booking.customerPhone ? (
                      <a
                        href={`https://wa.me/${booking.customerPhone.replace(/[^0-9]/g, '').startsWith('91') ? booking.customerPhone.replace(/[^0-9]/g, '') : '91' + booking.customerPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(booking.customerName || 'Customer')},%20this%20is%20regarding%20your%20wedding%20booking.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-[9px] font-medium uppercase tracking-wide text-emerald-600 hover:bg-slate-50 active:scale-95 transition-all shadow-3xs"
                      >
                        <Icon name="chat" size="xs" className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); showToast('Customer phone not available'); }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-[9px] font-medium uppercase tracking-wide text-slate-400 hover:bg-slate-50 active:scale-95 transition-all shadow-3xs"
                      >
                        <Icon name="chat" size="xs" className="w-3.5 h-3.5 text-slate-300" /> WhatsApp
                      </button>
                    )}
                    {booking.status === 'Pending' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(booking._id, 'Accepted'); }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 text-[9px] font-medium uppercase tracking-wide text-white hover:bg-emerald-600 active:scale-95 transition-all shadow-2xs"
                      >
                        <Icon name="check" size="xs" className="w-3.5 h-3.5" /> Accept
                      </button>
                    )}
                    {booking.status === 'Accepted' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(booking._id, 'Confirmed'); }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-[9px] font-medium uppercase tracking-wide text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-2xs"
                      >
                        <Icon name="check" size="xs" className="w-3.5 h-3.5" /> Confirm
                      </button>
                    )}
                    <div className="relative ml-auto">
                      <button
                        className="px-1.5 py-0.5 rounded-lg bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center h-7 w-7 shadow-3xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(openMenu === booking._id ? null : booking._id);
                        }}
                      >
                        <Icon name="more" size="xs" />
                      </button>
                      {openMenu === booking._id && (
                        <>
                          <div className="fixed inset-0 z-[120]" onClick={() => setOpenMenu(null)}></div>
                          <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100/50 z-[130] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 p-1.5">
                            {booking.status !== 'Confirmed' && booking.status !== 'Rejected' && (
                              <button
                                onClick={() => handleStatusUpdate(booking._id, 'Confirmed')}
                                className="w-full px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider hover:bg-slate-50 text-slate-700 rounded-lg transition-all"
                              >
                                Mark as Confirmed
                              </button>
                            )}
                            <button
                              onClick={() => handleStatusUpdate(booking._id, 'Rejected')}
                              className="w-full px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider hover:bg-rose-50 text-rose-600 rounded-lg transition-all mt-1"
                            >
                              Cancel Booking
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* View in Detail Modal removed to use high-fidelity portal details */}
      {toast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] px-4.5 py-2.5 rounded-full bg-slate-900/95 backdrop-blur-md text-white text-[10.5px] font-medium uppercase tracking-widest shadow-xl flex items-center gap-2 animate-fade-in border border-slate-800/50 font-luxury-sans">
          <span className="h-2 w-2 rounded-full bg-[#6D3BFF] animate-pulse"></span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};

export default VendorBookings;
