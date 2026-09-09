import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { vendorApi } from '../vendorApi';
import Icon from '../../../components/ui/Icon';
import { useUpload } from '../context/UploadContext';

const VendorServices = () => {
    const { addBatchUpload, uploads } = useUpload();
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [categorySearchTerm, setCategorySearchTerm] = useState('');
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [viewingService, setViewingService] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [previewMedia, setPreviewMedia] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        shortDescription: '',
        detailedDescription: '',
        originalPrice: '',
        discountedPrice: '',
        features: []
    });
    const [featureInput, setFeatureInput] = useState('');
    
    const [coverImage, setCoverImage] = useState(null);
    const [coverPreview, setCoverPreview] = useState('');
    
    const [gallery, setGallery] = useState([]);
    const [galleryPreviews, setGalleryPreviews] = useState([]);
    const [existingGallery, setExistingGallery] = useState([]);

    const fileInputRef = useRef(null);
    const galleryInputRef = useRef(null);
    const token = localStorage.getItem('vendorToken');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [servicesRes, catsRes] = await Promise.all([
                vendorApi.getServices(token),
                vendorApi.getCategories()
            ]);
            
            if (servicesRes.success) setServices(servicesRes.data);
            if (catsRes.success) setCategories(catsRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (service = null) => {
        if (service) {
            setEditingService(service);
            setFormData({
                name: service.name,
                categoryId: service.category?._id || service.category,
                shortDescription: service.shortDescription,
                detailedDescription: service.detailedDescription,
                originalPrice: service.price?.original || '',
                discountedPrice: service.price?.discounted || '',
                features: service.features || []
            });
            setCoverPreview(service.coverImage ? service.coverImage : '');
            const normGallery = (service.gallery || []).map(item => typeof item === 'string' ? { url: item, type: 'image' } : item);
            setExistingGallery(normGallery);
            setGalleryPreviews(normGallery);
        } else {
            setEditingService(null);
            setFormData({
                name: '', categoryId: '', shortDescription: '', detailedDescription: '',
                originalPrice: '', discountedPrice: '', features: []
            });
            setCoverPreview('');
            setExistingGallery([]);
            setGalleryPreviews([]);
        }
        setCoverImage(null);
        setGallery([]);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingService(null);
    };

    const handleFeatureAdd = (e) => {
        e.preventDefault();
        if (featureInput.trim()) {
            setFormData(prev => ({ ...prev, features: [...prev.features, featureInput.trim()] }));
            setFeatureInput('');
        }
    };

    const handleFeatureRemove = (index) => {
        setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
    };

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverImage(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleGalleryChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newPreviews = files.map((file, i) => {
                const isVideo = file.type.startsWith('video/');
                return {
                    id: `new_gallery_${Date.now()}_${i}`,
                    url: URL.createObjectURL(file),
                    type: isVideo ? 'video' : 'image',
                    file
                };
            });
            
            setGallery(prev => [...prev, ...files]);
            setGalleryPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeGalleryImage = (index) => {
        // If it's an existing image
        if (index < existingGallery.length) {
            setExistingGallery(prev => prev.filter((_, i) => i !== index));
        } else {
            // It's a newly added image
            const newFileIndex = index - existingGallery.length;
            setGallery(prev => prev.filter((_, i) => i !== newFileIndex));
        }
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.categoryId || !formData.shortDescription || !formData.originalPrice) {
            return alert('Please fill required fields.');
        }

        const totalGalleryItems = existingGallery.length + galleryPreviews.length;
        if (totalGalleryItems < 5) {
            return alert('Minimum 5 gallery images or videos are required.');
        }

        if (!coverImage && !editingService?.coverImage) {
            return alert('Cover image is required.');
        }

        try {
            setActionLoading(true);
            const token = localStorage.getItem('vendorToken');
            
            const newFiles = galleryPreviews.filter(p => p.file).map(p => p.file);
            const allFilesToUpload = [];
            
            if (coverImage instanceof File) {
                allFilesToUpload.push(coverImage);
            }
            if (newFiles.length > 0) {
                allFilesToUpload.push(...newFiles);
            }

            let finalCoverImage = editingService ? editingService.coverImage : null;
            const newGalleryUrls = [];

            if (allFilesToUpload.length > 0) {
                const results = await addBatchUpload(allFilesToUpload, token, 'batch_upload');
                
                // results is an array of { url, type, originalName }
                // Map them back. The cover image (if present) was pushed first.
                let resultIndex = 0;
                if (coverImage instanceof File) {
                    finalCoverImage = results[resultIndex].url;
                    resultIndex++;
                }
                
                while (resultIndex < results.length) {
                    newGalleryUrls.push({ url: results[resultIndex].url, type: results[resultIndex].type });
                    resultIndex++;
                }
            }
            
            const finalGallery = [...existingGallery, ...newGalleryUrls];

            const data = new FormData();
            data.append('name', formData.name);
            data.append('category', formData.categoryId);
            data.append('shortDescription', formData.shortDescription);
            data.append('detailedDescription', formData.detailedDescription);
            data.append('features', JSON.stringify(formData.features));
            data.append('price', JSON.stringify({
                original: Number(formData.originalPrice),
                discounted: formData.discountedPrice ? Number(formData.discountedPrice) : undefined
            }));

            data.append('coverImage', finalCoverImage);
            data.append('gallery', JSON.stringify(finalGallery));

            let res;
            if (editingService) {
                res = await vendorApi.updateService(editingService._id, data, token);
            } else {
                res = await vendorApi.createService(data, token);
            }

            if (res.success) {
                fetchInitialData();
                closeModal();
            } else {
                alert(res.message || 'Error saving service');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to save service: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this service?')) return;
        try {
            const res = await vendorApi.deleteService(id, token);
            if (res.success) {
                fetchInitialData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const filteredServices = services.filter(s => {
        const matchesQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory ? s.category?._id === filterCategory : true;
        return matchesQuery && matchesCategory;
    });

    if (loading) {
        return (
            <div className="flex-1 h-full min-h-[600px] flex items-center justify-center">
                <div className="h-10 w-10 border-4 border-[#4F35C3]/20 border-t-[#4F35C3] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full min-h-[600px] flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="bg-white rounded-3xl border border-[#EAE6FF] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Services Portfolio</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Manage your offerings, pricing, and galleries</p>
                </div>
                <button 
                    onClick={() => openModal()}
                    className="h-12 px-6 bg-[#4F35C3] text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-[#3f2aa6] transition-all shadow-md shadow-[#4F35C3]/20 flex items-center gap-2 shrink-0"
                >
                    <Icon name="plus" size="sm" color="currentColor" /> Add Service
                </button>
            </div>

            {/* Filter Area */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Icon name="search" size="sm" color="#4F35C3" className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
                    <input 
                        type="text"
                        placeholder="Search services..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white border border-[#EAE6FF] rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#4F35C3]/30 focus:ring-4 focus:ring-[#4F35C3]/5 transition-all shadow-sm"
                    />
                </div>
                <div className="w-full md:w-64">
                    <select 
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full h-12 px-4 bg-white border border-[#EAE6FF] rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-[#4F35C3]/30 focus:ring-4 focus:ring-[#4F35C3]/5 transition-all shadow-sm appearance-none"
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Services Grid */}
            {filteredServices.length === 0 ? (
                <div className="flex-1 bg-white rounded-3xl border border-[#EAE6FF] p-12 flex flex-col items-center justify-center text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="h-20 w-20 bg-[#F9F8FF] rounded-2xl flex items-center justify-center mb-4 border border-[#4F35C3]/10">
                        <Icon name="store" size="xl" color="#4F35C3" className="opacity-50" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">No services found</h3>
                    <p className="text-slate-500 text-sm font-medium mt-2 max-w-sm">You haven't added any services yet, or none match your search criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredServices.map(service => (
                        <div key={service._id} className="bg-white rounded-3xl border border-[#EAE6FF] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] group hover:shadow-[0_12px_40px_rgb(79,53,195,0.08)] hover:border-[#4F35C3]/30 transition-all flex flex-col cursor-pointer" onClick={() => setViewingService(service)}>
                            <div className="h-48 relative overflow-hidden bg-slate-100">
                                {service.coverImage ? (
                                    <img src={service.coverImage} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Icon name="image" size="lg" color="currentColor" />
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg shadow-sm border border-white/20">
                                    <span className="text-[10px] font-black text-[#4F35C3] uppercase tracking-widest">{service.category?.name || 'Uncategorized'}</span>
                                </div>
                                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0" onClick={e => e.stopPropagation()}>
                                    <button onClick={(e) => { e.stopPropagation(); openModal(service); }} className="h-8 w-8 bg-white/90 backdrop-blur-md text-[#4F35C3] hover:bg-white rounded-lg flex items-center justify-center shadow-sm transition-all">
                                        <Icon name="edit" size="xs" color="currentColor" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(service._id); }} className="h-8 w-8 bg-rose-500/90 backdrop-blur-md text-white hover:bg-rose-500 rounded-lg flex items-center justify-center shadow-sm transition-all">
                                        <Icon name="trash" size="xs" color="currentColor" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-5 flex flex-col flex-1">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight line-clamp-1">{service.name}</h3>
                                <p className="text-xs font-medium text-slate-500 mt-2 line-clamp-2 flex-1">{service.shortDescription}</p>
                                
                                <div className="mt-4 pt-4 border-t border-[#EAE6FF] flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <Icon name="star" size="xs" color="#F59E0B" />
                                        <span className="text-sm font-bold text-slate-700">{service.rating?.score || '0.0'}</span>
                                        <span className="text-xs font-medium text-slate-400">({service.rating?.count || 0})</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        {service.price?.discounted ? (
                                            <>
                                                <span className="text-[10px] font-bold text-slate-400 line-through">₹{service.price.original}</span>
                                                <span className="text-sm font-black text-[#4F35C3]">₹{service.price.discounted}</span>
                                            </>
                                        ) : (
                                            <span className="text-sm font-black text-[#4F35C3]">₹{service.price?.original || '0'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6" data-lenis-prevent="true">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal}></div>
                    <div className="relative bg-white rounded-none sm:rounded-3xl w-full h-[100dvh] sm:h-auto max-w-none sm:max-w-4xl max-h-[100dvh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 m-0 sm:m-auto">
                        <div className="flex items-center justify-between p-6 border-b border-[#EAE6FF] bg-[#F9F8FF]">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">{editingService ? 'Edit Service' : 'Add New Service'}</h2>
                                <p className="text-[#4F35C3] text-[10px] font-bold uppercase tracking-widest mt-1">Configure service details</p>
                            </div>
                            <button onClick={closeModal} className="h-10 w-10 bg-white hover:bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center border border-[#EAE6FF] transition-all">
                                <Icon name="close" size="sm" color="currentColor" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar" data-lenis-prevent="true">
                            <form id="serviceForm" onSubmit={handleSubmit} className="space-y-8">
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left Column */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Service Name</label>
                                            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-12 px-4 bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-[#4F35C3]/30 focus:ring-4 focus:ring-[#4F35C3]/5 transition-all" placeholder="e.g. Premium Pet Grooming" />
                                        </div>
                                        <div className="relative">
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Category</label>
                                            
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    className="w-full h-12 px-4 pr-10 bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-[#4F35C3]/30 focus:ring-4 focus:ring-[#4F35C3]/5 transition-all cursor-text"
                                                    placeholder="Search or Select Category..."
                                                    value={isCategoryDropdownOpen ? categorySearchTerm : (formData.categoryId ? categories.find(c => c._id === formData.categoryId)?.name || '' : '')}
                                                    onChange={(e) => {
                                                        setCategorySearchTerm(e.target.value);
                                                        if (!isCategoryDropdownOpen) setIsCategoryDropdownOpen(true);
                                                    }}
                                                    onClick={() => setIsCategoryDropdownOpen(true)}
                                                    onFocus={() => setIsCategoryDropdownOpen(true)}
                                                    onBlur={() => {
                                                        // delay closing to allow click events on dropdown items
                                                        setTimeout(() => {
                                                            setIsCategoryDropdownOpen(false);
                                                            setCategorySearchTerm('');
                                                        }, 200);
                                                    }}
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <Icon name={isCategoryDropdownOpen ? "search" : "arrow"} size="sm" color="#64748b" className={isCategoryDropdownOpen ? "" : "transform rotate-90"} />
                                                </div>
                                            </div>

                                            {isCategoryDropdownOpen && (
                                                <div className="absolute z-50 w-full mt-2 bg-white border border-[#EAE6FF] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden">
                                                    <div className="max-h-60 overflow-y-auto" data-lenis-prevent="true">
                                                        {categories
                                                            .filter(cat => cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase()))
                                                            .map(cat => (
                                                                <div 
                                                                    key={cat._id}
                                                                    className={`px-4 py-3 text-sm cursor-pointer hover:bg-[#F9F8FF] ${formData.categoryId === cat._id ? 'text-[#4F35C3] font-bold bg-[#F9F8FF]' : 'text-slate-700'}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setFormData({...formData, categoryId: cat._id});
                                                                        setIsCategoryDropdownOpen(false);
                                                                        setCategorySearchTerm('');
                                                                    }}
                                                                >
                                                                    {cat.name}
                                                                </div>
                                                        ))}
                                                        {categories.filter(cat => cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase())).length === 0 && (
                                                            <div className="px-4 py-3 text-sm text-slate-500 text-center">
                                                                No categories found
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Hidden native select for required validation */}
                                            <select 
                                                required 
                                                value={formData.categoryId} 
                                                onChange={() => {}} 
                                                className="absolute bottom-0 left-1/2 w-0 h-0 opacity-0 pointer-events-none"
                                            >
                                                <option value="">Select</option>
                                                <option value={formData.categoryId}>{formData.categoryId}</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Original Price (₹)</label>
                                                <input type="number" required min="0" value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: e.target.value})} className="w-full h-12 px-4 bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-[#4F35C3]/30 focus:ring-4 focus:ring-[#4F35C3]/5 transition-all" placeholder="0" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Discounted Price (₹)</label>
                                                <input type="number" min="0" value={formData.discountedPrice} onChange={e => setFormData({...formData, discountedPrice: e.target.value})} className="w-full h-12 px-4 bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-[#4F35C3]/30 focus:ring-4 focus:ring-[#4F35C3]/5 transition-all" placeholder="Optional" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Short Description</label>
                                            <textarea required maxLength={150} value={formData.shortDescription} onChange={e => setFormData({...formData, shortDescription: e.target.value})} className="w-full p-4 bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-[#4F35C3]/30 focus:ring-4 focus:ring-[#4F35C3]/5 transition-all resize-none h-24 custom-scrollbar" placeholder="Brief summary (max 150 chars)"></textarea>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Detailed Description</label>
                                            <textarea required value={formData.detailedDescription} onChange={e => setFormData({...formData, detailedDescription: e.target.value})} className="w-full p-4 bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-[#4F35C3]/30 focus:ring-4 focus:ring-[#4F35C3]/5 transition-all resize-none h-32 custom-scrollbar" placeholder="Full details of the service..."></textarea>
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Cover Image *</label>
                                            <div className="h-40 border-2 border-dashed border-[#EAE6FF] rounded-2xl bg-[#F9F8FF] flex items-center justify-center relative overflow-hidden group hover:border-[#4F35C3]/50 transition-colors">
                                                {coverPreview ? (
                                                    <>
                                                        <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white rounded-lg text-sm font-bold text-[#4F35C3]">Replace</button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                                        <Icon name="image" size="lg" color="#4F35C3" className="mx-auto mb-2 opacity-50" />
                                                        <p className="text-xs font-bold text-[#4F35C3]">Click to upload</p>
                                                    </div>
                                                )}
                                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleCoverChange} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Gallery Images</label>
                                            <div className="grid grid-cols-4 gap-3 mb-3">
                                                {galleryPreviews.map((preview, i) => (
                                                    <div 
                                                        key={i} 
                                                        className="aspect-square rounded-xl overflow-hidden relative group border border-[#EAE6FF] cursor-pointer"
                                                        onClick={() => setPreviewMedia(preview)}
                                                    >
                                                        {preview.type === 'video' ? (
                                                            <video src={preview.url} className="w-full h-full object-cover" muted />
                                                        ) : (
                                                            <img src={preview.url} alt="Gallery" className="w-full h-full object-cover" />
                                                        )}
                                                        <button 
                                                            type="button" 
                                                            onClick={(e) => { e.stopPropagation(); removeGalleryImage(i); }} 
                                                            className="absolute inset-0 bg-rose-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Icon name="trash" size="sm" color="currentColor" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {galleryPreviews.length < 10 && (
                                                    <div onClick={() => galleryInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-[#EAE6FF] bg-[#F9F8FF] flex items-center justify-center cursor-pointer hover:border-[#4F35C3]/50 transition-colors">
                                                        <Icon name="plus" size="md" color="#4F35C3" className="opacity-50" />
                                                    </div>
                                                )}
                                            </div>
                                            <input type="file" ref={galleryInputRef} className="hidden" accept="image/*,video/*" multiple onChange={handleGalleryChange} />
                                            <p className="text-[10px] text-slate-400 font-medium">Min 5, Max 10 images allowed.</p>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Features / Inclusions</label>
                                            <div className="flex gap-2 mb-3">
                                                <input type="text" value={featureInput} onChange={e => setFeatureInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleFeatureAdd(e)} className="flex-1 h-10 px-4 bg-[#F9F8FF] border border-[#EAE6FF] rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-[#4F35C3]/30 transition-all" placeholder="e.g. Free consultation" />
                                                <button type="button" onClick={handleFeatureAdd} className="h-10 px-4 bg-[#4F35C3]/10 text-[#4F35C3] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#4F35C3]/20 transition-all">Add</button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {formData.features.map((feature, i) => (
                                                    <div key={i} className="px-3 py-1.5 bg-[#4F35C3]/5 border border-[#4F35C3]/10 text-[#4F35C3] rounded-lg text-xs font-bold flex items-center gap-2">
                                                        {feature}
                                                        <button type="button" onClick={() => handleFeatureRemove(i)} className="hover:text-rose-500 transition-colors">
                                                            <Icon name="close" size="xs" color="currentColor" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-4 sm:p-6 border-t border-[#EAE6FF] bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-3">
                            <button type="button" onClick={closeModal} className="h-12 px-6 bg-white border border-[#EAE6FF] text-slate-700 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
                            <button type="submit" form="serviceForm" disabled={actionLoading} className="h-12 px-8 bg-[#4F35C3] text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-[#3f2aa6] transition-all shadow-md shadow-[#4F35C3]/20 flex items-center gap-2 disabled:opacity-70">
                                {actionLoading && <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                {editingService ? 'Save Changes' : 'Create Service'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* View Modal */}
            {viewingService && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6" data-lenis-prevent="true">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewingService(null)}></div>
                    <div className="relative bg-white rounded-none sm:rounded-3xl w-full h-[100dvh] sm:h-auto max-w-none sm:max-w-2xl max-h-[100dvh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 m-0 sm:m-auto">
                        {/* Cover Image Header */}
                        <div 
                            className="h-48 sm:h-64 w-full relative cursor-pointer"
                            onClick={() => viewingService.coverImage && setPreviewMedia({ url: viewingService.coverImage, type: 'image' })}
                        >
                            {viewingService.coverImage ? (
                                <img src={viewingService.coverImage} alt={viewingService.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                                    <Icon name="image" size="lg" color="currentColor" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent pointer-events-none"></div>
                            
                            <button onClick={(e) => { e.stopPropagation(); setViewingService(null); }} className="absolute top-6 right-6 h-10 w-10 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-xl flex items-center justify-center transition-all z-10">
                                <Icon name="close" size="sm" color="currentColor" />
                            </button>

                            <div className="absolute bottom-6 left-6 right-6 text-white">
                                <span className="px-3 py-1 bg-[#4F35C3]/90 backdrop-blur-sm rounded-lg text-[10px] font-black uppercase tracking-widest inline-block mb-3">
                                    {viewingService.category?.name || 'Uncategorized'}
                                </span>
                                <h2 className="text-2xl font-black tracking-tight">{viewingService.name}</h2>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar" data-lenis-prevent="true">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EAE6FF] mb-6 gap-4">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Price</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-black text-[#4F35C3]">₹{viewingService.price?.discounted || viewingService.price?.original}</span>
                                        {viewingService.price?.discounted && (
                                            <span className="text-sm font-bold text-slate-400 line-through">₹{viewingService.price?.original}</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 sm:text-right">Rating</p>
                                    <div className="flex items-center gap-1 sm:justify-end">
                                        <Icon name="star" size="sm" color="#F59E0B" />
                                        <span className="text-lg font-bold text-slate-700">{viewingService.rating?.score || '0.0'}</span>
                                        <span className="text-xs font-medium text-slate-400 ml-1">({viewingService.rating?.count || 0} reviews)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 tracking-tight mb-3">About this service</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{viewingService.detailedDescription || viewingService.shortDescription}</p>
                                </div>

                                {viewingService.features && viewingService.features.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 tracking-tight mb-3">Features & Inclusions</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {viewingService.features.map((feature, i) => (
                                                <div key={i} className="px-3 py-1.5 bg-[#4F35C3]/5 text-[#4F35C3] rounded-lg text-xs font-bold border border-[#4F35C3]/10">
                                                    {feature}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {viewingService.gallery && viewingService.gallery.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 tracking-tight mb-3">Gallery ({viewingService.gallery.length})</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {viewingService.gallery.map((item, i) => {
                                                const normItem = typeof item === 'string' ? { url: item, type: 'image' } : item;
                                                return (
                                                    <div 
                                                        key={i} 
                                                        className="aspect-square rounded-xl overflow-hidden border border-[#EAE6FF] bg-black cursor-pointer relative group"
                                                        onClick={() => setPreviewMedia(normItem)}
                                                    >
                                                        {normItem.type === 'video' ? (
                                                            <>
                                                                <video src={normItem.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-transparent transition-all pointer-events-none">
                                                                    <div className="w-10 h-10 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center">
                                                                        <Icon name="play" size="sm" color="white" />
                                                                    </div>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <img src={normItem.url} alt="Gallery item" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 border-t border-[#EAE6FF] bg-slate-50 flex flex-col-reverse sm:flex-row justify-between gap-3">
                            <button onClick={() => { setViewingService(null); openModal(viewingService); }} className="h-12 px-6 bg-white border border-[#EAE6FF] text-[#4F35C3] rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                <Icon name="edit" size="sm" color="currentColor" /> Edit Service
                            </button>
                            <button onClick={() => setViewingService(null)} className="h-12 px-8 bg-slate-900 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md flex items-center justify-center">
                                Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Media Preview Modal */}
            {previewMedia && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/95 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-300" onClick={() => setPreviewMedia(null)}>
                    <button 
                        className="absolute top-6 right-6 h-12 w-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all z-[120]"
                        onClick={() => setPreviewMedia(null)}
                    >
                        <Icon name="close" size="md" color="currentColor" />
                    </button>
                    <div className="relative w-full max-w-5xl max-h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                        {previewMedia.type === 'video' ? (
                            <video src={previewMedia.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" />
                        ) : (
                            <img src={previewMedia.url} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default VendorServices;
