import Icon from '../../../components/ui/Icon';

const AdminSettings = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Global Configurations</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Platform Master Variables</p>
                </div>
                <button className="h-8 px-4 rounded-lg bg-primary-400 text-white text-[9px] font-black uppercase tracking-widest shadow-md hover:bg-primary-500 transition-all active:scale-95">
                    Deploy Changes
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Finance Logic */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                            <Icon name="money" size="xs" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Finance & Tax</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500">Platform Commission</span>
                            <div className="flex items-center gap-2">
                                <input type="text" defaultValue="15%" className="w-16 h-7 text-right px-2 bg-slate-50 border border-slate-100 rounded text-[11px] font-black text-slate-900 outline-none focus:border-primary-400" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500">Service GST Rate</span>
                            <input type="text" defaultValue="18%" className="w-16 h-7 text-right px-2 bg-slate-50 border border-slate-100 rounded text-[11px] font-black text-slate-900 outline-none" />
                        </div>
                    </div>
                </div>

                {/* Operational Flow */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-8 w-8 rounded-lg bg-primary-50 text-primary-400 flex items-center justify-center">
                            <Icon name="chart" size="xs" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Platform Status</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-900 leading-none">Maintenance Mode</span>
                                <span className="text-[9px] text-slate-400 mt-1 uppercase font-bold">Redirect all traffic</span>
                            </div>
                            <div className="w-10 h-5 bg-slate-100 rounded-full relative cursor-pointer group">
                                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm shadow-slate-300 group-hover:bg-slate-200 transition-all" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-900 leading-none">Automatic Payouts</span>
                                <span className="text-[9px] text-slate-400 mt-1 uppercase font-bold">Settlement frequency: 24h</span>
                            </div>
                            <div className="w-10 h-5 bg-primary-400 rounded-full relative cursor-pointer">
                                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
