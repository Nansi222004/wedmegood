import { useState, useEffect } from 'react';
import { useVendorState } from '../useVendorState';
import Icon from '../../../components/ui/Icon';

const VendorPricing = () => {
  const { vendorState, updateVendorState } = useVendorState();
  const [showModal, setShowModal] = useState(false);
  
  const [tempPricing, setTempPricing] = useState({
    range: '',
    notes: ''
  });

  useEffect(() => {
    if (showModal) { 
      document.body.style.overflow = 'hidden'; 
      document.body.classList.add('modal-open');
    } else { 
      document.body.style.overflow = 'unset'; 
      document.body.classList.remove('modal-open');
    }
    return () => { 
      document.body.style.overflow = 'unset'; 
      document.body.classList.remove('modal-open');
    };
  }, [showModal]);

  const handleOpenModal = () => {
    setTempPricing({
      range: vendorState?.pricing?.range || '',
      notes: vendorState?.pricing?.notes || ''
    });
    setShowModal(true);
  };

  const handleSave = () => {
    updateVendorState({ 
      pricing: {
        range: tempPricing.range,
        notes: tempPricing.notes
      }
    });
    setShowModal(false);
  };

  const activePackages = vendorState?.services?.flatMap((s) => s.packages || []) || [];

  return (
    <div className="space-y-3 pb-24 pf-sans">
      {/* Dynamic font styles injection */}
      <style>{`
        .pf-sans  { font-family: 'Poppins', 'Inter', 'Arial', sans-serif; }
        .pf-poppins { font-family: 'Poppins', sans-serif !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes pfFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pf-fadein { animation: pfFadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* Header Card - Sleek & Compact */}
      <div className="pf-fadein rounded p-3.5 relative overflow-hidden border border-rose-100"
        style={{ background: 'linear-gradient(135deg, #FFF5F7 0%, #FFF9FA 100%)', borderRadius: '4px' }}>
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#E11D48] mb-0.5">Financials</p>
            <h1 className="text-[14px] font-black text-slate-900 leading-tight tracking-tight">Pricing Strategy</h1>
            <p className="text-[8.5px] font-medium text-slate-500 mt-0.5 leading-tight">Define your service rates & package values</p>
          </div>
          <button 
            type="button" 
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded text-[8px] font-black uppercase tracking-widest text-white active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #E11D48, #BE123C)', borderRadius: '4px', boxShadow: '0 2px 6px rgba(225,29,72,0.2)' }}
            onClick={handleOpenModal}
          >
            <Icon name="edit" size="xs" /> Update Rates
          </button>
        </div>
      </div>

      {/* Stats Mini Row */}
      <div className="grid grid-cols-3 gap-2 mt-2.5">
        {[
          { label: 'Avg. Rate', value: vendorState?.pricing?.range || 'Not set', bg: '#FFFDF0', border: '#FDE4A3', badgeBg: '#FFF2C6', color: '#F59E0B', icon: 'money' },
          { label: 'Live Plans', value: activePackages.length.toString(), bg: '#F0F6FF', border: '#C7DDFE', badgeBg: '#DCE9FE', color: '#2563EB', icon: 'plan' },
          { label: 'Market Visibility', value: 'Top 10%', bg: '#EEFBF4', border: '#C1F2D9', badgeBg: '#D3F8E6', color: '#10B981', icon: 'trophy' }
        ].map((stat, i) => (
          <div key={i} className="pf-fadein rounded p-2 flex flex-col justify-start border transition-all"
            style={{ backgroundColor: stat.bg, borderColor: stat.border, borderRadius: '4px', animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center justify-between gap-1 w-full">
              <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-tight">{stat.label}</span>
              <div className="w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: stat.badgeBg }}>
                <Icon name={stat.icon} size="xs" color={stat.color} className="w-2.5 h-2.5 shrink-0" />
              </div>
            </div>
            <p className="pf-poppins text-xs font-black text-slate-900 tracking-tight leading-none mt-1 truncate">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Pricing Layout - 2 Columns (Clean White Cards) */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 mt-3">
        
        {/* Base Pricing Card - Clean White / Soft Amber Border */}
        <div className="pf-fadein p-3.5 bg-white border border-amber-100 relative overflow-hidden transition-all hover:shadow-sm"
          style={{ borderRadius: '4px' }}>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-50">
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded bg-amber-50 flex items-center justify-center text-amber-500">
                <Icon name="money" size="xs" className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-black text-slate-800 uppercase tracking-wider">Starting Range</span>
            </div>
            <button onClick={handleOpenModal} className="text-slate-400 hover:text-amber-500 transition-colors">
              <Icon name="edit" size="xs" className="w-3.5 h-3.5" />
            </button>
          </div>
           
          <div className="space-y-3">
            <div>
              <p className="pf-poppins text-lg font-black text-slate-900 tracking-tighter">{vendorState?.pricing?.range || 'Price Not Set'}</p>
            </div>

            {vendorState?.pricing?.notes ? (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Strategy Inclusions & Notes</p>
                <p className="text-[8.5px] font-bold text-slate-600 leading-relaxed italic">"{vendorState?.pricing?.notes}"</p>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[8px] font-bold text-slate-400 italic">No additional strategy notes defined.</p>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Packages Card - Clean White / Soft Rose Border */}
        <div className="pf-fadein p-3.5 bg-white border border-rose-100 relative overflow-hidden transition-all hover:shadow-sm"
          style={{ borderRadius: '4px' }}>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-50">
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded bg-rose-50 flex items-center justify-center text-rose-500">
                <Icon name="plan" size="xs" className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-black text-slate-800 uppercase tracking-wider">Active Service Packages</span>
            </div>
            <span className="text-[7.5px] font-black uppercase tracking-widest px-2 py-0.5 bg-rose-50 rounded text-rose-600 border border-rose-100">
              {activePackages.length} Plans
            </span>
          </div>

          <div className="grid gap-1.5 max-h-[140px] overflow-y-auto no-scrollbar">
            {activePackages.length > 0 ? (
              activePackages.map((pkg, index) => (
                <div key={`${pkg.name}-${index}`} className="flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded p-2 transition-all group"
                  style={{ borderRadius: '4px' }}>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-400"></div>
                    <span className="text-[8.5px] font-black text-slate-700 uppercase tracking-tight truncate max-w-[130px]">{pkg.name}</span>
                  </div>
                  <span className="pf-poppins text-[10px] font-black text-[#E11D48] tracking-tight">₹{pkg.price.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded border border-dashed border-slate-200" style={{ borderRadius: '4px' }}>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">No packages defined</p>
                <p className="text-[7.5px] font-bold text-slate-400 mt-0.5">Go to Services to add packages.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded shadow-2xl p-4 overflow-hidden animate-in fade-in zoom-in duration-300"
            style={{ borderRadius: '4px' }}>
             <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Update Pricing</h3>
                  <p className="text-[8px] font-bold text-slate-400">Set your starting market rate</p>
                </div>
                <button onClick={() => setShowModal(false)} className="h-6 w-6 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                  <Icon name="close" size="xs" />
                </button>
             </div>

             <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest px-0.5">Starting Range</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 50k - 2L"
                    className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-black focus:outline-none focus:border-rose-400 transition-all"
                    style={{ borderRadius: '4px' }}
                    value={tempPricing.range}
                    onChange={(e) => setTempPricing({...tempPricing, range: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest px-0.5">Pricing Notes</label>
                  <textarea 
                    placeholder="Details about package inclusions..."
                    className="w-full h-24 p-2.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-bold focus:outline-none focus:border-rose-400 transition-all resize-none"
                    style={{ borderRadius: '4px' }}
                    value={tempPricing.notes}
                    onChange={(e) => setTempPricing({...tempPricing, notes: e.target.value})}
                  />
                </div>

                <div className="pt-2">
                   <button onClick={handleSave} className="w-full h-8 rounded text-[8.5px] font-black uppercase tracking-widest shadow-md transition-all active:scale-95 text-white"
                     style={{ background: 'linear-gradient(135deg, #E11D48, #BE123C)', borderRadius: '4px' }}>
                      Save Rates
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorPricing;
