import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../../components/ui/Icon';
import { adminApi } from '../services/adminApi';

const AdminVendorServices = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Pending Approval', 'Approved', 'Rejected'
    const [viewingService, setViewingService] = useState(null);
    const [previewMedia, setPreviewMedia] = useState(null);

    const token = localStorage.getItem('adminToken');

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await adminApi.getDynamicVendorServices(null, token);
            if (res.success) {
                setServices(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch vendor services:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateStatus = async (serviceId, status) => {
        if (!window.confirm(`Are you sure you want to mark this service as ${status}?`)) return;
        try {
            const res = await adminApi.updateVendorServiceStatus(serviceId, status, token);
            if (res.success) {
                setServices(prev => prev.map(s => s._id === serviceId ? { ...s, status } : s));
                if (viewingService?._id === serviceId) {
                    setViewingService(prev => ({ ...prev, status }));
                }
            }
        } catch (err) {
            console.error('Failed to update service status:', err);
        }
    };

    const filteredData = useMemo(() => {
        return services.filter(service => {
            const matchStatus = filterStatus === 'All' || service.status === filterStatus;
            
            const searchLower = searchQuery.toLowerCase();
            const vendorName = service.vendorId?.businessName?.toLowerCase() || '';
            const vendorEmail = service.vendorId?.email?.toLowerCase() || '';
            const catName = service.categoryId?.name?.toLowerCase() || '';
            const subName = service.subCategoryId?.name?.toLowerCase() || '';
            
            const matchSearch = vendorName.includes(searchLower) || vendorEmail.includes(searchLower) || catName.includes(searchLower) || subName.includes(searchLower);

            return matchStatus && matchSearch;
        });
    }, [services, searchQuery, filterStatus]);

    // Statistics Calculation
    const stats = useMemo(() => {
        let total = services.length;
        let pending = 0;
        let approved = 0;
        let rejected = 0;

        services.forEach(s => {
            if (s.status === 'Pending Approval') pending++;
            if (s.status === 'Approved') approved++;
            if (s.status === 'Rejected') rejected++;
        });

        return { total, pending, approved, rejected };
    }, [services]);

    const getStatusStyle = (status) => {
        switch(status) {
            case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-200/50';
            case 'Rejected': return 'bg-rose-50 text-rose-600 border-rose-200/50';
            case 'Pending Approval': return 'bg-amber-50 text-amber-600 border-amber-200/50';
            default: return 'bg-slate-50 text-slate-600 border-slate-200/50';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-10 w-10 border-4 border-slate-200 border-t-[#4F35C3] rounded-full"></div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Services...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Service Catalog</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Review and approve dynamic vendor offerings.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full sm:w-72">
                        <Icon name="search" size="sm" color="#64748b" className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by vendor, category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-[#4F35C3]/30 focus:ring-4 focus:ring-[#4F35C3]/5 transition-all shadow-sm"
                        />
                    </div>
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="h-[46px] px-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase tracking-wider outline-none focus:ring-4 focus:ring-[#4F35C3]/5 focus:border-[#4F35C3]/30 shadow-sm cursor-pointer"
                    >
                        <option value="All">All Status</option>
                        <option value="Pending Approval">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Top Statistics Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { title: 'Total Services', value: stats.total, icon: 'layers', color: 'from-[#4F35C3] to-[#7154eb]', text: 'text-[#4F35C3]', bg: 'bg-[#4F35C3]/10' },
                    { title: 'Pending Approval', value: stats.pending, icon: 'clock', color: 'from-amber-600 to-amber-400', text: 'text-amber-600', bg: 'bg-amber-500/10' },
                    { title: 'Approved', value: stats.approved, icon: 'check-circle', color: 'from-emerald-600 to-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-500/10' },
                    { title: 'Rejected', value: stats.rejected, icon: 'slash', color: 'from-rose-500 to-rose-400', text: 'text-rose-500', bg: 'bg-rose-500/10' },
                ].map((stat, idx) => (
                    <div key={idx} className="group relative bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.title}</p>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                            </div>
                            <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.text} transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300`}>
                                <Icon name={stat.icon} size="md" color="currentColor" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Services List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredData.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-white border border-slate-200/60 rounded-[2rem]">
                        <div className="flex flex-col items-center">
                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Icon name="search" size="md" color="#94a3b8" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">No Services Found</h3>
                            <p className="text-xs font-medium text-slate-500 mt-1 max-w-sm">We couldn't find any dynamic vendor services matching your filters.</p>
                        </div>
                    </div>
                ) : (
                    filteredData.map(service => (
                        <div key={service._id} className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-[#4F35C3]/5 transition-all flex flex-col overflow-hidden">
                            <div className="p-6 pb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 line-clamp-1">{service.vendorId?.businessName || 'Unknown Vendor'}</h3>
                                        <p className="text-xs text-slate-500">{service.vendorId?.email}</p>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-1 border rounded-lg text-[10px] font-black uppercase tracking-widest ${getStatusStyle(service.status)}`}>
                                        {service.status}
                                    </span>
                                </div>
                                <div className="flex gap-2 mb-4">
                                    <span className="px-2.5 py-1 bg-[#4F35C3]/10 text-[#4F35C3] rounded-lg text-[10px] font-black uppercase tracking-widest">
                                        {service.categoryId?.name}
                                    </span>
                                    {service.subCategoryId && (
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                            {service.subCategoryId?.name}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="space-y-2 mb-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Service Data Snapshot</p>
                                    {Object.entries(service.serviceData || {}).slice(0, 3).map(([k, v]) => (
                                        <div key={k} className="flex justify-between text-xs">
                                            <span className="font-bold text-slate-500 capitalize">{k.replace(/_/g, ' ')}:</span>
                                            <span className="font-medium text-slate-900 truncate max-w-[150px]">
                                                {typeof v === 'object' ? JSON.stringify(v) : v.toString()}
                                            </span>
                                        </div>
                                    ))}
                                    {Object.keys(service.serviceData || {}).length > 3 && (
                                        <div className="text-[10px] font-bold text-[#4F35C3] pt-1">+{Object.keys(service.serviceData).length - 3} more fields...</div>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                    <div className="flex items-center gap-1">
                                        <Icon name="image" size="xs" /> {service.images?.length || 0} Images
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Icon name="video" size="xs" /> {service.videos?.length || 0} Videos
                                    </div>
                                </div>
                            </div>
                            <div className="mt-auto border-t border-slate-100 p-4 bg-slate-50/50 flex gap-2">
                                <button 
                                    onClick={() => setViewingService(service)}
                                    className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:border-[#4F35C3]/30 hover:text-[#4F35C3] transition-colors"
                                >
                                    View Full Details
                                </button>
                                {service.status !== 'Approved' && (
                                    <button 
                                        onClick={() => handleUpdateStatus(service._id, 'Approved')}
                                        className="h-9 w-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-100 transition-colors tooltip tooltip-top"
                                        title="Approve Service"
                                    >
                                        <Icon name="check" size="xs" color="currentColor" />
                                    </button>
                                )}
                                {service.status !== 'Rejected' && (
                                    <button 
                                        onClick={() => handleUpdateStatus(service._id, 'Rejected')}
                                        className="h-9 w-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-100 transition-colors tooltip tooltip-top"
                                        title="Reject Service"
                                    >
                                        <Icon name="close" size="xs" color="currentColor" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Detailed View Modal */}
            {viewingService && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6" data-lenis-prevent="true">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewingService(null)}></div>
                    <div className="relative bg-white rounded-none sm:rounded-3xl w-full h-[100dvh] sm:h-auto max-w-none sm:max-w-3xl max-h-[100dvh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Service Details</h2>
                                <p className="text-xs font-medium text-slate-500 mt-1">{viewingService.vendorId?.businessName} • {viewingService.categoryId?.name}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-widest ${getStatusStyle(viewingService.status)}`}>
                                    {viewingService.status}
                                </span>
                                <button onClick={() => setViewingService(null)} className="h-10 w-10 bg-white border border-slate-200 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-50">
                                    <Icon name="close" size="sm" color="currentColor" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="h-4 w-1 bg-[#4F35C3] rounded-full"></div> Dynamic Form Data
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(viewingService.serviceData || {}).map(([key, value], idx) => (
                                        <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</p>
                                            <p className="text-sm font-medium text-slate-900 break-words">
                                                {Array.isArray(value) ? value.join(', ') : (typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value.toString())}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {viewingService.images?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <div className="h-4 w-1 bg-[#4F35C3] rounded-full"></div> Images ({viewingService.images.length})
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {viewingService.images.map((img, idx) => (
                                            <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-slate-200 cursor-pointer group" onClick={() => setPreviewMedia(img)}>
                                                <img src={img} alt="Gallery" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {viewingService.videos?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <div className="h-4 w-1 bg-[#4F35C3] rounded-full"></div> Videos ({viewingService.videos.length})
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {viewingService.videos.map((vid, idx) => (
                                            <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-black cursor-pointer relative group" onClick={() => setPreviewMedia({ url: vid, type: 'video' })}>
                                                <video src={vid} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-10 h-10 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                                                        <Icon name="play" size="sm" color="currentColor" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 sticky bottom-0">
                            {viewingService.status !== 'Approved' && (
                                <button 
                                    onClick={() => handleUpdateStatus(viewingService._id, 'Approved')}
                                    className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                                >
                                    Approve Service
                                </button>
                            )}
                            {viewingService.status !== 'Rejected' && (
                                <button 
                                    onClick={() => handleUpdateStatus(viewingService._id, 'Rejected')}
                                    className="px-6 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition-colors"
                                >
                                    Reject Service
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Media Preview Modal */}
            {previewMedia && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setPreviewMedia(null)}>
                    <button className="absolute top-6 right-6 h-12 w-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all">
                        <Icon name="close" size="sm" color="currentColor" />
                    </button>
                    {typeof previewMedia === 'object' && previewMedia.type === 'video' ? (
                        <video src={previewMedia.url} controls autoPlay className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()} />
                    ) : (
                        <img src={typeof previewMedia === 'string' ? previewMedia : previewMedia.url} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()} />
                    )}
                </div>,
                document.body
            )}
        </div>
    );
};

export default AdminVendorServices;
