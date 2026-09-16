import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/adminApi';
import Icon from '../../../components/ui/Icon';

const AdminPayments = () => {
    const [activeTab, setActiveTab] = useState('payments'); // 'payments' or 'withdrawals'
    const [payments, setPayments] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [stats, setStats] = useState({
        totalSettled: '₹0.00L',
        pendingPayouts: '₹0',
        pendingCount: 0,
        totalGMV: 0,
        netRevenue: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
    const [utrNumber, setUtrNumber] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const navigate = useNavigate();

    const token = localStorage.getItem('adminToken');

    const fetchData = useCallback(async () => {
        if (!token) {
            navigate('/admin/login');
            return;
        }

        try {
            setIsLoading(true);
            const [paymentsRes, withdrawalsRes, summaryRes] = await Promise.all([
                adminApi.getPayments(token),
                adminApi.getWithdrawals(token).catch(() => ({ success: false })),
                adminApi.getFinancialSummary(token).catch(() => ({ success: false }))
            ]);

            if (paymentsRes.success && paymentsRes.data) {
                setPayments(paymentsRes.data.payments || []);
                if (paymentsRes.data.stats) {
                    setStats(prev => ({
                        ...prev,
                        ...paymentsRes.data.stats
                    }));
                }
            }

            if (withdrawalsRes?.success && Array.isArray(withdrawalsRes.data)) {
                setWithdrawals(withdrawalsRes.data);
            }

            if (summaryRes?.success && summaryRes.data) {
                setStats(prev => ({
                    ...prev,
                    totalGMV: summaryRes.data.totalGMV,
                    netRevenue: summaryRes.data.netPlatformRevenue
                }));
            }
        } catch (err) {
            console.error('Error fetching financial records:', err);
        } finally {
            setIsLoading(false);
        }
    }, [token, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredPayments = useMemo(() => {
        return payments.filter(p =>
            p.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [payments, searchQuery]);

    const filteredWithdrawals = useMemo(() => {
        return withdrawals.filter(w =>
            (w.vendorId?.businessName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (w._id || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [withdrawals, searchQuery]);

    const handleUpdateWithdrawal = async (id, status, extraData = {}) => {
        setActionLoading(true);
        try {
            const res = await adminApi.updateWithdrawalStatus(id, {
                status,
                payoutReference: utrNumber || extraData.payoutReference,
                adminNotes: extraData.adminNotes
            }, token);

            if (res.success) {
                setSelectedWithdrawal(null);
                setUtrNumber('');
                await fetchData();
            } else {
                alert(res.message || 'Failed to update withdrawal status');
            }
        } catch (err) {
            alert(err.message || 'Error updating payout');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Financial Treasury & Payouts</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Platform Cashflow & Vendor Settlement Control</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Icon name="search" size="xs" color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Grep records..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold focus:ring-2 focus:ring-slate-900/10 outline-none w-56 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Settled Volume</p>
                    <h3 className="text-xl font-black text-slate-900 mt-1 tracking-tight">{stats.totalSettled}</h3>
                    <div className="mt-2 text-emerald-600 text-[9px] font-bold">
                        <span>All-time Customer Payments</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Platform Net Commission</p>
                    <h3 className="text-xl font-black text-emerald-600 mt-1 tracking-tight">₹{(stats.netRevenue || 0).toLocaleString('en-IN')}</h3>
                    <div className="mt-2 text-slate-400 text-[9px] font-bold">
                        <span>10% Platform Retained Fee</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending Payout Requests</p>
                    <h3 className="text-xl font-black text-amber-600 mt-1 tracking-tight">
                        {stats.pendingPayouts}
                    </h3>
                    <div className="mt-2 text-amber-600 text-[9px] font-black uppercase tracking-widest">
                        <span>{stats.pendingCount} Nodes Active</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Settlement Health</p>
                    <h3 className="text-xl font-black text-indigo-600 mt-1 tracking-tight">Balanced</h3>
                    <div className="mt-2 text-indigo-500 text-[9px] font-bold">
                        <span>Ledger Reconciled</span>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-slate-200 pb-2">
                <button
                    onClick={() => setActiveTab('payments')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === 'payments' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100'
                    }`}
                >
                    Customer Payments ({payments.length})
                </button>
                <button
                    onClick={() => setActiveTab('withdrawals')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === 'withdrawals' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100'
                    }`}
                >
                    Vendor Payout Requests ({withdrawals.length})
                </button>
            </div>

            {/* Content Tab 1: Customer Payments Table */}
            {activeTab === 'payments' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm min-h-[300px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Txn ID</th>
                                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Partner</th>
                                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Amount</th>
                                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Settled On</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Financial Records...</td>
                                    </tr>
                                ) : filteredPayments.length > 0 ? filteredPayments.map((txn) => (
                                    <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-3 text-[11px] font-black text-slate-900 font-mono">{txn.id}</td>
                                        <td className="px-5 py-3 text-[11px] font-bold text-slate-600">{txn.vendor}</td>
                                        <td className="px-5 py-3 text-[11px] font-black text-slate-900">{txn.amount}</td>
                                        <td className="px-5 py-3 text-[10px] font-bold text-slate-400">{txn.date}</td>
                                        <td className="px-6 py-3 text-right">
                                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                                                txn.status === 'Settled' || txn.status === 'Completed' || txn.status === 'Paid'
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                                            }`}>
                                                {txn.status}
                                            </span>
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
            )}

            {/* Content Tab 2: Vendor Withdrawal Requests Table */}
            {activeTab === 'withdrawals' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm min-h-[300px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Request ID</th>
                                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Vendor</th>
                                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Amount</th>
                                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Destination</th>
                                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Payout Requests...</td>
                                    </tr>
                                ) : filteredWithdrawals.length > 0 ? filteredWithdrawals.map((w) => (
                                    <tr key={w._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-3 font-mono text-[11px] font-bold text-slate-800">
                                            #{w._id.slice(-6).toUpperCase()}
                                        </td>
                                        <td className="px-5 py-3">
                                            <p className="text-[11px] font-black text-slate-900">{w.vendorId?.businessName || 'Vendor'}</p>
                                            <p className="text-[9px] text-slate-400">{w.vendorId?.city || ''}</p>
                                        </td>
                                        <td className="px-5 py-3 text-[12px] font-black text-slate-900">
                                            ₹{Number(w.amount).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-5 py-3 text-[10px] text-slate-600">
                                            {w.payoutMethod === 'UPI' ? (
                                                <span>UPI: {w.bankDetails?.upiId || 'N/A'}</span>
                                            ) : (
                                                <span>A/C: ••••{w.bankDetails?.accountNumber ? w.bankDetails.accountNumber.slice(-4) : 'N/A'} ({w.bankDetails?.ifsc || ''})</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                                w.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                                w.status === 'Approved' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                                                w.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                                                'bg-amber-50 text-amber-600 border border-amber-200'
                                            }`}>
                                                {w.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            {w.status === 'Requested' || w.status === 'Approved' || w.status === 'Processing' ? (
                                                <div className="flex justify-end gap-1.5">
                                                    <button
                                                        onClick={() => { setSelectedWithdrawal(w); setUtrNumber(''); }}
                                                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white text-[9px] font-black uppercase tracking-wider transition-all"
                                                    >
                                                        Mark Paid
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateWithdrawal(w._id, 'Rejected')}
                                                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white text-[9px] font-black uppercase tracking-wider transition-all"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-[9px] font-mono text-slate-400">
                                                    {w.payoutReference || 'Finalized'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">No withdrawal requests found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Mark Paid with UTR Modal */}
            {selectedWithdrawal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Record Payout Settlement</h3>
                                <p className="text-[10px] text-slate-400">Vendor: {selectedWithdrawal.vendorId?.businessName}</p>
                            </div>
                            <button onClick={() => setSelectedWithdrawal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Amount to Transfer:</span>
                                <span className="font-black text-slate-900">₹{Number(selectedWithdrawal.amount).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Destination A/C:</span>
                                <span className="font-mono text-slate-700">{selectedWithdrawal.bankDetails?.accountNumber || selectedWithdrawal.bankDetails?.upiId}</span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Bank UTR / Transaction Reference</label>
                            <input
                                type="text"
                                value={utrNumber}
                                onChange={(e) => setUtrNumber(e.target.value)}
                                placeholder="e.g. UTR1234567890"
                                className="w-full h-11 rounded-xl bg-slate-50 border-0 px-4 text-xs font-bold focus:ring-2 focus:ring-slate-900"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => handleUpdateWithdrawal(selectedWithdrawal._id, 'Paid')}
                                disabled={actionLoading}
                                className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider hover:bg-slate-800 disabled:opacity-50"
                            >
                                {actionLoading ? 'Recording...' : 'Confirm Paid'}
                            </button>
                            <button
                                onClick={() => setSelectedWithdrawal(null)}
                                className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPayments;
