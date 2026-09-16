import { useState, useEffect } from 'react';
import Icon from '../../../components/ui/Icon';
import { adminApi } from '../services/adminApi';

const AdminReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
    const token = localStorage.getItem('adminToken');

    const fetchReviews = async (page = 1) => {
        try {
            setLoading(true);
            const params = { page, limit: 12 };
            if (statusFilter) params.status = statusFilter;

            const res = await adminApi.getReviews(token, params);
            if (res.success) {
                setReviews(res.data || []);
                if (res.pagination) {
                    setPagination(res.pagination);
                }
            } else {
                alert(res.message || 'Failed to fetch reviews');
            }
        } catch (err) {
            console.error('Failed to fetch reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews(1);
    }, [statusFilter]);

    const handleModerate = async (id, status) => {
        try {
            setActionLoading(true);
            const res = await adminApi.updateReviewStatus(id, status, token);
            if (res.success) {
                await fetchReviews(pagination.page);
            } else {
                alert(res.message || 'Failed to moderate review');
            }
        } catch (err) {
            console.error('Moderation error:', err);
            alert('A network or server error occurred');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this review permanently?')) return;
        try {
            const res = await adminApi.deleteReview(id, token);
            if (res.success) {
                await fetchReviews(pagination.page);
            } else {
                alert(res.message || 'Failed to delete review');
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-8 w-1 bg-rose-500 rounded-full"></div>
                    <div>
                        <h1 className="text-[14px] font-black text-slate-900 tracking-tight uppercase leading-none">Reviews Moderation Center</h1>
                        <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest mt-1">Trust & Feedback Governance</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                    {[
                        { label: 'All', val: '' },
                        { label: 'Pending', val: 'Pending' },
                        { label: 'Approved', val: 'Approved' },
                        { label: 'Rejected', val: 'Rejected' },
                    ].map((tab) => (
                        <button
                            key={tab.label}
                            onClick={() => setStatusFilter(tab.val)}
                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                statusFilter === tab.val 
                                    ? 'bg-rose-500 text-white shadow-xs' 
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Reviews List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    [1,2,3,4,5,6].map(i => (
                        <div key={i} className="h-48 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse"></div>
                    ))
                ) : reviews.length > 0 ? reviews.map((review) => (
                    <div key={review._id} className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-rose-200 transition-all hover:shadow-lg group relative flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700 font-black text-sm border border-purple-100">
                                        {(review.user?.name || review.user?.email || 'U')[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-[12px] font-black text-slate-900 tracking-tight leading-tight">
                                            {review.user?.name || 'Client'}
                                        </h3>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{review.user?.email || 'Verified'}</p>
                                    </div>
                                </div>
                                
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                                    review.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                    review.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                                    'bg-amber-50 text-amber-600 border border-amber-200'
                                }`}>
                                    {review.status || 'Pending'}
                                </span>
                            </div>

                            <div className="mt-3 p-3 bg-slate-50/70 rounded-xl">
                                <div className="flex gap-1 mb-1.5">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className={`text-xs ${i < review.rating ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>
                                            ★
                                        </span>
                                    ))}
                                </div>
                                <p className="text-[11px] font-medium text-slate-700 leading-relaxed line-clamp-3">
                                    "{review.comment}"
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div className="min-w-0 pr-2">
                                <p className="text-[10px] font-black text-slate-700 truncate">{review.vendor?.businessName || 'Platform Vendor'}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase">{new Date(review.createdAt).toLocaleDateString()}</p>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                {review.status !== 'Approved' && (
                                    <button
                                        disabled={actionLoading}
                                        onClick={() => handleModerate(review._id, 'Approved')}
                                        className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white text-[9px] font-bold transition-all border border-emerald-200"
                                        title="Approve (Recalculates public rating)"
                                    >
                                        Approve
                                    </button>
                                )}
                                {review.status !== 'Rejected' && (
                                    <button
                                        disabled={actionLoading}
                                        onClick={() => handleModerate(review._id, 'Rejected')}
                                        className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white text-[9px] font-bold transition-all border border-rose-200"
                                        title="Reject (Omits from vendor rating)"
                                    >
                                        Reject
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleDelete(review._id)} 
                                    className="h-6 w-6 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                    title="Purge Review"
                                >
                                    <Icon name="trash" size="xs" color="currentColor" />
                                </button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-20 bg-slate-50/30 border border-dashed border-slate-200 rounded-3xl text-center">
                        <div className="h-12 w-12 rounded-full bg-white mx-auto flex items-center justify-center text-slate-200 mb-4">
                            <Icon name="sparkles" size="sm" color="currentColor" />
                        </div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">No reviews match filter</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
                <div className="px-6 py-3 bg-white rounded-2xl border border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
                    <div className="flex gap-1">
                        <button
                            disabled={pagination.page <= 1}
                            onClick={() => fetchReviews(pagination.page - 1)}
                            className="px-3 py-1 rounded bg-slate-100 font-bold disabled:opacity-40"
                        >
                            Prev
                        </button>
                        <button
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => fetchReviews(pagination.page + 1)}
                            className="px-3 py-1 rounded bg-slate-100 font-bold disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReviews;

