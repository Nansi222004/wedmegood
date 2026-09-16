import { useState, useEffect } from 'react';
import Icon from '../../../components/ui/Icon';
import { adminApi } from '../services/adminApi';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [selectedUser, setSelectedUser] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const token = localStorage.getItem('adminToken');

    const fetchUsers = async (page = 1) => {
        try {
            setLoading(true);
            const params = { page, limit: 10 };
            if (searchQuery.trim()) params.search = searchQuery.trim();
            if (statusFilter) params.status = statusFilter;

            const res = await adminApi.getUsers(token, params);
            if (res.success) {
                setUsers(res.data || []);
                if (res.pagination) {
                    setPagination(res.pagination);
                }
            } else {
                alert(res.message || 'Failed to fetch users');
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchUsers(1);
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery, statusFilter]);

    const handleToggleStatus = async (user) => {
        const willBlock = !user.isBlocked;
        const confirmMsg = willBlock 
            ? `Block client ${user.name || user.email}? They will no longer be able to login or create leads.`
            : `Unblock client ${user.name || user.email}?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            setActionLoading(true);
            const res = await adminApi.updateUserStatus(user._id, { isBlocked: willBlock, isActive: !willBlock }, token);
            if (res.success) {
                await fetchUsers(pagination.page);
            } else {
                alert(res.message || 'Failed to update user status');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert('A network or server error occurred');
        } finally {
            setActionLoading(false);
        }
    };

    const handleViewDetails = async (userId) => {
        try {
            setLoadingDetails(true);
            setSelectedUser(null);
            const res = await adminApi.getUserById(userId, token);
            if (res.success) {
                setSelectedUser(res.data);
            } else {
                alert(res.message || 'Failed to fetch client details');
            }
        } catch (err) {
            console.error('Failed to view details:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Client Directory</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Platform User Management & Safeguards</p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-400/20"
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active Only</option>
                        <option value="blocked">Blocked Only</option>
                    </select>

                    <div className="relative">
                        <Icon name="search" size="xs" color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search name, email, phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-semibold focus:ring-2 focus:ring-primary-400/10 outline-none w-60 transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm min-h-[300px]">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">User Profile</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Contact Details</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Role</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Created At</th>
                                <th className="px-6 py-4 text-right border-b border-slate-100">Ops</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <div className="animate-spin h-6 w-6 border-2 border-primary-400 border-t-transparent rounded-full mx-auto"></div>
                                    </td>
                                </tr>
                            ) : users.length > 0 ? users.map((user) => (
                                <tr key={user._id} className="hover:bg-primary-50/10 transition-colors group">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 p-0.5 overflow-hidden flex items-center justify-center shadow-sm text-primary-400 font-black text-lg">
                                                {(user.name || user.email || 'U')[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <button 
                                                    onClick={() => handleViewDetails(user._id)}
                                                    className="text-[12px] font-black text-slate-900 leading-tight hover:text-[#4F35C3] transition-colors text-left"
                                                >
                                                    {user.name || 'Unnamed Client'}
                                                </button>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user.city || 'National'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <p className="text-[11px] font-bold text-slate-600 leading-none">{user.email}</p>
                                        <p className="text-[9px] font-black text-slate-400 mt-1">{user.phone || 'No phone'}</p>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                                            user.isBlocked 
                                                ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                                                : user.isActive === false
                                                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                        }`}>
                                            {user.isBlocked ? 'Blocked' : user.isActive === false ? 'Inactive' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-purple-50 text-purple-600 font-black' : 'bg-slate-100 text-slate-600'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleViewDetails(user._id)}
                                                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] font-bold transition-all"
                                                title="View Full Profile"
                                            >
                                                Details
                                            </button>
                                            {user.role !== 'admin' && (
                                                <button 
                                                    disabled={actionLoading}
                                                    onClick={() => handleToggleStatus(user)}
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                                        user.isBlocked
                                                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                            : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                                    }`}
                                                    title={user.isBlocked ? 'Unblock User' : 'Block User'}
                                                >
                                                    {user.isBlocked ? 'Unblock' : 'Block'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No clients match registry query</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
                        <div className="flex gap-1">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => fetchUsers(pagination.page - 1)}
                                className="px-3 py-1 rounded bg-slate-100 font-bold disabled:opacity-40"
                            >
                                Prev
                            </button>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => fetchUsers(pagination.page + 1)}
                                className="px-3 py-1 rounded bg-slate-100 font-bold disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* User Details Modal */}
            {(selectedUser || loadingDetails) && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h3 className="text-base font-black text-slate-900">Client Detailed Profile</h3>
                            <button 
                                onClick={() => setSelectedUser(null)} 
                                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                            >
                                ×
                            </button>
                        </div>

                        {loadingDetails ? (
                            <div className="py-12 text-center">
                                <div className="animate-spin h-6 w-6 border-2 border-primary-400 border-t-transparent rounded-full mx-auto" />
                            </div>
                        ) : selectedUser && (
                            <div className="space-y-4 text-xs">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xl">
                                        {(selectedUser.name || 'U')[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900">{selectedUser.name}</p>
                                        <p className="text-slate-500">{selectedUser.email} • {selectedUser.phone || 'No phone'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Wedding Details</p>
                                        <p className="text-slate-800 font-bold mt-1">
                                            {selectedUser.weddingDetails?.weddingDate 
                                                ? new Date(selectedUser.weddingDetails.weddingDate).toLocaleDateString()
                                                : 'Date unannounced'}
                                        </p>
                                        <p className="text-slate-500 text-[10px]">
                                            City: {selectedUser.weddingDetails?.city || 'Not specified'}
                                        </p>
                                    </div>

                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Spend & Bookings</p>
                                        <p className="text-slate-800 font-bold mt-1">
                                            ₹{(selectedUser.bookingStats?.totalSpent || 0).toLocaleString('en-IN')}
                                        </p>
                                        <p className="text-slate-500 text-[10px]">
                                            {selectedUser.bookingStats?.totalBookings || 0} Bookings ({selectedUser.bookingStats?.confirmedBookings || 0} Confirmed)
                                        </p>
                                    </div>

                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Reviews Posted</p>
                                        <p className="text-slate-800 font-bold mt-1">
                                            {selectedUser.reviewCount || 0} Reviews
                                        </p>
                                    </div>

                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Support Tickets</p>
                                        <p className="text-slate-800 font-bold mt-1">
                                            {selectedUser.complaintCount || 0} Complaints
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-3">
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;

