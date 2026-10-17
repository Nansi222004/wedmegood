import { createPortal } from 'react-dom';

export const Card = ({ title, action, children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-100 p-4 shadow-sm ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-2 mb-3">
        {title && <h3 className="text-[12px] font-semibold text-slate-800 uppercase tracking-wider">{title}</h3>}
        {action}
      </div>
    )}
    {children}
  </div>
);

const VARIANTS = {
  primary: 'bg-[#7c3aed] hover:bg-violet-700 text-white',
  dark: 'bg-slate-900 hover:bg-slate-800 text-white',
  ghost: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
  danger: 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white'
};
export const Btn = ({ variant = 'primary', className = '', ...props }) => (
  <button {...props} className={`px-3 py-2 rounded-lg text-[12px] font-semibold disabled:opacity-50 cursor-pointer transition-colors ${VARIANTS[variant]} ${className}`} />
);

const TONES = {
  grey: 'bg-slate-100 text-slate-600',
  blue: 'bg-sky-50 text-sky-700',
  violet: 'bg-violet-50 text-violet-700',
  amber: 'bg-amber-50 text-amber-800',
  green: 'bg-emerald-50 text-emerald-700',
  red: 'bg-rose-50 text-rose-700',
  solid: 'bg-emerald-600 text-white'
};
export const Badge = ({ tone = 'grey', children }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${TONES[tone]}`}>{children}</span>
);

export const Field = ({ label, children, hint }) => (
  <label className="block space-y-1">
    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider ml-0.5">{label}</span>
    {children}
    {hint && <span className="block text-[10px] text-slate-400">{hint}</span>}
  </label>
);

export const Modal = ({ title, onClose, children, wide = false }) => createPortal(
  <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4" onClick={onClose}>
    <div
      className={`bg-white w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto`}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-bold text-slate-900">{title}</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer" aria-label="Close">✕</button>
      </div>
      {children}
    </div>
  </div>,
  document.body
);

export const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-[#7c3aed]" />
  </div>
);

export const Empty = ({ children }) => (
  <p className="text-[12px] text-slate-400 text-center py-8 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">{children}</p>
);

export const Tabs = ({ tabs, value, onChange }) => (
  <div className="flex gap-1 overflow-x-auto no-scrollbar bg-slate-100 p-1 rounded-xl">
    {tabs.map(([key, label]) => (
      <button
        key={key}
        onClick={() => onChange(key)}
        className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap cursor-pointer ${value === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
      >
        {label}
      </button>
    ))}
  </div>
);

export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
    <div>
      <h1 className="text-[18px] font-medium text-slate-900 tracking-tight leading-tight">{title}</h1>
      {subtitle && <p className="text-[11px] font-medium text-slate-400">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const Progress = ({ value }) => (
  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
    <div className={`h-full rounded-full ${value >= 100 ? 'bg-emerald-500' : value >= 80 ? 'bg-violet-500' : 'bg-amber-400'}`} style={{ width: `${Math.min(100, value || 0)}%` }} />
  </div>
);
