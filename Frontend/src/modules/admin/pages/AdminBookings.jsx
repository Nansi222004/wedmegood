import { useState, useEffect } from 'react';
import Icon from '../../../components/ui/Icon';

const AdminBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/bookings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                setBookings(result.data);
            }
        } catch (err) {
            console.error('Error fetching bookings:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Global Ledger</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Platform Booking Oversight</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="h-8 rounded-lg border border-slate-200 bg-white px-3 flex items-center gap-2">
                        <Icon name="calendar" size="xs" color="#94a3b8" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Monitor</span>
                    </div>
                    <button className="h-8 px-4 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all">
                        Export XML
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Booking ID</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Client / Customer</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Vendor Partner</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Valuation</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Event Date</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Registry Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">Synchronizing Ledger Data...</td>
                                </tr>
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No transaction records detected</td>
                                </tr>
                            ) : bookings.map((booking) => (
                                <tr key={booking._id} className="hover:bg-primary-50/10 transition-colors group">
                                    <td className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">#{booking._id.slice(-6)}</td>
                                    <td className="px-5 py-3">
                                        <p className="text-[11px] font-black text-slate-900">{booking.userId?.fullName || 'Anonymous'}</p>
                                        <p className="text-[9px] font-bold text-slate-400">{booking.userId?.email}</p>
                                    </td>
                                    <td className="px-5 py-3">
                                        <p className="text-[11px] font-black text-slate-800">{booking.vendorId?.businessName || 'Platform Service'}</p>
                                    </td>
                                    <td className="px-5 py-3 text-[11px] font-black text-emerald-600 tracking-tight">₹{booking.totalPrice?.toLocaleString()}</td>
                                    <td className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase">
                                        {new Date(booking.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                            booking.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            booking.status === 'Completed' ? 'bg-primary-50 text-primary-500 border-primary-100' :
                                            booking.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                            'bg-slate-50 text-slate-400 border-slate-100'
                                        }`}>{booking.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminBookings;
