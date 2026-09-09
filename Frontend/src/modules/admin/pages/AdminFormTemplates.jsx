import { useState, useEffect, useMemo } from 'react';
import Icon from '../../../components/ui/Icon';
import { adminApi } from '../services/adminApi';

const AdminFormTemplates = () => {
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubCategories] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    
    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [templateForm, setTemplateForm] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    
    const token = localStorage.getItem('adminToken');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [catRes, subRes, tplRes] = await Promise.all([
                adminApi.getCategories(token),
                adminApi.getSubCategories(null, token),
                adminApi.getFormTemplates(null, null, token)
            ]);
            
            if (catRes.success) setCategories(catRes.data);
            if (subRes.success) setSubCategories(subRes.data);
            if (tplRes.success) setTemplates(tplRes.data);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredSubs = useMemo(() => {
        if (!selectedCategory) return [];
        return subcategories.filter(s => s.categoryId?._id === selectedCategory || s.categoryId === selectedCategory);
    }, [subcategories, selectedCategory]);

    const filteredTemplates = useMemo(() => {
        return templates.filter(t => {
            const matchesCat = selectedCategory ? (t.categoryId?._id === selectedCategory || t.categoryId === selectedCategory) : true;
            const matchesSub = selectedSubCategory ? (t.subCategoryId?._id === selectedSubCategory || t.subCategoryId === selectedSubCategory) : true;
            return matchesCat && matchesSub;
        });
    }, [templates, selectedCategory, selectedSubCategory]);

    const handleCreateClick = () => {
        setIsEditing(true);
        setTemplateForm({ 
            name: '', 
            type: 'text', 
            label: '',
            placeholder: '',
            required: false,
            options: [],
            categoryId: selectedCategory || (categories[0]?._id || ''), 
            subCategoryId: selectedSubCategory || '',
            order: 0
        });
    };

    const handleEditClick = (tpl) => {
        setIsEditing(true);
        setTemplateForm({ 
            _id: tpl._id,
            name: tpl.name, 
            type: tpl.type,
            label: tpl.label || '',
            placeholder: tpl.placeholder || '',
            required: tpl.required || false,
            options: tpl.options || [],
            categoryId: tpl.categoryId?._id || tpl.categoryId,
            subCategoryId: tpl.subCategoryId?._id || tpl.subCategoryId || null,
            order: tpl.order || 0
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!templateForm.name || !templateForm.categoryId) return alert('Name and Category required');
        
        // Remove empty options
        const cleanedOptions = (templateForm.options || []).filter(o => o.trim() !== '');

        const payload = {
            ...templateForm,
            options: cleanedOptions,
            subCategoryId: templateForm.subCategoryId || null
        };

        try {
            setActionLoading(true);
            let res;
            if (payload._id) {
                res = await adminApi.updateFormTemplate(payload._id, payload, token);
            } else {
                res = await adminApi.createFormTemplate(payload, token);
            }

            if (res.success) {
                await fetchData();
                setIsEditing(false);
                setTemplateForm(null);
            } else {
                alert(res.message || 'Error');
            }
        } catch (err) {
            console.error('Submit error:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this template field?')) return;
        try {
            const res = await adminApi.deleteFormTemplate(id, token);
            if (res.success) {
                fetchData();
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    return (
        <div className="flex-1 h-full min-h-[600px] flex gap-6 animate-in fade-in duration-500 relative">
            {/* LEFT PANEL: Master View */}
            <div className="w-1/3 min-w-[320px] bg-white rounded-[2rem] border border-[#EAE6FF] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-[#EAE6FF] bg-[#F9F8FF]">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-2 bg-[#4F35C3] rounded-full"></div>
                            <div>
                                <h1 className="text-[16px] font-black text-slate-900 tracking-tight uppercase leading-none">Form Templates</h1>
                                <p className="text-[#4F35C3] text-[9px] font-bold uppercase tracking-widest mt-1">Dynamic Fields</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleCreateClick}
                            className="h-8 w-8 bg-[#4F35C3] text-white rounded-xl flex items-center justify-center hover:bg-[#3f2aa6] transition-all shadow-md shadow-[#4F35C3]/20"
                        >
                            <Icon name="plus" size="xs" color="currentColor" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <select 
                            value={selectedCategory} 
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setSelectedSubCategory('');
                            }}
                            className="w-full h-10 px-4 bg-white border border-[#EAE6FF] rounded-xl text-[10px] font-bold uppercase tracking-widest focus:ring-4 focus:ring-[#4F35C3]/10 outline-none"
                        >
                            <option value="">ALL CATEGORIES</option>
                            {categories.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                        <select 
                            value={selectedSubCategory} 
                            onChange={(e) => setSelectedSubCategory(e.target.value)}
                            disabled={!selectedCategory || filteredSubs.length === 0}
                            className="w-full h-10 px-4 bg-white border border-[#EAE6FF] rounded-xl text-[10px] font-bold uppercase tracking-widest focus:ring-4 focus:ring-[#4F35C3]/10 outline-none disabled:opacity-50"
                        >
                            <option value="">ALL SUBCATEGORIES</option>
                            {filteredSubs.map(s => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 custom-scrollbar min-h-0" data-lenis-prevent="true">
                    {loading ? (
                        [1,2,3].map(i => <div key={i} className="h-20 bg-[#F9F8FF] rounded-2xl animate-pulse"></div>)
                    ) : filteredTemplates.length > 0 ? (
                        filteredTemplates.sort((a,b) => a.order - b.order).map(tpl => (
                            <div 
                                key={tpl._id}
                                className="p-4 bg-white border border-[#EAE6FF] rounded-2xl hover:border-[#4F35C3]/40 transition-all flex flex-col group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-[13px] font-black text-slate-900 tracking-tight">{tpl.label || tpl.name} {tpl.required && <span className="text-rose-500">*</span>}</h3>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditClick(tpl)} className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-[#4F35C3] bg-[#F9F8FF] rounded-md"><Icon name="edit" size="xs" /></button>
                                        <button onClick={() => handleDelete(tpl._id)} className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-rose-500 bg-[#F9F8FF] rounded-md"><Icon name="trash" size="xs" /></button>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center text-[9px] font-bold uppercase text-[#4F35C3] mb-1">
                                    <span className="bg-[#4F35C3]/10 px-2 py-0.5 rounded">{tpl.type}</span>
                                    {tpl.subCategoryId ? (
                                        <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{tpl.subCategoryId.name}</span>
                                    ) : (
                                        <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{tpl.categoryId?.name}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Fields Found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL: Editor */}
            <div className="flex-1 bg-white rounded-[2rem] border border-[#EAE6FF] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col relative">
                {isEditing && templateForm ? (
                    <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar" data-lenis-prevent="true">
                        <div className="p-8 border-b border-[#EAE6FF] bg-[#F9F8FF] flex items-center justify-between sticky top-0 z-10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{templateForm._id ? 'Edit Field Template' : 'Add Field Template'}</h2>
                            </div>
                            <button onClick={() => setIsEditing(false)} className="h-10 w-10 bg-white border border-[#EAE6FF] rounded-xl flex items-center justify-center hover:bg-slate-50">
                                <Icon name="close" size="xs" color="currentColor" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 max-w-2xl space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                                    <select 
                                        value={templateForm.categoryId} 
                                        onChange={(e) => setTemplateForm({...templateForm, categoryId: e.target.value, subCategoryId: ''})}
                                        className="w-full bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl px-4 py-3 text-[13px] font-bold text-slate-900 focus:ring-4 focus:ring-[#4F35C3]/10"
                                    >
                                        <option value="">SELECT A CATEGORY</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subcategory (Optional)</label>
                                    <select 
                                        value={templateForm.subCategoryId} 
                                        onChange={(e) => setTemplateForm({...templateForm, subCategoryId: e.target.value})}
                                        className="w-full bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl px-4 py-3 text-[13px] font-bold text-slate-900 focus:ring-4 focus:ring-[#4F35C3]/10"
                                    >
                                        <option value="">ALL SUBCATEGORIES (GLOBAL)</option>
                                        {subcategories.filter(s => s.categoryId?._id === templateForm.categoryId || s.categoryId === templateForm.categoryId).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Field Name (Internal)</label>
                                    <input
                                        type="text"
                                        value={templateForm.name}
                                        onChange={(e) => setTemplateForm({...templateForm, name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()})}
                                        className="w-full bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl px-4 py-3 text-[13px] font-bold text-slate-900 focus:ring-4 focus:ring-[#4F35C3]/10"
                                        placeholder="e.g. price_per_day"
                                    />
                                    <p className="text-[9px] text-slate-400 mt-1">Used as JSON key. No spaces.</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Field Label (Display)</label>
                                    <input
                                        type="text"
                                        value={templateForm.label}
                                        onChange={(e) => setTemplateForm({...templateForm, label: e.target.value})}
                                        className="w-full bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl px-4 py-3 text-[13px] font-bold text-slate-900 focus:ring-4 focus:ring-[#4F35C3]/10"
                                        placeholder="e.g. Price Per Day"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Field Type</label>
                                    <select 
                                        value={templateForm.type} 
                                        onChange={(e) => setTemplateForm({...templateForm, type: e.target.value})}
                                        className="w-full bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl px-4 py-3 text-[13px] font-bold text-slate-900 focus:ring-4 focus:ring-[#4F35C3]/10"
                                    >
                                        <option value="text">Text</option>
                                        <option value="textarea">Textarea</option>
                                        <option value="number">Number</option>
                                        <option value="select">Select</option>
                                        <option value="multiselect">Multi-Select</option>
                                        <option value="checkbox">Checkbox</option>
                                        <option value="radio">Radio</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Placeholder</label>
                                    <input
                                        type="text"
                                        value={templateForm.placeholder}
                                        onChange={(e) => setTemplateForm({...templateForm, placeholder: e.target.value})}
                                        className="w-full bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl px-4 py-3 text-[13px] font-bold text-slate-900 focus:ring-4 focus:ring-[#4F35C3]/10"
                                    />
                                </div>
                            </div>

                            {(['select', 'multiselect', 'radio'].includes(templateForm.type)) && (
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Options (Comma separated)</label>
                                    <input
                                        type="text"
                                        value={(templateForm.options || []).join(', ')}
                                        onChange={(e) => setTemplateForm({...templateForm, options: e.target.value.split(',').map(s=>s.trim())})}
                                        className="w-full bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl px-4 py-3 text-[13px] font-bold text-slate-900 focus:ring-4 focus:ring-[#4F35C3]/10"
                                        placeholder="e.g. Option 1, Option 2, Option 3"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        checked={templateForm.required}
                                        onChange={(e) => setTemplateForm({...templateForm, required: e.target.checked})}
                                        className="h-4 w-4 rounded"
                                    />
                                    <label className="text-[12px] font-bold text-slate-700">Required</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-[12px] font-bold text-slate-700">Order</label>
                                    <input 
                                        type="number" 
                                        value={templateForm.order}
                                        onChange={(e) => setTemplateForm({...templateForm, order: parseInt(e.target.value) || 0})}
                                        className="w-20 bg-[#F9F8FF] border border-[#EAE6FF] rounded-lg px-2 py-1 text-[13px] font-bold text-slate-900"
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={actionLoading} className="px-8 py-3 bg-[#4F35C3] text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                                {actionLoading ? 'Saving...' : 'Save Template'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F9F8FF]">
                        <div className="h-24 w-24 bg-white rounded-[2rem] flex items-center justify-center mb-6 border border-[#EAE6FF]">
                            <Icon name="grid" size="md" color="#cbd5e1" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manage Form Templates</h2>
                        <button onClick={handleCreateClick} className="mt-8 h-12 px-8 bg-[#4F35C3] text-white rounded-xl text-[11px] font-black uppercase flex items-center gap-2">
                            <Icon name="plus" size="xs" color="currentColor" /> Add New Field
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminFormTemplates;
