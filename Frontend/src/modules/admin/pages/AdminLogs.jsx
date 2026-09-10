import { useState, useEffect } from 'react';
import Icon from '../../../components/ui/Icon';

const AdminLogs = () => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('ALL');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/logs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                setLogs(result.data);
            }
        } catch (err) {
            console.error('Error fetching logs:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearLogs = async () => {
        if (!window.confirm('Are you sure you want to clear all audit logs? This cannot be undone.')) return;
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/logs', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                setLogs([]);
            }
        } catch (err) {
            console.error('Error clearing logs:', err);
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             log.target.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = filterLevel === 'ALL' || log.level.toUpperCase() === filterLevel;
        return matchesSearch && matchesLevel;
    });

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + 
               date.toLocaleDateString([], { day: '2-digit', month: 'short' });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Security Audit</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Historical Node Event Registry</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleClearLogs}
                        className="h-8 px-3 rounded-lg border border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                    >
                        Clear Buffer
                    </button>
                    <button className="h-8 px-3 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest shadow-md">Export Audit</button>
                </div>
            </div>

            <div className="bg-[#1A0F0F] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between gap-6 bg-white/[0.02]">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Monitor Active</span>
                        </div>
                        <div className="h-4 w-px bg-white/10" />
                        <select 
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="bg-transparent border-none text-[10px] font-black text-white/70 uppercase tracking-widest outline-none cursor-pointer hover:text-white transition-colors appearance-none pr-4"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'white\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right center', backgroundSize: '10px' }}
                        >
                            <option value="ALL" className="bg-[#1A0F0F] text-white">Level: ALL</option>
                            <option value="CRITICAL" className="bg-[#1A0F0F] text-white">Level: CRITICAL</option>
                            <option value="WARNING" className="bg-[#1A0F0F] text-white">Level: WARNING</option>
                            <option value="SUCCESS" className="bg-[#1A0F0F] text-white">Level: SUCCESS</option>
                            <option value="INFO" className="bg-[#1A0F0F] text-white">Level: INFO</option>
                        </select>
                    </div>

                    <div className="relative group">
                        <Icon name="search" size="xs" color="white" className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity" />
                        <input 
                            type="text" 
                            placeholder="Grep events..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white/5 border border-white/10 pl-9 pr-4 py-2 rounded-xl text-[11px] font-bold text-white placeholder:text-white/20 focus:bg-white/10 focus:border-primary-400/30 outline-none w-64 transition-all" 
                        />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.03]">
                                <th className="px-6 py-5 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/10">Time & ID</th>
                                <th className="px-5 py-5 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/10">Initiator</th>
                                <th className="px-5 py-5 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/10">Operational Action</th>
                                <th className="px-5 py-5 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/10">Status</th>
                                <th className="px-6 py-5 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/10 text-right">Source</th>
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
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center text-white/30 text-[11px] font-black uppercase tracking-[0.3em]">No matching events found</td>
                                </tr>
                            ) : filteredLogs.map((log) => (
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
                                                {log.user.charAt(0)}
                                            </div>
                                            <span className="text-[11px] font-black text-primary-400">{log.user}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-[13px] font-semibold text-slate-200 leading-snug">{log.action}</p>
                                        <p className="text-[9px] font-black text-white/20 mt-1.5 uppercase tracking-widest">{log.target}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border shadow-sm ${log.level === 'Critical' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                                log.level === 'Warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                    log.level === 'Success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                        'bg-primary-500/10 text-primary-400 border-primary-500/20'
                                            }`}>{log.level}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-[11px] text-white/30 group-hover/row:text-primary-300 transition-colors">
                                        {log.ip}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminLogs;
