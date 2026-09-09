import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import '../adminTheme.css';

const AdminForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/user/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            const result = await res.json();

            if (result.success) {
                // For MVP, the backend returns the token directly in the response since email sending isn't active
                const token = result.data?.resetToken;
                
                setTimeout(() => {
                    setIsLoading(false);
                    if (token) {
                        navigate('/admin/reset-password', { state: { token, email } });
                    } else {
                        // Fallback if token is not sent in response
                        alert('Password reset instructions sent to your email.');
                        navigate('/admin/login');
                    }
                }, 1000);
            } else {
                setIsLoading(false);
                setError(result.message || 'Error initiating password reset');
            }
        } catch (err) {
            setIsLoading(false);
            console.error('Forgot Password Error:', err);
            setError('Connection failed. Please check your backend.');
        }
    };

    return (
        <div className="min-h-screen bg-[#FFF9F9] flex items-center justify-center p-6 selection:bg-primary-400/20 admin-theme">
            <div className="w-full max-w-sm">
                {/* Brand Identity */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="h-14 w-14 rounded-2xl bg-[#1A0F0F] flex items-center justify-center shadow-2xl mb-4 group hover:scale-105 transition-all duration-500 cursor-pointer" onClick={() => navigate('/admin/login')}>
                        <Icon name="sparkles" size="sm" color="#F9AEAF" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Utsavo<span className="text-primary-400">Chakra</span></h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Emergency Override</p>
                </div>

                {/* Secure Console */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-[0_32px_64px_-16px_rgba(249,174,175,0.15)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-400/5 rounded-bl-full pointer-events-none" />

                    <div className="mb-6 relative z-10 text-center">
                        <h2 className="text-[15px] font-bold text-slate-900">Reset Access Key</h2>
                        <p className="text-[11px] text-slate-500 mt-1">Enter your admin email to retrieve your override token.</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-600 font-medium text-center relative z-10">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Admin Email</label>
                            <div className="relative">
                                <Icon name="mail" size="xs" color="#94a3b8" className="absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="email"
                                    required
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
                                    Retrieving...
                                </>
                            ) : 'Retrieve Token'}
                        </button>
                    </form>

                    <div className="mt-8 flex justify-center">
                        <button 
                            type="button"
                            onClick={() => navigate('/admin/login')}
                            className="text-[9px] font-black text-slate-400 hover:text-slate-600 tracking-widest uppercase transition-colors"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminForgotPassword;
