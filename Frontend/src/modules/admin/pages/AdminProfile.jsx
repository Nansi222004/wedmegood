import { useState, useEffect } from 'react';
import Icon from '../../../components/ui/Icon';

const AdminProfile = () => {
    const [profile, setProfile] = useState({
        fullName: '',
        email: '',
        phone: '',
        bio: '',
        role: 'Administrator'
    });
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                setProfile({
                    ...profile,
                    fullName: result.data.fullName || '',
                    email: result.data.email || '',
                    phone: result.data.phone || '',
                    bio: result.data.bio || '',
                    role: result.data.role || 'Administrator'
                });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName: profile.fullName,
                    email: profile.email,
                    phone: profile.phone,
                    bio: profile.bio
                })
            });
            const result = await res.json();
            if (result.success) {
                setMessage({ type: 'success', text: 'Protocol Synchronized: Administrative identity updated.' });
            } else {
                setMessage({ type: 'error', text: result.message || 'Synchronization failed.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'System error during synchronization.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage({ type: 'error', text: 'Credential mismatch: Passwords do not match.' });
            return;
        }
        setIsSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/profile/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword
                })
            });
            const result = await res.json();
            if (result.success) {
                setMessage({ type: 'success', text: 'Security Key Updated: Access credentials re-encrypted.' });
                setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setMessage({ type: 'error', text: result.message || 'Key update failed.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Security system failure during update.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="h-6 w-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Security Identity</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Manage Administrative Protocol & Access</p>
                </div>
                {message.text && (
                    <div className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest animate-in fade-in zoom-in duration-300 ${
                        message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                        {message.text}
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {/* Profile Section */}
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="h-24 bg-primary-400/10 relative">
                            <div className="absolute -bottom-10 left-8">
                                <div className="h-20 w-20 rounded-2xl bg-white p-1 shadow-lg group relative border border-slate-100 flex items-center justify-center">
                                    <div className="h-full w-full bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                                        <Icon name="user" size="lg" color="currentColor" />
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Icon name="sparkles" size="xs" color="white" />
                                    </div>
                                </div>
                            </div>
                            <div className="absolute right-8 bottom-4">
                                <span className="px-3 py-1 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full text-[9px] font-black text-slate-900 uppercase tracking-widest">
                                    {profile.role}
                                </span>
                            </div>
                        </div>

                        <div className="p-8 pt-16 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Display Identity</label>
                                    <input
                                        type="text"
                                        required
                                        value={profile.fullName}
                                        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                                        className="w-full h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-bold text-slate-900 outline-none focus:border-primary-400 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Email Registry</label>
                                    <input
                                        type="email"
                                        required
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                        className="w-full h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-bold text-slate-900 outline-none focus:border-primary-400 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Comm Channel (Phone)</label>
                                    <input
                                        type="text"
                                        value={profile.phone}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                        className="w-full h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-bold text-slate-900 outline-none focus:border-primary-400 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Operator Index</label>
                                    <div className="w-full h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-bold text-slate-400 flex items-center">
                                        MASTER_{profile.email.split('@')[0].toUpperCase()}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Professional Brief</label>
                                <textarea
                                    rows="2"
                                    value={profile.bio}
                                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-bold text-slate-900 outline-none focus:border-primary-400 resize-none transition-all"
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="h-10 px-8 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isSaving ? 'Synchronizing...' : 'Update Identity'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Password Section */}
                <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="bg-[#1A0F0F] rounded-2xl p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-400/5 rounded-bl-[4rem]" />
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-8 w-8 rounded-lg bg-primary-400/20 text-primary-400 flex items-center justify-center">
                                <Icon name="verified" size="xs" color="current" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Master Access Key</h3>
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">Re-encrypt Administrative Entry Point</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest px-1">Current Master Key</label>
                                <input
                                    type="password"
                                    required
                                    value={passwords.currentPassword}
                                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-[12px] font-bold text-white outline-none focus:border-primary-400 focus:bg-white/10 transition-all"
                                    placeholder="Verify current key"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-white/20 uppercase tracking-widest px-1 group-hover:text-primary-400/60 transition-colors">New Master Key</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwords.newPassword}
                                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                        className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-[12px] font-bold text-white outline-none focus:border-primary-400 focus:bg-white/10 transition-all"
                                        placeholder="Generate new key"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-white/20 uppercase tracking-widest px-1 group-hover:text-primary-400/60 transition-colors">Confirm New Key</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwords.confirmPassword}
                                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                        className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-[12px] font-bold text-white outline-none focus:border-primary-400 focus:bg-white/10 transition-all"
                                        placeholder="Validate new key"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[9px] font-black text-white/10 uppercase tracking-widest">TLS 1.3 Encryption Active</p>
                            </div>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="h-10 px-8 rounded-xl bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? 'Processing...' : 'Deploy New Key'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminProfile;
