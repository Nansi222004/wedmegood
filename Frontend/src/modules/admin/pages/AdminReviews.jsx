import { useState, useEffect } from 'react';
import Icon from '../../../components/ui/Icon';
import { adminApi } from '../services/adminApi';

const AdminReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('adminToken');

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const res = await adminApi.getReviews(token);
            if (res.success) {
                setReviews(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this review permanently?')) return;
        try {
            const res = await adminApi.deleteReview(id, token);
            if (res.success) {
                fetchReviews();
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* Professional Compact Header */}
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-8 w-1 bg-rose-500 rounded-full"></div>
                    <div>
                        <h1 className="text-[14px] font-black text-slate-900 tracking-tight uppercase leading-none">Reviews Console</h1>
                        <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest mt-1">User Feedback Management</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Monitor</span>
                </div>
            </div>

            {/* Reviews List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {loading ? (
                    [1,2,3,4,5,6].map(i => (
                        <div key={i} className="h-40 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse"></div>
                    ))
                ) : reviews.length > 0 ? reviews.map((review) => (
                    <div key={review._id} className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-rose-200 transition-all hover:shadow-lg group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleDelete(review._id)} className="h-8 w-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                                <Icon name="logout" size="xs" color="currentColor" />
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                <Icon name="user" size="sm" color="currentColor" />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-black text-slate-900 tracking-tight uppercase">{review.user?.fullName || 'Anonymous'}</h3>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Customer</p>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-slate-50/50 rounded-xl">
                            <div className="flex gap-0.5 mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < review.rating ? 'bg-amber-400' : 'bg-slate-200'}`}></div>
                                ))}
                            </div>
                            <p className="text-[10px] font-semibold text-slate-600 leading-relaxed line-clamp-3">"{review.comment}"</p>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                            <div className="flex items-center gap-1.5">
                                <Icon name="store" size="xs" color="#64748b" />
                                <span className="text-[9px] font-black text-slate-500 uppercase truncate max-w-[120px]">{review.vendor?.businessName || 'General'}</span>
                            </div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-20 bg-slate-50/30 border border-dashed border-slate-200 rounded-3xl text-center">
                        <div className="h-12 w-12 rounded-full bg-white mx-auto flex items-center justify-center text-slate-200 mb-4">
                            <Icon name="sparkles" size="sm" color="currentColor" />
                        </div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">No feedback recorded</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminReviews;
