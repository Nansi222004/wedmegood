import { useState, useEffect } from 'react';
import Icon from '../../../components/ui/Icon';
import { adminApi } from '../services/adminApi';

const AdminLogs = () => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('ALL');
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
    const [selectedLog, setSelectedLog] = useState(null);

    const token = localStorage.getItem('adminToken');

    const fetchLogs = async (page = 1) => {
        try {
            setIsLoading(true);
            const params = { page, limit: 15 };
            if (searchTerm.trim()) params.search = searchTerm.trim();
            if (filterLevel !== 'ALL') params.level = filterLevel;

            const res = await adminApi.getAuditLogs(token, params);
            if (res.success) {
                setLogs(res.data || []);
                if (res.pagination) {
                    setPagination(res.pagination);
                }
            }
        } catch (err) {
            console.error('Error fetching logs:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, filterLevel]);

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + 
               date.toLocaleDateString([], { day: '2-digit', month: 'short' });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Security & Audit Registry</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Append-Only Immutable Platform Operations Trail</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                        Immutable Ledger
                    </span>
                </div>
            </div>

            <div className="bg-[#1A0F0F] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.02]">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Audit Stream Active</span>
                        </div>
                        <div className="h-4 w-px bg-white/10" />
                        <select 
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="bg-transparent border-none text-[10px] font-black text-white/70 uppercase tracking-widest outline-none cursor-pointer hover:text-white transition-colors appearance-none pr-4"
                        >
                            <option value="ALL" className="bg-[#1A0F0F] text-white">Level: ALL</option>
                            <option value="Critical" className="bg-[#1A0F0F] text-white">Level: CRITICAL</option>
                            <option value="Warning" className="bg-[#1A0F0F] text-white">Level: WARNING</option>
                            <option value="Success" className="bg-[#1A0F0F] text-white">Level: SUCCESS</option>
                            <option value="Info" className="bg-[#1A0F0F] text-white">Level: INFO</option>
                        </select>
                    </div>

                    <div className="relative group w-full sm:w-auto">
                        <Icon name="search" size="xs" color="white" className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity" />
                        <input 
                            type="text" 
                            placeholder="Grep audit events..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white/5 border border-white/10 pl-9 pr-4 py-2 rounded-xl text-[11px] font-bold text-white placeholder:text-white/20 focus:bg-white/10 focus:border-primary-400/30 outline-none w-full sm:w-64 transition-all" 
                        />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.03]">
                                <th className="px-6 py-5 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/10">Time & ID</th>
                                <th className="px-5 py-5 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/10">Admin Identity</th>
                                <th className="px-5 py-5 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/10">Action & Target</th>
                                <th className="px-5 py-5 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/10">Severity</th>
                                <th className="px-6 py-5 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/10 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center text-white/30 text-[11px] font-black uppercase tracking-[0.3em]">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-4 w-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                                            Synchronizing Registry...
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center text-white/30 text-[11px] font-black uppercase tracking-[0.3em]">No matching events found</td>
                                </tr>
                            ) : logs.map((log) => (
                                <tr key={log._id} className="hover:bg-white/[0.04] transition-all group/row">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-[12px] font-black text-white group-hover/row:text-primary-300 transition-colors">{formatTime(log.createdAt)}</span>
                                            <span className="text-[9px] font-bold text-white/20 mt-1 uppercase">#{log._id.slice(-6)}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-primary-400/10 flex items-center justify-center text-[10px] font-black text-primary-400 border border-primary-400/20">
                                                {(log.adminEmail || log.user || 'A').charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-[11px] font-black text-primary-400">{log.adminEmail || log.user || 'System'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-[12px] font-semibold text-slate-200 leading-snug">{log.action}</p>
                                        <p className="text-[9px] font-black text-white/40 mt-1 uppercase tracking-wider">
                                            {log.entityType ? `[${log.entityType}] ` : ''}{log.target || log.reason || ''}
                                        </p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                                            (log.level || '').toUpperCase() === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                            (log.level || '').toUpperCase() === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            (log.level || '').toUpperCase() === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                            'bg-purple-500/10 text-purple-300 border-purple-500/20'
                                        }`}>
                                            {log.level || 'Info'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {(log.before || log.after || log.metadata) ? (
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="text-[10px] font-bold text-white/50 hover:text-white underline cursor-pointer"
                                            >
                                                View Diff
                                            </button>
                                        ) : (
                                            <span className="font-mono text-[10px] text-white/30">{log.ip || 'internal'}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between text-xs text-white/50 bg-white/[0.01]">
                        <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)</span>
                        <div className="flex gap-2">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => fetchLogs(pagination.page - 1)}
                                className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-bold disabled:opacity-30"
                            >
                                Prev
                            </button>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => fetchLogs(pagination.page + 1)}
                                className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-bold disabled:opacity-30"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Diff Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 text-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-white/10 space-y-4 animate-in zoom-in-95">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                            <div>
                                <h3 className="text-sm font-black text-white">{selectedLog.action}</h3>
                                <p className="text-[10px] text-white/50">By {selectedLog.adminEmail || selectedLog.user} at {new Date(selectedLog.createdAt).toLocaleString()}</p>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="text-white/50 hover:text-white text-lg font-bold">×</button>
                        </div>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar text-xs font-mono">
                            {selectedLog.reason && (
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <span className="text-white/40 block text-[9px] uppercase font-sans">Reason:</span>
                                    <span>{selectedLog.reason}</span>
                                </div>
                            )}

                            {selectedLog.before && (
                                <div className="p-3 bg-rose-950/40 border border-rose-900/40 rounded-xl">
                                    <span className="text-rose-400 block text-[9px] uppercase font-sans font-bold">Before Snapshot (Sanitized):</span>
                                    <pre className="mt-1 whitespace-pre-wrap text-[11px] text-rose-200">{JSON.stringify(selectedLog.before, null, 2)}</pre>
                                </div>
                            )}

                            {selectedLog.after && (
                                <div className="p-3 bg-emerald-950/40 border border-emerald-900/40 rounded-xl">
                                    <span className="text-emerald-400 block text-[9px] uppercase font-sans font-bold">After Snapshot (Sanitized):</span>
                                    <pre className="mt-1 whitespace-pre-wrap text-[11px] text-emerald-200">{JSON.stringify(selectedLog.after, null, 2)}</pre>
                                </div>
                            )}

                            {selectedLog.metadata && (
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <span className="text-white/40 block text-[9px] uppercase font-sans">Metadata:</span>
                                    <pre className="mt-1 whitespace-pre-wrap text-[11px] text-white/70">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button onClick={() => setSelectedLog(null)} className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLogs;

