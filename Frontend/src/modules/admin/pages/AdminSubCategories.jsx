import { useState, useEffect, useMemo } from 'react';
import Icon from '../../../components/ui/Icon';
import { adminApi } from '../services/adminApi';

const AdminSubCategories = () => {
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [subForm, setSubForm] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    
    const token = localStorage.getItem('adminToken');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [catRes, subRes] = await Promise.all([
                adminApi.getCategories(token),
                adminApi.getSubCategories(null, token)
            ]);
            
            if (catRes.success) setCategories(catRes.data);
            if (subRes.success) setSubCategories(subRes.data);
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
        return subcategories.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCat = selectedCategory ? (s.categoryId?._id === selectedCategory || s.categoryId === selectedCategory) : true;
            return matchesSearch && matchesCat;
        });
    }, [subcategories, searchQuery, selectedCategory]);

    const handleCreateClick = () => {
        setIsEditing(true);
        setSubForm({ name: '', description: '', categoryId: selectedCategory || (categories[0]?._id || ''), isActive: true });
    };

    const handleEditClick = (sub) => {
        setIsEditing(true);
        setSubForm({ 
            _id: sub._id,
            name: sub.name, 
            description: sub.description || '', 
            categoryId: sub.categoryId?._id || sub.categoryId,
            isActive: sub.isActive 
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!subForm.name || !subForm.categoryId) return alert('Name and Category required');

        try {
            setActionLoading(true);
            let res;
            if (subForm._id) {
                res = await adminApi.updateSubCategory(subForm._id, subForm, token);
            } else {
                res = await adminApi.createSubCategory(subForm, token);
            }

            if (res.success) {
                await fetchData();
                setIsEditing(false);
                setSubForm(null);
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
        if (!window.confirm('Delete this subcategory?')) return;
        try {
            const res = await adminApi.deleteSubCategory(id, token);
            if (res.success) {
                fetchData();
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const toggleActive = async (sub) => {
        try {
            const res = await adminApi.updateSubCategory(sub._id, { isActive: !sub.isActive }, token);
            if (res.success) fetchData();
        } catch (err) {
            console.error('Toggle error:', err);
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
                                <h1 className="text-[16px] font-black text-slate-900 tracking-tight uppercase leading-none">Subcategories</h1>
                                <p className="text-[#4F35C3] text-[9px] font-bold uppercase tracking-widest mt-1">Nested Services</p>
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
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full h-10 px-4 bg-white border border-[#EAE6FF] rounded-xl text-[10px] font-bold uppercase tracking-widest focus:ring-4 focus:ring-[#4F35C3]/10 outline-none"
                        >
                            <option value="">ALL CATEGORIES</option>
                            {categories.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                        <div className="relative">
                            <Icon name="search" size="xs" color="#4F35C3" className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
                            <input
                                type="text"
                                placeholder="SEARCH..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 bg-white border border-[#EAE6FF] rounded-xl text-[10px] font-bold uppercase tracking-widest focus:ring-4 focus:ring-[#4F35C3]/10 outline-none placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 custom-scrollbar min-h-0" data-lenis-prevent="true">
                    {loading ? (
                        [1,2,3].map(i => <div key={i} className="h-20 bg-[#F9F8FF] rounded-2xl animate-pulse"></div>)
                    ) : filteredSubs.length > 0 ? (
                        filteredSubs.map(sub => (
                            <div 
                                key={sub._id}
                                className="p-4 bg-white border border-[#EAE6FF] rounded-2xl hover:border-[#4F35C3]/40 transition-all flex flex-col group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-[13px] font-black text-slate-900 tracking-tight">{sub.name}</h3>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => toggleActive(sub)} className={`h-6 px-2 text-[8px] font-black uppercase rounded-md border ${sub.isActive ? 'border-amber-200 bg-amber-50 text-amber-600' : 'border-emerald-200 bg-emerald-50 text-emerald-600'}`}>
                                            {sub.isActive ? 'Deactive' : 'Active'}
                                        </button>
                                        <button onClick={() => handleEditClick(sub)} className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-[#4F35C3] bg-[#F9F8FF] rounded-md"><Icon name="edit" size="xs" /></button>
                                        <button onClick={() => handleDelete(sub._id)} className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-rose-500 bg-[#F9F8FF] rounded-md"><Icon name="trash" size="xs" /></button>
                                    </div>
                                </div>
                                <p className="text-[9px] font-bold uppercase text-[#4F35C3] mb-1">{sub.categoryId?.name || 'Unknown Category'}</p>
                                {sub.description && <p className="text-[10px] text-slate-500 line-clamp-2">{sub.description}</p>}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Subcategories Found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL: Editor */}
            <div className="flex-1 bg-white rounded-[2rem] border border-[#EAE6FF] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col relative">
                {isEditing && subForm ? (
                    <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar" data-lenis-prevent="true">
                        <div className="p-8 border-b border-[#EAE6FF] bg-[#F9F8FF] flex items-center justify-between sticky top-0 z-10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{subForm._id ? 'Edit Subcategory' : 'Add Subcategory'}</h2>
                            </div>
                            <button onClick={() => setIsEditing(false)} className="h-10 w-10 bg-white border border-[#EAE6FF] rounded-xl flex items-center justify-center hover:bg-slate-50">
                                <Icon name="close" size="xs" color="currentColor" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 max-w-2xl space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                                <select 
                                    value={subForm.categoryId} 
                                    onChange={(e) => setSubForm({...subForm, categoryId: e.target.value})}
                                    className="w-full bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl px-4 py-3 text-[13px] font-bold text-slate-900 focus:ring-4 focus:ring-[#4F35C3]/10"
                                >
                                    <option value="">SELECT A CATEGORY</option>
                                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subcategory Name</label>
                                <input
                                    type="text"
                                    value={subForm.name}
                                    onChange={(e) => setSubForm({...subForm, name: e.target.value})}
                                    className="w-full bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl px-4 py-3 text-[13px] font-bold text-slate-900 focus:ring-4 focus:ring-[#4F35C3]/10"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                                <textarea
                                    value={subForm.description}
                                    onChange={(e) => setSubForm({...subForm, description: e.target.value})}
                                    className="w-full bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl px-4 py-3 text-[13px] font-medium text-slate-600 focus:ring-4 focus:ring-[#4F35C3]/10 resize-none"
                                    rows="3"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    checked={subForm.isActive}
                                    onChange={(e) => setSubForm({...subForm, isActive: e.target.checked})}
                                    className="h-4 w-4 rounded"
                                />
                                <label className="text-[12px] font-bold text-slate-700">Active</label>
                            </div>
                            <button type="submit" disabled={actionLoading} className="px-8 py-3 bg-[#4F35C3] text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                                {actionLoading ? 'Saving...' : 'Save Subcategory'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F9F8FF]">
                        <div className="h-24 w-24 bg-white rounded-[2rem] flex items-center justify-center mb-6 border border-[#EAE6FF]">
                            <Icon name="grid" size="md" color="#cbd5e1" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manage Subcategories</h2>
                        <button onClick={handleCreateClick} className="mt-8 h-12 px-8 bg-[#4F35C3] text-white rounded-xl text-[11px] font-black uppercase flex items-center gap-2">
                            <Icon name="plus" size="xs" color="currentColor" /> Add New
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSubCategories;
