'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X, CheckCircle, Loader2, Box, Image as ImageIcon, Film, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ALL_3D_EXTENSIONS, getFormatLabel, getFormatFromFilename } from '@/lib/format-utils';
import {
    ATTACHMENT_DROPZONE_ACCEPT,
    MAX_ATTACHMENT_UPLOAD_BYTES,
    MAX_MODEL_UPLOAD_BYTES,
    MODEL_DROPZONE_ACCEPT,
    type UploadResponse,
    type UploadSuccessResponse,
} from '@/lib/upload-config';

type UploadTab = '3d' | 'files';

const FORMAT_GROUPS = [
    { label: 'glTF / GLB', formats: ['.glb', '.gltf'] },
    { label: 'FBX', formats: ['.fbx'] },
    { label: 'Wavefront', formats: ['.obj', '.mtl'] },
    { label: 'STL', formats: ['.stl'] },
    { label: 'PLY', formats: ['.ply'] },
    { label: 'Collada', formats: ['.dae'] },
    { label: 'Apple USDZ', formats: ['.usdz', '.usda'] },
    { label: 'Other', formats: ['.3ds', '.3mf', '.wrl', '.drc'] },
];

interface UploadDropzoneProps {
    onUploadSuccess?: (result: UploadSuccessResponse) => void;
    isDemo?: boolean;
    availableTabs?: UploadTab[];
    modelAccept?: Record<string, string[]>;
}

