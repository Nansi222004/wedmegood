import React, { useState, useEffect } from 'react';
import { vendorApi } from '../vendorApi';
import { useVendorState } from '../useVendorState';
import Icon from '../../../components/ui/Icon';
import { ClipboardList, ClipboardCheck, ChevronDown, ChevronUp, UploadCloud } from 'lucide-react';
import ServiceProfileSetupModal from './ServiceProfileSetupModal';

const ProfileCompletionTracker = ({ onComplete }) => {
  const { vendorState, refreshData } = useVendorState();
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Missing Docs State
  const [idProofFile, setIdProofFile] = useState(null);
  const [gstFile, setGstFile] = useState(null);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [forceShowDocs, setForceShowDocs] = useState(false);

  // Active Subcategory Form State
  const [activeSubcategory, setActiveSubcategory] = useState(null);

  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);


  const fetchProgress = async () => {
    try {
      const token = localStorage.getItem('vendorToken');
      const res = await vendorApi.getProfileProgress(token);
      if (res.success) {
        setProgressData(res);
        if (res.isComplete) {
          onComplete && onComplete();
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile progress:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const handleDocumentUpload = async () => {
    if (!idProofFile && !gstFile) return;
    setUploadingDocs(true);
    try {
      const token = localStorage.getItem('vendorToken');
      let idProofUrl = null;
      let gstUrl = null;

      if (idProofFile) {
        const res1 = await vendorApi.uploadPublicMedia(idProofFile);
        if (res1.success) idProofUrl = res1.data.url;
      }
      if (gstFile) {
        const res2 = await vendorApi.uploadPublicMedia(gstFile);
        if (res2.success) gstUrl = res2.data.url;
      }

      await vendorApi.uploadMissingDocuments({ idProofUrl, gstUrl }, token);
      setIdProofFile(null);
      setGstFile(null);
      setForceShowDocs(false);
      await fetchProgress();
      await refreshData();
    } catch (err) {
      console.error('Failed to upload documents:', err);
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleSubmitForVerification = async () => {
    setIsSubmittingApproval(true);
    try {
      const token = localStorage.getItem('vendorToken');
      const res = await vendorApi.requestApproval(token);
      if (res.success) {
        onComplete && onComplete();
        await refreshData();
      } else {
        alert(res.message || 'Failed to submit. Please try again.');
      }
    } catch (err) {
      console.error('Failed to request approval:', err);
      alert('Network error. Please try again.');
    } finally {
      setIsSubmittingApproval(false);
    }
  };


  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-[#4F35C3] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-slate-500">Calculating your profile progress...</p>
      </div>
    );
  }

  if (!progressData) return null;

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden mb-8">
      {/* Header */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-[#4F35C3] to-[#7C3AED] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-['Playfair_Display'] tracking-tight mb-2">
            Complete Your Profile
          </h2>
          <p className="text-white/80 text-sm font-medium">
            Finish the required steps below to submit your profile for admin approval.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[6px] border-white/20 flex items-center justify-center relative">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="50%" cy="50%" r="42%" className="fill-none stroke-white" strokeWidth="6" strokeDasharray={`${progressData.percentage * 2.64} 264`} strokeLinecap="round" />
            </svg>
            <span className="text-lg sm:text-xl font-black">{progressData.percentage}%</span>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 bg-slate-50">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Pending Tasks</h3>
        <div className="space-y-4">

          {/* Documents Section */}
          {progressData.documentStatus.needed && (!progressData.documentStatus.idProof || !progressData.documentStatus.gst || forceShowDocs) && (
            <div className="bg-white border-2 border-rose-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0 text-rose-500">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-black text-slate-800">Business Documents</h4>
                    {forceShowDocs && (
                      <button
                        onClick={() => setForceShowDocs(false)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-500 mt-1 mb-4">Please upload your ID Proof and GST Certificate to verify your business.</p>

                  <div className="space-y-3">
                    {(!progressData.documentStatus.idProof || forceShowDocs) && (
                      idProofFile ? (
                        <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white shadow-sm w-full box-border">
                          <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0 pr-2">
                            <a href={URL.createObjectURL(idProofFile)} target="_blank" rel="noopener noreferrer" className="shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center hover:opacity-80 transition-opacity">
                              {idProofFile.type.startsWith('image/') ? (
                                <img src={URL.createObjectURL(idProofFile)} alt="preview" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold text-slate-400">PDF</span>
                              )}
                            </a>
                            <a href={URL.createObjectURL(idProofFile)} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-slate-700 truncate hover:text-[#4F35C3] hover:underline cursor-pointer flex-1 min-w-0">
                              {idProofFile.name}
                            </a>
                          </div>
                          <button onClick={() => setIdProofFile(null)} className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shrink-0">
                            <span className="text-lg font-black leading-none pb-0.5">×</span>
                          </button>
                        </div>
                      ) : (
                        <div className="relative group w-full h-12 rounded-xl border border-dashed border-slate-300 flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-[#4F35C3] bg-slate-50">
                          <span className="text-xs font-bold text-slate-500">{progressData.documentStatus.idProof ? 'Re-upload ID Proof (Optional)' : 'Upload ID Proof'}</span>
                          <input type="file" accept="image/*,application/pdf" onChange={(e) => setIdProofFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                      )
                    )}

                    {(!progressData.documentStatus.gst || forceShowDocs) && (
                      gstFile ? (
                        <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white shadow-sm w-full box-border">
                          <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0 pr-2">
                            <a href={URL.createObjectURL(gstFile)} target="_blank" rel="noopener noreferrer" className="shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center hover:opacity-80 transition-opacity">
                              {gstFile.type.startsWith('image/') ? (
                                <img src={URL.createObjectURL(gstFile)} alt="preview" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold text-slate-400">PDF</span>
                              )}
                            </a>
                            <a href={URL.createObjectURL(gstFile)} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-slate-700 truncate hover:text-[#4F35C3] hover:underline cursor-pointer flex-1 min-w-0">
                              {gstFile.name}
                            </a>
                          </div>
                          <button onClick={() => setGstFile(null)} className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shrink-0">
                            <span className="text-lg font-black leading-none pb-0.5">×</span>
                          </button>
                        </div>
                      ) : (
                        <div className="relative group w-full h-12 rounded-xl border border-dashed border-slate-300 flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-[#4F35C3] bg-slate-50">
                          <span className="text-xs font-bold text-slate-500">{progressData.documentStatus.gst ? 'Re-upload GST Certificate (Optional)' : 'Upload GST Certificate'}</span>
                          <input type="file" accept="image/*,application/pdf" onChange={(e) => setGstFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                      )
                    )}

                    {(idProofFile || gstFile) && (
                      <button
                        onClick={handleDocumentUpload}
                        disabled={uploadingDocs}
                        className="mt-2 w-full bg-[#4F35C3] text-white py-2 rounded-xl text-xs font-bold hover:bg-[#3f2aa6] transition-colors"
                      >
                        {uploadingDocs ? 'Uploading...' : 'Save Documents'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {progressData.documentStatus.needed && progressData.documentStatus.idProof && progressData.documentStatus.gst && !forceShowDocs && (
            <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <Icon name="check" size="sm" />
                </div>
                <span className="text-sm font-bold text-green-700">Business Documents Uploaded</span>
              </div>
              <button
                onClick={() => setForceShowDocs(true)}
                className="w-8 h-8 rounded-full hover:bg-green-100 flex items-center justify-center text-green-600 transition-colors"
                title="Re-upload documents"
              >
                <span className="text-lg font-black leading-none pb-0.5">×</span>
              </button>
            </div>
          )}

          {/* Categories / Subcategories Section */}
          {Array.from(new Set(progressData.subcategoryProgress.map(s => s.categoryName))).map(catName => {
            const subcats = progressData.subcategoryProgress.filter(s => s.categoryName === catName);
            const allComplete = subcats.every(s => s.completed);
            const isExpanded = expandedCategory === catName;

            return (
              <div key={catName} className={`bg-white border-2 rounded-2xl shadow-sm overflow-hidden transition-colors ${allComplete ? 'border-green-100' : 'border-slate-200'}`}>
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : catName)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${allComplete ? 'bg-green-50 text-green-500' : 'bg-[#F3E8FF] text-[#4F35C3]'}`}>
                      {allComplete ? <Icon name="check" size="md" /> : <ClipboardCheck className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-800">{catName} Services</h4>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">{subcats.filter(s => s.completed).length} of {subcats.length} subcategories complete</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 bg-slate-50/50 space-y-3">
                    {subcats.map(sub => (
                      <div key={sub.subcategoryId} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-sm font-bold text-slate-700">{sub.subcategoryName}</span>
                        {sub.completed ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                            <Icon name="check" size="xs" /> Completed
                          </span>
                        ) : (
                          <button
                            onClick={() => setActiveSubcategory(sub)}
                            className="text-xs font-bold text-[#4F35C3] bg-[#F3E8FF] hover:bg-[#E9D5FF] px-4 py-2 rounded-full transition-colors"
                          >
                            Fill Details
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {progressData.percentage === 100 && vendorState?.status === 'Incomplete' && (
          <div className="mt-8 border-t border-slate-200 pt-6 flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
              <Icon name="check" size="xl" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">You're All Set!</h3>
            <p className="text-sm font-medium text-slate-500 text-center max-w-md mb-6">
              Your profile is 100% complete. Submit it now so our admin team can review and verify your business.
            </p>
            <button
              onClick={handleSubmitForVerification}
              disabled={isSubmittingApproval}
              className={`px-8 py-3.5 rounded-2xl text-base font-bold text-white shadow-lg transition-all duration-200 ${isSubmittingApproval
                  ? 'bg-green-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 hover:shadow-green-500/30 hover:-translate-y-0.5 active:translate-y-0'
                }`}
            >
              {isSubmittingApproval ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        )}
      </div>


      {activeSubcategory && (
        <ServiceProfileSetupModal
          subcategory={activeSubcategory}
          onClose={() => setActiveSubcategory(null)}
          onSuccess={() => {
            setActiveSubcategory(null);
            fetchProgress();
            refreshData();
          }}
        />
      )}
    </div>
  );
};

export default ProfileCompletionTracker;
