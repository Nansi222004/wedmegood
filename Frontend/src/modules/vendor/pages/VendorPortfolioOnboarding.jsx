import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Check,
  X,
  PackageOpen,
  IndianRupee,
  Trash2
} from 'lucide-react';
import { useVendorState } from '../useVendorState';
import { vendorApi } from '../vendorApi';

// Onboarding steps — same order as VendorOnboarding.jsx
// Steps 1-7 visible, step 8 (submitted) hidden from circles
const PREV_ROUTE = '/vendor/register/details';
const NEXT_ROUTE = '/vendor/onboarding/subscription';

const DEFAULT_PACKAGES = [
  { id: 'p1', name: 'Basic Package',   price: 25000 },
  { id: 'p2', name: 'Premium Package', price: 45000 },
  { id: 'p3', name: 'Royal Package',   price: 75000 },
];

const formatINR = (num) =>
  num || num === 0 ? '₹' + Number(num).toLocaleString('en-IN') : '';

const VendorPortfolioOnboarding = () => {
  const navigate = useNavigate();
  const { vendorState, updateVendorState } = useVendorState();
  const fileInputRef = useRef(null);

  const [portfolioImages, setPortfolioImages] = useState(vendorState.portfolio || []);
  const [packages, setPackages]               = useState(DEFAULT_PACKAGES);
  const [editingPkgId, setEditingPkgId]       = useState(null);
  const [editPkgName, setEditPkgName]         = useState('');
  const [editPkgPrice, setEditPkgPrice]       = useState('');
  const [isUploading, setIsUploading]         = useState(false);
  const [isSaving, setIsSaving]               = useState(false);
  const [toast, setToast]                     = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  /* ── Image upload ─────────────────────────────────── */
  const handleAddMoreClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file  = e.target.files?.[0];
    const token = localStorage.getItem('vendorToken');
    if (!file || !token) return;
    setIsUploading(true);
    try {
      const res = await vendorApi.uploadMedia(file, token);
      if (res.success && res.url) {
        const newItem = {
          id: Date.now().toString(), type: 'Photo',
          title: file.name.replace(/\.[^/.]+$/, ''), tag: 'Portfolio', url: res.url
        };
        const updated = [...portfolioImages, newItem];
        setPortfolioImages(updated);
        updateVendorState({ portfolio: updated });
        showToast('Photo added ✨');
      } else showToast(res.message || 'Upload failed');
    } catch { showToast('Upload error. Try again.'); }
    finally   { setIsUploading(false); e.target.value = ''; }
  };

  const handleRemoveImage = (id) => {
    const updated = portfolioImages.filter(img => img.id !== id);
    setPortfolioImages(updated);
    updateVendorState({ portfolio: updated });
  };

  /* ── Package edit ─────────────────────────────────── */
  const startEditPkg = (pkg) => {
    setEditingPkgId(pkg.id);
    setEditPkgName(pkg.name);
    setEditPkgPrice(pkg.price.toString());
  };
  const saveEditPkg = () => {
    setPackages(prev =>
      prev.map(p => p.id === editingPkgId
        ? { ...p, name: editPkgName, price: Number(editPkgPrice) || 0 } : p)
    );
    setEditingPkgId(null);
  };
  const cancelEditPkg   = () => setEditingPkgId(null);
  const handleDeletePkg = (id) => setPackages(prev => prev.filter(p => p.id !== id));
  const handleAddPackage = () => {
    const newPkg = { id: `p${Date.now()}`, name: 'New Package', price: 0 };
    setPackages(prev => [...prev, newPkg]);
    startEditPkg(newPkg);
  };

  /* ── Next ─────────────────────────────────────────── */
  const handleNext = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('vendorToken');
      if (token && portfolioImages.length > 0)
        await vendorApi.updatePortfolio(portfolioImages, token);
      updateVendorState({ portfolio: portfolioImages });
      localStorage.setItem('vendorPackagesCount', packages.length);
      navigate(NEXT_ROUTE);
    } catch { showToast('Failed to save. Try again.'); }
    finally   { setIsSaving(false); }
  };

  /* ── Render ───────────────────────────────────────── */
  return (
    <div
      className="w-full min-h-[100dvh] sm:max-w-md sm:mx-auto flex flex-col bg-white"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@1,700&display=swap');
      `}</style>

      {/* ── HEADER BLOCK (logo + nav + steps) compact ─── */}
      <div className="flex-shrink-0 px-4 pt-3 pb-0 select-none">

        {/* Logo row */}
        <div
          className="flex items-center justify-center gap-1.5 cursor-pointer group mb-2"
          onClick={() => window.location.href = '/'}
        >
          <img
            src="/assets/vendor/logo_theme.png"
            alt="Utsavo"
            className="h-7 w-auto rounded-md shadow-sm group-hover:scale-105 transition-transform duration-300"
          />
          <div className="flex flex-col leading-none">
            <span
              className="text-base font-black italic tracking-tight bg-clip-text text-transparent"
              style={{
                fontFamily: "'Playfair Display', serif",
                backgroundImage: 'linear-gradient(135deg, #7c3aed, #5b21b6)'
              }}
            >Utsavo</span>
            <span className="text-[6.5px] font-black uppercase tracking-[0.22em] text-rose-800/70">
              Elite Wedding Network
            </span>
          </div>
        </div>

        {/* Back + Title row */}
        <div className="flex items-center justify-between mb-2.5">
          <button
            type="button"
            onClick={() => navigate(PREV_ROUTE)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors active:scale-90"
          >
            <ArrowLeft className="w-4.5 h-4.5 text-slate-800" strokeWidth={2.5} />
          </button>
          <p
            className="text-[13.5px] font-semibold text-slate-800 tracking-tight"
          >
            Vendor Registration
          </p>
          <div className="w-8" />
        </div>

        {/* Step circles — same style as VendorRegister.jsx */}
        <div className="relative flex items-center justify-between w-full max-w-[260px] mx-auto mb-3 select-none">
          {/* connector line */}
          <div className="absolute top-1/2 left-3 right-3 h-[1px] bg-slate-200 -translate-y-1/2 z-0" />
          {[1, 2, 3, 4, 5, 6, 7].map((num) => {
            const isActive    = num === 4;
            const isCompleted = num < 4;
            return (
              <div key={num} className="relative z-10">
                <div
                  onClick={() => {
                    if (num === 3) navigate('/vendor/register/details');
                  }}
                  className={`h-[26px] w-[26px] rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#4F35C3] text-white shadow-md ring-4 ring-[#4F35C3]/15 scale-110'
                      : isCompleted
                        ? 'bg-[#EDE9FE] text-[#4F35C3] border border-[#C4B5FD] cursor-pointer hover:bg-[#DDD6FE]'
                        : 'bg-white text-slate-400 border border-slate-200'
                  }`}
                >
                  {isCompleted
                    ? <Check className="w-3 h-3" strokeWidth={3} />
                    : num}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PAGE CONTENT ─────────────────────────────── */}
      <div className="flex-1 flex flex-col px-4 pb-6 overflow-y-auto gap-4 animate-in fade-in duration-250">

        {/* Hero icon + title */}
        <div className="flex flex-col items-center text-center pt-1">
          <div className="w-12 h-12 rounded-full bg-[#EDE9FE] flex items-center justify-center border-[3px] border-[#F5F3FF] mb-2 shadow-sm">
            <PackageOpen className="w-5 h-5 text-[#4F35C3]" strokeWidth={1.8} />
          </div>
          <h2 className="text-[17px] font-bold text-slate-900 tracking-tight leading-tight">
            Portfolio &amp; Packages
          </h2>
          <p className="mt-0.5 text-[10.5px] text-slate-500 font-medium">
            Showcase your work and packages
          </p>
        </div>

        {/* ── Portfolio Images ─────────────────────── */}
        <div>
          <p className="text-[11px] font-bold text-slate-700 mb-2">
            Portfolio Images
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {portfolioImages.map(img => (
              <div
                key={img.id}
                className="relative w-[72px] h-[72px] rounded-xl overflow-hidden border border-slate-200 shadow-sm group flex-shrink-0"
              >
                <img src={img.url} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(img.id)}
                  className="absolute top-0.5 right-0.5 w-4.5 h-4.5 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-2.5 h-2.5" strokeWidth={3} />
                </button>
              </div>
            ))}

            {/* Add More */}
            <button
              type="button"
              onClick={handleAddMoreClick}
              disabled={isUploading}
              className="w-[72px] h-[72px] rounded-xl border-2 border-dashed border-[#4F35C3]/40 bg-[#F5F3FF] flex flex-col items-center justify-center gap-0.5 hover:bg-[#EDE9FE] hover:border-[#4F35C3] transition-all active:scale-95 flex-shrink-0"
            >
              {isUploading
                ? <div className="w-4 h-4 rounded-full border-2 border-[#4F35C3] border-t-transparent animate-spin" />
                : <>
                    <Plus className="w-4 h-4 text-[#4F35C3]" strokeWidth={2.5} />
                    <span className="text-[8.5px] font-extrabold text-[#4F35C3] uppercase tracking-wide">Add More</span>
                  </>
              }
            </button>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
          </div>
        </div>

        {/* ── Packages ─────────────────────────────── */}
        <div>
          <p className="text-[11px] font-bold text-slate-700 mb-2">
            Packages <span className="text-rose-500">*</span>
          </p>

          <div className="space-y-2">
            {packages.map(pkg =>
              editingPkgId === pkg.id ? (
                /* Edit mode */
                <div key={pkg.id} className="rounded-[14px] border-2 border-[#4F35C3] bg-[#F5F3FF]/40 p-3 shadow-sm animate-in fade-in duration-150">
                  <div className="flex flex-col gap-2">
                    <input
                      autoFocus
                      className="w-full rounded-xl px-3 py-2 text-xs font-semibold border border-slate-200 bg-white focus:border-[#4F35C3] focus:ring-2 focus:ring-[#4F35C3]/10 outline-none transition-all"
                      placeholder="Package name"
                      value={editPkgName}
                      onChange={e => setEditPkgName(e.target.value)}
                    />
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" strokeWidth={2} />
                      <input
                        type="number"
                        className="w-full rounded-xl pl-7 pr-3 py-2 text-xs font-semibold border border-slate-200 bg-white focus:border-[#4F35C3] focus:ring-2 focus:ring-[#4F35C3]/10 outline-none transition-all"
                        placeholder="Price"
                        value={editPkgPrice}
                        onChange={e => setEditPkgPrice(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={saveEditPkg}
                        className="flex-1 rounded-xl py-1.5 text-[11px] font-extrabold text-white bg-[#4F35C3] hover:brightness-105 active:scale-95 transition-all">
                        <Check className="w-3 h-3 inline mr-1" strokeWidth={3} /> Save
                      </button>
                      <button type="button" onClick={cancelEditPkg}
                        className="flex-1 rounded-xl py-1.5 text-[11px] font-extrabold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Display mode */
                <div key={pkg.id}
                  className="rounded-[14px] border border-slate-100 bg-white px-3.5 py-3 shadow-sm flex items-center justify-between gap-3 hover:border-slate-200 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#EDE9FE] flex items-center justify-center flex-shrink-0">
                      <PackageOpen className="w-3.5 h-3.5 text-[#4F35C3]" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-slate-800 truncate">{pkg.name}</p>
                      <p className="text-[11px] font-semibold text-slate-500">{formatINR(pkg.price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button type="button" onClick={() => startEditPkg(pkg)}
                      className="w-7 h-7 rounded-full bg-slate-50 hover:bg-[#EDE9FE] flex items-center justify-center transition-colors active:scale-90">
                      <Pencil className="w-3.5 h-3.5 text-[#4F35C3]" strokeWidth={2.2} />
                    </button>
                    <button type="button" onClick={() => handleDeletePkg(pkg.id)}
                      className="w-7 h-7 rounded-full bg-slate-50 hover:bg-rose-50 flex items-center justify-center transition-colors active:scale-90">
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

          <button type="button" onClick={handleAddPackage}
            className="mt-2.5 flex items-center gap-1 text-[11px] font-extrabold text-[#4F35C3] hover:text-[#3f2aa6] transition-colors active:scale-95 ml-0.5">
            <Plus className="w-3.5 h-3.5" strokeWidth={3} />
            Add Another Package
          </button>
        </div>

        {/* ── Next Button ───────────────────────────── */}
        <div className="mt-auto pt-1">
          <button
            type="button"
            onClick={handleNext}
            disabled={isSaving}
            className={`w-full rounded-xl py-3 text-[13px] font-extrabold text-white transition-all duration-200 ${
              isSaving
                ? 'bg-[#4F35C3]/50 cursor-not-allowed'
                : 'bg-[#4F35C3] shadow-sm hover:shadow-[0_4px_16px_rgba(79,53,195,0.25)] hover:brightness-105 active:scale-[0.98]'
            }`}
          >
            {isSaving
              ? <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Saving...
                </span>
              : 'Next'
            }
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toast}
        </div>
      )}
    </div>
  );
};

export default VendorPortfolioOnboarding;
