import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import { useVendorState } from '../useVendorState';

const VendorVerify = () => {
  const navigate = useNavigate();
  const { vendorState, updateVendorState } = useVendorState();
  const { verification } = vendorState;
  const [inputs, setInputs] = useState({ phone: '', email: '' });
  const [errors, setErrors] = useState({ phone: '', email: '' });

  const handleVerify = (field, hardcodedOtp) => {
    if (inputs[field] === hardcodedOtp) {
      updateVendorState({ verification: { ...verification, [`${field}Verified`]: true } });
      setErrors({ ...errors, [field]: '' });
    } else {
      setErrors({ ...errors, [field]: 'Invalid OTP. Please try again.' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-1">
      <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl relative overflow-hidden" style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(124, 58, 237, 0.1)'
      }}>
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 sm:h-2 rounded-t-2xl sm:rounded-t-[2.5rem]" style={{
          background: 'linear-gradient(90deg, #7c3aed, #6d28d9, #a855f7, #7c3aed)',
          backgroundSize: '200% 100%',
          animation: 'gradient-shift 4s ease infinite'
        }}></div>

        <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6 mb-5 sm:mb-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: '#7c3aed' }}>Verification</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5 sm:mt-1">Verify contact details</h2>
            <p className="text-xs sm:text-sm font-medium mt-0.5 sm:mt-1" style={{ color: '#94a3b8' }}>Complete OTP and email verification to activate your account.</p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider shadow-sm" style={{
            background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
            color: '#5b21b6',
            border: '1px solid rgba(124, 58, 237, 0.1)'
          }}>
            <Icon name="verified" size="xs" color="current" />
            Security check
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {/* Phone Verification */}
          <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all" style={{
            background: 'rgba(253, 242, 248, 0.3)',
            border: '1px solid rgba(124, 58, 237, 0.1)'
          }}>
            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                  color: '#7c3aed'
                }}>
                  <Icon name="phone" size="sm" color="current" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 tracking-wide">Phone verification</p>
                  <p className="text-[10px] sm:text-[11px] font-semibold mt-0.5" style={{ color: '#94a3b8' }}>OTP: 1234 (Auto-sent)</p>
                </div>
              </div>
              {verification.phoneVerified ? (
                <div className="rounded-xl sm:rounded-2xl px-4 sm:px-5 py-2 sm:py-3 text-[11px] sm:text-xs font-semibold" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white' }}>
                  ✓ Verified
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <input
                    type="text"
                    maxLength="4"
                    placeholder="OTP"
                    className="w-16 sm:w-20 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold border-2 focus:border-[#7c3aed] outline-none transition-all"
                    value={inputs.phone}
                    onChange={(e) => setInputs({ ...inputs, phone: e.target.value })}
                  />
                  <button
                    type="button"
                    className="rounded-lg sm:rounded-xl px-4 sm:px-5 py-2 sm:py-3 text-[11px] sm:text-xs font-semibold transition-all active:scale-95 text-white"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
                    onClick={() => handleVerify('phone', '1234')}
                  >
                    Verify
                  </button>
                </div>
              )}
            </div>
            {errors.phone && <p className="text-[10px] font-semibold text-rose-500 mt-1.5 sm:mt-2">{errors.phone}</p>}
          </div>

          {/* Email Verification */}
          <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all" style={{
            background: 'rgba(253, 242, 248, 0.3)',
            border: '1px solid rgba(124, 58, 237, 0.1)'
          }}>
            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                  color: '#7c3aed'
                }}>
                  <Icon name="mail" size="sm" color="current" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 tracking-wide">Email verification</p>
                  <p className="text-[10px] sm:text-[11px] font-semibold mt-0.5" style={{ color: '#94a3b8' }}>OTP: 0000 (Auto-sent)</p>
                </div>
              </div>
              {verification.emailVerified ? (
                <div className="rounded-xl sm:rounded-2xl px-4 sm:px-5 py-2 sm:py-3 text-[11px] sm:text-xs font-semibold" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white' }}>
                  ✓ Verified
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <input
                    type="text"
                    maxLength="4"
                    placeholder="OTP"
                    className="w-16 sm:w-20 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold border-2 focus:border-[#7c3aed] outline-none transition-all"
                    value={inputs.email}
                    onChange={(e) => setInputs({ ...inputs, email: e.target.value })}
                  />
                  <button
                    type="button"
                    className="rounded-lg sm:rounded-xl px-4 sm:px-5 py-2 sm:py-3 text-[11px] sm:text-xs font-semibold transition-all active:scale-95 text-white"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
                    onClick={() => handleVerify('email', '0000')}
                  >
                    Verify
                  </button>
                </div>
              )}
            </div>
            {errors.email && <p className="text-[10px] font-semibold text-rose-500 mt-1.5 sm:mt-2">{errors.email}</p>}
          </div>
        </div>

        <div className="mt-6 sm:mt-10 pt-5 sm:pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6" style={{ borderColor: 'rgba(124, 58, 237, 0.1)' }}>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-semibold tracking-wide" style={{ color: '#64748b' }}>
            <span style={{ color: '#7c3aed' }}>
              <Icon name="verified" size="sm" color="current" />
            </span>
            Verified vendors get higher visibility.
          </div>
          <button
            type="button"
            className={`vendor-cta rounded-xl sm:rounded-2xl px-6 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-semibold tracking-wide w-full md:w-auto transition-all ${(!verification.phoneVerified || !verification.emailVerified) ? 'opacity-50 grayscale cursor-not-allowed' : 'shadow-xl active:scale-95'}`}
            style={verification.phoneVerified && verification.emailVerified ? { boxShadow: '0 8px 30px rgba(124, 58, 237, 0.25)' } : {}}
            onClick={() => {
              if (verification.phoneVerified && verification.emailVerified) navigate('/vendor/onboarding/category')
            }}
          >
            Continue to Onboarding
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorVerify;
