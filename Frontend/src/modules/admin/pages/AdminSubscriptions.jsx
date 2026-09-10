import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import { adminApi } from '../services/adminApi';
import { useToast } from '../../../components/ui/Toast';

const AdminSubscriptions = () => {
    const [plans, setPlans] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingPlanId, setEditingPlanId] = useState(null);
    const [editData, setEditData] = useState({ name: '', price: '', durationValue: 1, durationUnit: 'year' });
    const [subs, setSubs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const { showToast, ToastComponent } = useToast();

    const token = localStorage.getItem('adminToken');
    const navigate = useNavigate();

    const fetchData = async () => {
        if (!token) {
            navigate('/admin/login');
            return;
        }

        try {
            setLoading(true);
            const [planRes, vendorsRes] = await Promise.all([
                adminApi.getSubscriptionPlans(token),
                adminApi.getVendors(token)
            ]);

            if (planRes.message === 'Invalid token.' || vendorsRes.message === 'Invalid token.') {
                localStorage.removeItem('adminToken');
                navigate('/admin/login');
                return;
            }

            if (planRes.success) {
                setPlans(planRes.data);
            }
            if (vendorsRes.success) {
                setSubs(vendorsRes.data.filter(v => v.subscription?.status === 'Active'));
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            navigate('/admin/login');
        } else {
            fetchData();
        }
    }, [token]);

    const handleEditClick = (plan) => {
        setEditingPlanId(plan._id);
        setEditData({
            name: plan.name,
            price: plan.price,
            durationValue: plan.durationValue,
            durationUnit: plan.durationUnit
        });
        setIsEditing(true);
    };

    const handleAddNewClick = () => {
        setEditingPlanId(null);
        setEditData({ name: '', price: '', durationValue: 1, durationUnit: 'year' });
        setIsEditing(true);
    };

    const [subLoading, setSubLoading] = useState(false);

    const handleUpdatePlan = async () => {
        if (!editData.name || !editData.price) {
            showToast('Please provide Plan Name and Price', 'warning');
            return;
        }

        try {
            setSubLoading(true);
            let res;
            if (editingPlanId) {
                res = await adminApi.updateSubscriptionPlan(editingPlanId, editData, token);
            } else {
                res = await adminApi.createSubscriptionPlan(editData, token);
            }

            if (res.success) {
                setIsEditing(false);
                setEditingPlanId(null);
                showToast(editingPlanId ? 'Plan updated successfully' : 'New plan initialized successfully', 'success');
                fetchData();
            } else {
                showToast(res.message || 'Operation failed', 'error');
            }
        } catch (err) {
            console.error('Update error:', err);
            showToast('Network error or server failure', 'error');
        } finally {
            setSubLoading(false);
        }
    };

    const handleDeletePlan = async (id) => {
        if (!window.confirm('Are you sure you want to delete this subscription tier? This cannot be undone.')) return;

        try {
            setSubLoading(true);
            const res = await adminApi.deleteSubscriptionPlan(id, token);
            if (res.success) {
                showToast('Plan deleted successfully', 'success');
                fetchData();
                if (editingPlanId === id) setIsEditing(false);
            } else {
                showToast(res.message || 'Failed to delete plan', 'error');
            }
        } catch (err) {
            console.error('Delete error:', err);
            showToast('Failed to delete plan due to network error', 'error');
        } finally {
            setSubLoading(false);
        }
    };

    const terminateSub = (id) => {
        if (window.confirm('Revoke this partner license? Access will be decoupled immediately.')) {
            // Terminate logic
            setSubs(prev => prev.filter(s => s._id !== id));
        }
    };

    const filteredSubs = useMemo(() => {
        return subs.filter(s =>
            (s.businessName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.fullName || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [subs, searchQuery]);

    if (loading) return <div className="p-20 text-center animate-pulse text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Ledger...</div>;

    return (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Vendor Licensing</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Managing Multi-Cycle Monetization</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Icon name="search" size="xs" color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Grep subscribers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold focus:ring-2 focus:ring-primary-400/10 outline-none w-48 transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    {/* Active Plans List */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscription Tiers</h2>
                            <button 
                                onClick={handleAddNewClick}
                                className="h-6 w-6 rounded-lg bg-primary-50 text-primary-400 flex items-center justify-center hover:bg-primary-400 hover:text-white transition-all"
                            >
                                <Icon name="plus" size="xs" color="current" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {plans.map((p) => (
                                <div key={p._id} className={`p-4 rounded-2xl border transition-all group ${editingPlanId === p._id ? 'border-primary-400 bg-primary-50/10' : 'border-slate-50 hover:border-slate-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <div onClick={() => handleEditClick(p)} className="flex-1 cursor-pointer">
                                            <p className="text-[11px] font-black text-slate-900">{p.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400">₹{p.price.toLocaleString()} / {p.durationValue} {p.durationUnit}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={() => handleEditClick(p)}
                                                className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-primary-50 hover:text-primary-400 transition-all opacity-0 group-hover:opacity-100"
                                                title="Edit Plan"
                                            >
                                                <Icon name="search" size="xs" color="currentColor" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeletePlan(p._id)}
                                                className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                                                title="Delete Plan"
                                            >
                                                <Icon name="logout" size="xs" color="currentColor" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Edit/Create Form */}
                    {isEditing && (
                        <div className="bg-white p-6 rounded-3xl border border-primary-400 shadow-xl shadow-primary-400/5 space-y-5 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                    {editingPlanId ? 'Reconfigure Tier' : 'Deploy New Tier'}
                                </h3>
                                <button onClick={() => setIsEditing(false)} className="text-[10px] font-black text-slate-400 hover:text-rose-400 uppercase tracking-widest">Cancel</button>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Plan Identity</label>
                                    <input 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 outline-none focus:border-primary-400/50 transition-all"
                                        placeholder="e.g. Platinum Access"
                                        value={editData.name}
                                        onChange={(e) => setEditData({...editData, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Monetization (₹)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 outline-none focus:border-primary-400/50 transition-all"
                                        value={editData.price}
                                        onChange={(e) => setEditData({...editData, price: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 outline-none focus:border-primary-400/50 transition-all"
                                            value={editData.durationValue}
                                            onChange={(e) => setEditData({...editData, durationValue: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Cycle</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 outline-none focus:border-primary-400/50 transition-all"
                                            value={editData.durationUnit}
                                            onChange={(e) => setEditData({...editData, durationUnit: e.target.value})}
                                        >
                                            <option value="month">Month(s)</option>
                                            <option value="year">Year(s)</option>
                                        </select>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleUpdatePlan}
                                    disabled={subLoading}
                                    className={`w-full bg-slate-900 text-white rounded-xl py-3 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 active:scale-95 transition-all ${subLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {subLoading ? 'Processing...' : (editingPlanId ? 'Commit Changes' : 'Initialize Plan')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm min-h-[300px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Partner Details</th>
                                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Plan Status</th>
                                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Expiry Date</th>
                                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Ops</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredSubs.length > 0 ? filteredSubs.map((sub) => (
                                    <tr key={sub._id} className="hover:bg-primary-50/5 transition-colors group">
                                        <td className="px-6 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-[12px] font-black text-slate-900">{sub.businessName}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{sub.fullName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Active</span>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{sub.subscription?.planName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">
                                            {sub.subscription?.endDate ? new Date(sub.subscription.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button
                                                onClick={() => terminateSub(sub._id)}
                                                className="text-[9px] font-black text-rose-400 uppercase hover:text-rose-600 transition-colors opacity-20 group-hover:opacity-100"
                                            >
                                                Revoke
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="py-20 text-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No subscribers found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <ToastComponent />
        </div>
    );
};

export default AdminSubscriptions;
