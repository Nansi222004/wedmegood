import { useState, useEffect } from 'react';
import Icon from '../../../components/ui/Icon';
import { adminApi } from '../services/adminApi';

const AdminBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

    const token = localStorage.getItem('adminToken');

    const fetchBookings = async (page = 1) => {
        try {
            setIsLoading(true);
            const params = { page, limit: 12 };
            if (statusFilter) params.status = statusFilter;

            const res = await adminApi.getBookings(token, params);
            if (res.success) {
                setBookings(res.data || []);
                if (res.pagination) {
                    setPagination(res.pagination);
                }
            }
        } catch (err) {
            console.error('Error fetching bookings:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings(1);
    }, [statusFilter]);

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Global Bookings Ledger</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Platform Booking Operations & Settlements</p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-400/20"
                    >
                        <option value="">All Statuses</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Pending">Pending</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
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
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Payment</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Booking Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">Synchronizing Ledger Data...</td>
                                </tr>
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No transaction records detected</td>
                                </tr>
                            ) : bookings.map((booking) => (
                                <tr key={booking._id} className="hover:bg-primary-50/10 transition-colors group">
                                    <td className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">#{booking._id.slice(-6)}</td>
                                    <td className="px-5 py-3">
                                        <p className="text-[11px] font-black text-slate-900">{booking.userId?.name || booking.userId?.fullName || 'Anonymous'}</p>
                                        <p className="text-[9px] font-bold text-slate-400">{booking.userId?.email}</p>
                                    </td>
                                    <td className="px-5 py-3">
                                        <p className="text-[11px] font-black text-slate-800">{booking.vendorId?.businessName || 'Platform Service'}</p>
                                    </td>
                                    <td className="px-5 py-3 text-[11px] font-black text-emerald-600 tracking-tight">₹{(booking.totalPrice || booking.amount || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase">
                                        {booking.eventDate ? new Date(booking.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unscheduled'}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                            booking.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            booking.paymentStatus === 'Refunded' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                            'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>{booking.paymentStatus || 'Pending'}</span>
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

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} bookings)</span>
                        <div className="flex gap-2">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => fetchBookings(pagination.page - 1)}
                                className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 font-bold disabled:opacity-30"
                            >
                                Prev
                            </button>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => fetchBookings(pagination.page + 1)}
                                className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 font-bold disabled:opacity-30"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminBookings;

