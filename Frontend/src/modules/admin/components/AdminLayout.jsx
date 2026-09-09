import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import Icon from '../../../components/ui/Icon';
import '../adminTheme.css';

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminAuth');
        navigate('/admin/login');
    };

    return (
        <div className="flex h-screen bg-[#fbf9ff] admin-theme overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            <div
                className={`fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar Container */}
            <div
                className={`fixed inset-y-0 left-0 z-[70] transform transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 flex-shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <AdminSidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen relative overflow-hidden">
                {/* Header */}
                <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 bg-white/70 backdrop-blur-xl border-b border-purple-100/60 sticky top-0 z-[40]">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2.5 -ml-2 text-slate-500 hover:text-[#7c3aed] lg:hidden bg-white rounded-xl border border-slate-200 transition-all active:scale-95"
                        >
                            <Icon name="menu" size="sm" />
                        </button>

                        <div className="hidden md:flex items-center gap-3 bg-white border border-purple-100 rounded-2xl px-4 py-2 w-80 group focus-within:ring-4 focus-within:ring-[#7c3aed]/10 focus-within:border-[#7c3aed]/30 transition-all shadow-sm">
                            <Icon name="search" size="xs" color="#94a3b8" />
                            <input
                                type="text"
                                placeholder="Search dashboard..."
                                className="bg-transparent border-none outline-none text-[13px] font-semibold text-slate-600 placeholder-slate-400 w-full"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-1">
                            <button className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-purple-50 text-slate-500 relative transition-all active:scale-90">
                                <Icon name="bell" size="sm" />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                            </button>
                            <button className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-purple-50 text-slate-500 transition-all active:scale-90">
                                <Icon name="sparkles" size="sm" color="#7c3aed" />
                            </button>
                        </div>

                        <div className="h-8 w-px bg-slate-200" />

                        <div className="flex items-center gap-3 pl-1 group cursor-pointer">
                            <div className="text-right hidden sm:block">
                                <p className="text-[13px] font-black text-slate-900 leading-none">Super Admin</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Main Control</p>
                            </div>
                            <div className="h-10 w-10 rounded-2xl bg-[#7c3aed]/10 flex items-center justify-center border border-[#7c3aed]/20 group-hover:border-[#7c3aed]/40 transition-all shadow-sm text-[#7c3aed]">
                                <Icon name="user" size="sm" color="currentColor" />
                            </div>
                        </div>

                        <button 
                            onClick={handleLogout}
                            className="h-10 px-4 flex items-center gap-2 rounded-xl admin-cta text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                            <Icon name="logout" size="xs" color="white" />
                            <span className="hidden md:inline">Logout</span>
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-6 relative overflow-y-auto min-h-0 flex flex-col" data-lenis-prevent="true">
                    <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col min-h-0">
                        <Outlet />
                    </div>

                    {/* Background Decoration */}
                    <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-[#7c3aed]/5 blur-[120px] rounded-full -mr-64 -mb-64 pointer-events-none -z-10" />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
