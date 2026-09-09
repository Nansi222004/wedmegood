import { NavLink, useNavigate } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';

const navigation = [
    {
        title: 'Overview',
        items: [
            { path: '/admin/dashboard', icon: 'dashboard', label: 'Command Center' },
            { path: '/admin/analytics', icon: 'chart', label: 'Growth Insights' },
        ]
    },
    {
        title: 'Monetization',
        items: [
            { path: '/admin/subscriptions', icon: 'money', label: 'Vendor Plans' },
            { path: '/admin/payments', icon: 'money', label: 'Payout Registry' },
            { path: '/admin/checkout', icon: 'plan', label: 'Checkout Protocol' },
        ]
    },
    {
        title: 'Ecosystem',
        items: [
            { path: '/admin/verification', icon: 'shield', label: 'Verification Desk' },
            { path: '/admin/vendors', icon: 'user', label: 'Vendors Console' },
            { path: '/admin/vendor-ledger', icon: 'calendar', label: 'Partner Ledger' },
            { path: '/admin/vendor-services', icon: 'sparkles', label: 'Service Index' },
            { path: '/admin/users', icon: 'users', label: 'Client Directory' },
            { path: '/admin/bookings', icon: 'calendar', label: 'Global Bookings' },
            { path: '/admin/reviews', icon: 'shield', label: 'Review Hub' },
        ]
    },
    {
        title: 'Editorial',
        items: [
            { path: '/admin/categories', icon: 'sparkles', label: 'Categories' },
            { path: '/admin/subcategories', icon: 'sparkles', label: 'SubCategories' },
            { path: '/admin/form-templates', icon: 'sparkles', label: 'Form Templates' },
            { path: '/admin/banners', icon: 'sparkles', label: 'Banners' },
        ]
    },
    {
        title: 'Legal',
        items: [
            { path: '/admin/policies', icon: 'shield', label: 'Compliance' },
        ]
    },
    {
        title: 'Support',
        items: [
            { path: '/admin/support', icon: 'shield', label: 'Help & Support' },
        ]
    },


    {
        title: 'System',
        items: [
            { path: '/admin/logs', icon: 'dashboard', label: 'Audit Trail' },
            { path: '/admin/settings', icon: 'sparkles', label: 'Settings' },
            { path: '/admin/profile', icon: 'user', label: 'My Identity' },
        ]
    }
];

const AdminSidebar = ({ onClose }) => {
    const navigate = useNavigate();

    const handleLogout = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        localStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminAuth');
        navigate('/admin/login');
    };

    return (
        <aside className="h-full w-60 bg-white text-slate-600 flex flex-col border-r border-slate-100 shadow-xl transition-all duration-300">
            {/* Header - Compact */}
            <div className="px-5 py-2.5 border-b border-slate-100/80">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#581C87]">UtsavoChakra</p>
                        <h2 className="text-[13px] font-black text-slate-900 tracking-tight leading-none mt-0.5 uppercase">Admin Portal</h2>
                    </div>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                    </span>
                    System Online
                </div>
            </div>

            {/* Navigation - Dense */}
            <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto custom-scrollbar" data-lenis-prevent="true">
                {navigation.map((group) => (
                    <div key={group.title} className="space-y-1">
                        <h3 className="px-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                            {group.title}
                        </h3>
                        <div className="space-y-0.5">
                            {group.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={onClose}
                                    className={({ isActive }) => `
                    group flex items-center gap-3 text-[13px] font-medium transition-all duration-200 px-3.5 py-2.5 rounded-xl
                    ${isActive
                                            ? 'bg-[#F3E8FF] text-[#581C87] font-semibold shadow-xs'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <div className={`flex items-center justify-center transition-colors duration-200 ${isActive ? 'text-[#581C87]' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                                <Icon name={item.icon} size="md" color="currentColor" />
                                            </div>
                                            <span>
                                                {item.label}
                                            </span>
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer - Professional */}
            <div className="p-4 border-t border-slate-100 bg-white mt-auto">
                <button
                    type="button"
                    className="w-full h-9 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                    onClick={handleLogout}
                >
                    <Icon name="logout" size="sm" color="currentColor" />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;

