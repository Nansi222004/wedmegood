import React, { useState, useEffect } from 'react';
import { vendorApi } from '../vendorApi';
import { useVendorState } from '../useVendorState';
import Icon from '../../../components/ui/Icon';

const ServiceProfileSetupModal = ({ subcategory, onClose, onSuccess }) => {
  const { vendorState } = useVendorState();
  const [loading, setLoading] = useState(true);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mediaFiles, setMediaFiles] = useState({ images: [], videos: [], documents: [] });

  const vendor = vendorState?.vendor;

  useEffect(() => {
    if (subcategory) {
      fetchTemplate(subcategory);
    }
  }, [subcategory]);

  const fetchTemplate = async (subcat) => {
    setLoading(true);
    setError('');
    try {
      // Call public endpoint to get templates
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api')}/admin/form-templates`);
      const json = await res.json();
      if (json.success) {
        // Filter fields matching this category and subcategory
        const fields = json.data.filter(t => {
          const tCatId = t.categoryId?._id || t.categoryId;
          const tSubCatId = t.subCategoryId?._id || t.subCategoryId;
          return tCatId === subcat.categoryId && (tSubCatId === subcat.subcategoryId || !tSubCatId);
        }).map(f => ({
          ...f,
          fieldType: f.type,
          isRequired: f.required
        }));
        setCurrentTemplate({ fields });
      }
    } catch (err) {
      setError('Failed to load template. Please try again.');
    } finally {
      setLoading(false);
      setFormData({});
      setMediaFiles({ images: [], videos: [], documents: [] });
    }
  };


  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFileSelect = (e, type) => {
    const files = Array.from(e.target.files);
    setMediaFiles(prev => ({ ...prev, [type]: [...prev[type], ...files] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentTemplate) return;

    setSubmitting(true);
    setError('');

    try {
      const payload = new FormData();
      payload.append('categoryId', subcategory.categoryId);
      payload.append('subCategoryId', subcategory.subcategoryId);
      payload.append('serviceData', JSON.stringify(formData));
      
      mediaFiles.images.forEach(f => payload.append('images', f));
      mediaFiles.videos.forEach(f => payload.append('videos', f));
      mediaFiles.documents.forEach(f => payload.append('documents', f));

      const token = localStorage.getItem('vendorToken');
      const data = await vendorApi.createDynamicVendorService(payload, token);
      
      if (data.success) {
        if (onSuccess) onSuccess();
      } else {
        setError(data.message || 'Submission failed');
      }
    } catch (err) {
      setError('An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!subcategory) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-[#4F35C3] to-[#7C3AED] text-white">
          <h2 className="text-2xl sm:text-3xl font-black font-['Playfair_Display'] tracking-tight leading-tight">
            Service Details
          </h2>
          <p className="text-white/80 text-sm mt-1">
            Setting up: <span className="font-bold text-white">{subcategory?.categoryName} &gt; {subcategory?.subcategoryName}</span>
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-slate-50">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-black flex-shrink-0">!</span>
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#4F35C3] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-bold text-sm">Loading template...</p>
            </div>
          ) : !currentTemplate ? (
            <div className="py-8 text-center">
              <p className="text-slate-500 mb-4 font-medium">Unable to load form for this category.</p>
              <button 
                onClick={onClose}
                className="bg-[#4F35C3] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#3f2aa6] transition-colors"
              >
                Go Back
              </button>
            </div>
          ) : (
            <form id="dynamic-service-form" onSubmit={handleSubmit} className="space-y-5">
              {currentTemplate.fields.map(field => (
                <div key={field._id} className="flex flex-col">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">
                    {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                  </label>
                  
                  {field.fieldType === 'text' && (
                    <input 
                      type="text" 
                      required={field.isRequired}
                      className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold border border-slate-200 focus:border-[#4F35C3] focus:ring-2 focus:ring-[#4F35C3]/10 outline-none"
                      onChange={e => handleInputChange(field.name, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  )}

                  {field.fieldType === 'number' && (
                    <input 
                      type="number" 
                      required={field.isRequired}
                      className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold border border-slate-200 focus:border-[#4F35C3] focus:ring-2 focus:ring-[#4F35C3]/10 outline-none"
                      onChange={e => handleInputChange(field.name, e.target.value)}
                    />
                  )}

                  {field.fieldType === 'textarea' && (
                    <textarea 
                      required={field.isRequired}
                      className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold border border-slate-200 focus:border-[#4F35C3] focus:ring-2 focus:ring-[#4F35C3]/10 outline-none min-h-[100px]"
                      onChange={e => handleInputChange(field.name, e.target.value)}
                      placeholder={`Enter details about ${field.label.toLowerCase()}`}
                    />
                  )}

                  {field.fieldType === 'select' && (
                    <select 
                      required={field.isRequired}
                      className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold border border-slate-200 focus:border-[#4F35C3] focus:ring-2 focus:ring-[#4F35C3]/10 outline-none bg-white"
                      onChange={e => handleInputChange(field.name, e.target.value)}
                    >
                      <option value="">Select an option</option>
                      {field.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                  
                  {field.fieldType === 'multiselect' && (
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {field.options?.map(opt => (
                        <label key={opt} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-[#4F35C3] rounded focus:ring-[#4F35C3]"
                            onChange={(e) => {
                              const currentVals = formData[field.name] || [];
                              if (e.target.checked) {
                                handleInputChange(field.name, [...currentVals, opt]);
                              } else {
                                handleInputChange(field.name, currentVals.filter(v => v !== opt));
                              }
                            }}
                          />
                          <span className="text-sm font-semibold text-slate-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.description && (
                    <p className="text-[10px] text-slate-400 font-medium ml-1 mt-1">{field.description}</p>
                  )}
                </div>
              ))}

              {/* Media Uploads Block */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-sm font-black text-slate-800 mb-3">Service Media (Optional)</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="border border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center bg-white relative hover:border-[#4F35C3] transition-colors cursor-pointer">
                    <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileSelect(e, 'images')} />
                    <Icon name="image" size="sm" color="#94a3b8" />
                    <span className="text-[10px] font-bold mt-2 text-slate-500">Add Images</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">{mediaFiles.images.length} selected</span>
                  </div>
                  <div className="border border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center bg-white relative hover:border-[#4F35C3] transition-colors cursor-pointer">
                    <input type="file" multiple accept="video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileSelect(e, 'videos')} />
                    <Icon name="video" size="sm" color="#94a3b8" />
                    <span className="text-[10px] font-bold mt-2 text-slate-500">Add Videos</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">{mediaFiles.videos.length} selected</span>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!loading && currentTemplate && (
          <div className="p-4 sm:px-8 sm:py-5 bg-white border-t border-slate-100 flex items-center justify-between">
            <button 
              type="button" 
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              form="dynamic-service-form"
              disabled={submitting}
              className={`px-8 py-3 rounded-xl text-sm font-black text-white shadow-md transition-all flex items-center gap-2 ${submitting ? 'bg-[#4F35C3]/50 cursor-not-allowed' : 'bg-[#4F35C3] hover:bg-[#3f2aa6] hover:shadow-lg active:scale-95'}`}
            >
              {submitting ? 'Saving...' : 'Save Details ✨'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceProfileSetupModal;
