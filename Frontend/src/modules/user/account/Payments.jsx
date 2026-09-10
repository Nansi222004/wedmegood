import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

const Payments = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('all'); // all, pending, completed
  
  const [payments] = useState([
    {
      id: 1,
      vendorName: 'Royal Photography Studio',
      vendorType: 'Wedding Photographer',
      amount: 50000,
      status: 'completed',
      date: '2024-01-15',
      paymentMethod: 'UPI',
      transactionId: 'TXN123456789',
      description: 'Advance payment for wedding photography'
    },
    {
      id: 2,
      vendorName: 'Elegant Decorators',
      vendorType: 'Wedding Decorator',
      amount: 25000,
      status: 'pending',
      dueDate: '2024-02-10',
      description: 'Final payment for decoration services'
    },
    {
      id: 3,
      vendorName: 'Spice Garden Catering',
      vendorType: 'Wedding Caterer',
      amount: 75000,
      status: 'completed',
      date: '2024-01-10',
      paymentMethod: 'Bank Transfer',
      transactionId: 'TXN987654321',
      description: 'Full payment for catering services'
    },
    {
      id: 4,
      vendorName: 'Melodic Music Band',
      vendorType: 'Wedding Entertainment',
      amount: 30000,
      status: 'pending',
      dueDate: '2024-02-15',
      description: 'Payment for sangeet and wedding music'
    },
    {
      id: 5,
      vendorName: 'Bridal Beauty Salon',
      vendorType: 'Bridal Makeup',
      amount: 15000,
      status: 'completed',
      date: '2024-01-05',
      paymentMethod: 'Credit Card',
      transactionId: 'TXN456789123',
      description: 'Bridal makeup and hair styling'
    }
  ]);

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString()}`;
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

  const filteredPayments = payments.filter(payment => {
    if (activeTab === 'all') return true;
    return payment.status === activeTab;
  });

  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const handlePayNow = (payment) => {
    // Navigate to payment gateway or show payment modal
    console.log('Pay now for:', payment);
  };

  const handleViewReceipt = (payment) => {
    // Navigate to receipt page or show receipt modal
    console.log('View receipt for:', payment);
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

        {/* Payments List */}
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
      </div>
    </div>
  );
};

export default Payments;