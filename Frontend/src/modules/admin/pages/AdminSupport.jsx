import { useState, useEffect, useMemo } from 'react';
import Icon from '../../../components/ui/Icon';
import { adminApi } from '../services/adminApi';

const AdminSupport = () => {
    const [activeTab, setActiveTab] = useState('faqs');
    const [faqs, setFaqs] = useState([]);
    const [config, setConfig] = useState({
        supportEmail: '',
        supportPhone: '',
        officeAddress: '',
        workingHours: '',
        socialLinks: { instagram: '', facebook: '', twitter: '', whatsapp: '' }
    });
    const [loading, setLoading] = useState(true);
    
    // FAQ Modal State
    const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState(null);
    const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: 'General', order: 0 });

    const token = localStorage.getItem('adminToken');

    const fetchData = async () => {
        try {
            setLoading(true);
            if (activeTab === 'faqs') {
                const res = await adminApi.getFAQs();
                if (res.success) setFaqs(res.data);
            }
            
            if (activeTab === 'config') {
                const res = await adminApi.getSupportConfig();
                if (res.success) {
                    setConfig({
                        ...res.data,
                        socialLinks: res.data.socialLinks || { instagram: '', facebook: '', twitter: '', whatsapp: '' }
                    });
                }
            }


        } catch (err) {
            console.error(`Failed to fetch ${activeTab}:`, err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    // FAQ Handlers
    const handleSaveFaq = async (e) => {
        e.preventDefault();
        try {
            let res;
            if (editingFaq) {
                res = await adminApi.updateFAQ(editingFaq._id, faqForm, token);
            } else {
                res = await adminApi.createFAQ(faqForm, token);
            }
            if (res.success) {
                fetchData();
                setIsFaqModalOpen(false);
                setEditingFaq(null);
                setFaqForm({ question: '', answer: '', category: 'General', order: 0 });
                alert(editingFaq ? 'FAQ updated successfully!' : 'New FAQ protocol initialized successfully!');
            } else {
                alert(`Protocol Error: ${res.message || 'Operation failed'}`);
            }
        } catch (err) {
            console.error('FAQ save error:', err);
            alert('Transmission failure: Could not connect to support nexus.');
        }
    };


    const handleDeleteFaq = async (id) => {
        if (!window.confirm('Delete this FAQ entry?')) return;
        try {
            const res = await adminApi.deleteFAQ(id, token);
            if (res.success) setFaqs(prev => prev.filter(f => f._id !== id));
        } catch (err) {
            console.error('FAQ delete error:', err);
        }
    };

    // Config Handlers
    const handleSaveConfig = async (e) => {
        e.preventDefault();
        try {
            const res = await adminApi.updateSupportConfig(config, token);
            if (res.success) alert('Support configuration updated successfully.');
        } catch (err) {
            console.error('Config save error:', err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Support Control</h1>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mt-2">Omnichannel Resolution Engine</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl">
                    {[
                        { id: 'faqs', label: 'FAQs', icon: 'question' },
                        { id: 'config', label: 'Contact Info', icon: 'phone' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab.id 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <Icon name={tab.icon} size="xs" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'faqs' && (
                <div className="animate-in slide-in-from-bottom-4 space-y-4">
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manage Dynamic FAQs</p>
                        <button onClick={() => { setEditingFaq(null); setFaqForm({ question: '', answer: '', category: 'General', order: 0 }); setIsFaqModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-[#1A0F0F] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all">
                            <Icon name="plus" size="xs" /> Add Entry
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loading ? (
                            <div className="col-span-full py-20 text-center"><div className="animate-spin h-6 w-6 border-2 border-primary-400 border-t-transparent rounded-full mx-auto" /></div>
                        ) : faqs.length > 0 ? faqs.map(faq => (
                            <div key={faq._id} className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-primary-100 transition-all group relative">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-md">{faq.category}</span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => { setEditingFaq(faq); setFaqForm({ question: faq.question, answer: faq.answer, category: faq.category, order: faq.order }); setIsFaqModalOpen(true); }} className="p-1.5 bg-slate-50 text-slate-400 hover:text-primary-400 rounded-lg"><Icon name="sparkles" size="xs" /></button>
                                        <button onClick={() => handleDeleteFaq(faq._id)} className="p-1.5 bg-rose-50 text-rose-400 hover:text-rose-600 rounded-lg"><Icon name="trash" size="xs" /></button>
                                    </div>
                                </div>
                                <h3 className="text-[12px] font-black text-slate-900 mb-2 leading-tight">{faq.question}</h3>
                                <p className="text-[11px] text-slate-500 leading-relaxed">{faq.answer}</p>
                            </div>
                        )) : (
                            <div className="col-span-full py-20 text-center border-2 border-slate-100 border-dashed rounded-3xl"><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No FAQs registered</p></div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'config' && (
                <div className="animate-in slide-in-from-bottom-4 max-w-2xl mx-auto">
                    <form onSubmit={handleSaveConfig} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Support Email</label>
                                <input type="email" value={config.supportEmail} onChange={e => setConfig({...config, supportEmail: e.target.value})} className="w-full px-4 py-3 bg-slate-50 rounded-xl text-[11px] font-bold border border-transparent focus:border-primary-100 focus:bg-white outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Support Phone</label>
                                <input type="text" value={config.supportPhone} onChange={e => setConfig({...config, supportPhone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 rounded-xl text-[11px] font-bold border border-transparent focus:border-primary-100 focus:bg-white outline-none transition-all" />
                            </div>
                            <div className="col-span-full space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Office Address</label>
                                <textarea value={config.officeAddress} onChange={e => setConfig({...config, officeAddress: e.target.value})} className="w-full px-4 py-3 bg-slate-50 rounded-xl text-[11px] font-bold border border-transparent focus:border-primary-100 focus:bg-white outline-none transition-all h-24" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Working Hours</label>
                                <input type="text" value={config.workingHours} onChange={e => setConfig({...config, workingHours: e.target.value})} className="w-full px-4 py-3 bg-slate-50 rounded-xl text-[11px] font-bold border border-transparent focus:border-primary-100 focus:bg-white outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">WhatsApp Business</label>
                                <input type="text" value={config.socialLinks?.whatsapp || ''} onChange={e => setConfig({...config, socialLinks: {...(config.socialLinks || {}), whatsapp: e.target.value}})} className="w-full px-4 py-3 bg-slate-50 rounded-xl text-[11px] font-bold border border-transparent focus:border-primary-100 focus:bg-white outline-none transition-all" />

                            </div>
                        </div>
                        <button type="submit" className="w-full py-4 bg-[#1A0F0F] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-xl transition-all active:scale-[0.98]">Save Configuration</button>
                    </form>
                </div>
            )}

            {/* FAQ Modal */}
            {isFaqModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{editingFaq ? 'Modify FAQ' : 'New FAQ Protocol'}</h3>
                            <button onClick={() => setIsFaqModalOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-50"><Icon name="close" size="xs" /></button>
                        </div>
                        <form onSubmit={handleSaveFaq} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Question</label>
                                <input required type="text" value={faqForm.question} onChange={e => setFaqForm({...faqForm, question: e.target.value})} className="w-full px-4 py-3 bg-slate-50 rounded-xl text-[11px] font-bold outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Answer Content</label>
                                <textarea required value={faqForm.answer} onChange={e => setFaqForm({...faqForm, answer: e.target.value})} className="w-full px-4 py-3 bg-slate-50 rounded-xl text-[11px] font-bold outline-none h-32" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                                    <select value={faqForm.category} onChange={e => setFaqForm({...faqForm, category: e.target.value})} className="w-full px-4 py-3 bg-slate-50 rounded-xl text-[11px] font-bold outline-none">
                                        <option value="General">General</option>
                                        <option value="Vendors">Vendors</option>
                                        <option value="Users">Users</option>
                                        <option value="Payments">Payments</option>
                                        <option value="Technical">Technical</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Display Order</label>
                                    <input type="number" value={faqForm.order} onChange={e => setFaqForm({...faqForm, order: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 rounded-xl text-[11px] font-bold outline-none" />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-[#1A0F0F] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] mt-4">Save Entry</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSupport;
