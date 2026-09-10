import Icon from '../../../components/ui/Icon';
import weddingImg from '../../../assets/wedding.png';

const VendorPendingApproval = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] p-4 text-center bg-slate-50/50">
            <div className="vendor-surface rounded-[3rem] p-10 sm:p-16 max-w-2xl w-full relative overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.08)] bg-white border border-slate-100">
                {/* Decorative background accent */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#7c3aed]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10">
                    <div className="h-24 w-24 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl animate-pulse" style={{
                        background: 'linear-gradient(135deg, #7c3aed, #d84d77)',
                        boxShadow: '0 20px 40px -10px rgba(124, 58, 237, 0.4)'
                    }}>
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7c3aed]/5 border border-[#7c3aed]/10 mb-6">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#7c3aed] animate-ping"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7c3aed]">Application Analysis</span>
                    </div>
                    
                    <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                        Almost There <span className="text-[#7c3aed]">.</span>
                    </h2>

                    <div className="space-y-4 max-w-md mx-auto">
                        <p className="text-base sm:text-lg font-bold text-slate-600 leading-relaxed">
                            Your professional profile is currently being reviewed by our verification engine.
                        </p>
                        <p className="text-xs font-semibold text-slate-400 leading-relaxed px-8">
                            We manually verify every vendor to ensure the highest quality experience for our couples. This typically takes <span className="text-slate-900">24 business hours</span>.
                        </p>
                    </div>

                    {/* Enhanced Progress Track */}
                    <div className="mt-12 relative">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2"></div>
                        <div className="absolute top-1/2 left-0 w-1/2 h-0.5 bg-[#7c3aed] -translate-y-1/2 transition-all duration-1000"></div>
                        
                        <div className="relative flex justify-between">
                            <div className="flex flex-col items-center">
                                <div className="h-4 w-4 rounded-full bg-[#7c3aed] border-4 border-white shadow-md z-10"></div>
                                <p className="text-[9px] font-black uppercase tracking-widest mt-3 text-slate-900">Onboarding</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="h-4 w-4 rounded-full bg-[#7c3aed] border-4 border-white shadow-md z-10 animate-pulse"></div>
                                <p className="text-[9px] font-black uppercase tracking-widest mt-3 text-slate-900">Verification</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="h-4 w-4 rounded-full bg-slate-200 border-4 border-white shadow-md z-10"></div>
                                <p className="text-[9px] font-black uppercase tracking-widest mt-3 text-slate-300">Live</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button 
                            className="w-full sm:w-auto rounded-2xl px-12 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-all active:scale-95 hover:shadow-[#7c3aed]/40"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #d84d77)' }}
                            onClick={() => window.location.reload()}
                        >
                            Refresh Status
                        </button>
                        <button className="w-full sm:w-auto rounded-2xl px-12 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border border-slate-100 hover:bg-slate-50 transition-all">
                            View Guidelines
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="mt-10 flex items-center gap-4 text-slate-400">
                <p className="text-[10px] font-black uppercase tracking-widest">Support Reference: #77-{new Date().getFullYear()}</p>
                <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                <p className="text-[10px] font-black uppercase tracking-widest hover:text-[#7c3aed] cursor-pointer transition-colors">Help Center</p>
            </div>
        </div>
    );
};

export default VendorPendingApproval;
