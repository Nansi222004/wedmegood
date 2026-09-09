import React, { useState, useEffect } from 'react';
import { useUpload } from '../context/UploadContext';
import Icon from '../../../components/ui/Icon';

const UploadProgressWidget = ({ token }) => {
    const { 
        uploads, 
        isWidgetMinimized, 
        setIsWidgetMinimized, 
        retryUpload, 
        cancelUpload,
        clearCompleted,
        clearAll
    } = useUpload();

    const [thumbnails, setThumbnails] = useState({});

    // Generate thumbnails for files
    useEffect(() => {
        const newThumbnails = { ...thumbnails };
        let changed = false;
        
        uploads.forEach(u => {
            if (!newThumbnails[u.id] && u.file && u.file instanceof File) {
                newThumbnails[u.id] = URL.createObjectURL(u.file);
                changed = true;
            }
        });

        if (changed) setThumbnails(newThumbnails);

        // Cleanup URLs when uploads are removed
        const activeIds = uploads.map(u => u.id);
        Object.keys(thumbnails).forEach(id => {
            if (!activeIds.includes(id)) {
                URL.revokeObjectURL(thumbnails[id]);
                delete newThumbnails[id];
                changed = true;
            }
        });

        if (changed) setThumbnails({ ...newThumbnails });
    }, [uploads]);

    if (uploads.length === 0) return null;

    const totalFiles = uploads.length;
    const completedFiles = uploads.filter(u => u.status === 'completed').length;
    const errorFiles = uploads.filter(u => u.status === 'error').length;
    const inProgressFiles = totalFiles - completedFiles - errorFiles;
    
    const allDone = inProgressFiles === 0;
    
    let overallProgress = 0;
    if (totalFiles > 0) {
        const totalProgress = uploads.reduce((acc, u) => acc + (u.status === 'completed' ? 100 : u.progress), 0);
        overallProgress = Math.round(totalProgress / totalFiles);
    }

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    if (isWidgetMinimized) {
        return (
            <div 
                className="fixed bottom-6 right-6 z-[100] bg-white rounded-full shadow-2xl border border-slate-100 p-2 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors animate-in slide-in-from-bottom-5 fade-in duration-300"
                onClick={() => setIsWidgetMinimized(false)}
            >
                <div className="relative w-10 h-10 flex items-center justify-center bg-[#4F35C3]/10 rounded-full">
                    {allDone && errorFiles === 0 ? (
                        <Icon name="check-circle" size="sm" color="#10B981" />
                    ) : (
                        <>
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                <circle cx="20" cy="20" r="18" fill="none" stroke="#EAE6FF" strokeWidth="3" />
                                <circle 
                                    cx="20" cy="20" r="18" 
                                    fill="none" 
                                    stroke="#4F35C3" 
                                    strokeWidth="3" 
                                    strokeDasharray="113" 
                                    strokeDashoffset={113 - (113 * overallProgress) / 100}
                                    className="transition-all duration-300"
                                />
                            </svg>
                            <span className="text-[10px] font-bold text-[#4F35C3]">{overallProgress}%</span>
                        </>
                    )}
                </div>
                <div className="pr-3">
                    <p className="text-sm font-semibold text-slate-900">
                        {allDone ? 'Uploads complete' : `Uploading ${totalFiles - completedFiles} items`}
                    </p>
                    {errorFiles > 0 && <p className="text-xs text-rose-500">{errorFiles} failed</p>}
                </div>
                {allDone && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); clearAll(); }}
                        className="p-1.5 hover:bg-slate-100 rounded-full transition-colors mr-1"
                    >
                        <Icon name="x" size="sm" color="#64748b" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-[100] w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
            {/* Header */}
            <div className="bg-[#1a1532] text-white p-4 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-sm">
                        {allDone ? 'Uploads complete' : `Uploading ${inProgressFiles} items`}
                    </h3>
                    {!allDone && <p className="text-xs text-slate-400 mt-0.5">{overallProgress}% • {completedFiles}/{totalFiles} finished</p>}
                    {allDone && errorFiles > 0 && <p className="text-xs text-rose-400 mt-0.5">{errorFiles} failed</p>}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsWidgetMinimized(true)} className="p-1.5 hover:bg-white/10 rounded-md transition-colors">
                        <Icon name="minus" size="sm" color="#ffffff" />
                    </button>
                    {allDone ? (
                        <button onClick={clearAll} className="p-1.5 hover:bg-white/10 rounded-md transition-colors">
                            <Icon name="x" size="sm" color="#ffffff" />
                        </button>
                    ) : null}
                </div>
            </div>

            {/* List */}
            <div className="max-h-[60vh] overflow-y-auto p-2" data-lenis-prevent="true">
                {uploads.map((upload) => (
                    <div key={upload.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl group transition-colors">
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden relative">
                            {upload.file.type.startsWith('video') ? (
                                <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                                    <Icon name="video" size="sm" color="#ffffff" />
                                </div>
                            ) : upload.file.type === 'batch/multiple' ? (
                                <div className="absolute inset-0 bg-[#4F35C3]/10 flex items-center justify-center">
                                    <Icon name="layers" size="sm" color="#4F35C3" />
                                </div>
                            ) : (
                                <img src={thumbnails[upload.id]} alt="preview" className="w-full h-full object-cover" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate pr-4">{upload.file.name}</p>
                            
                            {upload.status === 'uploading' && (
                                <div className="mt-1.5">
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-[#4F35C3] transition-all duration-300"
                                            style={{ width: `${upload.progress}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 font-medium">
                                        <span>{upload.speed}</span>
                                        <span>{formatBytes(upload.file.size)}</span>
                                    </div>
                                </div>
                            )}

                            {upload.status === 'completed' && (
                                <p className="text-xs text-emerald-500 font-medium mt-1 flex items-center gap-1">
                                    <Icon name="check-circle" size="xs" color="currentColor" /> Uploaded
                                </p>
                            )}

                            {upload.status === 'error' && (
                                <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1 truncate" title={upload.error}>
                                    <Icon name="alert-circle" size="xs" color="currentColor" /> {upload.error}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex items-center">
                            {upload.status === 'uploading' && (
                                <button onClick={() => cancelUpload(upload.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                    <Icon name="x" size="sm" color="currentColor" />
                                </button>
                            )}
                            {upload.status === 'error' && (
                                <button onClick={() => retryUpload(upload.id, token)} className="p-2 text-slate-400 hover:text-[#4F35C3] hover:bg-[#4F35C3]/10 rounded-lg transition-colors">
                                    <Icon name="refresh-cw" size="sm" color="currentColor" />
                                </button>
                            )}
                            {upload.status === 'completed' && (
                                <div className="p-2 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icon name="check" size="sm" color="currentColor" />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UploadProgressWidget;
