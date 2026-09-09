import { useState, useMemo } from 'react';
import Icon from '../../../components/ui/Icon';

const AdminGateways = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [gateways, setGateways] = useState([
        { id: 'gw_1', name: 'Razorpay Main', provider: 'Razorpay', status: 'Active', volume: '₹4.2M', mode: 'Live', lastSync: '2m ago' },
        { id: 'gw_2', name: 'Stripe Global', provider: 'Stripe', status: 'Shadow', volume: '₹1.1M', mode: 'Test', lastSync: '1h ago' },
        { id: 'gw_3', name: 'PayPal Direct', provider: 'PayPal', status: 'Inactive', volume: '₹0', mode: 'Maintenance', lastSync: 'Never' }
    ]);

    const [checkoutProtocol, setCheckoutProtocol] = useState({
        platformFee: 12,
        taxRate: 18,
        autoSettlement: true,
        instantRefunds: false,
        escrowPeriod: 7
    });

    const filteredGateways = useMemo(() =>
        gateways.filter(gw => gw.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [gateways, searchTerm]
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Checkout Protocol</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Manage Payment Gateways & Transaction Logic</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Engine Online</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Core Logic Configuration */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#1A0F0F] rounded-2xl p-6 border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary-400/5 rounded-bl-[3rem]" />
                        <h3 className="text-[11px] font-black text-white/40 uppercase tracking-widest mb-6">Financial Matrix</h3>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest px-1">Platform Commission (%)</label>
                                <input
                                    type="number"
                                    value={checkoutProtocol.platformFee}
                                    onChange={(e) => setCheckoutProtocol({ ...checkoutProtocol, platformFee: e.target.value })}
                                    className="w-full h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-[12px] font-bold text-white outline-none focus:border-primary-400 focus:bg-white/10 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest px-1">Escrow Lock Duration (Days)</label>
                                <input
                                    type="number"
                                    value={checkoutProtocol.escrowPeriod}
                                    onChange={(e) => setCheckoutProtocol({ ...checkoutProtocol, escrowPeriod: e.target.value })}
                                    className="w-full h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-[12px] font-bold text-white outline-none focus:border-primary-400 focus:bg-white/10 transition-all"
                                />
                            </div>

                            <div className="pt-4 space-y-3">
                                <label className="flex items-center justify-between cursor-pointer group">
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:text-white/60 transition-colors">Auto-Settlement</span>
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${checkoutProtocol.autoSettlement ? 'bg-emerald-500' : 'bg-white/10'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${checkoutProtocol.autoSettlement ? 'left-4.5' : 'left-0.5'}`} />
                                    </div>
                                </label>
                                <label className="flex items-center justify-between cursor-pointer group">
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:text-white/60 transition-colors">Instant Partial Refunds</span>
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${checkoutProtocol.instantRefunds ? 'bg-emerald-500' : 'bg-white/10'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${checkoutProtocol.instantRefunds ? 'left-4.5' : 'left-0.5'}`} />
                                    </div>
                                </label>
                            </div>
                        </div>

                        <button className="w-full mt-8 h-10 bg-primary-400 text-[#1A0F0F] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-300 transition-all shadow-lg active:scale-95">
                            Apply Protocol
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-primary-400/10 flex items-center justify-center text-primary-400">
                                <Icon name="sparkles" size="xs" color="currentColor" />
                            </div>
                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Gateway Health</h4>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase tracking-tight">System is currently processing <span className="text-primary-400 font-black">₹182,400</span> in floating escrow nodes across 12 active checkouts.</p>
                    </div>
                </div>

                {/* Gateway Registry */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                        <div className="relative flex-1 max-w-sm">
                            <Icon name="search" size="xs" color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="PROBE GATEWAY..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-slate-900 outline-none focus:border-primary-400 transition-all placeholder:text-slate-300 uppercase tracking-widest"
                            />
                        </div>
                        <button className="h-10 px-6 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all active:scale-95 whitespace-nowrap shadow-md">
                            Connect Provider
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-slate-100">
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Provider Node</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Volume</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredGateways.length > 0 ? filteredGateways.map((gw) => (
                                    <tr key={gw.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{gw.name}</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{gw.provider}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${gw.mode === 'Live' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                        gw.mode === 'Test' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                            'bg-slate-50 text-slate-400 border border-slate-100'
                                                    }`}>
                                                    {gw.mode}
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{gw.lastSync}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-1.5 w-1.5 rounded-full ${gw.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' :
                                                        gw.status === 'Shadow' ? 'bg-amber-500' : 'bg-slate-300'
                                                    }`} />
                                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{gw.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-[11px] font-black text-slate-900 tracking-tight">{gw.volume}</span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center opacity-20">
                                                <Icon name="payments" size="lg" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-4">No Providers detected</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminGateways;
