import { useState, useEffect } from 'react';
import Icon from '../../../components/ui/Icon';
import { adminApi } from '../services/adminApi';

const AdminLeads = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [assignedTypeFilter, setAssignedTypeFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

    const token = localStorage.getItem('adminToken');

    const fetchLeads = async (page = 1) => {
        try {
            setLoading(true);
            const params = { page, limit: 12 };
            if (searchQuery.trim()) params.search = searchQuery.trim();
            if (statusFilter) params.status = statusFilter;
            if (assignedTypeFilter) params.assignedType = assignedTypeFilter;

            const res = await adminApi.getLeads(token, params);
            if (res.success) {
                setLeads(res.data || []);
                if (res.pagination) {
                    setPagination(res.pagination);
                }
            } else {
                alert(res.message || 'Failed to fetch leads');
            }
        } catch (err) {
            console.error('Failed to fetch leads:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchLeads(1);
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery, statusFilter, assignedTypeFilter]);

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Marketplace Leads Dispatcher</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Platform Inquiries & Opportunity Pipeline</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-400/20"
                    >
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Responded">Responded</option>
                        <option value="Converted">Converted</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Closed">Closed</option>
                    </select>

                    <select
                        value={assignedTypeFilter}
                        onChange={(e) => setAssignedTypeFilter(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-400/20"
                    >
                        <option value="">All Types</option>
                        <option value="direct">Direct Vendor</option>
                        <option value="broadcast">Broadcast</option>
                    </select>

                    <div className="relative">
                        <Icon name="search" size="xs" color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search client, phone, city..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-semibold focus:ring-2 focus:ring-primary-400/10 outline-none w-52 transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[850px]">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Client / Contact</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Category & Location</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Event Date</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Type</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Assigned Vendor</th>
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
                            ) : leads.length > 0 ? leads.map((lead) => (
                                <tr key={lead._id} className="hover:bg-primary-50/10 transition-colors">
                                    <td className="px-6 py-3">
                                        <p className="text-[12px] font-black text-slate-900 leading-tight">
                                            {lead.userId?.name || lead.userId?.fullName || lead.contactName || 'Marketplace Client'}
                                        </p>
                                        <p className="text-[10px] text-slate-500">{lead.userId?.phone || lead.contactPhone || 'No phone'}</p>
                                    </td>
                                    <td className="px-5 py-3">
                                        <p className="text-[11px] font-bold text-slate-800">{lead.categoryId?.name || lead.category || 'General'}</p>
                                        <p className="text-[9px] text-slate-400 uppercase font-black">{lead.eventCity || lead.city || 'National'}</p>
                                    </td>
                                    <td className="px-5 py-3 text-[10px] font-black text-slate-600">
                                        {lead.eventDate ? new Date(lead.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unspecified'}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                                            lead.assignedType === 'direct' ? 'bg-purple-50 text-purple-600 border border-purple-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
                                        }`}>
                                            {lead.assignedType || 'direct'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-[11px] font-bold text-slate-700">
                                        {lead.vendorId?.businessName || (lead.assignedVendors?.length > 0 ? `${lead.assignedVendors.length} Broadcasted` : 'Unassigned')}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                            lead.status === 'Converted' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                            lead.status === 'Responded' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                            lead.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                            'bg-amber-50 text-amber-600 border-amber-200'
                                        }`}>
                                            {lead.status || 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        No marketplace leads found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} leads)</span>
                        <div className="flex gap-2">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => fetchLeads(pagination.page - 1)}
                                className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 font-bold disabled:opacity-30"
                            >
                                Prev
                            </button>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => fetchLeads(pagination.page + 1)}
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

export default AdminLeads;
