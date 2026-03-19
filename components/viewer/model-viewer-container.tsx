'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFormatLabel } from '@/lib/format-utils';
import { useInteractionStore } from '@/lib/store/interaction-store';
import type { WorkspaceAttachment, WorkspaceModelWithAttachments } from '@/lib/workspace-types';
import { ModelViewer } from './model-viewer';
import { SceneControls } from './scene-controls';
import { ViewerControls } from './viewer-controls';

interface ModelViewerContainerProps {
    model: WorkspaceModelWithAttachments;
}

export function ModelViewerContainer({ model }: ModelViewerContainerProps) {
    const [autoRotate, setAutoRotate] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [activeTab, setActiveTab] = useState<'scene' | 'files'>('scene');
    const [isUploading, setIsUploading] = useState(false);
    const [localAttachments, setLocalAttachments] = useState<WorkspaceAttachment[]>(model.attachments ?? []);
    const [shareState, setShareState] = useState<'idle' | 'copied' | 'error'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { resetTransform, wireframe, setWireframe } = useInteractionStore();

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'attachment');
        formData.append('modelId', model.id);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json() as { data: WorkspaceAttachment };
            setLocalAttachments((previous) => [...previous, result.data]);
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleFullscreen = async () => {
        if (!document.fullscreenElement) {
            await containerRef.current?.requestFullscreen();
            return;
        }

        await document.exitFullscreen();
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = model.url;
        link.download = `${model.name}.${model.format || 'glb'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setShareState('copied');
        } catch {
            setShareState('error');
        }

        window.setTimeout(() => setShareState('idle'), 2000);
    };

    return (
        <div ref={containerRef} className="relative w-full h-full group bg-brand-dark">
            <div className="flex h-full">
                <div className="flex-1 relative">
                    <ModelViewer
                        modelUrl={model.url}
                        format={model.format || 'glb'}
                        autoRotate={autoRotate}
                    />

                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ViewerControls
                            autoRotate={autoRotate}
                            onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
                            onFullscreen={handleFullscreen}
                            onDownload={handleDownload}
                            onReset={resetTransform}
                            onShare={handleShare}
                            wireframe={wireframe}
                            onToggleWireframe={() => setWireframe(!wireframe)}
                            onToggleSceneControls={() => setShowControls(!showControls)}
                            showSceneControls={showControls}
                        />
                    </div>

                    <div className="absolute top-8 right-8 z-20 pointer-events-none">
                        <div className="glass-panel p-4 rounded-2xl border border-white/5 space-y-1 text-right">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Metadata</p>
                            <p className="text-white font-mono text-sm">{(model.size / (1024 * 1024)).toFixed(2)} MB</p>
                            <p className="text-brand-cyan font-mono text-[10px]">{getFormatLabel(model.format || 'glb')} ASSET</p>
                            {shareState !== 'idle' && (
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${shareState === 'copied' ? 'text-green-400' : 'text-red-400'}`}>
                                    {shareState === 'copied' ? 'Link copied' : 'Copy failed'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {showControls && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 320, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="h-full overflow-hidden border-l border-white/5 bg-brand-dark/50 backdrop-blur-md"
                        >
                            <div className="h-full flex flex-col p-4">
                                <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 mb-6">
                                    <button
                                        onClick={() => setActiveTab('scene')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'scene' ? 'bg-brand-cyan/20 text-brand-cyan shadow-sm' : 'text-gray-500 hover:text-white'
                                            }`}
                                    >
                                        Settings
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('files')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'files' ? 'bg-brand-purple/20 text-brand-purple shadow-sm' : 'text-gray-500 hover:text-white'
                                            }`}
                                    >
                                        Files ({localAttachments.length})
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                                    {activeTab === 'scene' ? (
                                        <SceneControls />
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Related Assets</p>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isUploading}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-purple/20 text-brand-purple border border-brand-purple/30 hover:bg-brand-purple/30 transition-all text-[10px] font-bold"
                                                >
                                                    {isUploading ? 'Uploading...' : 'Add File'}
                                                </button>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    onChange={handleFileUpload}
                                                />
                                            </div>

                                            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-gray-400">
                                                <p>
                                                    Upload reference files, notes, or supporting media that belong with this model.
                                                </p>
                                            </div>

                                            {localAttachments.length > 0 ? (
                                                <div className="space-y-2">
                                                    {localAttachments.map((file) => (
                                                        <a
                                                            key={file.id}
                                                            href={file.url}
                                                            download
                                                            className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-brand-purple/50 group transition-all"
                                                        >
                                                            <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple group-hover:scale-110 transition-transform">
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M7 10l5 5m0 0l5-5m-5 5V3" />
                                                                </svg>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-white truncate">{file.name}</p>
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{(file.size / (1024 * 1024)).toFixed(2)} MB / {file.type}</p>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 rounded-3xl border border-dashed border-white/10">
                                                    <p className="text-gray-500 text-xs italic">No additional files linked to this model.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
