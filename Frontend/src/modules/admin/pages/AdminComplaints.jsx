import { useState, useEffect } from 'react';
import Icon from '../../../components/ui/Icon';
import { adminApi } from '../services/adminApi';

const AdminComplaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [modalStatus, setModalStatus] = useState('');
    const [modalNotes, setModalNotes] = useState('');
    const [updating, setUpdating] = useState(false);

    const token = localStorage.getItem('adminToken');

    const fetchComplaints = async (page = 1) => {
        try {
            setLoading(true);
            const params = { page, limit: 10 };
            if (statusFilter) params.status = statusFilter;

            const res = await adminApi.getComplaints(token, params);
            if (res.success) {
                setComplaints(res.data || []);
                if (res.pagination) {
                    setPagination(res.pagination);
                }
            } else {
                alert(res.message || 'Failed to fetch complaints');
            }
        } catch (err) {
            console.error('Failed to fetch complaints:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints(1);
    }, [statusFilter]);

    const handleOpenModal = (complaint) => {
        setSelectedComplaint(complaint);
        setModalStatus(complaint.status || 'Pending');
        setModalNotes(complaint.adminNotes || '');
    };

    const handleSaveResolution = async (e) => {
        e.preventDefault();
        if (!selectedComplaint) return;

        try {
            setUpdating(true);
            const payload = {
                status: modalStatus,
                adminNotes: modalNotes
            };
            const res = await adminApi.updateComplaintStatus(selectedComplaint._id, payload, token);
            if (res.success) {
                setSelectedComplaint(null);
                await fetchComplaints(pagination.page);
            } else {
                alert(res.message || 'Failed to update complaint status');
            }
        } catch (err) {
            console.error('Resolution error:', err);
            alert('A network or server error occurred');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Customer Care & Dispute Resolution</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Platform Complaints & Incident Escalation</p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-400/20"
                    >
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="In-Review">In-Review</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Dismissed">Dismissed</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[850px]">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Subject & Category</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Complainant</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Vendor Involved</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Priority</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Filed On</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                                <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-20 text-center">
                                        <div className="animate-spin h-6 w-6 border-2 border-primary-400 border-t-transparent rounded-full mx-auto" />
                                    </td>
                                </tr>
                            ) : complaints.length > 0 ? complaints.map((complaint) => (
                                <tr key={complaint._id} className="hover:bg-primary-50/10 transition-colors">
                                    <td className="px-6 py-3">
                                        <p className="text-[12px] font-black text-slate-900 leading-tight truncate max-w-[220px]">
                                            {complaint.subject || 'Platform Grievance'}
                                        </p>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                            {complaint.category || 'General'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <p className="text-[11px] font-black text-slate-800">
                                            {complaint.userId?.name || complaint.userId?.fullName || 'Client'}
                                        </p>
                                        <p className="text-[9px] text-slate-400">{complaint.userId?.email || 'No email'}</p>
                                    </td>
                                    <td className="px-5 py-3">
                                        <p className="text-[11px] font-bold text-slate-700">
                                            {complaint.vendorId?.businessName || 'Platform Service'}
                                        </p>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                                            (complaint.priority || '').toLowerCase() === 'high' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                                            (complaint.priority || '').toLowerCase() === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                            {complaint.priority || 'Normal'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-[10px] font-black text-slate-500">
                                        {new Date(complaint.createdAt).toLocaleDateString('en-IN')}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                                            complaint.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                            complaint.status === 'In-Review' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                                            complaint.status === 'Dismissed' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                                            'bg-amber-50 text-amber-600 border border-amber-200'
                                        }`}>
                                            {complaint.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            onClick={() => handleOpenModal(complaint)}
                                            className="px-3 py-1 bg-slate-100 hover:bg-[#4F35C3] hover:text-white text-slate-700 font-bold text-[10px] rounded-xl transition-all"
                                        >
                                            Resolve
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="py-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        No complaints logged
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} complaints)</span>
                        <div className="flex gap-2">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => fetchComplaints(pagination.page - 1)}
                                className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 font-bold disabled:opacity-30"
                            >
                                Prev
                            </button>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => fetchComplaints(pagination.page + 1)}
                                className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 font-bold disabled:opacity-30"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Resolution Modal */}
            {selectedComplaint && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleSaveResolution} className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-black text-slate-900">Resolve Customer Dispute</h3>
                                <p className="text-[10px] text-slate-400">ID: #{selectedComplaint._id.slice(-6)}</p>
                            </div>
                            <button type="button" onClick={() => setSelectedComplaint(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Grievance Description</span>
                                <p className="text-slate-800 leading-relaxed">{selectedComplaint.description || 'No detailed description provided.'}</p>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">Update Status</label>
                                <select
                                    value={modalStatus}
                                    onChange={(e) => setModalStatus(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#4F35C3]"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="In-Review">In-Review</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Dismissed">Dismissed</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">Administrative Notes & Follow-up</label>
                                <textarea
                                    rows="3"
                                    value={modalNotes}
                                    onChange={(e) => setModalNotes(e.target.value)}
                                    placeholder="Document resolution outcome, vendor mediation, or settlement notes..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#4F35C3] resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setSelectedComplaint(null)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={updating}
                                className="px-5 py-2 bg-[#4F35C3] hover:bg-[#3f2aa6] text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md disabled:opacity-50"
                            >
                                {updating ? 'Saving...' : 'Update Ticket'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AdminComplaints;
