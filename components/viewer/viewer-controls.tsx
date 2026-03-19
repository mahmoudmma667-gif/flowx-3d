'use client';

import React from 'react';
import {
    Maximize,
    Download,
    RotateCcw,
    RefreshCcw,
    Share2,
    Grid3x3,
    Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ViewerControlsProps {
    onFullscreen: () => void;
    onDownload: () => void;
    onReset: () => void;
    onShare: () => void;
    autoRotate: boolean;
    onToggleAutoRotate: () => void;
    wireframe?: boolean;
    onToggleWireframe?: () => void;
    showSceneControls?: boolean;
    onToggleSceneControls?: () => void;
}

export function ViewerControls({
    onFullscreen,
    onDownload,
    onReset,
    onShare,
    autoRotate,
    onToggleAutoRotate,
    wireframe = false,
    onToggleWireframe,
    showSceneControls = false,
    onToggleSceneControls,
}: ViewerControlsProps) {
    return (
        <div className="flex items-center gap-2 p-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl pointer-events-auto shadow-2xl">
            <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className={`h-9 w-9 rounded-xl transition-all ${autoRotate ? 'bg-brand-cyan/20 text-brand-cyan' : 'text-white/60 hover:text-white'}`}
                    onClick={onToggleAutoRotate}
                    title="Toggle Auto Rotation"
                >
                    <RefreshCcw className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-white/60 hover:text-white rounded-xl"
                    onClick={onReset}
                    title="Reset View"
                >
                    <RotateCcw className="w-4 h-4" />
                </Button>
                {onToggleWireframe && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`h-9 w-9 rounded-xl transition-all ${wireframe ? 'bg-brand-purple/20 text-brand-purple' : 'text-white/60 hover:text-white'}`}
                        onClick={onToggleWireframe}
                        title="Toggle Wireframe"
                    >
                        <Grid3x3 className="w-4 h-4" />
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-white/60 hover:text-white rounded-xl"
                    onClick={onFullscreen}
                    title="Fullscreen"
                >
                    <Maximize className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-white/60 hover:text-white rounded-xl"
                    onClick={onDownload}
                    title="Download"
                >
                    <Download className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-white/60 hover:text-white rounded-xl"
                    onClick={onShare}
                    title="Share Model"
                >
                    <Share2 className="w-4 h-4" />
                </Button>
                {onToggleSceneControls && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`h-9 w-9 rounded-xl transition-all ${showSceneControls ? 'bg-brand-cyan/20 text-brand-cyan' : 'text-white/60 hover:text-white'}`}
                        onClick={onToggleSceneControls}
                        title="Scene Controls"
                    >
                        <Settings2 className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
