import { useState, useEffect } from 'react';
import Icon from '../../../components/ui/Icon';
import { vendorApi } from '../vendorApi';

const StarRow = ({ rating, color = '#7C3AED', size = 'xs' }) => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <svg key={i} className="w-3 h-3" viewBox="0 0 24 24" fill={i < rating ? color : '#E2E8F0'}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ))}
  </div>
);

const VendorReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('vendorToken');
      const res = await vendorApi.getReviews(token);
      if (res.success) setReviews(res.data);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('vendorToken');
      const res = await vendorApi.replyToReview(selectedReview._id, replyText, token);
      if (res.success) {
        setReviews(prev => prev.map(r => r._id === selectedReview._id ? { ...r, reply: replyText } : r));
        setSelectedReview(null);
        setReplyText('');
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateStats = () => {
    if (reviews.length === 0) return { avg: '0.0', count: 0, fiveStarCount: 0, fiveStarPct: 0, distribution: { 5: 0, 4: 0, 3: 0 } };
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    const avg = (sum / reviews.length).toFixed(1);
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => { if (dist[r.rating] !== undefined) dist[r.rating]++; });
    const fiveStarCount = dist[5];
    const fiveStarPct = Math.round((fiveStarCount / reviews.length) * 100);
    const distPercent = {};
    [5, 4, 3].forEach(k => {
      distPercent[k] = Math.round((dist[k] / reviews.length) * 100);
    });
    return { avg, count: reviews.length, fiveStarCount, fiveStarPct, distribution: distPercent };
  };

  const stats = calculateStats();

  const positive = reviews.filter(r => r.rating >= 4).length;
  const neutral = reviews.filter(r => r.rating === 3).length;
  const negative = reviews.filter(r => r.rating <= 2).length;

  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="animate-spin h-8 w-8 border-4 border-[#7C3AED] border-t-transparent rounded-full" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Listening to your clients...</p>
      </div>
    );
  }

  return (
    <div className="pb-28 space-y-3">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
        .rv { font-family: 'Poppins', system-ui, sans-serif; }
        @keyframes rvUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .rv-in { animation: rvUp 0.3s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* ─── Header ─── */}
      <div className="rv rv-in bg-white rounded-2xl px-4 py-3.5 border border-slate-100 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#7C3AED]">Social Proof</p>
          <h2 className="text-[17px] font-black text-slate-900 tracking-tight leading-tight mt-0.5">Client Feedback</h2>
          <p className="text-[9px] font-medium text-slate-400 mt-0.5">Engage with your clients and build your reputation.</p>
        </div>
        {/* Chat bubble illustration */}
        <div className="h-12 w-12 rounded-2xl bg-violet-50 flex items-center justify-center shrink-0 ml-3">
          <svg className="w-7 h-7 text-[#7C3AED]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" />
          </svg>
        </div>
      </div>

      {/* ─── 3-column stat cards ─── */}
      <div className="rv rv-in grid grid-cols-3 gap-2.5">
        {/* Average Rating Card */}
        <div className="bg-[#EEF2FF] rounded-xl p-2.5 border border-indigo-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[7.5px] font-black text-indigo-400 uppercase tracking-tighter">Trust Score</span>
            <div className="h-4.5 w-4.5 rounded-md bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
              <Icon name="star" size="xs" />
            </div>
          </div>
          <div>
            <h3 className="text-[14px] font-black text-slate-900 leading-none">{stats.avg}</h3>
            <div className="mt-1 flex items-center gap-1">
              <StarRow rating={Math.round(parseFloat(stats.avg))} />
            </div>
            <p className="text-[7.5px] font-bold text-rose-500 leading-none mt-1">Based on {stats.count} reviews</p>
          </div>
        </div>

        {/* 5-Star Reviews Card */}
        <div className="bg-[#ECFDF5] rounded-xl p-2.5 border border-emerald-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[7.5px] font-black text-emerald-500 uppercase tracking-tighter">5★ Reviews</span>
            <div className="h-4.5 w-4.5 rounded-md bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
              <Icon name="chart" size="xs" />
            </div>
          </div>
          <div>
            <h3 className="text-[14px] font-black text-emerald-950 leading-tight">{stats.fiveStarPct}%</h3>
            <p className="text-[7.5px] font-black text-emerald-700 uppercase mt-0.5 leading-none">{stats.fiveStarCount} Reviews</p>
            <div className="h-0.5 w-full bg-emerald-100 rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.fiveStarPct}%` }}></div>
            </div>
          </div>
        </div>

        {/* Total Reviews Card */}
        <div className="bg-[#FFF7ED] rounded-xl p-2.5 border border-orange-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[7.5px] font-black text-orange-400 uppercase tracking-tighter">Total Reviews</span>
            <div className="h-4.5 w-4.5 rounded-md bg-white flex items-center justify-center text-orange-600 shadow-sm border border-orange-100">
              <Icon name="chat" size="xs" />
            </div>
          </div>
          <div>
            <h3 className="text-[14px] font-black text-slate-900 leading-tight">{stats.count}</h3>
            <p className="text-[7.5px] font-black text-orange-700 uppercase mt-0.5 leading-none">All time reviews</p>
            <div className="h-0.5 w-full bg-orange-100 rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-orange-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Rating Distribution ─── */}
      <div className="rv rv-in bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <p className="text-[9px] font-black uppercase tracking-widest text-[#7C3AED] mb-3">Rating Distribution</p>
        <div className="space-y-2.5">
          {[5, 4, 3].map(star => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-slate-600 w-7 shrink-0">{star} ★</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${stats.distribution[star] || 0}%`,
                    background: star === 5 ? '#7C3AED' : star === 4 ? '#A78BFA' : '#D8B4FE'
                  }}
                />
              </div>
              <span className="text-[9px] font-black text-slate-500 w-16 text-right shrink-0">
                {stats.distribution[star] || 0}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Testimonials ─── */}
      <div className="rv rv-in space-y-2">
        <div className="flex items-center gap-1.5 px-1">
          <div className="h-2 w-2 rounded-full bg-[#7C3AED]" />
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Testimonials</p>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-dashed border-slate-200 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No reviews yet</p>
            <p className="text-[9px] font-medium text-slate-300 mt-1">Reviews appear once clients share experiences.</p>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review._id} className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-violet-50 flex items-center justify-center text-[#7C3AED] font-black text-[13px] shrink-0">
                    {review.userId?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="text-[11.5px] font-black text-slate-900 leading-none">
                      {review.userId?.name || 'Customer'}
                    </h4>
                    <div className="mt-1">
                      <StarRow rating={review.rating} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[8.5px] font-bold text-slate-400">{timeAgo(review.createdAt)}</span>
                  <button className="h-5 w-5 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="text-[10.5px] font-medium text-slate-600 italic mt-2.5 leading-relaxed">
                "{review.comment}"
              </p>

              {review.reply ? (
                <div className="mt-2.5 ml-4 p-2.5 bg-violet-50/60 rounded-xl border-l-2 border-[#7C3AED]">
                  <p className="text-[7.5px] font-black text-[#7C3AED] uppercase tracking-widest mb-1">Your Response</p>
                  <p className="text-[9.5px] font-medium text-slate-700">{review.reply}</p>
                </div>
              ) : (
                <div className="flex justify-end mt-2.5">
                  <button
                    onClick={() => setSelectedReview(review)}
                    className="text-[8.5px] font-black uppercase tracking-widest text-[#7C3AED] bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-all active:scale-95 border border-violet-100"
                  >
                    Reply
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ─── Bottom Summary Bar ─── */}
      <div className="rv rv-in bg-white rounded-2xl px-4 py-3 border border-slate-100 shadow-sm grid grid-cols-4 divide-x divide-slate-100">
        {[
          { icon: 'chat', value: stats.count, label: 'Total Reviews', color: '#7C3AED', iconColor: '#7C3AED', bg: '#F3E8FF' },
          { icon: 'thumbUp', value: positive, label: 'Positive', color: '#10B981', iconColor: '#10B981', bg: '#D1FAE5' },
          { icon: 'thumbDown', value: neutral, label: 'Neutral', color: '#EF4444', iconColor: '#EF4444', bg: '#FEE2E2' },
          { icon: 'thumbDown', value: negative, label: 'Negative', color: '#F59E0B', iconColor: '#F59E0B', bg: '#FEF3C7' },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center text-center px-1">
            <div className="h-6 w-6 rounded-lg flex items-center justify-center mb-1" style={{ background: item.bg }}>
              {i === 0 && (
                <svg className="w-3.5 h-3.5" fill="none" stroke={item.iconColor} strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
              )}
              {i === 1 && (
                <svg className="w-3.5 h-3.5" fill="none" stroke={item.iconColor} strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
                </svg>
              )}
              {i === 2 && (
                <svg className="w-3.5 h-3.5" fill="none" stroke={item.iconColor} strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h2.25m8.024-9.75c.011.05.028.1.052.148.591 1.2.924 2.55.924 3.977a8.96 8.96 0 0 1-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 .303-.54m.023-8.25H16.48a4.5 4.5 0 0 1-1.423.23l-3.114 1.04a4.5 4.5 0 0 1-1.423.23H6.504c-.618 0-1.217-.247-1.605-.729A11.952 11.952 0 0 1 2.25 12c0-2.848 1-5.461 2.649-7.521.388-.482.987-.729 1.605-.729H5.48c.483 0 .964.078 1.423.23l3.114 1.04a4.501 4.501 0 0 0 1.423.23h1.294M7.498 15.25H5.372m3.124 0c-.07.4-.305.952-.704 1.201 1.378.232 2.783.348 4.208.348 1.349 0 2.671-.106 3.966-.314" />
                </svg>
              )}
              {i === 3 && (
                <svg className="w-3.5 h-3.5" fill="none" stroke={item.iconColor} strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
              )}
            </div>
            <h4 className="text-[13px] font-black leading-none" style={{ color: item.color }}>{item.value}</h4>
            <p className="text-[7px] font-bold text-slate-400 mt-0.5 leading-none">{item.label}</p>
          </div>
        ))}
      </div>

      {/* ─── Reply Modal ─── */}
      {selectedReview && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Post Reply</h3>
                <p className="text-[9px] font-medium text-slate-400 mt-0.5">Responding to {selectedReview.userId?.name}</p>
              </div>
              <button onClick={() => { setSelectedReview(null); setReplyText(''); }} className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                <Icon name="close" size="xs" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 rounded-xl p-3 italic text-[10.5px] font-medium text-slate-500 border border-slate-100">
                "{selectedReview.comment}"
              </div>

              <div className="space-y-1.5">
                <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">Your Response</label>
                <textarea
                  className="w-full h-28 px-4 py-3 bg-slate-50 rounded-xl text-[11px] font-medium text-slate-700 border-0 resize-none focus:ring-1 ring-violet-200 focus:outline-none transition-all placeholder:text-slate-400"
                  placeholder="Say thanks or address their feedback..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              </div>

              <button
                disabled={isSaving || !replyText.trim()}
                onClick={handleReplySubmit}
                className="w-full h-12 bg-[#7C3AED] hover:bg-[#5b21b6] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-violet-200"
              >
                {isSaving ? 'Posting...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorReviews;
