import { useState, useEffect, useMemo } from 'react';
import Icon from '../../../components/ui/Icon';
import { adminApi } from '../services/adminApi';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isCreatingMain, setIsCreatingMain] = useState(false);
    
    // Forms
    const [mainForm, setMainForm] = useState({ name: '', description: '', image: '', order: 0 });
    const [subForm, setSubForm] = useState(null); // { _id?, name: '', description: '', isActive: true }
    
    const [actionLoading, setActionLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const token = localStorage.getItem('adminToken');

    const fetchCategories = async (preserveSelectionId = null) => {
        try {
            setLoading(true);
            const res = await adminApi.getCategories(token);
            if (res.success) {
                setCategories(res.data);
                if (preserveSelectionId) {
                    const found = res.data.find(c => c._id === preserveSelectionId);
                    if (found) setSelectedCategory(found);
                } else if (selectedCategory) {
                    const found = res.data.find(c => c._id === selectedCategory._id);
                    if (found) setSelectedCategory(found);
                }
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const filteredCategories = useMemo(() => {
        return categories.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [categories, searchQuery]);

    const handleCreateMainClick = () => {
        setSelectedCategory(null);
        setIsCreatingMain(true);
        setMainForm({ name: '', description: '', image: '', order: categories.length });
    };

    const handleEditMainClick = () => {
        setIsCreatingMain(true);
        setMainForm({ 
            name: selectedCategory.name, 
            description: selectedCategory.description || '', 
            image: selectedCategory.image || '', 
            order: selectedCategory.order || 0 
        });
    };

    const handleMainSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!mainForm.name) return alert('Category Name required');

        try {
            setActionLoading(true);
            let res;
            
            // If editing, preserve subCategories. If new, subCategories is empty.
            const payload = {
                ...mainForm,
                subCategories: selectedCategory ? selectedCategory.subCategories : []
            };

            if (selectedCategory) {
                res = await adminApi.updateCategory(selectedCategory._id, payload, token);
            } else {
                res = await adminApi.createCategory(payload, token);
            }

            if (res.success) {
                await fetchCategories(selectedCategory ? selectedCategory._id : res.data._id);
                setIsCreatingMain(false);
                if (!selectedCategory) {
                    setSelectedCategory(res.data);
                }
            } else {
                alert(res.message || 'Error');
            }
        } catch (err) {
            console.error('Submit error:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteMain = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this Category?')) return;
        try {
            const res = await adminApi.deleteCategory(id, token);
            if (res.success) {
                if (selectedCategory?._id === id) setSelectedCategory(null);
                fetchCategories();
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const handleSubSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!subForm.name) return alert('Subcategory Name required');

        try {
            setActionLoading(true);
            let updatedSubs = [...(selectedCategory.subCategories || [])];
            
            if (subForm._id) {
                // Edit existing
                const index = updatedSubs.findIndex(s => s._id === subForm._id);
                if (index !== -1) updatedSubs[index] = { ...updatedSubs[index], ...subForm };
            } else {
                // Add new
                updatedSubs.push({ name: subForm.name, description: subForm.description, isActive: subForm.isActive });
            }

            const payload = {
                name: selectedCategory.name,
                description: selectedCategory.description,
                image: selectedCategory.image,
                order: selectedCategory.order,
                subCategories: updatedSubs
            };

            const res = await adminApi.updateCategory(selectedCategory._id, payload, token);
            if (res.success) {
                await fetchCategories(selectedCategory._id);
                setSubForm(null);
            } else {
                alert(res.message || 'Error');
            }
        } catch (err) {
            console.error('SubSubmit error:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSub = async (subId) => {
        if (!window.confirm('Delete this subcategory?')) return;
        try {
            const updatedSubs = selectedCategory.subCategories.filter(s => s._id !== subId);
            const payload = {
                name: selectedCategory.name,
                subCategories: updatedSubs
            };
            const res = await adminApi.updateCategory(selectedCategory._id, payload, token);
            if (res.success) {
                fetchCategories(selectedCategory._id);
            }
        } catch (err) {
            console.error('Delete sub error:', err);
        }
    };

    const handleToggleMainActive = async (e, id, currentStatus) => {
        e.stopPropagation();
        try {
            const res = await adminApi.updateCategory(id, { isActive: !currentStatus }, token);
            if (res.success) {
                fetchCategories(id === selectedCategory?._id ? id : null);
            }
        } catch (err) {
            console.error('Toggle active error:', err);
        }
    };

    const handleToggleSubActive = async (subId, currentStatus) => {
        try {
            const updatedSubs = selectedCategory.subCategories.map(s => 
                s._id === subId ? { ...s, isActive: !currentStatus } : s
            );
            const payload = {
                name: selectedCategory.name,
                subCategories: updatedSubs
            };
            const res = await adminApi.updateCategory(selectedCategory._id, payload, token);
            if (res.success) {
                fetchCategories(selectedCategory._id);
            }
        } catch (err) {
            console.error('Toggle sub active error:', err);
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
                                <h1 className="text-[16px] font-black text-slate-900 tracking-tight uppercase leading-none">Categories</h1>
                                <p className="text-[#4F35C3] text-[9px] font-bold uppercase tracking-widest mt-1">Master Registry</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleCreateMainClick}
                            className="h-8 w-8 bg-[#4F35C3] text-white rounded-xl flex items-center justify-center hover:bg-[#3f2aa6] transition-all shadow-md shadow-[#4F35C3]/20"
                        >
                            <Icon name="plus" size="xs" color="currentColor" />
                        </button>
                    </div>

                    <div className="relative">
                        <Icon name="search" size="xs" color="#4F35C3" className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
                        <input
                            type="text"
                            placeholder="SEARCH CATEGORIES..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-white border border-[#EAE6FF] rounded-xl text-[10px] font-bold uppercase tracking-widest focus:ring-4 focus:ring-[#4F35C3]/10 focus:border-[#4F35C3]/30 outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 custom-scrollbar min-h-0" data-lenis-prevent="true">
                    {loading ? (
                        [1,2,3,4].map(i => <div key={i} className="h-20 bg-[#F9F8FF] rounded-2xl animate-pulse"></div>)
                    ) : filteredCategories.length > 0 ? (
                        filteredCategories.map(cat => {
                            const isSelected = selectedCategory?._id === cat._id && !isCreatingMain;
                            return (
                                <div 
                                    key={cat._id}
                                    onClick={() => {
                                        setSelectedCategory(cat);
                                        setIsCreatingMain(false);
                                        setSubForm(null);
                                    }}
                                    className={`p-4 rounded-2xl cursor-pointer transition-all border flex items-center gap-4 group ${
                                        isSelected 
                                            ? 'bg-[#4F35C3] border-[#4F35C3] shadow-[0_8px_20px_rgb(79,53,195,0.2)]' 
                                            : 'bg-white border-[#EAE6FF] hover:border-[#4F35C3]/40 hover:bg-[#F9F8FF]'
                                    }`}
                                >
                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden relative ${isSelected ? 'bg-white/10' : 'bg-[#F9F8FF]'}`}>
                                        {cat.image ? (
                                            <img src={cat.image} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <Icon name="palette" size="sm" color={isSelected ? 'white' : '#4F35C3'} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`text-[13px] font-black truncate tracking-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>{cat.name}</h3>
                                        <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 truncate ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                                            {cat.subCategories?.length || 0} Subcategories
                                        </p>
                                    </div>
                                    <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'text-white/50' : 'text-[#4F35C3]/30'}`}>
                                        <Icon name="chevron-right" size="sm" color="currentColor" />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Categories Found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL: Detail View */}
            <div className="flex-1 bg-white rounded-[2rem] border border-[#EAE6FF] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col relative">
                
                {isCreatingMain ? (
                    /* MAIN CATEGORY EDITOR */
                    <div className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar" data-lenis-prevent="true">
                        <div className="p-8 border-b border-[#EAE6FF] bg-[#F9F8FF] flex items-center justify-between sticky top-0 z-10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedCategory ? 'Edit Category' : 'Deploy New Category'}</h2>
                                <p className="text-[#4F35C3] text-[10px] font-bold uppercase tracking-widest mt-1">Main Category Configuration</p>
                            </div>
                            <button onClick={() => { setIsCreatingMain(false); if(!selectedCategory) setSelectedCategory(categories[0]||null); }} className="h-10 w-10 bg-white border border-[#EAE6FF] rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all">
                                <Icon name="close" size="xs" color="currentColor" />
                            </button>
                        </div>
                        <div className="p-8 max-w-2xl">
                            <form onSubmit={handleMainSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category Name</label>
                                    <input
                                        type="text"
                                        value={mainForm.name}
                                        onChange={(e) => setMainForm({...mainForm, name: e.target.value})}
                                        className="w-full bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl px-4 py-3 text-[13px] font-bold text-slate-900 focus:ring-4 focus:ring-[#4F35C3]/10 focus:border-[#4F35C3]/30 outline-none transition-all"
                                        placeholder="e.g. Photographers"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                                    <textarea
                                        value={mainForm.description}
                                        onChange={(e) => setMainForm({...mainForm, description: e.target.value})}
                                        className="w-full bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl px-4 py-3 text-[13px] font-medium text-slate-600 focus:ring-4 focus:ring-[#4F35C3]/10 focus:border-[#4F35C3]/30 outline-none transition-all resize-none"
                                        rows="3"
                                        placeholder="A short description..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Image URL</label>
                                    <input
                                        type="text"
                                        value={mainForm.image}
                                        onChange={(e) => setMainForm({...mainForm, image: e.target.value})}
                                        className="w-full bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl px-4 py-3 text-[12px] font-medium text-slate-600 focus:ring-4 focus:ring-[#4F35C3]/10 focus:border-[#4F35C3]/30 outline-none transition-all"
                                        placeholder="https://images.unsplash.com/..."
                                    />
                                </div>
                                <div className="pt-4 flex gap-4">
                                    <button type="submit" disabled={actionLoading} className="px-8 py-3 bg-[#4F35C3] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#3f2aa6] transition-all disabled:opacity-50">
                                        {actionLoading ? 'Saving...' : 'Save Category'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : selectedCategory ? (
                    /* CATEGORY DETAILS & SUBCATEGORIES */
                    <div className="flex-1 flex flex-col h-full overflow-hidden relative min-h-0">
                        {/* Cover Image & Header */}
                        <div className="relative h-48 bg-slate-900 flex-shrink-0">
                            {selectedCategory.image && (
                                <img src={selectedCategory.image} alt="" className="w-full h-full object-cover opacity-50" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                            
                            <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end justify-between">
                                <div>
                                    <span className="text-[10px] font-black text-[#8E71FF] uppercase tracking-widest px-3 py-1 bg-[#8E71FF]/10 rounded-lg mb-3 inline-block border border-[#8E71FF]/20">Active Node</span>
                                    <h2 className="text-4xl font-black text-white tracking-tighter leading-none">{selectedCategory.name}</h2>
                                    {selectedCategory.description && (
                                        <p className="text-white/70 text-[12px] font-medium mt-2 max-w-xl">{selectedCategory.description}</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={(e) => handleToggleMainActive(e, selectedCategory._id, selectedCategory.isActive)}
                                        className={`h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-sm transition-all flex items-center gap-2 ${
                                            selectedCategory.isActive 
                                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' 
                                            : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20'
                                        }`}
                                    >
                                        <Icon name={selectedCategory.isActive ? "check" : "close"} size="xs" color="currentColor" /> {selectedCategory.isActive ? 'Active' : 'Deactive'}
                                    </button>
                                    <button onClick={handleEditMainClick} className="h-10 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-sm transition-all flex items-center gap-2">
                                        <Icon name="edit" size="xs" color="currentColor" /> Edit
                                    </button>
                                    <button onClick={(e) => handleDeleteMain(e, selectedCategory._id)} className="h-10 w-10 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center backdrop-blur-sm transition-all border border-rose-500/20">
                                        <Icon name="trash" size="xs" color="currentColor" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Subcategories Area */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F9F8FF] p-8 custom-scrollbar min-h-0" data-lenis-prevent="true">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Subcategories</h3>
                                    <p className="text-[#4F35C3] text-[10px] font-bold uppercase tracking-widest mt-1">Manage nested service types</p>
                                </div>
                                <button 
                                    onClick={() => setSubForm({ name: '', description: '', isActive: true })}
                                    className="h-10 px-5 bg-white border border-[#EAE6FF] text-[#4F35C3] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#4F35C3] hover:text-white transition-all shadow-sm flex items-center gap-2"
                                >
                                    <Icon name="plus" size="xs" color="currentColor" /> Add Subcategory
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {selectedCategory.subCategories?.map(sub => (
                                    <div key={sub._id} className="bg-white p-5 rounded-2xl border border-[#EAE6FF] shadow-[0_4px_20px_rgb(0,0,0,0.02)] group hover:border-[#4F35C3]/40 transition-all flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className={`h-2 w-2 rounded-full ${sub.isActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-300'}`} />
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleToggleSubActive(sub._id, sub.isActive)} 
                                                        className={`h-6 px-2 text-[8px] font-black uppercase tracking-widest rounded-md transition-colors flex items-center gap-1 border ${sub.isActive ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100' : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                                    >
                                                        {sub.isActive ? 'Deactive' : 'Active'}
                                                    </button>
                                                    <button onClick={() => setSubForm(sub)} className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-[#4F35C3] hover:bg-[#F9F8FF] rounded-md transition-colors">
                                                        <Icon name="edit" size="xs" color="currentColor" />
                                                    </button>
                                                    <button onClick={() => handleDeleteSub(sub._id)} className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors">
                                                        <Icon name="trash" size="xs" color="currentColor" />
                                                    </button>
                                                </div>
                                            </div>
                                            <h4 className="text-[14px] font-black text-slate-900 tracking-tight leading-tight">{sub.name}</h4>
                                            {sub.description && (
                                                <p className="text-[10px] font-medium text-slate-500 mt-2 leading-relaxed line-clamp-2">{sub.description}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {(!selectedCategory.subCategories || selectedCategory.subCategories.length === 0) && (
                                    <div className="col-span-full py-16 text-center border-2 border-dashed border-[#EAE6FF] rounded-3xl bg-white">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No subcategories defined</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Subcategory Editor Overlay */}
                        {subForm && (
                            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-8 animate-in fade-in duration-200">
                                <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl border border-[#EAE6FF] overflow-hidden animate-in zoom-in-95 duration-200">
                                    <div className="p-6 bg-[#F9F8FF] border-b border-[#EAE6FF] flex items-center justify-between">
                                        <div>
                                            <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">{subForm._id ? 'Edit Subcategory' : 'Add Subcategory'}</h3>
                                        </div>
                                        <button onClick={() => setSubForm(null)} className="h-8 w-8 bg-white border border-[#EAE6FF] rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm">
                                            <Icon name="close" size="xs" color="currentColor" />
                                        </button>
                                    </div>
                                    <form onSubmit={handleSubSubmit} className="p-6 space-y-5">
                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Subcategory Name</label>
                                            <input
                                                type="text"
                                                value={subForm.name}
                                                onChange={(e) => setSubForm({...subForm, name: e.target.value})}
                                                className="w-full bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl px-4 py-3 text-[12px] font-bold text-slate-900 focus:ring-4 focus:ring-[#4F35C3]/10 focus:border-[#4F35C3]/30 outline-none transition-all"
                                                placeholder="e.g. Candid Photographer"
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                                            <textarea
                                                value={subForm.description || ''}
                                                onChange={(e) => setSubForm({...subForm, description: e.target.value})}
                                                className="w-full bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl px-4 py-3 text-[12px] font-medium text-slate-600 focus:ring-4 focus:ring-[#4F35C3]/10 focus:border-[#4F35C3]/30 outline-none transition-all resize-none"
                                                rows="3"
                                                placeholder="Details..."
                                            />
                                        </div>
                                        <div className="flex items-center gap-3 pt-2">
                                            <input 
                                                type="checkbox" 
                                                id="isActive"
                                                checked={subForm.isActive}
                                                onChange={(e) => setSubForm({...subForm, isActive: e.target.checked})}
                                                className="h-4 w-4 rounded border-slate-300 text-[#4F35C3] focus:ring-[#4F35C3]"
                                            />
                                            <label htmlFor="isActive" className="text-[11px] font-bold text-slate-700">Active Status</label>
                                        </div>
                                        <div className="pt-4">
                                            <button type="submit" disabled={actionLoading} className="w-full py-3 bg-[#4F35C3] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#3f2aa6] transition-all disabled:opacity-50 shadow-lg shadow-[#4F35C3]/20">
                                                {actionLoading ? 'Saving...' : 'Save Subcategory'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* EMPTY STATE */
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F9F8FF]">
                        <div className="h-24 w-24 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#EAE6FF]">
                            <Icon name="grid" size="md" color="#cbd5e1" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Registry Unselected</h2>
                        <p className="text-slate-400 font-medium mt-2 max-w-sm">Select a main category from the left panel to view and manage its configuration and subcategories.</p>
                        <button onClick={handleCreateMainClick} className="mt-8 h-12 px-8 bg-[#4F35C3] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#3f2aa6] transition-all flex items-center gap-2 shadow-xl shadow-[#4F35C3]/20">
                            <Icon name="plus" size="xs" color="currentColor" />
                            Deploy New Node
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminCategories;
