import { useState } from 'react';
import Icon from '../../../components/ui/Icon';
import { useToast } from '../../../components/ui/Toast';

const AdminEditorial = () => {
    const [isDeploying, setIsDeploying] = useState(false);
    const { showToast, ToastComponent } = useToast();

    const categories = [
        { name: 'Photography', vendors: 42, growth: '+12%', color: 'bg-primary-400' },
        { name: 'Catering', vendors: 28, growth: '+5%', color: 'bg-emerald-400' },
        { name: 'Venues', vendors: 15, growth: '+8%', color: 'bg-amber-400' },
        { name: 'Decoration', vendors: 34, growth: '+15%', color: 'bg-primary-500' },
        { name: 'Makeup', vendors: 56, growth: '+22%', color: 'bg-rose-400' },
        { name: 'Jewelry', vendors: 12, growth: '+2%', color: 'bg-violet-400' },
    ];

    const handleDeploy = () => {
        setIsDeploying(true);
        setTimeout(() => {
            setIsDeploying(false);
            showToast('Node Sync Successful: Catalog structure updated.', 'success');
        }, 1200);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Catalog Architecture</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Managing Service Taxonomy & Hierarchy</p>
                </div>
                <button
                    onClick={handleDeploy}
                    disabled={isDeploying}
                    className={`h-8 px-4 rounded-lg text-white text-[9px] font-black uppercase tracking-widest shadow-md transition-all flex items-center gap-2 ${isDeploying ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'
                        }`}
                >
                    {isDeploying ? 'Syncing...' : 'Deploy Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {categories.map(cat => (
                    <div key={cat.name} className="p-5 bg-white rounded-2xl border border-slate-200 group hover:border-primary-400/50 hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-12 h-12 ${cat.color} opacity-[0.03] rounded-bl-full`} />
                        <div className="flex items-center justify-between relative z-10">
                            <h3 className="text-[13px] font-black text-slate-900 tracking-tight">{cat.name}</h3>
                            <div className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">{cat.growth}</div>
                        </div>
                        <div className="mt-4 flex items-end justify-between relative z-10">
                            <div>
                                <p className="text-[18px] font-black text-slate-800 leading-none">{cat.vendors}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Assets</p>
                            </div>
                            <button className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-400 group-hover:text-white transition-all">
                                <Icon name="eye" size="xs" color="current" />
                            </button>
                        </div>
                    </div>
                ))}
                <button
                    onClick={() => showToast('Node Creation Wizard Offline', 'info')}
                    className="p-5 rounded-2xl border-2 border-dashed border-slate-100 text-slate-400 hover:border-primary-400/30 hover:text-primary-500 transition-all text-[9px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-2 min-h-[120px]"
                >
                    <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center">
                        <Icon name="sparkles" size="xs" />
                    </div>
                    Append Category
                </button>
            </div>
            <ToastComponent />
        </div>
    );
};

export default AdminEditorial;
