import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { userApi } from '../../../services/userApi';

const Payments = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('all'); // all, pending, completed
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await userApi.getUserPayments();
      if (res.success && Array.isArray(res.data)) {
        setPayments(res.data);
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error('Failed to load user payments:', err);
      setError(err.message || 'Could not load payments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return {
          bg: theme.colors.accent[100],
          text: theme.colors.accent[700],
          icon: 'check'
        };
      case 'pending':
        return {
          bg: '#fef3c7',
          text: '#d97706',
          icon: 'clock'
        };
      default:
        return {
          bg: theme.semantic.background.accent,
          text: theme.semantic.text.secondary,
          icon: 'sparkles'
        };
    }
  };

  const normalizedPayments = payments.map((p) => {
    const rawStatus = (p.status || 'pending').toLowerCase();
    return {
      id: p._id,
      vendorName: p.vendorId?.businessName || 'Wedding Vendor',
      vendorType: p.bookingId?.services?.[0]?.name || (Array.isArray(p.bookingId?.services) ? p.bookingId.services.join(', ') : 'Wedding Service'),
      amount: p.amount || p.bookingId?.totalPrice || 0,
      status: rawStatus === 'completed' ? 'completed' : rawStatus === 'failed' ? 'failed' : 'pending',
      date: p.createdAt,
      dueDate: p.bookingId?.eventDate || p.createdAt,
      paymentMethod: p.paymentMethod || 'Razorpay',
      transactionId: p.razorpayPaymentId || p.razorpayOrderId || p._id,
      description: `Payment for booking #${p.bookingId?._id ? p.bookingId._id.toString().slice(-6).toUpperCase() : p._id.toString().slice(-6).toUpperCase()}`,
      raw: p
    };
  });

  const filteredPayments = normalizedPayments.filter(payment => {
    if (activeTab === 'all') return true;
    return payment.status === activeTab;
  });

  const totalPaid = normalizedPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = normalizedPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const handlePayNow = (payment) => {
    if (payment.raw?.bookingId?._id) {
      navigate(`/user/checkout?bookingId=${payment.raw.bookingId._id}`);
    } else {
      navigate('/user/bookings');
    }
  };

  const handleViewReceipt = async (payment) => {
    try {
      setReceiptLoading(true);
      const res = await userApi.getPaymentReceipt(payment.id);
      if (res.success && res.data) {
        setSelectedReceipt(res.data);
      } else {
        setSelectedReceipt({
          receiptNumber: `RCP-${String(payment.id).slice(-8).toUpperCase()}`,
          issuedAt: payment.date,
          platform: {
            name: 'Utsavo / WedMeGood',
            legalEntity: 'WedMeGood Event Tech Pvt. Ltd.',
            supportEmail: 'support@wedmegood.com',
            currency: 'INR'
          },
          customer: {
            name: 'Valued Customer'
          },
          vendor: {
            businessName: payment.vendorName,
            category: payment.vendorType
          },
          booking: {
            bookingId: payment.id,
            services: [payment.vendorType]
          },
          payment: {
            transactionId: payment.transactionId,
            amount: payment.amount,
            status: 'Paid',
            paymentMethod: payment.paymentMethod
          }
        });
      }
    } catch (err) {
      console.error('Failed to load receipt:', err);
    } finally {
      setReceiptLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-10 px-4 py-4 border-b backdrop-blur-sm"
        style={{ 
          backgroundColor: `${theme.semantic.background.primary}95`,
          borderBottomColor: theme.semantic.border.light 
        }}
      >
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-3 p-2 rounded-full"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
          </button>
          <div>
            <h1 className="text-lg font-bold" style={{ color: theme.semantic.text.primary }}>
              My Payments
            </h1>
            <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
              Track all your wedding payments
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Payment Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                style={{ backgroundColor: theme.colors.accent[100] }}
              >
                <Icon name="check" size="sm" style={{ color: theme.colors.accent[600] }} />
              </div>
              <p className="text-xs mb-1" style={{ color: theme.semantic.text.secondary }}>
                Total Paid
              </p>
              <p className="font-bold text-lg" style={{ color: theme.colors.accent[600] }}>
                {formatCurrency(totalPaid)}
              </p>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                style={{ backgroundColor: '#fef3c7' }}
              >
                <Icon name="clock" size="sm" style={{ color: '#d97706' }} />
              </div>
              <p className="text-xs mb-1" style={{ color: theme.semantic.text.secondary }}>
                Pending
              </p>
              <p className="font-bold text-lg" style={{ color: '#d97706' }}>
                {formatCurrency(totalPending)}
              </p>
            </div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 p-1 rounded-lg" style={{ backgroundColor: theme.semantic.background.accent }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'completed', label: 'Completed' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id ? 'shadow-sm' : ''
              }`}
              style={{
                backgroundColor: activeTab === tab.id ? theme.semantic.background.primary : 'transparent',
                color: activeTab === tab.id ? theme.semantic.text.primary : theme.semantic.text.secondary
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div 
              className="w-10 h-10 border-4 rounded-full animate-spin mb-3"
              style={{ borderColor: `${theme.colors.primary[500]}20`, borderTopColor: theme.colors.primary[500] }}
            />
            <p className="text-sm font-medium" style={{ color: theme.semantic.text.secondary }}>
              Loading your payments...
            </p>
          </div>
        )}

        {error && !loading && (
          <Card className="p-4 text-center border border-red-200" style={{ backgroundColor: '#fef2f2' }}>
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <Button size="sm" onClick={fetchPayments} style={{ backgroundColor: theme.colors.primary[500], color: 'white' }}>
              Retry
            </Button>
          </Card>
        )}

        {/* Payments List */}
        {!loading && !error && (
          <>
            <div className="space-y-3">
              {filteredPayments.map((payment) => {
                const statusConfig = getStatusColor(payment.status);
                
                return (
                  <Card key={payment.id} className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium" style={{ color: theme.semantic.text.primary }}>
                            {payment.vendorName}
                          </h3>
                          <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                            {payment.vendorType}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg" style={{ color: theme.semantic.text.primary }}>
                            {formatCurrency(payment.amount)}
                          </p>
                          <div 
                            className="inline-flex items-center space-x-1 px-2 py-1 rounded-full"
                            style={{ backgroundColor: statusConfig.bg }}
                          >
                            <Icon name={statusConfig.icon} size="xs" style={{ color: statusConfig.text }} />
                            <span className="text-xs font-medium" style={{ color: statusConfig.text }}>
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                        {payment.description}
                      </p>

                      {/* Payment Details */}
                      <div className="flex items-center justify-between pt-2 border-t" style={{ borderTopColor: theme.semantic.border.light }}>
                        <div className="text-xs" style={{ color: theme.semantic.text.tertiary }}>
                          {payment.status === 'completed' ? (
                            <div>
                              <p>Paid on {formatDate(payment.date)}</p>
                              {payment.paymentMethod && (
                                <p>via {payment.paymentMethod}</p>
                              )}
                            </div>
                          ) : (
                            <p>Due on {formatDate(payment.dueDate)}</p>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          {payment.status === 'completed' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewReceipt(payment)}
                            >
                              <Icon name="download" size="xs" className="mr-1" />
                              Receipt
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handlePayNow(payment)}
                              style={{
                                backgroundColor: theme.colors.primary[500],
                                color: 'white'
                              }}
                            >
                              Pay Now
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Transaction ID for completed payments */}
                      {payment.status === 'completed' && payment.transactionId && (
                        <div className="text-xs" style={{ color: theme.semantic.text.tertiary }}>
                          Transaction ID: {payment.transactionId}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredPayments.length === 0 && (
              <Card className="p-8 text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: theme.semantic.background.accent }}
                >
                  <Icon name="money" size="xl" style={{ color: theme.semantic.text.secondary }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: theme.semantic.text.primary }}>
                  No {activeTab === 'all' ? '' : activeTab} payments found
                </h3>
                <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                  {activeTab === 'pending' 
                    ? 'All your payments are up to date!'
                    : 'Your payment history will appear here.'
                  }
                </p>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Official Customer Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                  ✓
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Official Payment Receipt</h3>
                  <p className="text-[10px] font-bold text-slate-400">{selectedReceipt.receiptNumber}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedReceipt(null)} 
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-4 text-left">
              <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Platform</p>
                  <p className="text-xs font-black text-slate-900">{selectedReceipt.platform?.name || 'Utsavo / WedMeGood'}</p>
                  <p className="text-[9px] font-medium text-slate-500">{selectedReceipt.platform?.legalEntity}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Payment Date</p>
                  <p className="text-xs font-bold text-slate-800">{new Date(selectedReceipt.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-3 py-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Paid By</p>
                  <p className="text-[11px] font-black text-slate-900">{selectedReceipt.customer?.name || 'Customer'}</p>
                  <p className="text-[9px] text-slate-500 truncate">{selectedReceipt.customer?.email || ''}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Paid To</p>
                  <p className="text-[11px] font-black text-slate-900">{selectedReceipt.vendor?.businessName || 'Verified Partner'}</p>
                  <p className="text-[9px] text-slate-500">{selectedReceipt.vendor?.category || ''}</p>
                </div>
              </div>

              {/* Service & Booking Details */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Service Items</p>
                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 text-xs font-bold text-slate-800">
                  {Array.isArray(selectedReceipt.booking?.services) && selectedReceipt.booking.services.length > 0
                    ? selectedReceipt.booking.services.join(', ')
                    : 'Wedding Event Services'}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Transaction Reference</span>
                  <span className="font-mono font-bold text-slate-700">{selectedReceipt.payment?.transactionId || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Payment Gateway</span>
                  <span className="font-bold text-slate-700">{selectedReceipt.payment?.paymentMethod || 'Razorpay'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900">Total Amount Paid</span>
                  <span className="text-base font-black text-emerald-600">
                    ₹{Number(selectedReceipt.payment?.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-colors"
                >
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;