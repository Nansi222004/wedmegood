import { useState, useEffect } from 'react';
import Icon from '../../../components/ui/Icon';
import { vendorApi } from '../vendorApi';

const VendorSupport = () => {
    const [faqs, setFaqs] = useState([]);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFaq, setActiveFaq] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [faqRes, configRes] = await Promise.all([
                    vendorApi.getFAQs(),
                    vendorApi.getSupportConfig()
                ]);
                if (faqRes.success) setFaqs(faqRes.data);
                if (configRes.success) setConfig(configRes.data);
            } catch (err) {
                console.error('Support fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredFaqs = faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <div className="animate-spin h-8 w-8 border-4 border-[#7C3AED] border-t-transparent rounded-full"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading intelligence registry...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-28 support-container">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
                .support-container { font-family: 'Poppins', sans-serif; }
                .support-card {
                    background: white;
                    border-radius: 1rem;
                    padding: 1rem;
                    border: 1px solid #F1F5F9;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.01);
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .support-card:hover {
                    border-color: #E2E8F0;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
                }
            `}</style>

            {/* Compact Header Card */}
            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[7.5px] font-black uppercase tracking-wider text-[#7C3AED] bg-[#F5F3FF] px-1.5 py-0.5 rounded-sm">Partner Support</span>
                        <span className="text-[7.5px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm border border-emerald-100">Help Desk</span>
                    </div>
                    <div>
                        <h1 className="text-base font-black text-slate-900 leading-tight">Support & Help Desk</h1>
                        <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Access our dynamic knowledge base and direct support channels</p>
                    </div>
                </div>
            </div>

            {/* Search Bar Below Card */}
            <div className="relative group w-full">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#7C3AED] transition-colors flex items-center justify-center">
                    <Icon name="search" size="xs" />
                </span>
                <input 
                    type="text"
                    placeholder="Search intelligence registry..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-100 rounded-xl text-[10.5px] font-bold shadow-sm focus:border-[#7C3AED]/20 focus:ring-4 focus:ring-[#7C3AED]/5 outline-none transition-all placeholder:text-slate-400"
                />
            </div>

            {/* Support Metrics/Info Grid */}
            <div className="grid grid-cols-1 gap-2.5">
                {[
                    { label: 'Support Email', val: config?.supportEmail || 'support@utsavchakra.com', icon: 'envelope', color: 'text-blue-500', bg: 'bg-blue-50/80' },
                    { label: 'WhatsApp Protocol', val: config?.socialLinks?.whatsapp || config?.supportPhone || '+91 9999999999', icon: 'whatsapp', color: 'text-emerald-500', bg: 'bg-emerald-50/80' },
                    { label: 'Active Window', val: config?.workingHours || '9:00 AM - 6:00 PM (Mon-Sat)', icon: 'clock', color: 'text-amber-500', bg: 'bg-amber-50/80' }
                ].map((item, i) => (
                    <div key={i} className="support-card flex items-center gap-4">
                        <div className={`h-11 w-11 rounded-xl ${item.bg} ${item.color} flex items-center justify-center flex-shrink-0`}>
                            <Icon name={item.icon} size="sm" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">{item.label}</p>
                            <p className="text-[12.5px] font-black text-slate-900 mt-0.5 truncate">{item.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Address & Direct Connection */}
            <div className="support-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
                        <Icon name="location" size="sm" />
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-[#7C3AED] uppercase tracking-[0.15em]">Operational Base</p>
                        <p className="text-[12px] font-black text-slate-800 leading-tight mt-0.5">{config?.officeAddress || '122, Utsav Plaza, Mumbai'}</p>
                    </div>
                </div>
                <a href={`mailto:${config?.supportEmail || 'support@utsavchakra.com'}`} className="w-full sm:w-auto px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all text-center shadow-md shadow-violet-100 active:scale-[0.97]">
                    Send Transmission
                </a>
            </div>

            {/* Registry Accordion (FAQs) */}
            <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Intelligence Registry (FAQs)</h3>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{filteredFaqs.length} Records</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {filteredFaqs.length > 0 ? filteredFaqs.map((faq, idx) => (
                        <div 
                            key={faq._id || idx}
                            className={`support-card !p-0 overflow-hidden border transition-all duration-300 ${
                                activeFaq === idx ? 'ring-1 ring-[#7C3AED]/20 border-[#7C3AED]/20 shadow-md' : 'border-slate-100'
                            }`}
                        >
                            <button 
                                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                                className="w-full flex items-center justify-between p-3.5 text-left outline-none"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`h-6.5 w-6.5 rounded-lg flex items-center justify-center text-[9px] font-black transition-colors ${
                                        activeFaq === idx ? 'bg-[#7C3AED] text-white' : 'bg-slate-50 text-slate-400 border border-slate-100'
                                    }`}>
                                        {idx + 1}
                                    </div>
                                    <h4 className="text-[12px] font-bold text-slate-800 tracking-tight">{faq.question}</h4>
                                </div>
                                <Icon 
                                    name="chevronDown" 
                                    size="xs" 
                                    className={`transition-transform duration-300 ${activeFaq === idx ? 'rotate-180 text-[#7C3AED]' : 'text-slate-400'}`} 
                                />
                            </button>
                            
                            <div className={`transition-all duration-300 overflow-hidden ${activeFaq === idx ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="px-3.5 pb-4 pl-12">
                                    <div className="h-px bg-slate-100 w-full mb-3" />
                                    <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium italic">
                                            "{faq.answer}"
                                        </p>
                                    </div>
                                    <div className="mt-2.5 flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-violet-50 text-[8px] font-black uppercase text-[#7C3AED] rounded-md tracking-wider border border-violet-100">{faq.category}</span>
                                        <span className="text-slate-200 text-[8px]">•</span>
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Protocol Verified</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl">
                            <Icon name="noResults" size="lg" color="#cbd5e1" className="mx-auto mb-2" />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Neural Registry Empty</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Minimal Footer */}
            <div className="pt-6 flex flex-col items-center gap-3 opacity-40">
                <div className="flex gap-2.5">
                    {[1, 2, 3].map(i => <div key={i} className="h-0.5 w-6 bg-slate-200 rounded-full" />)}
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Utsavo Support Core v2.0</p>
            </div>
        </div>
    );
};

export default VendorSupport;
