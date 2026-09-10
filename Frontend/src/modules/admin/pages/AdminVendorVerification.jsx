import { useState, useEffect } from 'react';
import Icon from '../../../components/ui/Icon';
import { adminApi } from '../services/adminApi';

const AdminVendorVerification = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const token = localStorage.getItem('adminToken');

    const fetchPendingVendors = async () => {
        try {
            setLoading(true);
            const res = await adminApi.getVendors(token);
            if (res.success) {
                // Filter for pending vendors
                const pending = res.data.filter(v => v.status === 'Pending');
                setVendors(pending);
            }
        } catch (err) {
            console.error('Failed to fetch vendors:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingVendors();
    }, []);

    const handleAction = async (id, status) => {
        try {
            setActionLoading(true);
            const res = await adminApi.updateVendorStatus(id, status, token);
            if (res.success) {
                setVendors(prev => prev.filter(v => v._id !== id));
                setModalOpen(false);
                setSelectedVendor(null);
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const openDetails = (vendor) => {
        setSelectedVendor(vendor);
        setModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-400"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Verification Desk</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">New Partner Approval Queue</p>
                </div>
                
                <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        {vendors.length} Requests Pending
                    </span>
                </div>
            </div>

            {vendors.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-20 text-center space-y-4">
                    <div className="h-20 w-20 rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
                        <Icon name="sparkles" size="lg" color="current" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-black text-slate-900">Queue is Clear!</h3>
                        <p className="text-slate-400 text-xs font-bold">All partners have been processed. Great job!</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {vendors.map((vendor) => (
                        <div key={vendor._id} className="group bg-white rounded-[2rem] border border-slate-200/60 p-6 shadow-sm hover:shadow-2xl hover:shadow-primary-100/20 transition-all duration-500 hover:-translate-y-1 relative flex flex-col">
                            {/* Status Badge */}
                            <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Awaiting Review</span>
                            </div>

                            <div className="flex-1 space-y-6">
                                {/* Partner Identity */}
                                <div className="flex items-start gap-4">
                                    <div className="h-16 w-16 rounded-[1.25rem] bg-slate-50 border border-slate-100 p-1 flex-shrink-0 group-hover:scale-105 transition-transform duration-500 overflow-hidden shadow-inner">
                                        <img 
                                            src={vendor.portfolio?.[0]?.url || `https://api.dicebear.com/7.x/identicon/svg?seed=${vendor.businessName}`} 
                                            alt="" 
                                            className="w-full h-full object-cover rounded-2xl" 
                                        />
                                    </div>
                                    <div className="pt-1 min-w-0">
                                        <h3 className="text-base font-black text-slate-900 leading-tight truncate pr-16">{vendor.businessName}</h3>
                                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                            {vendor.selectedCategories && vendor.selectedCategories.length > 0 ? (
                                                vendor.selectedCategories.map((cat, i) => (
                                                    <span key={i} className="px-2 py-0.5 rounded bg-primary-50 text-primary-500 text-[8px] font-black uppercase tracking-wider border border-primary-100/50">
                                                        {cat.categoryName}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-wider border border-slate-100/50">
                                                    Unspecified
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Info Grid */}
                                <div className="grid grid-cols-2 gap-px bg-slate-100 rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                                    <div className="bg-slate-50/50 p-3 flex items-center gap-3">
                                        <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                            <Icon name="search" size="xs" color="#94a3b8" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                                            <p className="text-[10px] font-bold text-slate-700">{vendor.city}</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50/50 p-3 flex items-center gap-3">
                                        <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                            <Icon name="user" size="xs" color="#94a3b8" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Contact</p>
                                            <p className="text-[10px] font-bold text-slate-700 truncate">{vendor.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Preview Portfolio Row (if any) */}
                                {vendor.portfolio && vendor.portfolio.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        {vendor.portfolio.slice(0, 4).map((img, i) => (
                                            <div key={i} className="h-8 w-8 rounded-lg overflow-hidden border border-slate-100 shadow-sm">
                                                <img src={img.url} className="h-full w-full object-cover" alt="" />
                                            </div>
                                        ))}
                                        {vendor.portfolio.length > 4 && (
                                            <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                                                <span className="text-[8px] font-black text-slate-400">+{vendor.portfolio.length - 4}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Action Button */}
                            <button 
                                onClick={() => openDetails(vendor)}
                                className="w-full mt-8 py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group-hover:gap-3 group-hover:bg-[#F9AEAF] group-hover:text-white group-hover:shadow-lg group-hover:shadow-[#F9AEAF]/20"
                            >
                                Detailed Review
                                <Icon name="eye" size="xs" color="currentColor" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Verification Modal */}
            {modalOpen && selectedVendor && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setModalOpen(false)}></div>
                    <div className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 p-0.5 overflow-hidden shadow-sm">
                                    <img 
                                        src={selectedVendor.portfolio?.[0]?.url || `https://api.dicebear.com/7.x/identicon/svg?seed=${selectedVendor.businessName}`} 
                                        alt="" 
                                        className="w-full h-full object-cover rounded-xl" 
                                    />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedVendor.businessName}</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Application Review</p>
                                </div>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="h-10 w-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
                                <Icon name="close" size="sm" color="#64748b" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column: Info */}
                                <div className="lg:col-span-1 space-y-8">
                                    <section className="space-y-4">
                                        <h4 className="text-[10px] font-black text-primary-400 uppercase tracking-widest pb-2 border-b border-primary-100">Business Profile</h4>
                                        <div className="space-y-4">
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Name</p>
                                                <p className="text-[13px] font-bold text-slate-900">{selectedVendor.fullName}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                                                <p className="text-[13px] font-bold text-slate-900">{selectedVendor.email}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category & Location</p>
                                                {selectedVendor.selectedCategories && selectedVendor.selectedCategories.length > 0 ? (
                                                    selectedVendor.selectedCategories.map((cat, i) => (
                                                        <div key={i}>
                                                            <p className="text-[13px] font-bold text-slate-900 leading-tight">{cat.categoryName}</p>
                                                            <p className="text-[10px] font-bold text-slate-500 leading-tight">
                                                                {cat.subcategories && cat.subcategories.map(sub => sub.subcategoryName).join(', ')}
                                                            </p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-[13px] font-bold text-slate-400 italic">Unspecified Category</p>
                                                )}
                                                <div className="pt-2 border-t border-slate-200 mt-2">
                                                    <p className="text-[12px] font-black text-slate-700 flex items-center gap-1.5">
                                                        <Icon name="search" size="xs" color="#64748b" /> {selectedVendor.city}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h4 className="text-[10px] font-black text-primary-400 uppercase tracking-widest pb-2 border-b border-primary-100">Operational Coverage</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Service Cities</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedVendor.serviceCities?.length > 0 ? (
                                                        selectedVendor.serviceCities.map((city, idx) => (
                                                            <span key={idx} className="bg-slate-50 border border-slate-100 text-slate-700 text-[9px] font-bold px-2 py-1 rounded">{city}</span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-slate-400 italic">Unspecified</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Languages</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedVendor.languages?.length > 0 ? (
                                                        selectedVendor.languages.map((lang, idx) => (
                                                            <span key={idx} className="bg-slate-50 border border-slate-100 text-slate-700 text-[9px] font-bold px-2 py-1 rounded">{lang}</span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-slate-400 italic">Unspecified</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h4 className="text-[10px] font-black text-primary-400 uppercase tracking-widest pb-2 border-b border-primary-100">Documents</h4>
                                        <div className="space-y-3">
                                            {selectedVendor.documents?.idProof ? (
                                                <a href={selectedVendor.documents.idProof} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl group transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <Icon name="shield" size="xs" color="#10b981" />
                                                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">ID Proof Uploaded</span>
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
                                                <a href={selectedVendor.documents.gst} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl group transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <Icon name="sparkles" size="xs" color="#10b981" />
                                                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">GST Registered</span>
                                                    </div>
                                                    <Icon name="eye" size="xs" color="#10b981" />
                                                </a>
                                            ) : (
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                                                    <Icon name="sparkles" size="xs" color="#94a3b8" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No GST Record</span>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>

                                {/* Right Column: Content & Media */}
                                <div className="lg:col-span-2 space-y-8">
                                    {selectedVendor.businessDetails?.description && (
                                        <section className="space-y-4">
                                            <h4 className="text-[10px] font-black text-primary-400 uppercase tracking-widest pb-2 border-b border-primary-100">About the Business</h4>
                                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                                                <p className="text-[13px] font-medium text-slate-700 leading-relaxed">
                                                    {selectedVendor.businessDetails.description}
                                                </p>
                                                <div className="flex gap-8 pt-4 border-t border-slate-200">
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
                                            <h4 className="text-[10px] font-black text-primary-400 uppercase tracking-widest pb-2 border-b border-primary-100">Services Offered</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {selectedVendor.services.map((svc, idx) => (
                                                    <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                        <p className="text-[13px] font-bold text-slate-900">{svc.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-500 mb-2">{svc.category}</p>
                                                        {svc.features && svc.features.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {svc.features.map((feat, fidx) => (
                                                                    <span key={fidx} className="bg-white border border-slate-200 text-[9px] font-bold text-slate-600 px-2 py-1 rounded">
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

                                    {selectedVendor.pricing && (
                                        <section className="space-y-4">
                                            <h4 className="text-[10px] font-black text-primary-400 uppercase tracking-widest pb-2 border-b border-primary-100">Pricing Details</h4>
                                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                            <h4 className="text-[10px] font-black text-primary-400 uppercase tracking-widest pb-2 border-b border-primary-100">Bank Details</h4>
                                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
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

                                    {selectedVendor.dynamicServices && selectedVendor.dynamicServices.length > 0 && (
                                        <section className="space-y-4">
                                            <h4 className="text-[10px] font-black text-primary-400 uppercase tracking-widest pb-2 border-b border-primary-100">Form Template Data</h4>
                                            <div className="space-y-4">
                                                {selectedVendor.dynamicServices.map((svc, idx) => (
                                                    <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                                        <p className="text-[11px] font-black text-primary-500 uppercase tracking-widest mb-4">{svc.subcategoryName || `Service Details #${idx + 1}`}</p>
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
                                                            <div className="pt-4 border-t border-slate-200 mt-4">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Media</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {svc.images?.map((img, i) => (
                                                                        <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                                                                            <img src={img} alt="Service media" className="h-16 w-16 rounded-xl object-cover border border-slate-200 hover:opacity-80 transition-opacity" />
                                                                        </a>
                                                                    ))}
                                                                    {svc.videos?.map((vid, i) => (
                                                                        <a key={i} href={vid} target="_blank" rel="noopener noreferrer" className="relative group block">
                                                                            <video src={vid} className="h-16 w-16 rounded-xl object-cover border border-slate-200" />
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

                                    <section className="space-y-4">
                                        <h4 className="text-[10px] font-black text-primary-400 uppercase tracking-widest pb-2 border-b border-primary-100">Work Portfolio</h4>
                                        {selectedVendor.portfolio && selectedVendor.portfolio.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {selectedVendor.portfolio.map((item, idx) => (
                                                    <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative group">
                                                        <img src={item.url} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                                            <p className="text-[8px] font-black text-white uppercase tracking-widest truncate">{item.title}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 p-10 rounded-3xl border border-dashed border-slate-200 text-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No portfolio media uploaded</p>
                                            </div>
                                        )}
                                    </section>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
                            <button 
                                onClick={() => handleAction(selectedVendor._id, 'Rejected')}
                                disabled={actionLoading}
                                className="px-8 py-4 rounded-2xl border border-rose-100 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all disabled:opacity-50"
                            >
                                Reject Application
                            </button>
                            <button 
                                onClick={() => handleAction(selectedVendor._id, 'Approved')}
                                disabled={actionLoading}
                                className="flex-1 max-w-sm py-4 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                            >
                                {actionLoading ? 'Processing...' : 'Approve & Activate Partner'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminVendorVerification;
