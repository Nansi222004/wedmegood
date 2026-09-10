import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { vendorApi } from '../vendorApi';

const UploadContext = createContext(null);

export const useUpload = () => useContext(UploadContext);

export const UploadProvider = ({ children }) => {
    const [uploads, setUploads] = useState([]);
    const [isWidgetMinimized, setIsWidgetMinimized] = useState(false);

    // Using ref for uploads to access latest state inside callbacks
    const uploadsRef = useRef([]);
    uploadsRef.current = uploads;

    const addUpload = useCallback((file, token, identifier = null) => {
        const id = identifier || Math.random().toString(36).substr(2, 9);
        
        const newUpload = {
            id,
            file,
            status: 'uploading', // 'pending', 'uploading', 'completed', 'error'
            progress: 0,
            url: null,
            type: null,
            speed: '0 KB/s',
            error: null,
            _abortFn: null,
            startTime: Date.now(),
            lastLoaded: 0,
            lastTime: Date.now()
        };

        setUploads(prev => [...prev, newUpload]);
        setIsWidgetMinimized(false); // Pop open when new upload starts

        return new Promise((resolve, reject) => {
            startUpload(newUpload, token, resolve, reject);
        });
    }, []);

    const startUpload = (uploadObj, token, resolveCb = null, rejectCb = null) => {
        const { promise, abort } = vendorApi.uploadMediaWithProgress(
            uploadObj.file, 
            token, 
            (progressEvent) => {
                const now = Date.now();
                setUploads(prev => prev.map(u => {
                    if (u.id === uploadObj.id) {
                        const timeDiff = (now - u.lastTime) / 1000; // in seconds
                        let speed = u.speed;
                        
                        // Calculate speed every 500ms
                        if (timeDiff > 0.5) {
                            const bytesDiff = progressEvent.loaded - u.lastLoaded;
                            const bytesPerSec = bytesDiff / timeDiff;
                            speed = bytesPerSec > 1024 * 1024 
                                ? (bytesPerSec / (1024 * 1024)).toFixed(1) + ' MB/s'
                                : (bytesPerSec / 1024).toFixed(1) + ' KB/s';
                            
                            u.lastTime = now;
                            u.lastLoaded = progressEvent.loaded;
                        }

                        return {
                            ...u,
                            progress: progressEvent.percentage,
                            speed
                        };
                    }
                    return u;
                }));
            }
        );

        setUploads(prev => prev.map(u => u.id === uploadObj.id ? { ...u, _abortFn: abort } : u));

        promise
            .then(res => {
                if (res.success) {
                    setUploads(prev => prev.map(u => u.id === uploadObj.id ? { 
                        ...u, 
                        status: 'completed', 
                        progress: 100, 
                        url: res.url, 
                        type: res.type 
                    } : u));
                    if (resolveCb) resolveCb({ url: res.url, type: res.type });
                } else {
                    throw new Error(res.message || 'Upload failed');
                }
            })
            .catch(err => {
                if (err.message !== 'Upload aborted') {
                    setUploads(prev => prev.map(u => u.id === uploadObj.id ? { 
                        ...u, 
                        status: 'error', 
                        error: err.message 
                    } : u));
                }
                if (rejectCb) rejectCb(err);
            });
    };

    const addBatchUpload = useCallback((files, token, identifier = 'batch') => {
        const id = identifier + '_' + Math.random().toString(36).substr(2, 9);
        const totalSize = files.reduce((acc, f) => acc + f.size, 0);
        
        const mockFile = {
            name: `Batch Upload (${files.length} items)`,
            size: totalSize,
            type: 'batch/multiple'
        };

        const newUpload = {
            id,
            file: mockFile,
            status: 'uploading',
            progress: 0,
            url: null,
            type: null,
            speed: '0 KB/s',
            error: null,
            _abortFn: null,
            startTime: Date.now(),
            lastLoaded: 0,
            lastTime: Date.now()
        };

        setUploads(prev => [...prev, newUpload]);
        setIsWidgetMinimized(false);

        return new Promise((resolve, reject) => {
            const { promise, abort } = vendorApi.uploadMultipleMediaWithProgress(
                files, 
                token, 
                (progressEvent) => {
                    const now = Date.now();
                    setUploads(prev => prev.map(u => {
                        if (u.id === newUpload.id) {
                            const timeDiff = (now - u.lastTime) / 1000;
                            let speed = u.speed;
                            
                            if (timeDiff > 0.5) {
                                const bytesDiff = progressEvent.loaded - u.lastLoaded;
                                const bytesPerSec = bytesDiff / timeDiff;
                                speed = bytesPerSec > 1024 * 1024 
                                    ? (bytesPerSec / (1024 * 1024)).toFixed(1) + ' MB/s'
                                    : (bytesPerSec / 1024).toFixed(1) + ' KB/s';
                                
                                u.lastTime = now;
                                u.lastLoaded = progressEvent.loaded;
                            }

                            return {
                                ...u,
                                progress: progressEvent.percentage,
                                speed
                            };
                        }
                        return u;
                    }));
                }
            );

            setUploads(prev => prev.map(u => u.id === newUpload.id ? { ...u, _abortFn: abort } : u));

            promise
                .then(res => {
                    if (res.success) {
                        setUploads(prev => prev.map(u => u.id === newUpload.id ? { 
                            ...u, 
                            status: 'completed', 
                            progress: 100,
                            files: res.files
                        } : u));
                        resolve(res.files);
                    } else {
                        throw new Error(res.message || 'Upload failed');
                    }
                })
                .catch(err => {
                    if (err.message !== 'Upload aborted') {
                        setUploads(prev => prev.map(u => u.id === newUpload.id ? { 
                            ...u, 
                            status: 'error', 
                            error: err.message 
                        } : u));
                    }
                    reject(err);
                });
        });
    }, []);

    const retryUpload = useCallback((id, token) => {
        const upload = uploadsRef.current.find(u => u.id === id);
        if (upload && upload.status === 'error') {
            setUploads(prev => prev.map(u => u.id === id ? { 
                ...u, 
                status: 'uploading', 
                progress: 0, 
                error: null,
                startTime: Date.now(),
                lastLoaded: 0,
                lastTime: Date.now()
            } : u));
            startUpload(upload, token);
        }
    }, []);

    const cancelUpload = useCallback((id) => {
        const upload = uploadsRef.current.find(u => u.id === id);
        if (upload && upload._abortFn) {
            upload._abortFn();
        }
        setUploads(prev => prev.filter(u => u.id !== id));
    }, []);

    const clearCompleted = useCallback(() => {
        setUploads(prev => prev.filter(u => u.status !== 'completed'));
    }, []);

    const clearAll = useCallback(() => {
        uploadsRef.current.forEach(u => {
            if (u.status === 'uploading' && u._abortFn) {
                u._abortFn();
            }
        });
        setUploads([]);
    }, []);

    const getCompletedUrls = useCallback(() => {
        return uploadsRef.current
            .filter(u => u.status === 'completed')
            .map(u => ({ url: u.url, type: u.type, id: u.id }));
    }, []);

    return (
        <UploadContext.Provider value={{
            uploads,
            isWidgetMinimized,
            setIsWidgetMinimized,
            addUpload,
            addBatchUpload,
            retryUpload,
            cancelUpload,
            clearCompleted,
            clearAll,
            getCompletedUrls
        }}>
            {children}
        </UploadContext.Provider>
    );
};
