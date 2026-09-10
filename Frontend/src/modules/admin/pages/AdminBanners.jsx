import { useState, useEffect } from 'react';
import Icon from '../../../components/ui/Icon';

const AdminBanners = () => {
    const [banners, setBanners] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        placement: 'Hero Main',
        target: 'All',
        category: 'All',
        status: 'Active'
    });

    useEffect(() => {
        fetchBanners();
        fetchCategories();
    }, []);

    const fetchBanners = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/banners', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                setBanners(result.data);
            }
        } catch (err) {
            console.error('Error fetching banners:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/admin/categories');
            const result = await res.json();
            if (result.success) {
                setCategories(result.data);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        console.log('🚀 Submit triggered');
        e.preventDefault();
        const token = localStorage.getItem('adminToken');
        const url = editingBanner ? `/api/admin/banners/${editingBanner._id}` : '/api/admin/banners';
        const method = editingBanner ? 'PUT' : 'POST';

        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('placement', formData.placement);
        data.append('target', formData.target);
        data.append('category', formData.category);
        data.append('status', formData.status);
        if (imageFile) {
            data.append('image', imageFile);
        }

        if (!imageFile && !editingBanner) {
            alert('Please select an image asset first');
            return;
        }

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });
            const result = await res.json();
            if (result.success) {
                fetchBanners();
                setIsModalOpen(false);
                setEditingBanner(null);
                setImageFile(null);
                setImagePreview(null);
                setFormData({ 
                    title: '', 
                    description: '', 
                    placement: 'Hero Main', 
                    target: 'All', 
                    category: 'All',
                    status: 'Active' 
                });
            } else {
                alert(result.message || 'Failed to deploy asset');
            }
        } catch (err) {
            console.error('Error saving banner:', err);
            alert('Network error. Please check your connection.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this banner?')) return;
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`/api/admin/banners/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                fetchBanners();
            }
        } catch (err) {
            console.error('Error deleting banner:', err);
        }
    };

    const openEditModal = (banner) => {
        setEditingBanner(banner);
        setImagePreview(banner.imageUrl);
        setFormData({
            title: banner.title,
            description: banner.description || '',
            placement: banner.placement,
            target: banner.target || 'All',
            category: banner.category || 'All',
            status: banner.status
        });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Promotion Assets</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Marketing Nodes & Banner Deployments</p>
                </div>
                <button 
                    onClick={() => {
                        setEditingBanner(null);
                        setImagePreview(null);
                        setImageFile(null);
                        setFormData({ 
                            title: '', 
                            description: '', 
                            placement: 'Hero Main', 
                            target: 'All', 
                            category: 'All', 
                            status: 'Active' 
                        });
                        setIsModalOpen(true);
                    }}
                    className="h-10 px-6 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
                >
                    <Icon name="plus" size="xs" color="white" />
                    Upload Asset
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Active Banners</p>
                    <h3 className="text-xl font-black text-slate-900 mt-1 tracking-tight">{banners.filter(b => b.status === 'Active').length}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Impressions</p>
                    <h3 className="text-xl font-black text-slate-900 mt-1 tracking-tight">
                        {banners.reduce((acc, b) => acc + (b.impressions || 0), 0).toLocaleString()}
                    </h3>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Asset Title</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Placement</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Performance</th>
                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Target</th>
                                <th className="px-6 py-4 text-right border-b border-slate-100"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Loading assets...</td>
                                </tr>
                            ) : banners.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No assets deployed</td>
                                </tr>
                            ) : banners.map((b) => (
                                <tr key={b._id} className="hover:bg-primary-50/10 transition-colors group">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                                <img src={b.imageUrl} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <p className="text-[11px] font-black text-slate-900">{b.title}</p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase">{b.placement}</td>
                                    <td className="px-5 py-3">
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-black text-slate-900">{b.clicks} Clicks</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{b.impressions} Impr.</p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${b.target === 'Vendor' ? 'bg-blue-50 text-blue-600' :
                                                b.target === 'User' ? 'bg-purple-50 text-purple-600' :
                                                    'bg-slate-50 text-slate-600'
                                            }`}>{b.target || 'All'}</span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => openEditModal(b)}
                                                className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all"
                                            >
                                                <Icon name="sparkles" size="xs" color="currentColor" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(b._id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Icon name="trash" size="xs" color="currentColor" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-[2rem] w-full max-w-md max-h-[85vh] overflow-y-auto p-6 shadow-2xl animate-in zoom-in-95 duration-200 scrollbar-hide">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">{editingBanner ? 'Edit Asset' : 'Deploy New Asset'}</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Banner Configuration Node</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <Icon name="search" size="xs" color="#94a3b8" />
                            </button>
                        </div>

                        <div className="overflow-y-auto pr-2 custom-scrollbar space-y-5" style={{ maxHeight: 'calc(85vh - 120px)' }}>
                            <form onSubmit={handleSubmit} className="space-y-5 pb-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Asset Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-bold text-slate-900 outline-none focus:border-primary-400/50 transition-all"
                                        placeholder="e.g. Summer Wedding Bonanza"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-bold text-slate-900 outline-none focus:border-primary-400/50 transition-all"
                                        placeholder="e.g. Reach more couples"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Upload Asset</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-primary-400/50 transition-all overflow-hidden">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <>
                                                    <Icon name="camera" size="sm" color="#94a3b8" />
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to upload image</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Target Audience</label>
                                        <select
                                            value={formData.target}
                                            onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                                            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-bold text-slate-900 outline-none focus:border-primary-400/50 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="All">All Audiences</option>
                                            <option value="Vendor">Vendors Only</option>
                                            <option value="User">Users Only</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Specific Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-bold text-slate-900 outline-none focus:border-primary-400/50 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="All">All Categories</option>
                                            {categories.map(cat => (
                                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Placement</label>
                                    <select
                                        value={formData.placement}
                                        onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                                        className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-bold text-slate-900 outline-none focus:border-primary-400/50 transition-all appearance-none"
                                    >
                                        <option>Hero Main</option>
                                        <option>Sub-Category</option>
                                        <option>Featured List</option>
                                        <option>Popup Modal</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full h-12 mt-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
                                >
                                    {editingBanner ? 'Update Asset' : 'Deploy Asset'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBanners;
