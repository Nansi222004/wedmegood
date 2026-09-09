import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/adminApi';
import Icon from '../../../components/ui/Icon';

const AdminPayments = () => {
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({ totalSettled: '₹0.00L', pendingPayouts: '₹0', pendingCount: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/admin/login');
            return;
        }
        fetchPayments(token);
    }, []);

    const fetchPayments = async (token) => {
        try {
            const result = await adminApi.getPayments(token);
            if (result.success) {
                setPayments(result.data.payments);
                setStats(result.data.stats);
            } else if (result.status === 401) {
                navigate('/admin/login');
            }
        } catch (err) {
            console.error('Error fetching payments:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPayments = useMemo(() => {
        return payments.filter(p =>
            p.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [payments, searchQuery]);

    const finalizePayment = (id) => {
        // Local state update for immediate feedback
        setPayments(prev => prev.map(p => {
            if (p.id === id) return { ...p, status: 'Settled' };
            return p;
        }));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Payout Registry</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Financial Flow Control</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Icon name="search" size="xs" color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Grep transactions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold focus:ring-2 focus:ring-primary-400/10 outline-none w-56 transition-all"
                        />
                    </div>
                    <button className="h-8 px-4 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest shadow-md">
                        Settlement Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:border-emerald-500/20">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Settled Volume</p>
                    <h3 className="text-xl font-black text-slate-900 mt-1 tracking-tight">{stats.totalSettled}</h3>
                    <div className="mt-3 flex items-center gap-1.5 text-emerald-500 text-[9px] font-bold">
                        <Icon name="chart" size="xs" />
                        <span>Real-time Velocity</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 relative overflow-hidden group shadow-sm transition-all hover:border-primary-400/20">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary-400/5 rounded-bl-[2rem]" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest relative z-10">Pending Payouts</p>
                    <h3 className="text-xl font-black text-slate-900 mt-1 tracking-tight relative z-10">
                        {stats.pendingPayouts}
                    </h3>
                    <div className="mt-4 flex items-center gap-2">
                         <span className="text-[9px] font-black text-primary-400 uppercase tracking-widest">{stats.pendingCount} Nodes Active</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm min-h-[300px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Txn ID</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Partner</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Amount</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Settled On</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Registry Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Financial Records...</td>
                                </tr>
                            ) : filteredPayments.length > 0 ? filteredPayments.map((txn) => (
                                <tr key={txn.id} className="hover:bg-primary-50/10 transition-colors group">
                                    <td className="px-6 py-3 text-[11px] font-black text-slate-900">{txn.id}</td>
                                    <td className="px-5 py-3 text-[11px] font-bold text-slate-600">{txn.vendor}</td>
                                    <td className="px-5 py-3 text-[11px] font-black text-slate-900">{txn.amount}</td>
                                    <td className="px-5 py-3 text-[10px] font-bold text-slate-400">{txn.date}</td>
                                    <td className="px-6 py-3 text-right">
                                        {txn.status === 'Pending' ? (
                                            <button
                                                onClick={() => finalizePayment(txn.id)}
                                                className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                            >
                                                Finalize Node
                                            </button>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                Settled
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">No transactions discovered</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPayments;
