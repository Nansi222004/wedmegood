import { useState, useEffect } from 'react';
import Icon from '../../../components/ui/Icon';
import { adminApi } from '../services/adminApi';

const AdminPolicies = () => {
    const [activePolicy, setActivePolicy] = useState('privacy-policy');
    const [policyData, setPolicyData] = useState({ title: '', content: '' });
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const token = localStorage.getItem('adminToken');

    const fetchPolicy = async (type) => {
        try {
            setLoading(true);
            const res = await adminApi.getPolicy(type, token);
            if (res.success) {
                setPolicyData({
                    title: res.data.title,
                    content: res.data.content
                });
            }
        } catch (err) {
            console.error('Failed to fetch policy:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolicy(activePolicy);
    }, [activePolicy]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const res = await adminApi.updatePolicy(activePolicy, policyData, token);
            if (res.success) {
                setMessage({ text: 'Policy synchronized successfully!', type: 'success' });
                setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            }
        } catch (err) {
            setMessage({ text: 'Deployment failed. Check protocols.', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
            {/* Minimalist Top Nav */}
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-8 w-1 bg-primary-400 rounded-full"></div>
                    <div>
                        <h1 className="text-[14px] font-black text-slate-900 tracking-tight uppercase leading-none">Legal Protocols</h1>
                        <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest mt-1">Compliance Management</p>
                    </div>
                </div>

                {message.text && (
                    <div className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest animate-in slide-in-from-top-2 ${
                        message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                        {message.text}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Selector Sidebar */}
                <div className="lg:col-span-3 space-y-2">
                    {[
                        { id: 'privacy-policy', label: 'Privacy Policy', icon: 'shield', sub: 'Data Protection' },
                        { id: 'terms-conditions', label: 'Terms & Conditions', icon: 'checkList', sub: 'User Agreement' }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActivePolicy(item.id)}
                            className={`w-full p-4 rounded-2xl border text-left transition-all group relative overflow-hidden ${
                                activePolicy === item.id 
                                ? 'bg-slate-900 border-slate-900 text-white shadow-xl' 
                                : 'bg-white border-slate-100 text-slate-400 hover:border-primary-400/40'
                            }`}
                        >
                            <div className="flex items-center gap-4 relative z-10">
                                <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${
                                    activePolicy === item.id ? 'bg-white/10 text-primary-400' : 'bg-slate-50 text-slate-300'
                                }`}>
                                    <Icon name={item.icon} size="xs" color="currentColor" />
                                </div>
                                <div>
                                    <h3 className="text-[11px] font-black uppercase tracking-tight leading-none">{item.label}</h3>
                                    <p className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${
                                        activePolicy === item.id ? 'text-white/40' : 'text-slate-300'
                                    }`}>{item.sub}</p>
                                </div>
                            </div>
                            {activePolicy === item.id && (
                                <div className="absolute right-0 top-0 h-full w-1 bg-primary-400 shadow-[0_0_15px_rgba(249,174,175,0.8)]"></div>
                            )}
                        </button>
                    ))}

                    <div className="bg-primary-400/10 border border-primary-400/20 rounded-2xl p-5 mt-6">
                        <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-2">Notice</h4>
                        <p className="text-slate-500 text-[9px] font-bold leading-relaxed">
                            Updates to these documents are reflected immediately across all user interfaces. Ensure legal accuracy before deployment.
                        </p>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="lg:col-span-9 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="h-8 w-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Retrieving legal node...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdate} className="flex flex-col h-full">
                            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Document Title</label>
                                    <input 
                                        value={policyData.title}
                                        onChange={(e) => setPolicyData({...policyData, title: e.target.value})}
                                        className="text-xl font-black text-slate-900 outline-none w-full bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-100"
                                        placeholder="Document Heading..."
                                    />
                                </div>
                                <button 
                                    disabled={actionLoading}
                                    className="h-10 px-6 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-3"
                                >
                                    {actionLoading ? 'Syncing...' : (
                                        <>
                                            <Icon name="sparkles" size="xs" color="white" />
                                            Synchronize
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="flex-1 p-8">
                                <div className="space-y-2 h-full flex flex-col">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Icon name="edit" size="xs" color="currentColor" />
                                        Content Buffer
                                    </label>
                                    <textarea 
                                        value={policyData.content}
                                        onChange={(e) => setPolicyData({...policyData, content: e.target.value})}
                                        className="flex-1 w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 leading-relaxed outline-none focus:border-primary-400/40 transition-all min-h-[400px] resize-none scrollbar-hide"
                                        placeholder="Draft your legal terms here..."
                                    />
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPolicies;
