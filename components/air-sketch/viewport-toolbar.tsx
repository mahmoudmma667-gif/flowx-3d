'use client';

import React from 'react';
import {
    Box,
    Circle,
    Cylinder,
    Triangle,
    Square,
    CircleDot,
    Eye,
    EyeOff,
    Lock,
    Unlock,
    Copy,
    FlipHorizontal2,
    AlignCenter,
    Ruler,
    Grid3x3,
    Redo2,
    RotateCcw,
    Move,
    Rotate3d,
    Maximize,
    Focus,
    Maximize2,
    ArrowUp,
    Crosshair,
    Layers,
    PencilRuler,
    Compass,
    MinusSquare,
    Sparkles,
    Sun,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────
export type CameraPreset = 'top' | 'front' | 'side' | 'reset' | 'focus' | 'fit';
export type DisplayMode = 'solid' | 'wireframe' | 'xray';
export type PrimitiveType = 'cube' | 'sphere' | 'cylinder' | 'cone' | 'plane' | 'torus';

interface ToolbarProps {
    // Camera
    onCameraPreset: (preset: CameraPreset) => void;
    isOrthographic: boolean;
    onToggleOrthographic: () => void;
    // Display
    displayMode: DisplayMode;
    onDisplayMode: (mode: DisplayMode) => void;
    showGrid: boolean;
    onToggleGrid: () => void;
    showAxes: boolean;
    onToggleAxes: () => void;
    // Transform
    transformMode: 'translate' | 'rotate' | 'scale';
    onTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void;
    snapEnabled: boolean;
    onToggleSnap: () => void;
    // Primitives
    onAddPrimitive: (type: PrimitiveType) => void;
    // Scene
    selectedId: string | null;
    onDuplicate: () => void;
    onMirror: () => void;
    onToggleVisibility: () => void;
    onToggleLock: () => void;
    selectedVisible?: boolean;
    selectedLocked?: boolean;
    // History
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    measureMode: boolean;
    onToggleMeasure: () => void;
    // New tools
    onGroup?: () => void;
    onAlign?: (axis: 'center' | 'x' | 'y' | 'z') => void;
    sceneObjectCount?: number;
    onHollow?: () => void;
    onExplode?: () => void;
    // Bounding Box
    showBoundingBoxes: boolean;
    onToggleBoundingBoxes: () => void;
    // Environment
    bgEnvironment: string;
    onBgEnvironment: (env: string) => void;
}

// ─── Tiny toolbar button ────────────────────────────────
function TBtn({
    icon,
    label,
    active = false,
    disabled = false,
    danger = false,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    disabled?: boolean;
    danger?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={label}
            className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                disabled && 'opacity-30 cursor-not-allowed',
                active && !danger && 'bg-brand-cyan/20 text-brand-cyan ring-1 ring-brand-cyan/30',
                danger && active && 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30',
                !active && !disabled && 'text-gray-400 hover:bg-white/10 hover:text-white',
            )}
        >
            {icon}
        </button>
    );
}

function Divider() {
    return <div className="mx-0.5 h-5 w-px bg-white/10" />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <span className="text-[8px] uppercase tracking-[0.2em] text-gray-500 px-1">
            {children}
        </span>
    );
}

