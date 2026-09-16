import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

const ConfirmModal = ({
    isOpen,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed? This action cannot be undone.',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = true,
    isLoading = false,
    onConfirm,
    onCancel
}) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen && !isLoading) {
                onCancel();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, isLoading, onCancel]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
                onClick={isLoading ? undefined : onCancel}
            />

            {/* Modal Dialog */}
            <div 
                className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 overflow-hidden z-10 animate-in zoom-in-95 fade-in duration-200"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                        isDanger ? 'bg-rose-50 text-rose-600' : 'bg-[#4F35C3]/10 text-[#4F35C3]'
                    }`}>
                        <Icon name={isDanger ? "trash" : "help-circle"} size="md" />
                    </div>

                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">
                            {title}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 ${
                            isDanger 
                                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' 
                                : 'bg-[#4F35C3] hover:bg-[#3D299E] shadow-[#4F35C3]/20'
                        }`}
                    >
                        {isLoading && (
                            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        )}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmModal;
