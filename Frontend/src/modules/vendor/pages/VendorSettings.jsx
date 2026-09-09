import { useState, useEffect } from 'react';
import Icon from '../../../components/ui/Icon';
import { useVendorState } from '../useVendorState';
import { vendorApi } from '../vendorApi';

const VendorSettings = () => {
    const { vendorState, refreshData } = useVendorState();
    const [activeTab, setActiveTab] = useState('account');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [token] = useState(localStorage.getItem('vendorToken'));

    const [settings, setSettings] = useState({
        email: '',
        phone: '',
        fullName: '',
        businessName: '',
        language: 'English (India)',
        notifications: {
            push: true,
            email: true,
            whatsapp: true
        }
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (vendorState) {
            setSettings({
                email: vendorState.email || '',
                phone: vendorState.phone || '',
                fullName: vendorState.fullName || '',
                businessName: vendorState.businessName || '',
                language: vendorState.language || 'English (India)',
                notifications: vendorState.notifications || {
                    push: true,
                    email: true,
                    whatsapp: true
                }
            });
        }
    }, [vendorState]);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleUpdate = async (updateObj) => {
        setIsSaving(true);
        try {
            const res = await vendorApi.updateProfile(updateObj, token);
            if (res.success) {
                showMessage('success', 'Intelligence records updated successfully');
                refreshData();
            } else {
                showMessage('error', res.message || 'Update protocol failed');
            }
        } catch (err) {
            console.error('Update failed:', err);
            showMessage('error', 'Transmission failure');
        } finally {
            setIsSaving(false);
        }
    };

    const handleNotificationToggle = (type) => {
        const updatedNotifications = {
            ...settings.notifications,
            [type]: !settings.notifications[type]
        };
        setSettings({ ...settings, notifications: updatedNotifications });
        handleUpdate({ notifications: updatedNotifications });
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        const activeToken = localStorage.getItem('vendorToken');
        
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert('Passwords do not match');
            return showMessage('error', 'Passwords do not match');
        }
        if (passwordForm.newPassword.length < 8) {
            alert('Minimum security requirement: 8 characters');
            return showMessage('error', 'Minimum security requirement: 8 characters');
        }

        setIsSaving(true);
        try {
            console.log('Initiating security key rotation...');
            const res = await vendorApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword, activeToken);
            console.log('Rotation response:', res);
            
            if (res.success) {
                alert('Security keys rotated successfully!');
                showMessage('success', 'Security keys rotated successfully');
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                alert(`Security Error: ${res.message || 'Protocol rejection'}`);
                showMessage('error', res.message || 'Security protocol rejection');
            }
        } catch (err) {
            console.error('Password change error:', err);
            alert('Authentication node error. Check console.');
            showMessage('error', 'Authentication node error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeactivate = async () => {
        const confirmMsg = vendorState?.isActive ? 'Deactivate your business node? You will go offline.' : 'Reactivate your business node?';
        if (!window.confirm(confirmMsg)) return;

        setIsSaving(true);
        try {
            const res = await vendorApi.deactivateAccount(token);
            if (res.success) {
                alert(res.message);
                showMessage('success', res.message);
                refreshData();
            } else {
                showMessage('error', res.message || 'Operation failed');
            }
        } catch (err) {
            showMessage('error', 'Transmission error');
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <div className="max-w-5xl mx-auto space-y-4 pb-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-[#7c3aed] flex items-center justify-center text-white shadow-md">
                        <Icon name="settings" size="xs" />
                    </div>
                    <div>
                        <h1 className="text-[18px] font-medium text-slate-900 tracking-tight leading-tight">Settings</h1>
                        <p className="text-[11px] font-medium text-slate-400">Manage credentials, alerts & security</p>
                    </div>
                </div>

                {message.text && (
                    <div className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${
                        message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                        {message.text}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
                {/* Side Navigation */}
                <div className="flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
                    {[
                        { id: 'account', label: 'Profile', icon: 'account', desc: 'Business & Contact' },
                        { id: 'notifications', label: 'Alerts', icon: 'bell', desc: 'Notification settings' },
                        { id: 'security', label: 'Security', icon: 'lock', desc: 'Password & Auth' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`text-left px-3 py-2.5 rounded-xl transition-all duration-200 group flex-shrink-0 ${
                                activeTab === tab.id 
                                    ? 'bg-white border border-violet-100 shadow-sm' 
                                    : 'bg-transparent hover:bg-slate-50'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                                    activeTab === tab.id ? 'bg-[#7c3aed] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white'
                                }`}>
                                    <Icon name={tab.icon} size="xs" />
                                </div>
                                <div>
                                    <p className={`text-[11px] font-semibold ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-500'}`}>{tab.label}</p>
                                    <p className="text-[9px] font-medium text-slate-300 hidden lg:block">{tab.desc}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Content Panel */}
                <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5 shadow-sm">
                    {activeTab === 'account' && (
                        <div className="space-y-5">
                            <section>
                                <h3 className="text-[12px] font-semibold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
                                    Identity & Profile
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider ml-0.5">Full Name</label>
                                        <input 
                                            type="text" 
                                            value={settings.fullName}
                                            onChange={e => setSettings({...settings, fullName: e.target.value})}
                                            onBlur={() => handleUpdate({ fullName: settings.fullName })}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-lg text-[12px] font-medium focus:bg-white focus:border-violet-200 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider ml-0.5">Business Name</label>
                                        <input 
                                            type="text" 
                                            value={settings.businessName}
                                            onChange={e => setSettings({...settings, businessName: e.target.value})}
                                            onBlur={() => handleUpdate({ businessName: settings.businessName })}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-lg text-[12px] font-medium focus:bg-white focus:border-violet-200 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider ml-0.5">Email (Read-only)</label>
                                        <input 
                                            type="email" 
                                            value={settings.email}
                                            readOnly
                                            className="w-full px-3.5 py-2.5 bg-slate-100 border border-transparent rounded-lg text-[12px] font-medium text-slate-400 cursor-not-allowed outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider ml-0.5">Phone</label>
                                        <input 
                                            type="text" 
                                            value={settings.phone}
                                            onChange={e => setSettings({...settings, phone: e.target.value})}
                                            onBlur={() => handleUpdate({ phone: settings.phone })}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-lg text-[12px] font-medium focus:bg-white focus:border-violet-200 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="pt-4 border-t border-slate-50">
                                <h3 className="text-[12px] font-semibold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
                                    Language
                                </h3>
                                <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[11px] font-semibold text-slate-800">Interface Language</p>
                                        <p className="text-[9px] font-medium text-slate-400 mt-0.5">Select your preferred language</p>
                                    </div>
                                    <select 
                                        value={settings.language}
                                        onChange={e => {
                                            setSettings({...settings, language: e.target.value});
                                            handleUpdate({ language: e.target.value });
                                        }}
                                        className="bg-white border border-slate-100 rounded-lg px-3 py-1.5 text-[10px] font-semibold outline-none focus:border-violet-200 transition-all cursor-pointer"
                                    >
                                        <option value="English (India)">English (India)</option>
                                        <option value="Hindi">Hindi</option>
                                        <option value="Marathi">Marathi</option>
                                    </select>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-4">
                            <h3 className="text-[12px] font-semibold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
                                Alert Preferences
                            </h3>
                            <div className="space-y-2">
                                {[
                                    { id: 'push', label: 'Push Notifications', desc: 'Real-time alerts for new leads & updates', icon: 'bell' },
                                    { id: 'email', label: 'Email Alerts', desc: 'Critical alerts and weekly reports via email', icon: 'mail' },
                                    { id: 'whatsapp', label: 'WhatsApp Alerts', desc: 'Instant lead notifications to your phone', icon: 'whatsapp' }
                                ].map(item => (
                                    <div key={item.id} className="group px-3.5 py-3 rounded-xl bg-slate-50 hover:bg-white border border-transparent hover:border-violet-100 transition-all flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-[#7c3aed] shadow-sm transition-colors">
                                                <Icon name={item.icon} size="xs" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-semibold text-slate-800">{item.label}</p>
                                                <p className="text-[9px] font-medium text-slate-400 mt-0.5">{item.desc}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleNotificationToggle(item.id)}
                                            className={`w-10 h-5 rounded-full relative transition-all duration-400 flex-shrink-0 ${
                                                settings.notifications[item.id] ? 'bg-[#7c3aed]' : 'bg-slate-200'
                                            }`}
                                        >
                                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-400 shadow-sm ${
                                                settings.notifications[item.id] ? 'left-5.5' : 'left-0.5'
                                            }`} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-5">
                            <section>
                                <h3 className="text-[12px] font-semibold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
                                    Change Password
                                </h3>
                                <form onSubmit={handlePasswordChange} className="space-y-3 max-w-md">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider ml-0.5">Current Password</label>
                                        <input 
                                            required
                                            type="password" 
                                            placeholder="••••••••"
                                            value={passwordForm.currentPassword}
                                            onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-lg text-[12px] font-medium focus:bg-white focus:border-violet-200 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider ml-0.5">New Password</label>
                                        <input 
                                            required
                                            type="password" 
                                            placeholder="••••••••"
                                            value={passwordForm.newPassword}
                                            onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-lg text-[12px] font-medium focus:bg-white focus:border-violet-200 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider ml-0.5">Confirm New Password</label>
                                        <input 
                                            required
                                            type="password" 
                                            placeholder="••••••••"
                                            value={passwordForm.confirmPassword}
                                            onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-lg text-[12px] font-medium focus:bg-white focus:border-violet-200 outline-none transition-all"
                                        />
                                    </div>
                                    <button 
                                        disabled={isSaving}
                                        type="submit"
                                        className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-semibold uppercase tracking-wider shadow-md hover:bg-[#7c3aed] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                                    >
                                        {isSaving ? 'Processing...' : 'Update Password'}
                                    </button>
                                </form>
                            </section>

                            <section className="pt-4 border-t border-slate-50">
                                <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[11px] font-semibold text-rose-800">{vendorState?.isActive ? 'Deactivate Account' : 'Reactivate Account'}</p>
                                        <p className="text-[9px] font-medium text-rose-400 mt-0.5">{vendorState?.isActive ? 'Temporarily go offline' : 'Bring your account back online'}</p>
                                    </div>
                                    <button 
                                        onClick={handleDeactivate}
                                        className="px-4 py-2 bg-rose-600 text-white rounded-lg text-[9px] font-semibold uppercase tracking-wider hover:bg-rose-700 transition-all shadow-sm flex-shrink-0"
                                    >
                                        {vendorState?.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorSettings;