// ─── Main ───────────────────────────────────────────────
export function ViewportToolbar({
    onCameraPreset,
    isOrthographic,
    onToggleOrthographic,
    displayMode,
    onDisplayMode,
    showGrid,
    onToggleGrid,
    showAxes,
    onToggleAxes,
    transformMode,
    onTransformMode,
    snapEnabled,
    onToggleSnap,
    onAddPrimitive,
    selectedId,
    onDuplicate,
    onMirror,
    onToggleVisibility,
    onToggleLock,
    selectedVisible = true,
    selectedLocked = false,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    measureMode,
    onToggleMeasure,
    showBoundingBoxes,
    onToggleBoundingBoxes,
    onGroup,
    onAlign,
    sceneObjectCount = 0,
    onHollow,
    onExplode,
    bgEnvironment,
    onBgEnvironment,
}: ToolbarProps) {
    const [showPrimitives, setShowPrimitives] = React.useState(false);

    return (
        <div className="pointer-events-auto absolute left-3 top-3 z-30 flex flex-col gap-1.5">
            {/* ── Camera Views ── */}
            <div className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-black/70 px-1.5 py-1 backdrop-blur-md">
                <SectionLabel>View</SectionLabel>
                <TBtn icon={<ArrowUp className="h-3.5 w-3.5" />} label="Top View" onClick={() => onCameraPreset('top')} />
                <TBtn icon={<Square className="h-3.5 w-3.5" />} label="Front View" onClick={() => onCameraPreset('front')} />
                <TBtn icon={<Layers className="h-3.5 w-3.5" />} label="Side View" onClick={() => onCameraPreset('side')} />
                <Divider />
                <TBtn icon={<Crosshair className="h-3.5 w-3.5" />} label="Reset View" onClick={() => onCameraPreset('reset')} />
                <TBtn icon={<Focus className="h-3.5 w-3.5" />} label="Focus on Object" onClick={() => onCameraPreset('focus')} disabled={!selectedId} />
                <TBtn icon={<Maximize2 className="h-3.5 w-3.5" />} label="Fit to Screen" onClick={() => onCameraPreset('fit')} />
                <Divider />
                <TBtn icon={<Box className="h-3.5 w-3.5" />} label={isOrthographic ? "Perspective" : "Orthographic"} active={isOrthographic} onClick={onToggleOrthographic} />
            </div>

            {/* ── Transform Tools ── */}
            <div className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-black/70 px-1.5 py-1 backdrop-blur-md">
                <SectionLabel>Transform</SectionLabel>
                <TBtn icon={<Move className="h-3.5 w-3.5" />} label="Move" active={transformMode === 'translate'} onClick={() => onTransformMode('translate')} />
                <TBtn icon={<Rotate3d className="h-3.5 w-3.5" />} label="Rotate" active={transformMode === 'rotate'} onClick={() => onTransformMode('rotate')} />
                <TBtn icon={<Maximize className="h-3.5 w-3.5" />} label="Scale" active={transformMode === 'scale'} onClick={() => onTransformMode('scale')} />
                <Divider />
                <TBtn icon={<Grid3x3 className="h-3.5 w-3.5" />} label="Grid Snap" active={snapEnabled} onClick={onToggleSnap} />
            </div>

            {/* ── Display ── */}
            <div className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-black/70 px-1.5 py-1 backdrop-blur-md">
                <SectionLabel>Display</SectionLabel>
                <TBtn icon={<Box className="h-3.5 w-3.5" />} label="Solid" active={displayMode === 'solid'} onClick={() => onDisplayMode('solid')} />
                <TBtn icon={<PencilRuler className="h-3.5 w-3.5" />} label="Wireframe" active={displayMode === 'wireframe'} onClick={() => onDisplayMode('wireframe')} />
                <TBtn icon={<Eye className="h-3.5 w-3.5" />} label="X-Ray" active={displayMode === 'xray'} onClick={() => onDisplayMode('xray')} />
                <Divider />
                <TBtn icon={<Grid3x3 className="h-3.5 w-3.5" />} label="Grid" active={showGrid} onClick={onToggleGrid} />
                <TBtn icon={<Compass className="h-3.5 w-3.5" />} label="Axes" active={showAxes} onClick={onToggleAxes} />
                <TBtn icon={<Maximize2 className="h-3.5 w-3.5" />} label="Bounding Boxes" active={showBoundingBoxes} onClick={onToggleBoundingBoxes} />
                <Divider />
                <TBtn icon={<Sun className="h-3.5 w-3.5" />} label={`Environment: ${bgEnvironment}`} onClick={() => {
                    const envs = ['studio', 'city', 'sunset', 'warehouse', 'dawn', 'apartment'];
                    const next = envs[(envs.indexOf(bgEnvironment) + 1) % envs.length];
                    onBgEnvironment(next);
                }} />
            </div>

            {/* ── Primitives ── */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-black/70 px-1.5 py-1 backdrop-blur-md">
                    <SectionLabel>Add</SectionLabel>
                    <TBtn icon={<Box className="h-3.5 w-3.5" />} label="Add Primitive" active={showPrimitives} onClick={() => setShowPrimitives(!showPrimitives)} />
                </div>
                {showPrimitives && (
                    <div className="flex items-center gap-0.5 rounded-xl border border-brand-cyan/20 bg-black/80 px-1.5 py-1 backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-200">
                        <TBtn icon={<Box className="h-3.5 w-3.5" />} label="Cube" onClick={() => { onAddPrimitive('cube'); setShowPrimitives(false); }} />
                        <TBtn icon={<Circle className="h-3.5 w-3.5" />} label="Sphere" onClick={() => { onAddPrimitive('sphere'); setShowPrimitives(false); }} />
                        <TBtn icon={<Cylinder className="h-3.5 w-3.5" />} label="Cylinder" onClick={() => { onAddPrimitive('cylinder'); setShowPrimitives(false); }} />
                        <TBtn icon={<Triangle className="h-3.5 w-3.5" />} label="Cone" onClick={() => { onAddPrimitive('cone'); setShowPrimitives(false); }} />
                        <TBtn icon={<Square className="h-3.5 w-3.5" />} label="Plane" onClick={() => { onAddPrimitive('plane'); setShowPrimitives(false); }} />
                        <TBtn icon={<CircleDot className="h-3.5 w-3.5" />} label="Torus" onClick={() => { onAddPrimitive('torus'); setShowPrimitives(false); }} />
                    </div>
                )}
            </div>

            {/* ── Scene Object Tools ── */}
            <div className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-black/70 px-1.5 py-1 backdrop-blur-md">
                <SectionLabel>Object</SectionLabel>
                <TBtn icon={<Copy className="h-3.5 w-3.5" />} label="Duplicate" disabled={!selectedId} onClick={onDuplicate} />
                <TBtn icon={<FlipHorizontal2 className="h-3.5 w-3.5" />} label="Mirror" disabled={!selectedId} onClick={onMirror} />
                <TBtn icon={selectedVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} label={selectedVisible ? "Hide" : "Show"} disabled={!selectedId} onClick={onToggleVisibility} />
                <TBtn icon={selectedLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />} label={selectedLocked ? "Unlock" : "Lock"} disabled={!selectedId} active={selectedLocked} onClick={onToggleLock} />
                <Divider />
                <TBtn icon={<AlignCenter className="h-3.5 w-3.5" />} label="Center Object" disabled={!selectedId} onClick={() => onAlign?.('center')} />
                {onGroup && (
                    <TBtn icon={<Layers className="h-3.5 w-3.5" />} label="Group Objects" disabled={!selectedId || sceneObjectCount < 2} onClick={onGroup} />
                )}
                <Divider />
                {onHollow && (
                    <TBtn icon={<MinusSquare className="h-3.5 w-3.5" />} label="Hollow (Shell)" disabled={!selectedId} onClick={onHollow} />
                )}
                {onExplode && (
                    <TBtn icon={<Sparkles className="h-3.5 w-3.5" />} label="Explode" disabled={!selectedId} onClick={onExplode} />
                )}
            </div>

            {/* ── History + Measure ── */}
            <div className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-black/70 px-1.5 py-1 backdrop-blur-md">
                <SectionLabel>History</SectionLabel>
                <TBtn icon={<RotateCcw className="h-3.5 w-3.5" />} label="Undo" disabled={!canUndo} onClick={onUndo} />
                <TBtn icon={<Redo2 className="h-3.5 w-3.5" />} label="Redo" disabled={!canRedo} onClick={onRedo} />
                <Divider />
                <TBtn icon={<Ruler className="h-3.5 w-3.5" />} label="Measure" active={measureMode} onClick={onToggleMeasure} />
            </div>
        </div>
    );
}