export function UploadDropzone({
    onUploadSuccess,
    isDemo = false,
    availableTabs = ['3d', 'files'],
    modelAccept = MODEL_DROPZONE_ACCEPT,
}: UploadDropzoneProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
    const [uploadDone, setUploadDone] = useState<Record<number, boolean>>({});
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<UploadTab>(availableTabs[0] ?? '3d');
    const router = useRouter();

    useEffect(() => {
        if (!availableTabs.includes(activeTab)) {
            setActiveTab(availableTabs[0] ?? '3d');
            setFiles([]);
        }
    }, [activeTab, availableTabs]);

    const onDrop3D = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) {
            return;
        }

        setFiles(acceptedFiles);
        setError(null);
    }, []);

    const onDropFiles = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) {
            return;
        }

        setFiles((previous) => [...previous, ...acceptedFiles]);
        setError(null);
    }, []);

    const dropzone3D = useDropzone({
        onDrop: onDrop3D,
        accept: modelAccept,
        maxFiles: 1,
        maxSize: MAX_MODEL_UPLOAD_BYTES,
    });

    const dropzoneFiles = useDropzone({
        onDrop: onDropFiles,
        accept: ATTACHMENT_DROPZONE_ACCEPT,
        maxFiles: 10,
        maxSize: MAX_ATTACHMENT_UPLOAD_BYTES,
    });

    const activeDropzone = activeTab === '3d' ? dropzone3D : dropzoneFiles;

    const clearFiles = () => {
        setFiles([]);
        setUploadProgress({});
        setUploadDone({});
        setError(null);
    };

    const removeFile = (index: number) => {
        setFiles((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            return;
        }

        setUploading(true);
        setError(null);

        const progressMap: Record<number, number> = {};
        const doneMap: Record<number, boolean> = {};

        for (let index = 0; index < files.length; index += 1) {
            progressMap[index] = 0;
            setUploadProgress({ ...progressMap });

            const interval = window.setInterval(() => {
                progressMap[index] = Math.min(progressMap[index] + 15, 90);
                setUploadProgress({ ...progressMap });
            }, 300);

            try {
                const formData = new FormData();
                formData.append('file', files[index]);
                formData.append('type', activeTab === '3d' ? '3d' : 'attachment');

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                window.clearInterval(interval);

                const contentType = response.headers.get('content-type') ?? '';
                const responseText = await response.text();

                if (!contentType.includes('application/json')) {
                    const normalizedText = responseText.trim();

                    if (response.redirected || normalizedText.startsWith('<!DOCTYPE') || normalizedText.startsWith('<html')) {
                        throw new Error('Upload endpoint returned a page instead of JSON. The route may be protected or failed before returning API data.');
                    }

                    throw new Error(normalizedText.slice(0, 160) || 'Upload endpoint returned a non-JSON response.');
                }

                const result = JSON.parse(responseText) as UploadResponse;

                if (!response.ok) {
                    throw new Error(result.success ? 'Upload failed' : result.message || result.error || 'Upload failed');
                }

                if (!result.success) {
                    throw new Error(result.message || result.error || 'Upload failed');
                }

                progressMap[index] = 100;
                doneMap[index] = true;
                setUploadProgress({ ...progressMap });
                setUploadDone({ ...doneMap });

                onUploadSuccess?.(result);
            } catch (uploadError) {
                window.clearInterval(interval);
                setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload. Please try again.');
                setUploading(false);
                return;
            }
        }

        window.setTimeout(() => {
            if (!isDemo) {
                router.push('/library');
                return;
            }

            setUploading(false);
            clearFiles();
        }, 1000);
    };

    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        if (ALL_3D_EXTENSIONS.map((item) => item.slice(1)).includes(extension)) return <Box className="w-5 h-5 text-brand-cyan" />;
        if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(extension)) return <ImageIcon className="w-5 h-5 text-green-400" />;
        if (['mp4', 'webm', 'mov'].includes(extension)) return <Film className="w-5 h-5 text-purple-400" />;
        return <FileText className="w-5 h-5 text-yellow-400" />;
    };

    const showTabSwitcher = availableTabs.length > 1;

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {showTabSwitcher && (
                <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10 w-fit mx-auto">
                    {availableTabs.includes('3d') && (
                        <button
                            onClick={() => { setActiveTab('3d'); clearFiles(); }}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2",
                                activeTab === '3d'
                                    ? "bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Box className="w-4 h-4" />
                            3D Models
                        </button>
                    )}
                    {availableTabs.includes('files') && (
                        <button
                            onClick={() => { setActiveTab('files'); clearFiles(); }}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2",
                                activeTab === 'files'
                                    ? "bg-brand-purple/20 text-brand-purple border border-brand-purple/30 shadow-[0_0_15px_rgba(189,0,255,0.15)]"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <File className="w-4 h-4" />
                            Files & Media
                        </button>
                    )}
                </div>
            )}

            {activeTab === '3d' && files.length === 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-xl mx-auto">
                    {FORMAT_GROUPS.map((group) => (
                        <div key={group.label} className="bg-white/[0.03] rounded-xl p-3 border border-white/5 text-center">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">{group.label}</p>
                            <p className="text-xs text-brand-cyan font-mono">{group.formats.join(' ')}</p>
                        </div>
                    ))}
                </div>
            )}

            <AnimatePresence mode="wait">
                {files.length === 0 ? (
                    <div
                        {...activeDropzone.getRootProps()}
                        className={cn(
                            "border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-300",
                            activeDropzone.isDragActive
                                ? activeTab === '3d'
                                    ? "border-brand-cyan bg-brand-cyan/10 scale-[1.02]"
                                    : "border-brand-purple bg-brand-purple/10 scale-[1.02]"
                                : "border-white/10 hover:border-brand-cyan/50 hover:bg-white/5"
                        )}
                    >
                        <input {...activeDropzone.getInputProps()} />
                        <motion.div
                            key={`dropzone-${activeTab}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,0,0,0.3)] border border-white/5 bg-brand-dark">
                                <UploadCloud className={cn("w-10 h-10", activeTab === '3d' ? 'text-brand-cyan' : 'text-brand-purple')} />
                            </div>
                            <h3 className="text-xl font-bold font-space text-white mb-2">
                                {activeDropzone.isDragActive ? "Drop it here!" : activeTab === '3d' ? "Drag & Drop your 3D Model" : "Drag & Drop your Files"}
                            </h3>
                            <p className="text-gray-400 text-sm mb-6">
                                {activeTab === '3d'
                                    ? "Supports GLB, GLTF, FBX, OBJ, STL, PLY, DAE, USDZ, 3DS, 3MF, WRL (max 200MB)"
                                    : "Images, videos, documents, and archives (max 100MB each, up to 10 files)"
                                }
                            </p>
                            <Button variant="outline" className="pointer-events-none">
                                Select {activeTab === '3d' ? 'Model' : 'Files'}
                            </Button>
                        </motion.div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-brand-dark/50 border border-white/10 rounded-3xl p-6 backdrop-blur-md space-y-4"
                    >
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                            {files.map((file, index) => (
                                <div key={`${file.name}-${file.size}-${index}`} className="flex items-center gap-4 p-3 bg-white/[0.03] rounded-2xl border border-white/5">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                        {getFileIcon(file.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white text-sm truncate">{file.name}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                                            {activeTab === '3d' && (
                                                <span className="text-[10px] text-brand-cyan font-mono bg-brand-cyan/10 px-2 py-0.5 rounded-lg uppercase">
                                                    {getFormatLabel(getFormatFromFilename(file.name))}
                                                </span>
                                            )}
                                        </div>
                                        {uploading && (
                                            <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    className={cn(
                                                        "h-full rounded-full",
                                                        uploadDone[index] ? "bg-green-400" : "bg-brand-cyan"
                                                    )}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${uploadProgress[index] || 0}%` }}
                                                    transition={{ duration: 0.3 }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    {!uploading && (
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="text-gray-500 hover:text-white transition-colors shrink-0"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                    {uploading && uploadDone[index] && (
                                        <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                                    )}
                                    {uploading && !uploadDone[index] && (
                                        <Loader2 className="w-5 h-5 text-brand-cyan animate-spin shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {uploading && Object.values(uploadDone).length === files.length && Object.values(uploadDone).every(Boolean) && (
                            <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-bold py-2">
                                <CheckCircle className="w-5 h-5" />
                                All uploads complete! Redirecting...
                            </div>
                        )}

                        {!uploading && (
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleUpload}
                                    className={cn(
                                        "w-full font-bold",
                                        activeTab === '3d'
                                            ? "bg-brand-cyan text-brand-dark hover:bg-brand-cyan/90 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                                            : "bg-brand-purple text-white hover:bg-brand-purple/90 shadow-[0_0_20px_rgba(189,0,255,0.3)]"
                                    )}
                                >
                                    Upload {files.length > 1 ? `${files.length} Files` : 'File'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={clearFiles}
                                    className="w-full"
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}

                        {error && (
                            <p className="text-red-500 text-sm text-center">{error}</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
