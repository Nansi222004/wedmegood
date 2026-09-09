import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

const MyBookings = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConnectivityData = () => {
      try {
        const STORAGE_KEY = 'vendor-panel-state';
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const state = JSON.parse(raw);
          // Filter leads by user name/email if possible, or show all for this prototype
          const userLeads = (state.leads || []).filter(lead => 
            !user?.email || lead.email === user.email
          );
          setInquiries(userLeads);
          setQuotes(state.quotes || []);
        }
      } catch (e) {
        console.error('Error loading bookings', e);
      } finally {
        setLoading(false);
      }
    };

    loadConnectivityData();
    // Refresh when window regains focus or when storage changes (e.g. from vendor tab)
    const handleStorageChange = (e) => {
      if (e.key === 'vendor-panel-state') {
        loadConnectivityData();
      }
    };
    window.addEventListener('focus', loadConnectivityData);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('focus', loadConnectivityData);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-700';
      case 'quoted': return 'bg-blue-100 text-blue-700';
      case 'contacted': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const findQuoteForLead = (customerName) => {
    return quotes.find(q => q.customerName === customerName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const handleAcceptQuote = (inquiry) => {
    try {
      const STORAGE_KEY = 'vendor-panel-state';
      const raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return;
          
          const state = JSON.parse(raw);
          const quote = state.quotes?.find(q => q.customerName === inquiry.customerName);
          
          if (!quote) return;

          // Update Quote Status
          state.quotes = state.quotes.map(q => 
            q.id === quote.id ? { ...q, status: 'Accepted' } : q
          );

          // Update Lead Status
          state.leads = state.leads.map(l => 
            l.id === inquiry.id ? { ...l, status: 'Confirmed' } : l
          );

          // Add to Bookings
          const newBooking = {
            id: `bk-${Date.now()}`,
            customerName: inquiry.customerName,
            eventDate: inquiry.eventDate,
            location: inquiry.eventLocation,
            services: quote.items.map(i => i.label),
            totalPrice: quote.items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0),
            status: 'Confirmed'
          };
          state.bookings = [newBooking, ...state.bookings];

          // Notify Vendor
          state.notifications.unshift({
            id: `nt-${Date.now()}`,
            message: `Booking confirmed by ${inquiry.customerName}!`,
            time: 'Just now'
          });

          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          
          // Refresh local display logic
          setInquiries(state.leads.filter(lead => !user?.email || lead.email === user.email));
          setQuotes(state.quotes);
          
          alert('Congratulations! Your booking with ' + inquiry.vendorName + ' has been confirmed.');
        } catch (e) {
          console.error('Error accepting quote', e);
        }
      };

      return (
        <div className="min-h-screen pb-24 px-4 pt-6 md:max-w-4xl md:mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">My Bookings</h1>
            <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">Track your inquiries, quotes, and confirmed events.</p>
          </div>

          {inquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-[2rem] md:rounded-[2.5rem] border-2 border-dashed border-slate-200 px-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center shadow-xl mb-6">
                <Icon name="calendar" size="lg" color="muted" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900">No bookings yet</h3>
              <p className="text-slate-500 max-w-xs mx-auto mt-2 text-sm">Start your wedding journey by inquiry with our top vendors.</p>
              <Button 
                className="mt-8 rounded-2xl px-8 w-full md:w-auto" 
                onClick={() => navigate('/user/vendors')}
              >
                Explore Vendors
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {inquiries.map((inquiry) => {
                const quote = findQuoteForLead(inquiry.customerName);
                const status = quote?.status === 'Accepted' ? 'Confirmed' : (quote ? 'Quoted' : inquiry.status);

                return (
                  <Card key={inquiry.id} className="overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/80 transition-all duration-300">
                    <div className="p-6 md:p-10">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 md:mb-8">
                        <div>
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(status)}`}>
                            {status}
                          </span>
                          <h3 className="text-2xl md:text-3xl font-black text-slate-900 mt-4 leading-tight">{inquiry.vendorName}</h3>
                          <p className="text-slate-500 font-bold text-xs md:text-sm flex items-center gap-2 mt-2">
                            <Icon name="location" size="xs" /> {inquiry.eventLocation}
                          </p>
                        </div>
                        <div className="flex justify-between md:block text-right bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
                          <div className="text-left md:text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Date</p>
                            <p className="text-slate-900 font-bold text-base md:text-lg">{inquiry.eventDate}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 rounded-2xl p-4 md:p-5 mb-6 md:mb-8 border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 md:mb-3">Your Requirement</p>
                        <p className="text-slate-600 text-xs md:text-sm italic font-medium">"{inquiry.message}"</p>
                      </div>

                      {quote && (
                        <div className="border-t border-slate-100 pt-6 md:pt-8 mt-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                              <h4 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-wider">Received Quotation</h4>
                              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Detailed breakdown of services</p>
                            </div>
                            <div className="sm:text-right">
                              <span className="text-2xl md:text-3xl font-black text-emerald-600 tracking-tight">
                                ₹{quote.items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3 bg-white border border-slate-50 p-4 md:p-5 rounded-2xl mb-6 md:mb-8">
                            {quote.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-xs md:text-sm font-bold">
                                <span className="text-slate-500">{item.label}</span>
                                <span className="text-slate-900">₹{Number(item.amount).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                          
                          {quote.status !== 'Accepted' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                              <button 
                                className="vendor-cta rounded-2xl py-3.5 md:py-4 font-black text-sm md:text-base shadow-xl shadow-emerald-100 active:scale-95 transition-all text-white"
                                style={{ backgroundColor: '#10b981' }}
                                onClick={() => handleAcceptQuote(inquiry)}
                              >
                                Accept & Book
                              </button>
                              <button className="rounded-2xl py-3.5 md:py-4 font-black border-2 border-slate-100 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 text-sm md:text-base">
                                Decline
                              </button>
                            </div>
                          ) : (
                            <div className="w-full bg-emerald-500 text-white rounded-2xl py-4 md:py-5 flex items-center justify-center gap-3 shadow-xl shadow-emerald-200">
                              <Icon name="check" size="sm" color="white" />
                              <span className="font-black uppercase tracking-widest text-xs md:text-sm">Booking Confirmed</span>
                            </div>
                          )}
                        </div>
                      )}

                      {!quote && (
                        <div className="flex items-center gap-3 text-amber-600 bg-amber-50/50 px-4 md:px-5 py-3 md:py-4 rounded-2xl border border-amber-100/50">
                          <div className="animate-pulse">
                            <Icon name="clock" size="sm" />
                          </div>
                          <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide">Waiting for vendor response...</span>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      );
};

export default MyBookings;
