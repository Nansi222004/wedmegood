import { useState, useMemo, useEffect } from 'react';
import Icon from '../../../components/ui/Icon';
import { adminApi } from '../services/adminApi';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const token = localStorage.getItem('adminToken');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await adminApi.getUsers(token);
            if (res.success) {
                setUsers(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        return users.filter(u =>
            (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.phone || '').includes(searchQuery) ||
            (u.city || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, searchQuery]);

    const deleteUser = async (id) => {
        if (window.confirm('Erase this client record from the registry? This action cannot be undone.')) {
            try {
                const res = await adminApi.deleteUser(id, token);
                if (res.success) {
                    setUsers(prev => prev.filter(u => u._id !== id));
                    alert('User record successfully purged.');
                } else {
                    alert(res.message || 'Failed to delete user');
                }
            } catch (err) {
                console.error('Delete error:', err);
                alert('A system error occurred.');
            }
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Client Directory</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Platform User Management</p>
                </div>

                <div className="relative">
                    <Icon name="search" size="xs" color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold focus:ring-2 focus:ring-primary-400/10 outline-none w-56 transition-all"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm min-h-[300px]">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">User Profile</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Contact Details</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Created At</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Identity</th>
                                <th className="px-6 py-4 text-right border-b border-slate-100">Ops</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center">
                                        <div className="animate-spin h-6 w-6 border-2 border-primary-400 border-t-transparent rounded-full mx-auto"></div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                <tr key={user._id} className="hover:bg-primary-50/10 transition-colors group">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 p-0.5 overflow-hidden flex items-center justify-center shadow-sm text-primary-400 font-black text-lg">
                                                {user.fullName?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-[12px] font-black text-slate-900 leading-tight">{user.fullName}</p>
                                                <p className="text-[9px] font-bold text-primary-400 uppercase tracking-widest">{user.city || 'Unknown City'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <p className="text-[11px] font-bold text-slate-600 leading-none">{user.email}</p>
                                        <p className="text-[9px] font-black text-slate-400 mt-1">{user.phone}</p>
                                    </td>
                                    <td className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button 
                                                onClick={() => deleteUser(user._id)}
                                                className="h-8 w-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                title="Purge User Record"
                                            >
                                                <Icon name="logout" size="xs" color="currentColor" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No clients found in registry</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;
