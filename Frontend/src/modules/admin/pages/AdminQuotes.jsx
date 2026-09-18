import { useState, useEffect } from 'react';
import Icon from '../../../components/ui/Icon';
import { toast } from '../../../components/ui/Toast';
import getFriendlyErrorMessage from '../../../utils/errorHandler';
import { adminApi } from '../services/adminApi';

const AdminQuotes = () => {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

    const token = localStorage.getItem('adminToken');

    const fetchQuotes = async (page = 1) => {
        try {
            setLoading(true);
            const params = { page, limit: 12 };
            if (statusFilter) params.status = statusFilter;

            const res = await adminApi.getQuotes(token, params);
            if (res.success) {
                setQuotes(res.data || []);
                if (res.pagination) {
                    setPagination(res.pagination);
                }
            } else {
                toast.error(getFriendlyErrorMessage(res, 'Failed to fetch quotes.'));
            }
        } catch (err) {
            console.error('Failed to fetch quotes:', err);
            toast.error(getFriendlyErrorMessage(err, 'Unable to load quotes.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotes(1);
    }, [statusFilter]);

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Vendor Quotes Oversight</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Proposal Valuations & Commercial Terms</p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-400/20"
                    >
                        <option value="">All Statuses</option>
                        <option value="Sent">Sent</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Declined">Declined</option>
                        <option value="Expired">Expired</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[850px]">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Quote ID</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Vendor Partner</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Client / Recipient</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Proposed Amount</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Validity</th>
                                <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <div className="animate-spin h-6 w-6 border-2 border-primary-400 border-t-transparent rounded-full mx-auto" />
                                    </td>
                                </tr>
                            ) : quotes.length > 0 ? quotes.map((quote) => (
                                <tr key={quote._id} className="hover:bg-primary-50/10 transition-colors">
                                    <td className="px-6 py-3 text-[10px] font-mono text-slate-500 font-bold">
                                        #{quote._id.slice(-6)}
                                    </td>
                                    <td className="px-5 py-3">
                                        <p className="text-[12px] font-black text-slate-900 leading-tight">
                                            {quote.vendorId?.businessName || 'Platform Vendor'}
                                        </p>
                                        <p className="text-[10px] text-slate-400">{quote.vendorId?.city || 'National'}</p>
                                    </td>
                                    <td className="px-5 py-3">
                                        <p className="text-[11px] font-bold text-slate-800">
                                            {quote.userId?.name || quote.userId?.fullName || 'Client'}
                                        </p>
                                        <p className="text-[10px] text-slate-400">{quote.userId?.email || 'No email'}</p>
                                    </td>
                                    <td className="px-5 py-3 text-[12px] font-black text-emerald-600 tracking-tight">
                                        ₹{(quote.totalAmount || quote.amount || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-5 py-3 text-[10px] font-bold text-slate-500">
                                        {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('en-IN') : 'No expiry'}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                            quote.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                            quote.status === 'Declined' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                            quote.status === 'Expired' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                            'bg-blue-50 text-blue-600 border-blue-200'
                                        }`}>
                                            {quote.status || 'Sent'}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        No commercial quotes found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} quotes)</span>
                        <div className="flex gap-2">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => fetchQuotes(pagination.page - 1)}
                                className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 font-bold disabled:opacity-30"
                            >
                                Prev
                            </button>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => fetchQuotes(pagination.page + 1)}
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

export default AdminQuotes;
