import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import { adminApi } from '../services/adminApi';

const AdminDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [recentLogs, setRecentLogs] = useState([]);
    const [analytics, setAnalytics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/admin/login');
            return;
        }
        fetchDashboardData(token);
    }, []);

    const fetchDashboardData = async (token) => {
        try {
            const [sumRes, logsRes, analyticsRes] = await Promise.all([
                adminApi.getDashboardSummary(token),
                adminApi.getAuditLogs(token, { limit: 5 }),
                adminApi.getAnalytics(token)
            ]);

            if (sumRes?.status === 401 || logsRes?.status === 401) {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                navigate('/admin/login');
                return;
            }

            if (sumRes?.success) setSummary(sumRes.data);
            if (logsRes?.success && Array.isArray(logsRes.data)) setRecentLogs(logsRes.data);
            if (analyticsRes?.success) setAnalytics(analyticsRes.data.trajectory || []);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (val) => {
        const num = Number(val) || 0;
        if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
        if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
        if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
        return `₹${num.toLocaleString('en-IN')}`;
    };

    const dashboardStats = [
        { 
            label: 'Platform Revenue', 
            value: formatCurrency(summary?.financials?.platformRevenue ?? 0), 
            sub: `Total Vol: ${formatCurrency(summary?.financials?.totalVolume ?? 0)}`, 
            icon: 'money',
            change: '+14%'
        },
        { 
            label: 'Vendors Status', 
            value: (summary?.vendors?.approved ?? 0).toString(), 
            sub: `${summary?.vendors?.pending ?? 0} Pending • ${summary?.vendors?.suspended ?? 0} Suspended`, 
            icon: 'user',
            change: `${summary?.vendors?.total ?? 0} Total`
        },
        { 
            label: 'Marketplace Bookings', 
            value: (summary?.marketplace?.bookings?.total ?? 0).toString(), 
            sub: `${summary?.marketplace?.leads ?? 0} Leads • ${summary?.marketplace?.quotes ?? 0} Quotes`, 
            icon: 'users',
            change: `${summary?.marketplace?.bookings?.confirmed ?? 0} Confirmed`
        },
        { 
            label: 'Operations & Care', 
            value: (summary?.complaints?.pending ?? 0 + (summary?.complaints?.inReview ?? 0)).toString(), 
            sub: `${summary?.reviews?.pending ?? 0} Pending Reviews`, 
            icon: 'bell',
            change: `${summary?.complaints?.total ?? 0} Tickets`
        },
    ];

    // Chart logic
    const safeAnalytics = Array.isArray(analytics) && analytics.length > 0 ? analytics : [
        { day: 'Mon', revenue: 0 }, { day: 'Tue', revenue: 0 }, { day: 'Wed', revenue: 0 },
        { day: 'Thu', revenue: 0 }, { day: 'Fri', revenue: 0 }, { day: 'Sat', revenue: 0 }, { day: 'Sun', revenue: 0 }
    ];
    const maxRevenue = Math.max(...safeAnalytics.map(d => d.revenue || 0), 1000);
    const chartHeight = 240;
    const chartWidth = 800;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Console Overview</h1>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mt-2">Authoritative Platform Operational Intelligence</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => navigate('/admin/logs')}
                        className="h-9 px-4 rounded-xl bg-white border border-slate-200 text-[9px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                        Audit Trail
                    </button>
                    <button 
                        onClick={() => navigate('/admin/financial/reconciliation')}
                        className="h-9 px-4 rounded-xl admin-cta text-[9px] font-black uppercase tracking-widest shadow-lg hover:shadow-xl transition-all"
                    >
                        Financial Center
                    </button>
                </div>
            </div>

            {/* Stats - Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-[#F9F8FF] rounded-[2rem] animate-pulse border border-[#EAE6FF]" />
                    ))
                ) : dashboardStats.map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-[#EAE6FF] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#4F35C3] opacity-[0.03] rounded-full translate-x-1/3 -translate-y-1/3 group-hover:scale-150 transition-transform duration-700" />
                        
                        <div className="flex items-center justify-between relative z-10">
                            <div className="h-10 w-10 rounded-2xl bg-[#4F35C3]/10 flex items-center justify-center text-[#4F35C3] group-hover:scale-110 group-hover:bg-[#4F35C3] group-hover:text-white transition-all duration-300 shadow-sm">
                                <Icon name={stat.icon} size="sm" color="current" />
                            </div>
                            <span className="text-[9px] font-black px-3 py-1.5 rounded-xl bg-[#4F35C3]/5 text-[#4F35C3] border border-[#4F35C3]/10">
                                {stat.change}
                            </span>
                        </div>
                        
                        <div className="mt-5 relative z-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tighter">{stat.value}</h3>
                            <p className="text-[10px] font-medium text-slate-500 mt-1">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Analytics Trajectory */}
                <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-[#EAE6FF] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group relative overflow-hidden">
                    <div className="flex justify-between items-center mb-10 relative z-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Market Analytics</h3>
                            <p className="text-[#4F35C3] text-[10px] font-black uppercase tracking-widest mt-1">Daily Revenue Trajectory (7D)</p>
                        </div>
                        <div className="flex bg-[#F9F8FF] p-1.5 rounded-2xl border border-[#EAE6FF]">
                            <button className="px-4 h-10 rounded-xl text-[10px] font-black bg-white text-[#4F35C3] shadow-sm transition-all uppercase tracking-widest">Revenue Flow</button>
                        </div>
                    </div>

                    <div className="h-64 w-full relative group/chart">
                        {isLoading ? (
                            <div className="h-full w-full flex items-center justify-center">
                                <div className="h-8 w-8 border-4 border-[#4F35C3] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <>
                                <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#4F35C3" stopOpacity="0.2" />
                                            <stop offset="100%" stopColor="#4F35C3" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    
                                    <path 
                                        d={`M 0 ${chartHeight} ${safeAnalytics.map((d, i) => `L ${(i / Math.max(1, safeAnalytics.length - 1)) * chartWidth} ${chartHeight - ((d.revenue || 0) / maxRevenue) * (chartHeight - 40) - 20}`).join(' ')} L ${chartWidth} ${chartHeight} Z`}
                                        fill="url(#chartGradient)"
                                        className="animate-in fade-in duration-1000"
                                    />

                                    <path 
                                        d={safeAnalytics.map((d, i) => `${i === 0 ? 'M' : 'L'} ${(i / Math.max(1, safeAnalytics.length - 1)) * chartWidth} ${chartHeight - ((d.revenue || 0) / maxRevenue) * (chartHeight - 40) - 20}`).join(' ')}
                                        fill="none"
                                        stroke="#4F35C3"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="animate-in slide-in-from-left duration-1000"
                                    />

                                    {safeAnalytics.map((d, i) => (
                                        <circle 
                                            key={i}
                                            cx={(i / Math.max(1, safeAnalytics.length - 1)) * chartWidth}
                                            cy={chartHeight - ((d.revenue || 0) / maxRevenue) * (chartHeight - 40) - 20}
                                            r="6"
                                            fill="white"
                                            stroke="#4F35C3"
                                            strokeWidth="3"
                                            className="hover:r-8 transition-all cursor-pointer shadow-sm"
                                        />
                                    ))}
                                </svg>
                                
                                <div className="absolute -bottom-6 left-0 right-0 flex justify-between px-1">
                                    {safeAnalytics.map((d, i) => (
                                        <span key={i} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.day}</span>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Live Real Audit Log Stream */}
                <div className="lg:col-span-4 bg-gradient-to-br from-[#fbf9ff] via-[#f5eeff] to-[#eddfff] rounded-[2.5rem] p-8 shadow-md border border-purple-200/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#7c3aed] opacity-[0.04] rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <h3 className="text-sm font-black text-[#581C87] tracking-widest uppercase">System Audit Trail</h3>
                        <div className="h-2 w-2 rounded-full bg-[#7c3aed] shadow-[0_0_8px_rgba(124,58,237,0.6)] animate-pulse" />
                    </div>

                    <div className="space-y-4 relative z-10">
                        {isLoading ? (
                            <div className="text-center py-8 text-xs text-slate-400 font-bold">Connecting audit stream...</div>
                        ) : recentLogs.length === 0 ? (
                            <div className="text-center py-8 text-xs text-slate-400 font-bold">No recent audit records</div>
                        ) : (
                            recentLogs.map((log, i) => (
                                <div key={log._id || i} className="flex gap-4 group/item items-start">
                                    <div className="h-8 w-1 rounded-full bg-white/50 border-l-2 border-[#7c3aed]/50 transition-all group-hover/item:h-10 shadow-sm" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] text-slate-700 font-semibold leading-tight mt-0.5 truncate">
                                            <span className="text-slate-900 font-black">{log.adminEmail?.split('@')[0] || 'Admin'}:</span> {log.action || 'System Action'}
                                        </p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                            {log.entityType ? `[${log.entityType}] ` : ''}{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <button 
                        onClick={() => navigate('/admin/logs')}
                        className="w-full mt-8 py-3 rounded-xl admin-cta text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all relative z-10"
                    >
                        Full Audit Trail
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

