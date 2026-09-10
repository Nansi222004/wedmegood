import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../../components/ui/Icon';
import { adminApi } from '../services/adminApi';

const AdminVendors = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    const token = localStorage.getItem('adminToken');

    const fetchVendors = async () => {
        try {
            setLoading(true);
            const res = await adminApi.getVendors(token);
            if (res.success) {
                setVendors(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch vendors:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const filteredVendors = useMemo(() => {
        return vendors.filter(v => {
            const statusMap = {
                'Verified': 'Approved',
                'Pending': 'Pending',
                'Rejected': 'Rejected'
            };
            const targetStatus = statusMap[filter] || filter;
            const matchStatus = filter === 'All' || v.status === targetStatus;
            const categoriesMatch = v.selectedCategories ? v.selectedCategories.some(cat => cat.categoryName.toLowerCase().includes(searchQuery.toLowerCase())) : false;
            const matchSearch = (v.businessName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (v.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                categoriesMatch;
            return matchStatus && matchSearch;
        });
    }, [vendors, filter, searchQuery]);

    const handleAction = async (id, status) => {
        try {
            setActionLoading(true);
            const res = await adminApi.updateVendorStatus(id, status, token);
            if (res.success) {
                setVendors(prev => prev.map(v => v._id === id ? res.data : v));
                setModalOpen(false);
                setSelectedVendor(null);
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const nextStatus = currentStatus === 'Approved' ? 'Pending' : 'Approved';
        await handleAction(id, nextStatus);
    };

    const toggleActive = async (id, currentIsActive) => {
        try {
            const res = await adminApi.toggleVendorActive(id, !currentIsActive, token);
            if (res.success) {
                setVendors(prev => prev.map(v => v._id === id ? res.data : v));
            }
        } catch (err) {
            console.error('Failed to toggle active status:', err);
        }
    };

    const openDetails = (vendor) => {
        setSelectedVendor(vendor);
        setModalOpen(true);
    };

    const deleteVendor = async (id) => {
        if (window.confirm('Are you sure you want to permanently delete this vendor and all their associated data? This action cannot be undone.')) {
            try {
                const res = await adminApi.deleteVendor(id, token);
                if (res.success) {
                    setVendors(prev => prev.filter(v => v._id !== id));
                    alert('Vendor node successfully decoupled from system.');
                } else {
                    alert(res.message || 'Failed to delete vendor');
                }
            } catch (err) {
                console.error('Delete error:', err);
                alert('A system error occurred during deletion.');
            }
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-[#EAE6FF] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Partners Console</h1>
                    <p className="text-[#4F35C3] text-[10px] font-black uppercase tracking-widest mt-2">Vendor Ecosystem Oversight</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full sm:w-auto">
                        <Icon name="search" size="xs" color="#4F35C3" className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
                        <input
                            type="text"
                            placeholder="Search partners..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-4 py-3 bg-[#F9F8FF] border border-[#EAE6FF] rounded-2xl text-[12px] font-bold text-slate-900 focus:border-[#4F35C3]/30 focus:ring-4 focus:ring-[#4F35C3]/5 outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-[#F9F8FF] p-1.5 rounded-2xl border border-[#EAE6FF]">
                        {['All', 'Pending', 'Verified'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${filter === status
                                        ? 'bg-[#4F35C3] text-white shadow-md shadow-[#4F35C3]/20 scale-100'
                                        : 'text-slate-500 hover:text-[#4F35C3] hover:bg-white scale-95 hover:scale-100'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-[#EAE6FF] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-[#F9F8FF]">
                                <th className="px-6 py-5 text-[10px] font-black text-[#4F35C3] uppercase tracking-widest border-b border-[#EAE6FF]">Partner Details</th>
                                <th className="px-5 py-5 text-[10px] font-black text-[#4F35C3] uppercase tracking-widest border-b border-[#EAE6FF]">Contact & Location</th>
                                <th className="px-5 py-5 text-[10px] font-black text-[#4F35C3] uppercase tracking-widest border-b border-[#EAE6FF]">Service Details</th>
                                <th className="px-5 py-5 text-[10px] font-black text-[#4F35C3] uppercase tracking-widest border-b border-[#EAE6FF]">Onboarding</th>
                                <th className="px-5 py-5 text-[10px] font-black text-[#4F35C3] uppercase tracking-widest border-b border-[#EAE6FF]">Verify</th>
                                <th className="px-6 py-5 text-[10px] font-black text-[#4F35C3] uppercase tracking-widest border-b border-[#EAE6FF] text-right">Ops</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EAE6FF]/50">
                            {filteredVendors.length > 0 ? filteredVendors.map((vendor) => (
                                <tr key={vendor._id} className="group hover:bg-primary-50/10 transition-colors">
                                     <td className="px-6 py-4">
                                         <div className="flex items-center gap-3">
                                             <div className="h-12 w-12 rounded-2xl bg-[#F9F8FF] border border-[#EAE6FF] p-0.5 flex-shrink-0 overflow-hidden shadow-sm">
                                                 <img 
                                                     src={vendor.profileImage || vendor.portfolio?.[0]?.url || `https://api.dicebear.com/7.x/identicon/svg?seed=${vendor.businessName}`} 
                                                     className="h-full w-full object-cover rounded-xl" 
                                                     alt={vendor.businessName} 
                                                 />
                                             </div>
                                             <div className="min-w-0">
                                                 <p className="text-[13px] font-black text-slate-900 leading-tight truncate">{vendor.businessName}</p>
                                                 <p className="text-[10px] font-bold text-[#4F35C3] mt-0.5 uppercase tracking-widest truncate">{vendor.fullName}</p>
                                             </div>
                                         </div>
                                     </td>
                                     <td className="px-5 py-4">
                                         <p className="text-[11px] font-black text-slate-700">{vendor.phone}</p>
                                         <p className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">{vendor.email}</p>
                                         <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">{vendor.city}</p>
                                     </td>
                                     <td className="px-5 py-4">
                                         {vendor.selectedCategories && vendor.selectedCategories.length > 0 ? (
                                             vendor.selectedCategories.map((cat, i) => (
                                                 <div key={i} className="mb-2 last:mb-0">
                                                    <p className="text-[11px] font-black text-[#4F35C3] uppercase tracking-widest">{cat.categoryName}</p>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                                        {cat.subcategories && cat.subcategories.map(sub => sub.subcategoryName).join(', ')}
                                                    </p>
                                                 </div>
                                             ))
                                         ) : (
                                             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Unspecified</p>
                                         )}
                                     </td>
                                     <td className="px-5 py-4">
                                         <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                             vendor.onboardingStep === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                         }`}>
                                             {vendor.onboardingStep || 'Started'}
                                         </span>
                                         <p className="text-[8px] font-bold text-slate-400 mt-1.5 uppercase">Joined: {new Date(vendor.createdAt).toLocaleDateString()}</p>
                                     </td>
                                     <td className="px-5 py-4">
                                         <button
                                             onClick={() => toggleStatus(vendor._id, vendor.status)}
                                             className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                                         >
                                             <div className={`h-1.5 w-1.5 rounded-full ${vendor.status === 'Approved' && vendor.isActive ? 'bg-emerald-500' :
                                                     vendor.status === 'Approved' && !vendor.isActive ? 'bg-slate-400' :
                                                     vendor.status === 'Pending' ? 'bg-amber-500' :
                                                         'bg-rose-500'
                                                 }`} />
                                             <span className={`text-[9px] font-black uppercase tracking-widest ${vendor.status === 'Approved' && vendor.isActive ? 'text-emerald-600' :
                                                     vendor.status === 'Approved' && !vendor.isActive ? 'text-slate-500' :
                                                     vendor.status === 'Pending' ? 'text-amber-600' :
                                                         'text-rose-600'
                                                 }`}>
                                                 {vendor.status === 'Approved' ? (vendor.isActive ? 'Verified & Active' : 'Deactivated') : vendor.status}
                                             </span>
                                         </button>
                                     </td>
                                     <td className="px-5 py-4 text-right">
                                         <div className="flex items-center justify-end gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                                             {vendor.status === 'Pending' && (
                                                 <>
                                                     <button 
                                                         onClick={() => handleAction(vendor._id, 'Approved')}
                                                         title="Approve Partner"
                                                         className="h-8 w-8 flex items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-500 hover:bg-emerald-500 hover:text-white hover:scale-110 transition-all shadow-sm"
                                                     >
                                                         <Icon name="check" size="xs" color="current" />
                                                     </button>
                                                     <button 
                                                         onClick={() => handleAction(vendor._id, 'Rejected')}
                                                         title="Reject Partner"
                                                         className="h-8 w-8 flex items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white hover:scale-110 transition-all shadow-sm"
                                                     >
                                                         <Icon name="close" size="xs" color="current" />
                                                     </button>
                                                 </>
                                             )}
                                             {vendor.status === 'Approved' && (
                                                 <button 
                                                     onClick={() => toggleActive(vendor._id, vendor.isActive)}
                                                     title={vendor.isActive ? "Deactivate Vendor" : "Activate Vendor"}
                                                     className={`h-8 px-3 flex items-center justify-center rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all shadow-sm hover:scale-105 ${
                                                         vendor.isActive 
                                                         ? 'bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-500 hover:text-white' 
                                                         : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                                                     }`}
                                                 >
                                                     {vendor.isActive ? "Deactive" : "Active"}
                                                 </button>
                                             )}
                                             <button 
                                                 onClick={() => openDetails(vendor)}
                                                 title="View Full Details"
                                                 className="h-8 w-8 flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-600 active:bg-violet-600 focus:bg-violet-600 text-white opacity-100 hover:!brightness-100 hover:scale-110 transition-all shadow-sm"
                                             >
                                                 <Icon name="eye" size="xs" color="current" />
                                             </button>
                                             <button
                                                 onClick={() => deleteVendor(vendor._id)}
                                                 title="Delete Vendor"
                                                 className="h-8 w-8 flex items-center justify-center rounded-xl bg-rose-500 hover:bg-rose-500 active:bg-rose-500 focus:bg-rose-500 text-white opacity-100 hover:!brightness-100 hover:scale-110 transition-all shadow-sm"
                                             >
                                                 <Icon name="trash" size="xs" color="current" />
                                             </button>
                                         </div>
                                     </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No nodes match your query</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Verification Modal */}
            {modalOpen && selectedVendor && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8">
                    <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={() => setModalOpen(false)}></div>
                    <div className="relative w-full max-w-5xl bg-white rounded-[2.5rem] border border-[#EAE6FF] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-[#EAE6FF] flex items-center justify-between bg-[#F9F8FF]">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-white border border-[#EAE6FF] p-1 shadow-sm">
                                    <img src={selectedVendor.profileImage || selectedVendor.portfolio?.[0]?.url || `https://api.dicebear.com/7.x/identicon/svg?seed=${selectedVendor.businessName}`} alt="" className="w-full h-full object-cover rounded-xl" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedVendor.businessName}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[10px] font-black text-[#4F35C3] uppercase tracking-[0.2em]">Application Review</p>
                                        <span className="text-[10px] font-black text-slate-300">•</span>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined {new Date(selectedVendor.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="h-10 w-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
                                <Icon name="close" size="sm" color="#64748b" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar" data-lenis-prevent="true">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column: Info */}
                                <div className="lg:col-span-1 space-y-8">
                                    <section className="space-y-4">
                                        <h4 className="text-[11px] font-black text-[#4F35C3] uppercase tracking-widest pb-2 border-b border-[#EAE6FF]">Business Profile</h4>
                                        <div className="space-y-4">
                                            <div className="bg-[#F9F8FF] p-5 rounded-2xl border border-[#EAE6FF] space-y-3">
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Person</p>
                                                    <p className="text-[14px] font-bold text-slate-900">{selectedVendor.fullName}</p>
                                                </div>
                                                <div className="pt-3 border-t border-[#EAE6FF]">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                                                    <p className="text-[13px] font-bold text-slate-900">{selectedVendor.email}</p>
                                                </div>
                                                <div className="pt-3 border-t border-[#EAE6FF]">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                                                    <p className="text-[13px] font-bold text-slate-900">{selectedVendor.phone}</p>
                                                </div>
                                            </div>
                                            <div className="bg-[#F9F8FF] p-5 rounded-2xl border border-[#EAE6FF] space-y-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Category & Location</p>
                                                {selectedVendor.selectedCategories && selectedVendor.selectedCategories.length > 0 ? (
                                                    selectedVendor.selectedCategories.map((cat, i) => (
                                                        <div key={i} className="mb-2">
                                                            <p className="text-[12px] font-bold text-[#4F35C3] leading-tight">{cat.categoryName}</p>
                                                            <p className="text-[10px] font-bold text-slate-500 leading-tight">
                                                                {cat.subcategories && cat.subcategories.map(sub => sub.subcategoryName).join(', ')}
                                                            </p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-[12px] font-bold text-slate-400 italic">Unspecified Category</p>
                                                )}
                                                <div className="mt-3 pt-2 border-t border-[#EAE6FF]">
                                                    <p className="text-[11px] font-black text-slate-900 flex items-center gap-1">
                                                        <Icon name="search" size="xs" color="#64748b" /> {selectedVendor.city}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h4 className="text-[11px] font-black text-[#4F35C3] uppercase tracking-widest pb-2 border-b border-[#EAE6FF]">Performance Metrics</h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="bg-white p-4 rounded-2xl border border-[#EAE6FF] shadow-[0_4px_20px_rgb(0,0,0,0.02)] text-center">
                                                <p className="text-2xl font-black text-[#4F35C3]">{selectedVendor.profileViews || '0'}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Profile Views</p>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h4 className="text-[11px] font-black text-[#4F35C3] uppercase tracking-widest pb-2 border-b border-[#EAE6FF]">Verification Documents</h4>
                                        <div className="space-y-3">
                                            {selectedVendor.documents?.idProof ? (
                                                <a href={selectedVendor.documents.idProof} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl group transition-all hover:bg-emerald-100">
                                                    <div className="flex items-center gap-3">
                                                        <Icon name="shield" size="xs" color="#10b981" />
                                                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">ID Proof</span>
                                                    </div>
                                                    <Icon name="eye" size="xs" color="#10b981" />
                                                </a>
                                            ) : (
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                                                    <Icon name="shield" size="xs" color="#94a3b8" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No ID Proof</span>
                                                </div>
                                            )}
                                            
                                            {selectedVendor.documents?.gst ? (
                                                <a href={selectedVendor.documents.gst} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl group transition-all hover:bg-emerald-100">
                                                    <div className="flex items-center gap-3">
                                                        <Icon name="sparkles" size="xs" color="#10b981" />
                                                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">GST Reg</span>
                                                    </div>
                                                    <Icon name="eye" size="xs" color="#10b981" />
                                                </a>
                                            ) : (
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                                                    <Icon name="sparkles" size="xs" color="#94a3b8" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No GST</span>
                                                </div>
                                            )}

                                            {selectedVendor.documents?.contract ? (
                                                <a href={selectedVendor.documents.contract} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl group transition-all hover:bg-emerald-100">
                                                    <div className="flex items-center gap-3">
                                                        <Icon name="document" size="xs" color="#10b981" />
                                                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Contract</span>
                                                    </div>
                                                    <Icon name="eye" size="xs" color="#10b981" />
                                                </a>
                                            ) : (
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                                                    <Icon name="document" size="xs" color="#94a3b8" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Contract</span>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>

                                {/* Right Column: Content & Media */}
                                <div className="lg:col-span-2 space-y-8">
                                    {selectedVendor.businessDetails?.description && (
                                        <section className="space-y-4">
                                            <h4 className="text-[11px] font-black text-[#4F35C3] uppercase tracking-widest pb-2 border-b border-[#EAE6FF]">About the Business</h4>
                                            <div className="bg-[#F9F8FF] p-6 rounded-3xl border border-[#EAE6FF] space-y-4">
                                                <p className="text-[13px] font-medium text-slate-700 leading-relaxed">
                                                    {selectedVendor.businessDetails.description}
                                                </p>
                                                <div className="flex gap-8 pt-4 border-t border-[#EAE6FF]">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Experience</p>
                                                        <p className="text-[14px] font-bold text-slate-900">{selectedVendor.businessDetails.years} Years</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Team Size</p>
                                                        <p className="text-[14px] font-bold text-slate-900">{selectedVendor.businessDetails.teamSize} Members</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    {selectedVendor.services && selectedVendor.services.length > 0 && (
                                        <section className="space-y-4">
                                            <h4 className="text-[11px] font-black text-[#4F35C3] uppercase tracking-widest pb-2 border-b border-[#EAE6FF]">Services Offered</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {selectedVendor.services.map((svc, idx) => (
                                                    <div key={idx} className="bg-[#F9F8FF] p-4 rounded-2xl border border-[#EAE6FF]">
                                                        <p className="text-[13px] font-bold text-slate-900">{svc.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-500 mb-2">{svc.category}</p>
                                                        {svc.features && svc.features.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {svc.features.map((feat, fidx) => (
                                                                    <span key={fidx} className="bg-white border border-[#EAE6FF] text-[9px] font-bold text-slate-600 px-2 py-1 rounded">
                                                                        {feat}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {selectedVendor.dynamicServices && selectedVendor.dynamicServices.length > 0 && (
                                        <section className="space-y-4">
                                            <h4 className="text-[11px] font-black text-[#4F35C3] uppercase tracking-widest pb-2 border-b border-[#EAE6FF]">Form Template Data</h4>
                                            <div className="space-y-4">
                                                {selectedVendor.dynamicServices.map((svc, idx) => (
                                                    <div key={idx} className="bg-[#F9F8FF] p-6 rounded-3xl border border-[#EAE6FF]">
                                                        <p className="text-[11px] font-black text-[#4F35C3] uppercase tracking-widest mb-4">
                                                            {svc.subcategoryName || `Service Details #${idx + 1}`}
                                                        </p>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            {Object.entries(svc.serviceData || {}).map(([key, val], i) => (
                                                                <div key={i}>
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{key}</p>
                                                                    <p className="text-[13px] font-bold text-slate-900">
                                                                        {Array.isArray(val) ? val.join(', ') : (val || 'N/A')}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {(svc.images?.length > 0 || svc.videos?.length > 0) && (
                                                            <div className="pt-4 border-t border-[#EAE6FF] mt-4">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Media</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {svc.images?.map((img, i) => (
                                                                        <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                                                                            <img src={img} alt="Service media" className="h-16 w-16 rounded-xl object-cover border border-[#EAE6FF] hover:opacity-80 transition-opacity" />
                                                                        </a>
                                                                    ))}
                                                                    {svc.videos?.map((vid, i) => (
                                                                        <a key={i} href={vid} target="_blank" rel="noopener noreferrer" className="relative group block">
                                                                            <video src={vid} className="h-16 w-16 rounded-xl object-cover border border-[#EAE6FF]" />
                                                                            <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center group-hover:bg-black/40 transition-all">
                                                                                <Icon name="play" size="sm" color="#ffffff" />
                                                                            </div>
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {selectedVendor.pricing && (
                                        <section className="space-y-4">
                                            <h4 className="text-[11px] font-black text-[#4F35C3] uppercase tracking-widest pb-2 border-b border-[#EAE6FF]">Pricing Details</h4>
                                            <div className="bg-[#F9F8FF] p-6 rounded-3xl border border-[#EAE6FF] grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Base Price Range</p>
                                                    <p className="text-[14px] font-bold text-slate-900">{selectedVendor.pricing.range || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Additional Notes</p>
                                                    <p className="text-[12px] font-medium text-slate-700">{selectedVendor.pricing.notes || 'None'}</p>
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    {selectedVendor.bank && (
                                        <section className="space-y-4">
                                            <h4 className="text-[11px] font-black text-[#4F35C3] uppercase tracking-widest pb-2 border-b border-[#EAE6FF]">Bank Details</h4>
                                            <div className="bg-[#F9F8FF] p-6 rounded-3xl border border-[#EAE6FF] grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Name</p>
                                                    <p className="text-[12px] font-bold text-slate-900">{selectedVendor.bank.accountName || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Number</p>
                                                    <p className="text-[12px] font-bold text-slate-900">{selectedVendor.bank.accountNumber || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">IFSC</p>
                                                    <p className="text-[12px] font-bold text-slate-900">{selectedVendor.bank.ifsc || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">UPI ID</p>
                                                    <p className="text-[12px] font-bold text-slate-900">{selectedVendor.bank.upiId || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    <section className="space-y-4">
                                        <h4 className="text-[11px] font-black text-[#4F35C3] uppercase tracking-widest pb-2 border-b border-[#EAE6FF]">Operational Coverage</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-[#F9F8FF] p-5 rounded-[2rem] border border-[#EAE6FF]">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Service Cities</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedVendor.serviceCities?.length > 0 ? (
                                                        selectedVendor.serviceCities.map((city, idx) => (
                                                            <span key={idx} className="bg-white border border-[#EAE6FF] text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg">{city}</span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-400 italic">Unspecified</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="bg-[#F9F8FF] p-5 rounded-[2rem] border border-[#EAE6FF]">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Languages</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedVendor.languages?.length > 0 ? (
                                                        selectedVendor.languages.map((lang, idx) => (
                                                            <span key={idx} className="bg-white border border-[#EAE6FF] text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg">{lang}</span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-400 italic">Unspecified</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h4 className="text-[11px] font-black text-[#4F35C3] uppercase tracking-widest pb-2 border-b border-[#EAE6FF]">Work Portfolio</h4>
                                        {selectedVendor.portfolio && selectedVendor.portfolio.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {selectedVendor.portfolio.map((item, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        className="aspect-square rounded-2xl overflow-hidden border border-[#EAE6FF] shadow-sm relative group bg-slate-50 cursor-pointer"
                                                        onClick={() => setPreviewImage(item.url)}
                                                    >
                                                        <img src={item.url} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                                            <p className="text-[8px] font-black text-white uppercase tracking-widest truncate">{item.title}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-[#F9F8FF] p-10 rounded-3xl border border-dashed border-[#EAE6FF] text-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No portfolio media uploaded</p>
                                            </div>
                                        )}
                                    </section>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-6 border-t border-[#EAE6FF] flex items-center justify-between gap-4 bg-[#F9F8FF]">
                            <button 
                                onClick={() => handleAction(selectedVendor._id, 'Rejected')}
                                disabled={actionLoading}
                                className="px-8 py-4 rounded-2xl border border-rose-100 text-rose-500 text-[11px] font-black uppercase tracking-widest hover:bg-rose-50 hover:border-rose-200 transition-all disabled:opacity-50"
                            >
                                Reject Application
                            </button>
                            <button 
                                onClick={() => handleAction(selectedVendor._id, 'Approved')}
                                disabled={actionLoading}
                                className="flex-1 max-w-sm py-4 rounded-2xl bg-[#4F35C3] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#3f2aa6] transition-all shadow-lg shadow-[#4F35C3]/30 disabled:opacity-50"
                            >
                                {actionLoading ? 'Processing...' : selectedVendor.status === 'Approved' ? 'Already Verified' : 'Approve & Activate Partner'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Image Preview Modal */}
            {previewImage && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
                    <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center justify-center animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                        <img src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border-4 border-white/10" />
                        <button 
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-12 right-0 md:-right-12 h-10 w-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                        >
                            <Icon name="close" size="sm" color="current" />
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AdminVendors;
