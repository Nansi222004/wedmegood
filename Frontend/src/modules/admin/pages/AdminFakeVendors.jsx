import { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/ui/Icon';
import { toast } from '../../../components/ui/Toast';
import getFriendlyErrorMessage from '../../../utils/errorHandler';
import { adminApi } from '../services/adminApi';

const EMPTY_FORM = { name: '', businessName: '', phone: '', city: '', category: '', reason: '', isPublished: true };

const AdminFakeVendors = () => {
    const [listings, setListings] = useState([]);
    const [stats, setStats] = useState({ totalListings: 0, published: 0, accessPurchases: 0, accessRevenue: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [editing, setEditing] = useState(null); // null = closed, {} = new, listing = edit
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const token = localStorage.getItem('adminToken');

    const fetchListings = useCallback(async () => {
        try {
            setLoading(true);
            const params = {};
            if (search.trim()) params.search = search.trim();
            if (statusFilter) params.status = statusFilter;
            const res = await adminApi.getFakeVendorListings(token, params);
            if (res.success) {
                setListings(res.data || []);
                if (res.stats) setStats(res.stats);
            } else {
                toast.error(getFriendlyErrorMessage(res, 'Failed to load fake vendor listings.'));
            }
        } catch (err) {
            toast.error(getFriendlyErrorMessage(err, 'Unable to load fake vendor listings.'));
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, token]);

    useEffect(() => {
        const timer = setTimeout(fetchListings, 300);
        return () => clearTimeout(timer);
    }, [fetchListings]);

    const openNew = () => {
        setForm(EMPTY_FORM);
        setEditing({});
    };

    const openEdit = (listing) => {
        setForm({
            name: listing.name || '',
            businessName: listing.businessName || '',
            phone: listing.phone || '',
            city: listing.city || '',
            category: listing.category || '',
            reason: listing.reason || '',
            isPublished: listing.isPublished !== false
        });
        setEditing(listing);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.reason.trim()) {
            toast.warning('Name and reason are required.');
            return;
        }
        try {
            setSaving(true);
            const res = editing?._id
                ? await adminApi.updateFakeVendorListing(editing._id, form, token)
                : await adminApi.createFakeVendorListing(form, token);
            if (res.success) {
                toast.success(res.message || 'Saved.');
                setEditing(null);
                await fetchListings();
            } else {
                toast.error(getFriendlyErrorMessage(res, 'Failed to save the listing.'));
            }
        } catch (err) {
            toast.error(getFriendlyErrorMessage(err, 'A network or server error occurred.'));
        } finally {
            setSaving(false);
        }
    };

    const togglePublished = async (listing) => {
        try {
            const res = await adminApi.updateFakeVendorListing(listing._id, { isPublished: !listing.isPublished }, token);
            if (res.success) {
                toast.success(listing.isPublished ? 'Listing hidden from users.' : 'Listing published.');
                await fetchListings();
            } else {
                toast.error(getFriendlyErrorMessage(res, 'Failed to update the listing.'));
            }
        } catch (err) {
            toast.error(getFriendlyErrorMessage(err, 'A network or server error occurred.'));
        }
    };

    const handleDelete = async (listing) => {
        if (!window.confirm(`Delete the listing for ${listing.businessName || listing.name}?`)) return;
        try {
            const res = await adminApi.deleteFakeVendorListing(listing._id, token);
            if (res.success) {
                toast.success('Listing deleted.');
                await fetchListings();
            } else {
                toast.error(getFriendlyErrorMessage(res, 'Failed to delete the listing.'));
            }
        } catch (err) {
            toast.error(getFriendlyErrorMessage(err, 'A network or server error occurred.'));
        }
    };

    const inputClass = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#4F35C3]';

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Fake Vendors</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Listings shown to users on the Fake Vendors page</p>
                </div>
                <button
                    onClick={openNew}
                    className="h-9 px-5 rounded-xl bg-[#4F35C3] text-white text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-[#3f2aa6] transition-all"
                >
                    Add Listing
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Listings', value: stats.totalListings },
                    { label: 'Published', value: stats.published },
                    { label: 'Paid Passes Sold', value: stats.accessPurchases },
                    { label: 'Pass Revenue', value: `₹${Number(stats.accessRevenue || 0).toLocaleString('en-IN')}` }
                ].map(card => (
                    <div key={card.label} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                        <p className="text-lg font-black text-slate-900 mt-1">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="search" size="xs" /></span>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, phone, city, category"
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#4F35C3]"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none"
                >
                    <option value="">All</option>
                    <option value="published">Published</option>
                    <option value="hidden">Hidden</option>
                </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead className="bg-slate-50/50">
                            <tr>
                                {['Vendor', 'Phone / City', 'Reason (shown to users)', 'Complaints', 'Status', 'Action'].map((h, i) => (
                                    <th key={h} className={`px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <div className="animate-spin h-6 w-6 border-2 border-[#4F35C3] border-t-transparent rounded-full mx-auto" />
                                    </td>
                                </tr>
                            ) : listings.length > 0 ? listings.map((l) => (
                                <tr key={l._id}>
                                    <td className="px-5 py-3">
                                        <p className="text-[12px] font-black text-slate-900">{l.businessName || l.name}</p>
                                        <p className="text-[9px] text-slate-400">
                                            {l.businessName ? l.name : ''}{l.category ? ` · ${l.category}` : ''}
                                            {l.vendorId ? ' · Registered vendor' : ' · Not on app'}
                                        </p>
                                    </td>
                                    <td className="px-5 py-3 text-[11px] text-slate-700">
                                        <p className="font-bold">{l.phone || '—'}</p>
                                        <p className="text-[9px] text-slate-400">{l.city || ''}</p>
                                    </td>
                                    <td className="px-5 py-3 text-[11px] text-slate-600 max-w-[320px]">
                                        <p className="line-clamp-2">{l.reason}</p>
                                    </td>
                                    <td className="px-5 py-3 text-[11px] font-black text-slate-700">{(l.complaintIds || []).length}</td>
                                    <td className="px-5 py-3">
                                        <button
                                            onClick={() => togglePublished(l)}
                                            className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${l.isPublished ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}
                                            title={l.isPublished ? 'Click to hide' : 'Click to publish'}
                                        >
                                            {l.isPublished ? 'Published' : 'Hidden'}
                                        </button>
                                    </td>
                                    <td className="px-5 py-3 text-right space-x-2 whitespace-nowrap">
                                        <button onClick={() => openEdit(l)} className="px-3 py-1 bg-slate-100 hover:bg-[#4F35C3] hover:text-white text-slate-700 font-bold text-[10px] rounded-xl transition-all">Edit</button>
                                        <button onClick={() => handleDelete(l)} className="px-3 py-1 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 font-bold text-[10px] rounded-xl transition-all">Delete</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        No fake vendors listed. Confirm one from a complaint or add one here.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {editing && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-3 max-h-[92vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h3 className="text-base font-black text-slate-900">{editing._id ? 'Edit Listing' : 'Add Fake Vendor'}</h3>
                            <button type="button" onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
                        </div>
                        <input className={inputClass} placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} />
                        <input className={inputClass} placeholder="Business name" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} maxLength={120} />
                        <div className="grid grid-cols-2 gap-2">
                            <input className={inputClass} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} />
                            <input className={inputClass} placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} maxLength={80} />
                        </div>
                        <input className={inputClass} placeholder="Service / category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} maxLength={80} />
                        <textarea className={`${inputClass} resize-none`} rows="3" placeholder="Reason (shown to users) *" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} maxLength={1000} />
                        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 cursor-pointer">
                            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                            Show on the users' Fake Vendors page
                        </label>
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">Cancel</button>
                            <button type="submit" disabled={saving} className="px-5 py-2 bg-[#4F35C3] hover:bg-[#3f2aa6] text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AdminFakeVendors;
