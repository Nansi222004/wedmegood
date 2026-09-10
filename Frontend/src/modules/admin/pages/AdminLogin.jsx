import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import '../adminTheme.css';

const AdminLogin = () => {
    const [credentials, setCredentials] = useState({ username: '', masterKey: '' });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/user/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: credentials.username, 
                    password: credentials.masterKey 
                })
            });
            
            const result = await res.json();

            if (result.success) {
                // Store token
                localStorage.setItem('adminToken', result.data.token);
                localStorage.setItem('adminUser', JSON.stringify(result.data.user));
                
                setTimeout(() => {
                    setIsLoading(false);
                    navigate('/admin/dashboard');
                }, 1000);
            } else {
                setIsLoading(false);
                alert(result.message || 'Invalid Admin Credentials');
            }
        } catch (err) {
            setIsLoading(false);
            console.error('Admin Login Error:', err);
            alert('Connection failed. Please check your backend.');
        }
    };

    return (
        <div className="min-h-screen bg-[#FFF9F9] flex items-center justify-center p-6 selection:bg-primary-400/20 admin-theme">
            <div className="w-full max-w-sm">
                {/* Brand Identity */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="h-14 w-14 rounded-2xl bg-[#1A0F0F] flex items-center justify-center shadow-2xl mb-4 group hover:scale-105 transition-all duration-500">
                        <Icon name="sparkles" size="sm" color="#F9AEAF" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Utsavo<span className="text-primary-400">Chakra</span></h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Utsavo Master Access</p>
                </div>

                {/* Secure Console */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-[0_32px_64px_-16px_rgba(249,174,175,0.15)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-400/5 rounded-bl-full pointer-events-none" />

                    <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Admin Email</label>
                            <div className="relative">
                                <Icon name="mail" size="xs" color="#94a3b8" className="absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="email"
                                    required
                                    placeholder="admin@example.com"
                                    value={credentials.username}
                                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-900 outline-none focus:border-primary-400/50 transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Access Password</label>
                            <div className="relative">
                                <Icon name="lock" size="xs" color="#94a3b8" className="absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={credentials.masterKey}
                                    onChange={(e) => setCredentials({ ...credentials, masterKey: e.target.value })}
                                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-900 outline-none focus:border-primary-400/50 transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full h-12 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                                    Authenticating...
                                </>
                            ) : 'Login to Console'}
                        </button>
                    </form>
                    <div className="mt-8 flex justify-center">
                        <button 
                            type="button"
                            onClick={() => navigate('/admin/forgot-password')}
                            className="text-[9px] font-black text-primary-400 opacity-60 hover:opacity-100 tracking-widest uppercase transition-opacity"
                        >
                            Request Emergency Override
                        </button>
                    </div>
                </div>

                <div className="mt-10 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Authorized Personnel Only</p>
                    <div className="flex items-center justify-center gap-2 mt-2 opacity-20">
                        <div className="h-1 w-1 rounded-full bg-slate-400" />
                        <div className="h-1 w-1 rounded-full bg-slate-400" />
                        <div className="h-1 w-1 rounded-full bg-slate-400" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
