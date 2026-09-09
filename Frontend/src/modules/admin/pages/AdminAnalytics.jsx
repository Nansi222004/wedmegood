import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';

const AdminAnalytics = () => {
    const [data, setData] = useState({
        trajectory: [],
        distribution: [],
        metrics: {
            userGrowth: '0%',
            vendorGrowth: '0%',
            totalRevenue: 0,
            conversionLift: '0%'
        }
    });
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/admin/login');
            return;
        }
        fetchAnalytics(token);
    }, []);

    const fetchAnalytics = async (token) => {
        try {
            const res = await fetch('/api/admin/analytics', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            } else if (res.status === 401) {
                navigate('/admin/login');
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const metricCards = [
        { label: 'Revenue Velocity', val: `₹${((data.metrics?.totalRevenue || 0) / 1000).toFixed(1)}K`, g: '+14.2%', i: 'money' },
        { label: 'Vendor Growth', val: data.metrics?.vendorGrowth || '0%', g: '+2.4%', i: 'user' },
        { label: 'User Expansion', val: data.metrics?.userGrowth || '0%', g: '+18.5%', i: 'users' },
        { label: 'Conversion Lift', val: data.metrics?.conversionLift || '0.0%', g: '+0.8%', i: 'sparkles' },
    ];

    const maxRevenue = Math.max(...(data.trajectory || []).map(t => t.revenue || 0), 1);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Growth Insights</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Quantitative Platform Performance</p>
                </div>
                <div className="flex bg-white p-1 rounded-lg border border-slate-200">
                    {['24H', '7D', '30D', '1Y'].map(t => (
                        <button key={t} className={`px-3 py-1 rounded-md text-[9px] font-black tracking-widest transition-all ${t === '30D' ? 'bg-primary-400 text-white shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}>{t}</button>
                    ))}
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse border border-slate-200" />
                    ))
                ) : metricCards.map(m => (
                    <div key={m.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm group hover:border-primary-400/30 transition-all overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-primary-400 opacity-[0.02] rounded-full translate-x-1/2 -translate-y-1/2" />
                        
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary-400 transition-colors">
                                <Icon name={m.i} size="xs" color="current" />
                            </div>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${m.g.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{m.g}</span>
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none relative z-10">{m.label}</p>
                        <h3 className="text-xl font-black text-slate-900 mt-1 tracking-tight relative z-10">{m.val}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Revenue Trajectory */}
                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Revenue Trajectory</h3>
                            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">Daily Fulfillment Velocity (15D)</p>
                        </div>
                        <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary-400" />
                                <span className="text-slate-400">Transaction Volume</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-64 w-full relative">
                        {isLoading ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="h-6 w-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : data.trajectory?.length > 0 ? (
                            <>
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 800 240" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#F9AEAF" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="#F9AEAF" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>

                                    {/* Grid Lines */}
                                    {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                                        <line key={i} x1="0" y1={240 - p * 200 - 20} x2="800" y2={240 - p * 200 - 20} stroke="#f1f5f9" strokeWidth="1" />
                                    ))}

                                    {/* Area */}
                                    <path 
                                        d={`M 0 240 L 0 ${240 - ((data.trajectory[0]?.revenue || 0) / maxRevenue) * 200 - 20} ${data.trajectory.map((t, i) => `L ${(i / (data.trajectory.length - 1)) * 800} ${240 - (t.revenue / maxRevenue) * 200 - 20}`).join(' ')} L 800 240 Z`}
                                        fill="url(#analyticsGradient)"
                                        className="animate-in fade-in duration-1000"
                                    />

                                    {/* Line */}
                                    <path 
                                        d={data.trajectory.map((t, i) => `${i === 0 ? 'M' : 'L'} ${(i / (data.trajectory.length - 1)) * 800} ${240 - (t.revenue / maxRevenue) * 200 - 20}`).join(' ')}
                                        fill="none"
                                        stroke="#F9AEAF"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="animate-in slide-in-from-left duration-1000"
                                    />

                                    {/* Points */}
                                    {data.trajectory.map((t, i) => (
                                        <g key={i} className="group/node">
                                            <circle 
                                                cx={(i / (data.trajectory.length - 1)) * 800}
                                                cy={240 - (t.revenue / maxRevenue) * 200 - 20}
                                                r="4"
                                                fill="white"
                                                stroke="#F9AEAF"
                                                strokeWidth="2"
                                                className="transition-all duration-300 group-hover/node:r-6 cursor-pointer"
                                            />
                                            <foreignObject x={(i / (data.trajectory.length - 1)) * 800 - 40} y={240 - (t.revenue / maxRevenue) * 200 - 60} width="80" height="30" className="opacity-0 group-hover/node:opacity-100 transition-opacity pointer-events-none">
                                                <div className="bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded text-center shadow-xl">
                                                    ₹{t.revenue.toLocaleString()}
                                                </div>
                                            </foreignObject>
                                        </g>
                                    ))}
                                </svg>
                                
                                {/* X-Axis Labels */}
                                <div className="absolute -bottom-6 left-0 right-0 flex justify-between px-1">
                                    {(data.trajectory || []).map((t, i) => (
                                        i % 2 === 0 && <span key={i} className="text-[7px] font-black text-slate-300 uppercase tracking-tighter">{t.day}</span>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Awaiting Transaction Data Flow...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Segment Mix */}
                <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">Segment Mix</h3>
                    <div className="flex-1 space-y-6">
                        {isLoading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="space-y-2">
                                    <div className="h-2 w-20 bg-slate-100 rounded animate-pulse" />
                                    <div className="h-1 w-full bg-slate-50 rounded" />
                                </div>
                            ))
                        ) : (data.distribution || []).map((s, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-1.5 text-slate-500">
                                    <span>{s.label}</span>
                                    <span>{s.percentage}%</span>
                                </div>
                                <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                                    <div className={`h-full ${i === 0 ? 'bg-primary-400' : i === 1 ? 'bg-emerald-400' : 'bg-blue-400'} rounded-full transition-all duration-1000`} style={{ width: `${s.percentage}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="mt-10 w-full py-3 rounded-xl border border-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:border-primary-400/30 hover:text-primary-500 transition-all">
                        Deep Segment Audit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
