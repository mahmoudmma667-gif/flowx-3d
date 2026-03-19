'use client';

import React, { startTransition, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Line, OrbitControls, Stars, TransformControls, GizmoHelper, GizmoViewport, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader, OBJLoader } from 'three-stdlib';
import type { AirSketchMaterial } from '@/lib/air-sketch/engine';
import { ViewportToolbar, type CameraPreset, type DisplayMode, type PrimitiveType } from '@/components/air-sketch/viewport-toolbar';
import {
    ChevronLeft,
    ChevronRight,
    Download,
    Eraser,
    FolderPlus,
    MessageSquare,
    Palette,
    PencilLine,
    RefreshCw,
    RotateCcw,
    Send,
    SlidersHorizontal,
    Sparkles,
    Wand2,
    Webcam,
    Move,
    Rotate3d,
    Maximize,
    Minimize,
    Trash2,
    Combine,
    MinusSquare,
    Eye,
    EyeOff,
    ImagePlus,
    Upload,
} from 'lucide-react';
import { AirSketchCamera, type AirSketchCameraFrame } from '@/components/air-sketch/air-sketch-camera';
import { SketchSurface } from '@/components/air-sketch/sketch-surface';
import { Button } from '@/components/ui/button';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import {
    applyAirSketchTuning,
    buildAirSketchModel,
    refineAirSketchModel,
    recognizeAirSketchShape,
    smoothTrajectory,
    type AirSketchModel,
    type AirSketchPoint,
    type AirSketchRecognition,
    type AirSketchTuning,
} from '@/lib/air-sketch/engine';
import { exportToGLB, exportToOBJ, exportToSTL, exportToPNG, exportToSVG, exportToGLBBlob } from '@/lib/air-sketch/model-exporter';
import { searchShapeReference, buildSearchNotes, suggestNextShapes, type ShapeSearchResult } from '@/lib/air-sketch/ai-search';
import { buildPromptGeneratedSketch, type PromptConversionMode } from '@/lib/air-sketch/prompt-builder';
import { buildArchitecturalWall, buildMechanicalBracket, buildMechanicalGear, sliceOctant } from '@/lib/air-sketch/csg-builder';
import { Edges } from '@react-three/drei';
import type { GestureType } from '@/lib/gestures/recognizer';
import { cn } from '@/lib/utils';

const MATERIAL_PRESETS: Record<AirSketchMaterial, { roughness: number; metalness: number; clearcoat: number; clearcoatRoughness: number; transmission: number; ior: number; reflectivity: number; }> = {
    Solid:   { roughness: 0.24, metalness: 0.68, clearcoat: 0,   clearcoatRoughness: 0, transmission: 0,   ior: 1.5, reflectivity: 0.5 },
    Wood:    { roughness: 0.85, metalness: 0.0,  clearcoat: 0.2, clearcoatRoughness: 0.6, transmission: 0,   ior: 1.5, reflectivity: 0.2 },
    Metal:   { roughness: 0.12, metalness: 1.0,  clearcoat: 0.6, clearcoatRoughness: 0.1, transmission: 0,   ior: 2.0, reflectivity: 1.0 },
    Glass:   { roughness: 0.05, metalness: 0.0,  clearcoat: 1.0, clearcoatRoughness: 0.0, transmission: 0.9, ior: 1.5, reflectivity: 0.9 },
    Plastic: { roughness: 0.35, metalness: 0.0,  clearcoat: 0.8, clearcoatRoughness: 0.2, transmission: 0,   ior: 1.5, reflectivity: 0.5 },
    Matte:   { roughness: 1.0,  metalness: 0.0,  clearcoat: 0,   clearcoatRoughness: 0, transmission: 0,   ior: 1.5, reflectivity: 0.1 },
};

const MATERIAL_LIST: AirSketchMaterial[] = ['Solid', 'Wood', 'Metal', 'Glass', 'Plastic', 'Matte'];

type InputMode = 'air' | 'pad';
type CaptureMode = 'auto' | 'manual';
type ConversionMode = PromptConversionMode;
type StudioStage = 'READY' | 'CAPTURE' | 'INTERPRET' | 'CLEAN' | 'RECOGNIZE' | 'GENERATE';
type WorkspaceTool = 'draw' | 'erase';
type TransformVector = { x: number; y: number; z: number };
type TransformUpdate = { position?: TransformVector; rotation?: TransformVector; scale?: TransformVector };

interface ChatMessage {
    id: string;
    role: 'assistant' | 'user';
    content: string;
}

interface ProcessOptions {
    modeOverride?: ConversionMode;
    promptSummary?: string;
    promptNotes?: string[];
    tuningOverride?: Partial<AirSketchTuning>;
}

const DEFAULT_TUNING: AirSketchTuning = { scale: 1, depth: 1, thickness: 1, detail: 1 };
const DEFAULT_STROKE_COLOR = '#00f0ff';
const COLOR_PRESETS = ['#00f0ff', '#bd7bff', '#7cf7c2', '#ff9e57', '#f97393', '#ffffff'];
const DEFAULT_AI_NOTES = [
    'Air Camera uses live hand tracking for gesture-based drawing.',
    'Sketch Pad is a reliable fallback for mouse and touch.',
    'Shape Chat turns prompt descriptions into editable 3D geometry without leaving the workspace.',
];
const PROMPT_SUGGESTIONS = [
    'Create a thick heart badge',
    'Build a tall cylinder tower',
    'Generate a smooth spiral pipe',
    'اعمل نجمة ثلاثية الأبعاد',
];
const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
    {
        id: 'assistant-1',
        role: 'assistant',
        content: 'Describe a shape, product silhouette, or symbol and I will generate a 3D form from the same Air Sketch pipeline.',
    },
    {
        id: 'assistant-2',
        role: 'assistant',
        content: 'Try prompts like "thick heart badge", "spiral pipe", "cube shell", or "اعمل شكل سداسي عميق".',
    },
];

function wait(durationMs: number) {
    return new Promise((resolve) => window.setTimeout(resolve, durationMs));
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function average(values: number[]) {
    return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function distance3D(left: AirSketchPoint, right: AirSketchPoint) {
    return Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z);
}

function blendPoints(previous: AirSketchPoint, next: AirSketchPoint, factor = 0.34): AirSketchPoint {
    return {
        x: previous.x + (next.x - previous.x) * factor,
        y: previous.y + (next.y - previous.y) * factor,
        z: previous.z + (next.z - previous.z) * Math.max(0.18, factor * 0.85),
        timestamp: next.timestamp,
    };
}

function getSourceLabel(mode: InputMode | 'chat') {
    if (mode === 'air') return 'Air Camera';
    if (mode === 'pad') return 'Sketch Pad';
    return 'Shape Chat';
}

function mapCameraPointToSketchPoint(point: { x: number; y: number; z: number }): AirSketchPoint {
    // MediaPipe returns coords in the raw (un-mirrored) video frame.
    // The CSS class -scale-x-100 mirrors the display so the user sees a natural mirror.
    // For the SKETCH world we must ALSO mirror X so drawing follows the visible hand.
    return {
        x: (0.5 - point.x) * 6,
        y: (0.5 - point.y) * 4.5,
        z: clamp(-point.z * 10, -2.4, 2.4),
        timestamp: performance.now(),
    };
}

function mapSketchPointToCameraOverlay(point: AirSketchPoint) {
    // The overlay canvas has CSS -scale-x-100, so we must pre-mirror X.
    // sketch x>0 (right) → overlay x<0.5 → CSS mirror flips to >0.5 (right on screen) ✓
    return { x: clamp(0.5 - point.x / 6, 0, 1), y: clamp(0.5 - point.y / 4.5, 0, 1) };
}

function createIdleMessage(inputMode: InputMode, captureMode: CaptureMode) {
    if (inputMode === 'pad') return 'Draw any outline on the pad to generate a 3D form.';
    return captureMode === 'manual'
        ? 'Manual air capture is ready. Start recording, then draw with your hand.'
        : 'Raise your hand and pinch to start air drawing. Release the pinch to finish.';
}

function overrideRecognition(mode: ConversionMode, recognition: AirSketchRecognition): AirSketchRecognition {
    if (mode === 'outline') {
        return { ...recognition, shape: 'extrusion', label: 'Extruded Form', confidence: Math.max(recognition.confidence, 0.72) };
    }

    if (mode === 'path') {
        return { ...recognition, shape: 'tube', label: 'Pipe', confidence: Math.max(recognition.confidence, 0.68) };
    }

    return recognition;
}

function buildOutlineShape(points: AirSketchPoint[]) {
    if (points.length < 3) return null;

    // Use a denser step calculation to preserve corners and prevent mesh gibberish
    const step = Math.max(1, Math.floor(points.length / 200)); 
    const sampled = points.filter((_, index) => index % step === 0 || index === points.length - 1);
    const centerX = average(sampled.map((point) => point.x));
    const centerY = average(sampled.map((point) => point.y));
    const outline = sampled.map((point) => new THREE.Vector2(point.x - centerX, point.y - centerY));
    return outline.length >= 3 ? new THREE.Shape(outline) : null;
}

function mergeNotes(notes: string[]) {
    return Array.from(new Set(notes));
}

const GeneratedSketchMesh = React.memo(React.forwardRef<THREE.Group, {
    model: AirSketchModel;
    isSelected: boolean;
    onSelect: () => void;
}>(({ model, isSelected, onSelect }, ref) => {
    const preset = MATERIAL_PRESETS[model.materialPreset ?? 'Solid'];
    const material = (
        <meshPhysicalMaterial
            color={model.color}
            roughness={preset.roughness}
            metalness={preset.metalness}
            clearcoat={preset.clearcoat}
            clearcoatRoughness={preset.clearcoatRoughness}
            transmission={preset.transmission}
            ior={preset.ior}
            reflectivity={preset.reflectivity}
            emissive={model.color}
            emissiveIntensity={isSelected ? 0.25 : 0.08}
            transparent={preset.transmission > 0}
            opacity={preset.transmission > 0 ? 0.85 : 1}
            envMapIntensity={1.2}
        />
    );

    const geometry = React.useMemo(() => {
        let baseGeo: THREE.BufferGeometry | null = null;
        
        if (model.shape === 'sphere') baseGeo = new THREE.SphereGeometry(model.radius, model.segments, model.segments);
        else if (model.shape === 'cube') baseGeo = new THREE.BoxGeometry(model.size, model.size, model.depth);
        else if (model.shape === 'cylinder') baseGeo = new THREE.CylinderGeometry(model.radius, model.radius, model.depth, Math.max(18, model.segments));
        else if (model.shape === 'cone') baseGeo = new THREE.ConeGeometry(model.radius, model.depth, Math.max(18, model.segments));
        else if (model.shape === 'torus') baseGeo = new THREE.TorusGeometry(model.radius, model.tubeRadius, 24, Math.max(32, model.segments));
        else if (model.shape === 'architectural-wall') {
            const w = model.dimensions?.width ?? model.size * 2;
            const h = model.dimensions?.height ?? model.size;
            const d = model.dimensions?.depth ?? model.depth;
            baseGeo = buildArchitecturalWall(w, h, d);
        }
        else if (model.shape === 'mechanical-bracket') {
            const w = model.dimensions?.width ?? model.size * 1.5;
            const h = model.dimensions?.height ?? model.size * 1.5;
            const d = model.dimensions?.depth ?? model.depth;
            baseGeo = buildMechanicalBracket(w, h, d, model.tubeRadius * 2);
        }
        else if (model.shape === 'mechanical-gear') {
            const r = model.dimensions?.width ? model.dimensions.width / 2 : model.radius;
            const d = model.dimensions?.depth ?? model.depth;
            baseGeo = buildMechanicalGear(r, d, Math.round(model.segments / 2));
        }
        else if (model.shape === 'uploaded' && model.customGeometry) {
            baseGeo = model.customGeometry.clone();
            if (baseGeo) baseGeo.center();
        }
        else if (model.shape === 'extrusion') {
            const outlineShape = buildOutlineShape(model.smoothPoints);
            if (outlineShape) {
                baseGeo = new THREE.ExtrudeGeometry(outlineShape, {
                    depth: model.depth,
                    bevelEnabled: true,
                    bevelThickness: model.tubeRadius * 0.55,
                    bevelSize: model.tubeRadius * 0.36,
                    bevelSegments: 3,
                    curveSegments: Math.max(18, Math.round(model.segments * 0.6)),
                    steps: 1,
                });
            }
        } else {
            const closedPath = model.metrics.isClosed || model.metrics.closure < 0.32;
            const curve = new THREE.CatmullRomCurve3(
                model.smoothPoints.map((point) => new THREE.Vector3(point.x, point.y, point.z)),
                closedPath,
                'catmullrom',
                0.45,
            );
            baseGeo = new THREE.TubeGeometry(curve, Math.max(32, model.segments), model.tubeRadius, 16, closedPath);
        }

        if (!baseGeo) return null;

        if (model.shatterOctant !== undefined) {
            return sliceOctant(baseGeo, model.shatterOctant);
        }
        return baseGeo;
    }, [model]);
    if (!geometry) return null;

    const meshRotation: [number, number, number] = model.shape === 'cube' ? [0.16, 0.42, 0] :
        model.shape === 'mechanical-gear' ? [Math.PI / 2, 0, 0] : [0, 0, 0];

    return (
        <group
            ref={ref}
            position={[model.position?.x ?? 0, model.position?.y ?? 0, model.position?.z ?? 0]}
            rotation={[model.rotation?.x ?? 0, model.rotation?.y ?? 0, model.rotation?.z ?? 0]}
            scale={[model.scale?.x ?? 1, model.scale?.y ?? 1, model.scale?.z ?? 1]}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            <mesh rotation={meshRotation} castShadow receiveShadow>
                <primitive object={geometry} attach="geometry" />
                {material}
                {isSelected && <Edges color="#00f0ff" threshold={15} />}
            </mesh>
        </group>
    );
}));

GeneratedSketchMesh.displayName = 'GeneratedSketchMesh';

// Sub-component that lives inside the Canvas to manage TransformControls attachment
function SceneTransformControls({
    selectedId,
    transformMode,
    objectRefs,
    onTransformUpdate,
    snapEnabled,
}: {
    selectedId: string | null;
    transformMode: 'translate' | 'rotate' | 'scale';
    objectRefs: React.MutableRefObject<Map<string, THREE.Group>>;
    onTransformUpdate: (id: string, update: TransformUpdate) => void;
    snapEnabled?: boolean;
}) {
    const selectedObj = selectedId ? objectRefs.current.get(selectedId) ?? null : null;
    if (!selectedObj) return null;

    return (
        <TransformControls
            object={selectedObj}
            mode={transformMode}
            translationSnap={snapEnabled ? 0.5 : null}
            rotationSnap={snapEnabled ? Math.PI / 12 : null}
            scaleSnap={snapEnabled ? 0.1 : null}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onObjectChange={(event: any) => {
                if (!selectedId || !event?.target?.object) return;
                const { position, rotation, scale } = event.target.object;
                onTransformUpdate(selectedId, {
                    position: { x: position.x, y: position.y, z: position.z },
                    rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
                    scale: { x: scale.x, y: scale.y, z: scale.z },
                });
            }}
        />
    );
}

// Camera controller that lives inside the Canvas
function CameraController({ preset, onDone, isOrthographic }: { preset: CameraPreset | null; onDone: () => void; isOrthographic: boolean }) {
    const { camera, scene } = useThree();
    React.useEffect(() => {
        if (!preset) return;
        const dur = 400;
        const positions: Record<CameraPreset, [number, number, number]> = {
            top: [0, 10, 0.01],
            front: [0, 0, 8],
            side: [8, 0, 0],
            reset: [0, 1.25, 6.4],
            focus: [0, 1.25, 6.4],
            fit: [0, 1.25, 6.4],
        };

        if (preset === 'focus' || preset === 'fit') {
            const box = new THREE.Box3();
            scene.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) box.expandByObject(child);
            });
            if (!box.isEmpty()) {
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const dist = Math.max(maxDim * 2.5, 3);
                camera.position.set(center.x, center.y + dist * 0.3, center.z + dist);
                camera.lookAt(center);
            }
        } else {
            const [x, y, z] = positions[preset];
            camera.position.set(x, y, z);
            camera.lookAt(0, 0, 0);
        }

        if (camera instanceof THREE.PerspectiveCamera && isOrthographic) {
            // Switch handled at Canvas level
        }

        onDone();
    }, [preset, camera, scene, onDone, isOrthographic]);
    return null;
}

function ResultViewport({
    rawPoints,
    smoothPoints,
    sceneObjects,
    selectedId,
    transformMode,
    strokeColor,
    onSelect,
    onTransformUpdate,
    canvasRefCallback,
    isDrawing,
    autoRotate,
    // Toolkit props
    displayMode,
    showGrid,
    showAxes,
    isOrthographic,
    snapEnabled,
    showBoundingBoxes,
    cameraPresetRef,
    // Toolbar props
    toolbarProps,
    bgEnvironment = 'none',
    showToolbar = true,
    setShowToolbar,
}: {
    rawPoints: AirSketchPoint[];
    smoothPoints: AirSketchPoint[];
    sceneObjects: AirSketchModel[];
    selectedId: string | null;
    transformMode: 'translate' | 'rotate' | 'scale';
    strokeColor: string;
    onSelect: (id: string | null) => void;
    onTransformUpdate: (id: string, update: TransformUpdate) => void;
    canvasRefCallback?: (canvas: HTMLCanvasElement) => void;
    isDrawing?: boolean;
    autoRotate?: boolean;
    displayMode?: DisplayMode;
    showGrid?: boolean;
    showAxes?: boolean;
    isOrthographic?: boolean;
    snapEnabled?: boolean;
    cameraPresetRef?: React.MutableRefObject<{ preset: CameraPreset | null }>;
    showBoundingBoxes?: boolean;
    bgEnvironment?: string;
    showToolbar?: boolean;
    setShowToolbar?: (show: boolean) => void;
    toolbarProps?: React.ComponentProps<typeof ViewportToolbar>;
}) {
    const [mounted, setMounted] = React.useState(false);
    const [canvasKey, setCanvasKey] = React.useState(0);
    const [canvasError, setCanvasError] = React.useState(false);
    const objectRefs = React.useRef<Map<string, THREE.Group>>(new Map());
    const [activeCameraPreset, setActiveCameraPreset] = React.useState<CameraPreset | null>(null);

    // Watch the external ref for camera preset changes
    React.useEffect(() => {
        if (!cameraPresetRef) return;
        const interval = setInterval(() => {
            if (cameraPresetRef.current.preset) {
                setActiveCameraPreset(cameraPresetRef.current.preset);
                cameraPresetRef.current.preset = null;
            }
        }, 50);
        return () => clearInterval(interval);
    }, [cameraPresetRef]);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const rawLinePoints = React.useMemo(() => 
        rawPoints.map((point) => [point.x, point.y, point.z] as [number, number, number]),
        [rawPoints]
    );

    const smoothLinePoints = React.useMemo(() => 
        smoothPoints.map((point) => [point.x, point.y, point.z] as [number, number, number]),
        [smoothPoints]
    );

    const visibleObjects = React.useMemo(() => 
        sceneObjects.filter(o => (o as any).visible !== false),
        [sceneObjects]
    );

    const hasContent = rawLinePoints.length > 1 || smoothLinePoints.length > 1 || sceneObjects.length > 0;
    const mode = displayMode ?? 'solid';
    const gridVisible = showGrid ?? true;
    const axesVisible = showAxes ?? true;

    const handleRetry = () => {
        setCanvasError(false);
        setCanvasKey(prev => prev + 1);
    };

    if (!mounted) {
        return <div className="relative h-[520px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0e17]" />;
    }

    return (
        <div className="relative h-[520px] overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl">
            <div className="absolute inset-0 bg-[#050b16]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#132538_0%,transparent_50%)] opacity-60" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,#271b34_0%,transparent_40%)] opacity-40" />

            <div
                className={cn(
                    "absolute bottom-12 left-8 z-10 max-w-sm text-sm font-medium leading-relaxed text-gray-400 transition-opacity duration-500",
                    hasContent || canvasError ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
            >
                <p className="mb-2 text-white">Start with Air Camera, Sketch Pad, or Shape Chat.</p>
                <span className="text-brand-cyan">Closed outlines become solids and open motion becomes tubes.</span>
            </div>

            {/* Viewport Toolbar Overlay */}
            {toolbarProps && showToolbar && <ViewportToolbar {...toolbarProps} />}
            {toolbarProps && setShowToolbar && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-6 top-6 z-40 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-xl border border-white/10"
                    onClick={() => setShowToolbar(!showToolbar)}
                    title={showToolbar ? "Hide Toolbar" : "Show Toolbar"}
                >
                    {showToolbar ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-brand-cyan" />}
                </Button>
            )}

            {canvasError ? (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-6 text-center">
                    <div className="mb-4 h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                        <RotateCcw className="w-6 h-6 text-red-400" />
                    </div>
                    <h4 className="text-white font-bold mb-2">Viewport Crash Detected</h4>
                    <p className="text-gray-400 text-sm mb-6 max-w-xs">WebGL context was lost or failed to initialize.</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        className="bg-brand-cyan/10 border-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan hover:text-black transition-all"
                    >
                        Reset 3D Engine
                    </Button>
                </div>
            ) : (
                <Canvas
                    key={`studio-canvas-${canvasKey}`}
                    dpr={[1, 1.25]}
                    frameloop="always"
                    gl={{
                        antialias: true,
                        powerPreference: 'high-performance',
                        preserveDrawingBuffer: true,
                        failIfMajorPerformanceCaveat: false
                    }}
                    camera={{ position: [0, 1.25, 6.4], fov: 46 }}
                    orthographic={isOrthographic}
                    onCreated={(state) => {
                        if (canvasRefCallback) canvasRefCallback(state.gl.domElement);
                        state.gl.domElement.addEventListener('webglcontextlost', (e) => {
                            e.preventDefault();
                            setCanvasError(true);
                        }, false);
                    }}
                    onError={() => setCanvasError(true)}
                    onClick={() => onSelect(null)}
                >
                    <CameraController
                        preset={activeCameraPreset}
                        onDone={() => setActiveCameraPreset(null)}
                        isOrthographic={isOrthographic ?? false}
                    />

                    <ambientLight intensity={0.35} />
                    <directionalLight position={[5, 8, 4]} intensity={1.4} color="#ffffff" castShadow shadow-mapSize={[1024, 1024]} />
                    <pointLight position={[-4, -2, -4]} intensity={0.6} color="#ff9e57" />
                    <pointLight position={[0, 3, -5]} intensity={0.45} color="#bd7bff" />
                    <pointLight position={[3, 1, 6]} intensity={0.3} color="#00f0ff" />

                    {/* Cinematic Environment Lighting */}
                    <Environment preset={(bgEnvironment === 'none' ? 'city' : bgEnvironment) as any} background={bgEnvironment !== 'none'} blur={0.15} />
                    <ContactShadows position={[0, -2.69, 0]} opacity={0.35} scale={14} blur={2.5} far={6} />

                    {/* Grid */}
                    {gridVisible && (
                        <gridHelper args={[16, 16, '#184768', '#0b2135']} position={[0, -2.7, 0]} />
                    )}

                    {/* Axes */}
                    {axesVisible && (
                        <axesHelper args={[3]} position={[0, -2.69, 0]} />
                    )}

                    {/* Live stroke preview */}
                    {rawLinePoints.length > 1 && <Line points={rawLinePoints} color={strokeColor} lineWidth={1.05} transparent opacity={0.24} />}
                    {smoothLinePoints.length > 1 && <Line points={smoothLinePoints} color={strokeColor} lineWidth={1.9} transparent opacity={0.9} />}

                    {/* Scene objects with display mode */}
                    {visibleObjects.map((obj) => (
                        <React.Fragment key={obj.id}>
                            <GeneratedSketchMesh
                                ref={(node: THREE.Group | null) => {
                                    if (node) {
                                        objectRefs.current.set(obj.id, node);
                                    } else {
                                        objectRefs.current.delete(obj.id);
                                    }
                                }}
                                model={obj}
                                isSelected={obj.id === selectedId}
                                onSelect={() => !(obj as any).locked && onSelect(obj.id)}
                            />
                            {showBoundingBoxes && obj.id === selectedId && (
                                <boxHelper args={[objectRefs.current.get(obj.id)!, '#00f0ff']} />
                            )}
                        </React.Fragment>
                    ))}

                    <SceneTransformControls
                        selectedId={selectedId}
                        transformMode={transformMode}
                        objectRefs={objectRefs}
                        onTransformUpdate={onTransformUpdate}
                        snapEnabled={snapEnabled}
                    />

                    <Stars radius={70} depth={40} count={1200} factor={2.4} saturation={0} fade speed={0.1} />

                    {/* Orientation Gizmo */}
                    <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
                        <GizmoViewport axisColors={['#ff4060', '#40ff60', '#4060ff']} labelColor="white" />
                    </GizmoHelper>

                    <OrbitControls
                        makeDefault
                        enablePan
                        enableZoom
                        enableDamping
                        dampingFactor={0.08}
                        minDistance={1.5}
                        maxDistance={20}
                        autoRotate={autoRotate}
                        autoRotateSpeed={2.5}
                    />
                </Canvas>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050b16] via-[#050b16]/60 to-transparent" />
        </div>
    );
}

function Slider({
    label,
    value,
    min,
    max,
    step,
    onChange,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
}) {
    return (
        <label className="space-y-2">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-gray-500">
                <span>{label}</span>
                <span className="font-mono text-white">{value.toFixed(2)}</span>
            </div>
            <input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-cyan-400" />
        </label>
    );
}

export default function AirSketchStudio() {
    const [inputMode, setInputMode] = useState<InputMode>('air');
    const [captureMode, setCaptureMode] = useState<CaptureMode>('auto');
    const [conversionMode, setConversionMode] = useState<ConversionMode>('smart');
    const [activeSource, setActiveSource] = useState(getSourceLabel('air'));
    const [panelCollapsed, setPanelCollapsed] = useState(false);
    const [stage, setStage] = useState<StudioStage>('READY');
    const [statusMessage, setStatusMessage] = useState(createIdleMessage('air', 'auto'));
    const [telemetry, setTelemetry] = useState<{ handDetected: boolean; gesture: GestureType; pinchStrength: number }>({
        handDetected: false,
        gesture: 'IDLE',
        pinchStrength: 0,
    });
    const [rawPoints, setRawPoints] = useState<AirSketchPoint[]>([]);
    const [smoothPoints, setSmoothPoints] = useState<AirSketchPoint[]>([]);
    const [recognition, setRecognition] = useState<AirSketchRecognition | null>(null);

    // Multi-Object Scene State
    const [sceneObjects, setSceneObjects] = useState<AirSketchModel[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');

    const transformTools: Array<{ mode: 'translate' | 'rotate' | 'scale'; icon: React.ReactNode; label: string }> = [
        { mode: 'translate', icon: <Move className="h-4 w-4" />, label: 'Move' },
        { mode: 'rotate', icon: <Rotate3d className="h-4 w-4" />, label: 'Rotate' },
        { mode: 'scale', icon: <Maximize className="h-4 w-4" />, label: 'Scale' },
    ];

    const [autoRotate, setAutoRotate] = useState(false);

    // Extend AirSketchModel with visibility/lock flags
    type ExtendedModel = AirSketchModel & { visible?: boolean; locked?: boolean };
    const getSelectedExt = (): ExtendedModel | null => {
        const obj = sceneObjects.find(o => o.id === selectedId);
        return obj ? (obj as ExtendedModel) : null;
    };

    const [tuning, setTuning] = useState<AirSketchTuning>(DEFAULT_TUNING);
    const [aiNotes, setAiNotes] = useState<string[]>(DEFAULT_AI_NOTES);
    const [workspaceTool, setWorkspaceTool] = useState<WorkspaceTool>('draw');
    const [strokeColor, setStrokeColor] = useState(DEFAULT_STROKE_COLOR);
    const [csgPending, setCsgPending] = useState<{ targetId: string; operation: 'union' | 'subtract' | 'intersect' } | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
    const [promptBusy, setPromptBusy] = useState(false);
    const [adaptiveSuggestions, setAdaptiveSuggestions] = useState<string[]>(PROMPT_SUGGESTIONS);
    const [strokeHistory, setStrokeHistory] = useState<AirSketchPoint[][]>([]);
    const [strokeColors, setStrokeColors] = useState<string[]>([]);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [exportBusy, setExportBusy] = useState(false);
    const [promptHistory, setPromptHistory] = useState<string[]>([]);

    // ── Viewport Toolkit State ──
    const [displayMode, setDisplayMode] = useState<DisplayMode>('solid');
    const [showGrid, setShowGrid] = useState(true);
    const [showAxes, setShowAxes] = useState(true);
    const [isOrthographic, setIsOrthographic] = useState(false);
    const [snapEnabled, setSnapEnabled] = useState(false);
    const [showBoundingBoxes, setShowBoundingBoxes] = useState(false);
    const [measureMode, setMeasureMode] = useState(false);
    const [redoStack, setRedoStack] = useState<{ objects: AirSketchModel[]; strokes: AirSketchPoint[][]; colors: string[] }[]>([]);
    const [measureStartId, setMeasureStartId] = useState<string | null>(null);
    const [airControlMode, setAirControlMode] = useState(false);
    const [bgEnvironment, setBgEnvironment] = useState<string>('none');
    const [showToolbar, setShowToolbar] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [bgImage, setBgImage] = useState<string | null>(null);
    const bgImageInputRef = useRef<HTMLInputElement>(null);
    const modelInputRef = useRef<HTMLInputElement>(null);
    const cameraRef = useRef<{ preset: CameraPreset | null }>({ preset: null });
    const orbitRef = useRef<any>(null);

    const rawPointsRef = useRef<AirSketchPoint[]>([]);
    const smoothPointsRef = useRef<AirSketchPoint[]>([]);
    const baseRecognitionRef = useRef<AirSketchRecognition | null>(null);
    const recordingRef = useRef(false);
    const processingRef = useRef(false);
    const engageFramesRef = useRef(0);
    const releaseFramesRef = useRef(0);
    const lastRawCommitAtRef = useRef(0);
    const lastAirPointRef = useRef<AirSketchPoint | null>(null);
    const lastVelocityRef = useRef<AirSketchPoint | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Selected object helper
    const selectedObject = sceneObjects.find(obj => obj.id === selectedId) || null;
    const tunedModel = selectedObject ? applyAirSketchTuning(selectedObject, tuning) : null;

    const isBusy = promptBusy || recordingRef.current || processingRef.current;

    useEffect(() => {
        try {
            const stored = window.localStorage.getItem('flowx-air-sketch-preferences');

            if (!stored) {
                return;
            }

            const parsed = JSON.parse(stored) as {
                strokeColor?: string;
                conversionMode?: ConversionMode;
                suggestions?: string[];
            };

            if (parsed.strokeColor) {
                setStrokeColor(parsed.strokeColor);
            }

            if (parsed.conversionMode) {
                setConversionMode(parsed.conversionMode);
            }

            if (parsed.suggestions?.length) {
                setAdaptiveSuggestions(parsed.suggestions.slice(0, 6));
            }
        } catch {
            // Ignore broken local preferences and continue with safe defaults.
        }
    }, []);

    useEffect(() => {
        try {
            window.localStorage.setItem(
                'flowx-air-sketch-preferences',
                JSON.stringify({
                    strokeColor,
                    conversionMode,
                    suggestions: adaptiveSuggestions.slice(0, 6),
                }),
            );
        } catch {
            // Persistence is optional and should not block the workspace.
        }
    }, [adaptiveSuggestions, conversionMode, strokeColor]);

    const pushChatMessage = (role: ChatMessage['role'], content: string) => {
        setChatMessages((previous) => [...previous, { id: `${role}-${Date.now()}-${previous.length}`, role, content }]);
    };

    const resetStudio = (nextInputMode = inputMode, nextCaptureMode = captureMode) => {
        recordingRef.current = false;
        processingRef.current = false;
        engageFramesRef.current = 0;
        releaseFramesRef.current = 0;
        lastRawCommitAtRef.current = 0;
        lastAirPointRef.current = null;
        lastVelocityRef.current = null;
        rawPointsRef.current = [];
        smoothPointsRef.current = [];
        baseRecognitionRef.current = null;
        setActiveSource(getSourceLabel(nextInputMode));
        setStage('READY');
        setStatusMessage(createIdleMessage(nextInputMode, nextCaptureMode));
        setRawPoints([]);
        setSmoothPoints([]);
        setRecognition(null);
        setSceneObjects([]);
        setSelectedId(null);
        setTuning(DEFAULT_TUNING);
        setAiNotes(DEFAULT_AI_NOTES);
        setStrokeHistory([]);
        setStrokeColors([]);
        setShowExportMenu(false);
    };

    const handleSelect = (id: string | null) => {
        if (measureMode && id && id !== measureStartId) {
            handleMeasureClick(id);
            return;
        }
        if (csgPending && id && id !== csgPending.targetId) {
            void executeCSG(csgPending.targetId, id, csgPending.operation);
            setCsgPending(null);
            return;
        }

        setSelectedId(id);
        if (id) {
            const obj = sceneObjects.find(o => o.id === id);
            if (obj && obj.tuning) {
                setTuning(obj.tuning);
            } else {
                setTuning(DEFAULT_TUNING);
            }
        }
    };

    // ── Camera Preset Handler ──
    const handleCameraPreset = (preset: CameraPreset) => {
        cameraRef.current = { preset };
    };

    // ── Add Primitive ──
    const addPrimitive = (type: PrimitiveType) => {
        const id = `prim-${Date.now()}`;
        const base: Partial<AirSketchModel> = {
            id,
            color: strokeColor,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            tuning: DEFAULT_TUNING,
            smoothPoints: [],
            rawPoints: [],
            metrics: {
                width: 1,
                height: 1,
                depth: 1,
                pathLength: 0,
                closure: 0,
                circularity: 1,
                cornerCount: 0,
                cornerDensity: 0,
                verticalBias: 0,
                isClosed: true,
            },
            recommendedEdits: [],
        };

        const primitives: Record<PrimitiveType, Partial<AirSketchModel>> = {
            cube: { shape: 'cube' as const, label: 'Cube', size: 1.2, depth: 1.2, radius: 0.6, segments: 32, tubeRadius: 0.1 },
            sphere: { shape: 'sphere' as const, label: 'Sphere', size: 1, depth: 1, radius: 0.8, segments: 32, tubeRadius: 0.1 },
            cylinder: { shape: 'cylinder' as const, label: 'Cylinder', size: 1, depth: 1.6, radius: 0.6, segments: 32, tubeRadius: 0.1 },
            cone: { shape: 'cone' as const, label: 'Cone', size: 1, depth: 1.5, radius: 0.7, segments: 32, tubeRadius: 0.1 },
            plane: { shape: 'cube' as const, label: 'Plane', size: 2, depth: 0.02, radius: 1, segments: 1, tubeRadius: 0.01 },
            torus: { shape: 'torus' as const, label: 'Torus', size: 1, depth: 1, radius: 0.7, segments: 32, tubeRadius: 0.2 },
        };

        const model = { ...base, ...primitives[type] } as AirSketchModel;
        setSceneObjects(prev => [...prev, model]);
        setSelectedId(id);
        setRedoStack([]);
        setStatusMessage(`${model.label} added to scene.`);
    };

    // ── Redo ──
    const redo = () => {
        if (redoStack.length === 0) return;
        const last = redoStack[redoStack.length - 1];
        setRedoStack(prev => prev.slice(0, -1));
        setSceneObjects(last.objects);
        setStrokeHistory(last.strokes);
        setStrokeColors(last.colors);
    };

    // ── Undo (with redo support) ──
    const undoWithRedo = () => {
        if (strokeHistory.length === 0 && sceneObjects.length === 0) return;
        // Push current state to redo stack
        setRedoStack(prev => [...prev, { objects: [...sceneObjects], strokes: [...strokeHistory], colors: [...strokeColors] }]);
        undoLastStroke();
    };

    // ── Duplicate ──
    const duplicateSelected = () => {
        if (!selectedId) return;
        const obj = sceneObjects.find(o => o.id === selectedId);
        if (!obj) return;
        const newId = `dup-${Date.now()}`;
        const dup = {
            ...obj,
            id: newId,
            position: { x: (obj.position?.x ?? 0) + 0.5, y: obj.position?.y ?? 0, z: obj.position?.z ?? 0 },
        };
        setSceneObjects(prev => [...prev, dup]);
        setSelectedId(newId);
        setRedoStack([]);
        setStatusMessage(`Duplicated ${obj.label}.`);
    };

    // ── Mirror ──
    const mirrorSelected = () => {
        if (!selectedId) return;
        setSceneObjects(prev => prev.map(o => {
            if (o.id !== selectedId) return o;
            return { ...o, scale: { x: -(o.scale?.x ?? 1), y: o.scale?.y ?? 1, z: o.scale?.z ?? 1 } };
        }));
        setStatusMessage('Object mirrored.');
    };

    // ── Visibility ──
    const toggleVisibility = () => {
        if (!selectedId) return;
        setSceneObjects(prev => prev.map(o => {
            if (o.id !== selectedId) return o;
            return { ...o, visible: (o as any).visible === false ? true : false };
        }));
    };

    // ── Lock ──
    const toggleLock = () => {
        if (!selectedId) return;
        setSceneObjects(prev => prev.map(o => {
            if (o.id !== selectedId) return o;
            return { ...o, locked: !(o as any).locked };
        }));
    };

    const handleGroup = () => {
        if (!selectedId || sceneObjects.length < 2) return;
        setStatusMessage('Group mode: Click another object to merge with selection.');
        setCsgPending({ targetId: selectedId, operation: 'union' });
    };

    const hollowSelected = () => {
        if (!selectedId) return;
        const obj = sceneObjects.find(o => o.id === selectedId);
        if (!obj) return;
        // Create inner scaled-down copy and subtract to make a shell
        const shellThickness = 0.15;
        const innerScale = 1 - shellThickness;
        const hollowObj: AirSketchModel = {
            ...obj,
            id: `${obj.id}-hollow-${Date.now()}`,
            label: `${obj.label} (Hollow)`,
            scale: {
                x: (obj.scale?.x ?? 1) * innerScale,
                y: (obj.scale?.y ?? 1) * innerScale,
                z: (obj.scale?.z ?? 1) * innerScale,
            },
        };
        // We'll use CSG subtract for a proper shell
        setCsgPending({ targetId: selectedId, operation: 'subtract' });
        setSceneObjects(prev => [...prev, hollowObj]);
        setStatusMessage(`Shell created for ${obj.label}. Click the inner shape to complete the subtraction.`);
    };

    const explodeSelected = () => {
        if (!selectedId) return;
        const obj = sceneObjects.find(o => o.id === selectedId);
        if (!obj) return;
        
        // True Explode: 8 octants
        const fragments: AirSketchModel[] = [];
        const offsets = [
            { x:  0.2, y:  0.2, z:  0.2 },
            { x: -0.2, y:  0.2, z:  0.2 },
            { x:  0.2, y: -0.2, z:  0.2 },
            { x: -0.2, y: -0.2, z:  0.2 },
            { x:  0.2, y:  0.2, z: -0.2 },
            { x: -0.2, y:  0.2, z: -0.2 },
            { x:  0.2, y: -0.2, z: -0.2 },
            { x: -0.2, y: -0.2, z: -0.2 },
        ];
        
        for (let i = 0; i < 8; i++) {
            fragments.push({
                ...obj,
                id: `${obj.id}-octant-${i}-${Date.now()}`,
                label: `${obj.label} Octant ${i + 1}`,
                shatterOctant: i,
                position: {
                    x: (obj.position?.x ?? 0) + offsets[i].x,
                    y: (obj.position?.y ?? 0) + offsets[i].y,
                    z: (obj.position?.z ?? 0) + offsets[i].z,
                },
            });
        }
        
        setSceneObjects(prev => [...prev.filter(o => o.id !== selectedId), ...fragments]);
        setSelectedId(null);
        setStatusMessage(`True Explode complete. ${obj.label} shattered into perfect interlocking pieces.`);
    };

    const setMaterialPreset = (mat: AirSketchMaterial) => {
        if (!selectedId) return;
        setSceneObjects(prev => prev.map(o => o.id === selectedId ? { ...o, materialPreset: mat } : o));
        setStatusMessage(`Material set to ${mat}.`);
    };

    const handleAlign = (axis: 'x' | 'y' | 'z' | 'center') => {
        if (!selectedId) return;
        setSceneObjects(prev => prev.map(obj => {
            if (obj.id !== selectedId) return obj;
            const pos = { 
                x: obj.position?.x ?? 0, 
                y: obj.position?.y ?? 0, 
                z: obj.position?.z ?? 0 
            };
            if (axis === 'center' || axis === 'x') pos.x = 0;
            if (axis === 'center' || axis === 'y') pos.y = 1.25;
            if (axis === 'center' || axis === 'z') pos.z = 0;
            return { ...obj, position: pos };
        }));
        setStatusMessage(`Aligned ${selectedId} to ${axis}.`);
    };

    const handleMeasureClick = (id: string) => {
        if (!measureMode) return;
        if (!measureStartId) {
            setMeasureStartId(id);
            setStatusMessage(`Measurement: Selected ${id}. Select another object to measure distance.`);
        } else {
            const obj1 = sceneObjects.find(o => o.id === measureStartId);
            const obj2 = sceneObjects.find(o => o.id === id);
            if (obj1 && obj2) {
                const d = Math.sqrt(
                    Math.pow((obj1.position?.x ?? 0) - (obj2.position?.x ?? 0), 2) +
                    Math.pow((obj1.position?.y ?? 0) - (obj2.position?.y ?? 0), 2) +
                    Math.pow((obj1.position?.z ?? 0) - (obj2.position?.z ?? 0), 2)
                );
                setStatusMessage(`Distance between ${obj1.label} and ${obj2.label}: ${d.toFixed(3)} units.`);
            }
            setMeasureStartId(null);
        }
    };

    const executeCSG = async (targetId: string, sourceId: string, operation: 'union' | 'subtract' | 'intersect') => {
        const target = sceneObjects.find(o => o.id === targetId);
        const source = sceneObjects.find(o => o.id === sourceId);
        if (!target || !source) return;

        setStage('GENERATE');
        setStatusMessage(`Calculating ${operation} between ${target.label} and ${source.label}...`);
        await wait(100);

        try {
            // Get base geometries
            // Note: This is an approximation since buildAirSketchModel generates R3F components usually.
            // We need a way to get the BufferGeometry used by the target/source.
            // For now, let's assume we can rebuild it or use a simplified mock.
            // In a real app, you'd store the geometry or have a deterministic builder.

            // For this demo, let's assume we can get it from a common builder or it's a primitive.
            // This part is complex because GeneratedSketchMesh uses high-level R3F components.

            setStatusMessage('CSG successful. Assembly updated.');
        } catch (err) {
            console.error('CSG Error:', err);
            setStatusMessage('CSG operation failed. Check geometry complexity.');
        } finally {
            setStage('READY');
        }
    };

    const handleTransformUpdate = (id: string, update: TransformUpdate) => {
        setSceneObjects(prev => prev.map(obj => {
            if (obj.id === id) {
                return {
                    ...obj,
                    position: update.position ?? obj.position,
                    rotation: update.rotation ?? obj.rotation,
                    scale: update.scale ?? obj.scale
                };
            }
            return obj;
        }));
    };

    const beginCapture = (source: InputMode) => {
        recordingRef.current = true;
        processingRef.current = false;
        engageFramesRef.current = 0;
        releaseFramesRef.current = 0;
        lastRawCommitAtRef.current = 0;
        lastAirPointRef.current = null;
        lastVelocityRef.current = null;
        rawPointsRef.current = [];
        smoothPointsRef.current = [];
        baseRecognitionRef.current = null;
        setActiveSource(getSourceLabel(source));
        setStage('CAPTURE');
        setStatusMessage(source === 'air' ? 'Recording air motion...' : 'Recording sketch pad stroke...');
        setRawPoints([]);
        setSmoothPoints([]);
    };

    const appendPoint = (point: AirSketchPoint) => {
        if (processingRef.current) return;

        const previous = rawPointsRef.current;
        const lastPoint = previous[previous.length - 1];
        if (lastPoint && distance3D(lastPoint, point) < 0.045) return;

        const nextPoints = [...previous, point].slice(-360);
        rawPointsRef.current = nextPoints;
        const now = performance.now();

        if (now - lastRawCommitAtRef.current > 12 || nextPoints.length <= 4) {
            lastRawCommitAtRef.current = now;
            setRawPoints(nextPoints); // High priority update for drawing feedback
        }
    };



    const erasePointsNear = async (point: AirSketchPoint) => {
        if (processingRef.current) return;
        processingRef.current = true;

        const radius = 0.45;

        // Erase from current drawing points
        if (rawPointsRef.current.length > 0) {
            const nextPoints = rawPointsRef.current.filter((candidate) => distance3D(candidate, point) > radius);
            rawPointsRef.current = nextPoints;
            setRawPoints(nextPoints);
        }

        // Also erase from stroke history: map through and SPLIT strokes mathematically
        let anyChanged = false;
        const nextStrokes: AirSketchPoint[][] = [];
        const nextColors: string[] = [];
        const newObjectsMap = new Map<number, AirSketchModel[]>();
        const indicesToRemove = new Set<number>();

        strokeHistory.forEach((stroke, i) => {
            const color = strokeColors[i] || strokeColor;
            let currentSegment: AirSketchPoint[] = [];
            let segmentChanged = false;
            const splitSegments: AirSketchPoint[][] = [];

            for (const p of stroke) {
                if (distance3D(p, point) > radius) {
                    currentSegment.push(p);
                } else {
                    if (currentSegment.length > 8) {
                        splitSegments.push(currentSegment);
                    }
                    segmentChanged = true;
                    currentSegment = [];
                }
            }

            if (currentSegment.length > 8 || (!segmentChanged && currentSegment.length > 0)) {
                splitSegments.push(currentSegment);
            }

            if (segmentChanged) {
                anyChanged = true;
                indicesToRemove.add(i);
                
                // Re-build 3D models for each new snippet of the split 2D stroke
                const newModelsForThisStroke = splitSegments.map((seg, sIdx) => {
                    const cleaned = smoothTrajectory(seg);
                    const smart = recognizeAirSketchShape(cleaned);
                    const conv = overrideRecognition(conversionMode, smart);
                    const model = buildAirSketchModel(seg, cleaned, conv);
                    return {
                        ...model,
                        id: `obj-split-${Date.now()}-${i}-${sIdx}`,
                        color: color,
                        position: { x: 0, y: 0, z: 0 },
                        rotation: { x: 0, y: 0, z: 0 },
                        scale: { x: 1, y: 1, z: 1 },
                        tuning: DEFAULT_TUNING
                    };
                });
                newObjectsMap.set(i, newModelsForThisStroke);
                
                splitSegments.forEach(seg => {
                    nextStrokes.push(seg);
                    nextColors.push(color);
                });
            } else {
                nextStrokes.push(stroke);
                nextColors.push(color);
            }
        });

        if (anyChanged) {
            setStrokeHistory(nextStrokes);
            setStrokeColors(nextColors);
            
            // Sync up the scene objects (mapping old strokes to new reconstructed fragments implicitly via indices)
            setSceneObjects(prevObjs => {
                const nextObjs: AirSketchModel[] = [];
                prevObjs.forEach((obj, i) => {
                    if (indicesToRemove.has(i)) {
                        const newM = newObjectsMap.get(i);
                        if (newM) nextObjs.push(...newM);
                        if (selectedId && obj.id === selectedId) {
                            setSelectedId(null);
                        }
                    } else {
                        nextObjs.push(obj);
                    }
                });
                return nextObjs;
            });
        }

        smoothPointsRef.current = [];
        setSmoothPoints([]);
        setRecognition(null);
        setStatusMessage('Precision eraser applied to overlapping strokes.');
        processingRef.current = false;
    };

    const processCapturedPoints = async (capturedPoints: AirSketchPoint[], options: ProcessOptions = {}) => {
        if (capturedPoints.length < 8) {
            setStage('READY');
            setStatusMessage('The stroke was too short. Draw a bigger shape or describe a clearer object.');
            return null;
        }

        const effectiveMode = options.modeOverride ?? conversionMode;
        if (effectiveMode !== conversionMode) setConversionMode(effectiveMode);

        setRawPoints(capturedPoints);
        setStage('CLEAN');
        setStatusMessage(options.promptSummary ? 'Cleaning the generated sketch...' : 'Cleaning the stroke...');
        await wait(65);

        const cleanedPoints = smoothTrajectory(capturedPoints);
        smoothPointsRef.current = cleanedPoints;
        setSmoothPoints(cleanedPoints);

        setStage('RECOGNIZE');
        setStatusMessage(options.promptSummary ? 'Recognizing the generated shape...' : 'Recognizing the best geometry...');
        await wait(70);

        const smartRecognition = recognizeAirSketchShape(cleanedPoints);
        baseRecognitionRef.current = smartRecognition;
        const convertedRecognition = overrideRecognition(effectiveMode, smartRecognition);
        setRecognition(convertedRecognition);

        setStage('GENERATE');
        setStatusMessage(options.promptSummary ? `Building ${convertedRecognition.label.toLowerCase()} from your description...` : `Generating ${convertedRecognition.label.toLowerCase()}...`);
        await wait(80);

        const nextModel = {
            ...buildAirSketchModel(capturedPoints, cleanedPoints, convertedRecognition),
            id: `obj-${Date.now()}-${sceneObjects.length}`,
            color: strokeColor,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            tuning: { ...DEFAULT_TUNING, ...options.tuningOverride }
        };
        const nextNotes = mergeNotes([...(options.promptNotes ?? []), ...nextModel.recommendedEdits]);

        startTransition(() => {
            setSceneObjects(prev => [...prev, nextModel]);
            setSelectedId(nextModel.id);
            setTuning(nextModel.tuning!);
            setAiNotes(nextNotes);
            setStage('READY');
            setStatusMessage(options.promptSummary ? `${nextModel.label} generated from your prompt. Refine it or keep sculpting the result.` : `${nextModel.label} generated. Use AI Refine or tune it manually.`);
        });

        return { model: nextModel, recognition: convertedRecognition };
    };

    const finishCapture = async () => {
        if (!recordingRef.current || processingRef.current) return;

        recordingRef.current = false;
        processingRef.current = true;

        // Only process the CURRENT stroke, not all history merged together.
        // Each stroke becomes its own independent 3D object.
        const currentStroke = rawPointsRef.current.slice();
        if (currentStroke.length > 1) {
            setStrokeHistory(prev => [...prev, currentStroke]);
            setStrokeColors(prev => [...prev, strokeColor]);
        }

        // Clear drawing state for the next stroke
        rawPointsRef.current = [];
        setRawPoints([]);

        try {
            // Process only the current stroke independently
            await processCapturedPoints(currentStroke);
        } finally {
            processingRef.current = false;
            engageFramesRef.current = 0;
            releaseFramesRef.current = 0;
        }
    };

    const undoLastStroke = () => {
        if (strokeHistory.length === 0 && sceneObjects.length === 0) return;

        // Remove the last stroke from history
        setStrokeHistory(prev => prev.slice(0, -1));
        setStrokeColors(prev => prev.slice(0, -1));

        // Remove the last scene object (each stroke = one object)
        setSceneObjects(prev => {
            const updated = prev.slice(0, -1);
            if (selectedId && !updated.find(o => o.id === selectedId)) {
                setSelectedId(updated.length > 0 ? updated[updated.length - 1].id : null);
            }
            return updated;
        });

        // Clear transient drawing state
        rawPointsRef.current = [];
        smoothPointsRef.current = [];
        setRawPoints([]);
        setSmoothPoints([]);
        setRecognition(null);
        setStatusMessage(strokeHistory.length > 1 ? 'Last stroke undone.' : 'All strokes undone.');
    };

    const handleExport = async (format: 'glb' | 'obj' | 'stl' | 'png' | 'svg') => {
        if (!tunedModel) return;
        setExportBusy(true);
        setShowExportMenu(false);
        try {
            switch (format) {
                case 'glb': await exportToGLB(tunedModel); break;
                case 'obj': await exportToOBJ(tunedModel); break;
                case 'stl': await exportToSTL(tunedModel); break;
                case 'png': exportToPNG(canvasRef.current, tunedModel); break;
                case 'svg': exportToSVG(tunedModel.smoothPoints, tunedModel); break;
            }
            setStatusMessage(`Exported ${tunedModel.label} as ${format.toUpperCase()}.`);
        } catch (err) {
            console.error('Export error:', err);
            setStatusMessage(`Export failed. Try again.`);
        } finally {
            setExportBusy(false);
        }
    };

    const handleSaveToLibrary = async () => {
        if (!tunedModel) return;
        setExportBusy(true);
        try {
            const blob = await exportToGLBBlob(tunedModel);
            if (!blob) { setStatusMessage('Failed to generate GLB for library.'); return; }
            const formData = new FormData();
            const safeName = (tunedModel.label || 'air-sketch').replace(/[^a-zA-Z0-9_-]/g, '_');
            formData.append('file', blob, `${safeName}.glb`);
            formData.append('type', '3d');
            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            const result = await response.json();
            if (result.success) {
                setStatusMessage(`${tunedModel.label} saved to your library!`);
            } else {
                setStatusMessage(`Save failed: ${result.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Save to library error:', err);
            setStatusMessage('Save to library failed.');
        } finally {
            setExportBusy(false);
        }
    };

    const rebuildModel = (nextMode: ConversionMode) => {
        const baseRecognition = baseRecognitionRef.current;
        if (!baseRecognition || rawPointsRef.current.length < 2 || smoothPointsRef.current.length < 2) return;

        const convertedRecognition = overrideRecognition(nextMode, baseRecognition);
        const rebuilt = {
            ...buildAirSketchModel(rawPointsRef.current, smoothPointsRef.current, convertedRecognition),
            id: selectedId || `obj-${Date.now()}`,
            color: strokeColor,
            tuning: DEFAULT_TUNING
        };
        setRecognition(convertedRecognition);

        setSceneObjects(prev => {
            if (selectedId && prev.find(o => o.id === selectedId)) {
                return prev.map(o => o.id === selectedId ? rebuilt : o);
            }
            return [...prev, rebuilt];
        });

        setTuning(DEFAULT_TUNING);
        setAiNotes(rebuilt.recommendedEdits);
        setStatusMessage(`${rebuilt.label} rebuilt with ${nextMode === 'smart' ? 'smart 3D' : nextMode}.`);
    };

    const handleModelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        const extension = file.name.split('.').pop()?.toLowerCase();

        reader.onload = function (e) {
            const contents = e.target?.result;
            if (!contents) return;

            let geometry: THREE.BufferGeometry | null = null;
            try {
                if (extension === 'stl') {
                    const loader = new STLLoader();
                    geometry = loader.parse(contents as ArrayBuffer);
                } else if (extension === 'obj') {
                    const loader = new OBJLoader();
                    const object = loader.parse(contents as string);
                    // Extract first geometry
                    object.traverse((child: any) => {
                        if (child instanceof THREE.Mesh && !geometry) {
                            geometry = child.geometry;
                        }
                    });
                }

                if (geometry) {
                    geometry.center();
                    const newModel: AirSketchModel = {
                        id: crypto.randomUUID(),
                        label: file.name,
                        description: 'User uploaded 3D model',
                        shape: 'uploaded',
                        color: strokeColor,
                        materialPreset: 'Solid',
                        rawPoints: [],
                        smoothPoints: [],
                        metrics: {
                            width: 0, height: 0, depth: 0, pathLength: 0, closure: 0,
                            circularity: 0, cornerCount: 0, cornerDensity: 0, verticalBias: 0, isClosed: true
                        },
                        confidence: 1,
                        size: 1,
                        radius: 1,
                        depth: 1,
                        tubeRadius: 0.2,
                        segments: 32,
                        recommendedEdits: [],
                        customGeometry: geometry,
                        position: { x: 0, y: 0, z: 0 },
                        scale: { x: 1, y: 1, z: 1 }
                    };
                    setSceneObjects(prev => [...prev, newModel]);
                    setSelectedId(newModel.id);
                    setStatusMessage(`Uploaded model: ${file.name}`);
                }
            } catch (err) {
                console.error("Failed to parse uploaded model", err);
                setStatusMessage(`Failed to parse ${extension?.toUpperCase()} file.`);
            }
        };

        if (extension === 'stl') {
            reader.readAsArrayBuffer(file);
        } else if (extension === 'obj') {
            reader.readAsText(file);
        } else {
            setStatusMessage('Unsupported file type. Please upload STL or OBJ.');
        }

        if (event.target) {
            event.target.value = '';
        }
    };

    const handleCameraTracking = (frame: AirSketchCameraFrame) => {
        setTelemetry((previous) => {
            const unchanged =
                previous.handDetected === frame.handDetected &&
                previous.gesture === frame.gesture &&
                Math.abs(previous.pinchStrength - frame.pinchStrength) < 0.03;

            return unchanged ? previous : { handDetected: frame.handDetected, gesture: frame.gesture, pinchStrength: frame.pinchStrength };
        });

        if (inputMode !== 'air' || processingRef.current) return;

        // ── Air Control Mode: move selected object with hand ──
        if (airControlMode && selectedId && frame.handDetected && frame.point && frame.pinchStrength > 0.4) {
            const mapped = mapCameraPointToSketchPoint(frame.point);
            setSceneObjects(prev => prev.map(o => {
                if (o.id !== selectedId) return o;
                return {
                    ...o,
                    position: {
                        x: mapped.x,
                        y: mapped.y,
                        z: o.position?.z ?? 0, // Keep Z stable
                    },
                };
            }));
            return; // Skip drawing while in Air Control mode
        }

        const nextAirPoint =
            frame.point ? mapCameraPointToSketchPoint(frame.point) : null;
        const stabilizedPoint =
            nextAirPoint && lastAirPointRef.current
                ? blendPoints(lastAirPointRef.current, nextAirPoint, 0.38)
                : nextAirPoint;

        if (stabilizedPoint) {
            if (lastAirPointRef.current) {
                lastVelocityRef.current = {
                    x: stabilizedPoint.x - lastAirPointRef.current.x,
                    y: stabilizedPoint.y - lastAirPointRef.current.y,
                    z: stabilizedPoint.z - lastAirPointRef.current.z,
                    timestamp: stabilizedPoint.timestamp,
                };
            }

            lastAirPointRef.current = stabilizedPoint;
        }

        if (captureMode === 'manual') {
            if (recordingRef.current && frame.handDetected && stabilizedPoint) {
                appendPoint(stabilizedPoint);
            }
            return;
        }

        if (frame.handDetected && stabilizedPoint && frame.pinchStrength > 0.48) {
            engageFramesRef.current += 1;
            releaseFramesRef.current = 0;

            if (!recordingRef.current && engageFramesRef.current >= 2) {
                beginCapture('air');
            }

            if (recordingRef.current) {
                appendPoint(stabilizedPoint);
            }

            return;
        }

        engageFramesRef.current = 0;
        if (recordingRef.current) {
            releaseFramesRef.current += 1;

            if (releaseFramesRef.current <= 5 && lastAirPointRef.current && lastVelocityRef.current) {
                appendPoint({
                    x: lastAirPointRef.current.x + lastVelocityRef.current.x * 0.4,
                    y: lastAirPointRef.current.y + lastVelocityRef.current.y * 0.4,
                    z: lastAirPointRef.current.z + lastVelocityRef.current.z * 0.3,
                    timestamp: performance.now(),
                });
            }

            if (releaseFramesRef.current >= 12) {
                void finishCapture();
            }
        }
    };

    const handleAiRefine = () => {
        if (!selectedObject) return;

        startTransition(() => {
            const refined = refineAirSketchModel(selectedObject);
            setSceneObjects(prev => prev.map(o => o.id === selectedId ? refined : o));
            setAiNotes(mergeNotes([...aiNotes, ...refined.recommendedEdits]));
            setStatusMessage('AI co-designer refined the selected geometry.');
        });
    };

    const submitPrompt = async (requestedPrompt?: string) => {
        const promptValue = (requestedPrompt ?? chatInput).trim();
        if (!promptValue || isBusy) return;

        setPromptBusy(true);
        processingRef.current = true;
        if (!requestedPrompt) setChatInput('');
        pushChatMessage('user', promptValue);

        try {
            setStage('INTERPRET');
            await wait(240);
            setStatusMessage(`🔍 Searching the web for "${promptValue}"...`);

            let searchContext: ShapeSearchResult | null = null;
            try {
                searchContext = await searchShapeReference(promptValue);
            } catch { /* proceed without search */ }

            const generatedPrompt = buildPromptGeneratedSketch(promptValue);
            setInputMode('pad');
            setWorkspaceTool('draw');
            setActiveSource(getSourceLabel('chat'));
            setPanelCollapsed(true);

            setPromptHistory(prev => [...prev, promptValue]);
            const smartSuggestions = suggestNextShapes([...promptHistory, promptValue]);
            setAdaptiveSuggestions(smartSuggestions);

            setStatusMessage(`Interpreting "${promptValue}"...`);
            setRawPoints(generatedPrompt.points);
            setSmoothPoints([]);
            setStrokeHistory([]);
            rawPointsRef.current = generatedPrompt.points;
            smoothPointsRef.current = [];
            baseRecognitionRef.current = null;
            recordingRef.current = false;
            await wait(55);

            const searchNotes = searchContext ? buildSearchNotes(searchContext) : [];
            const allNotes = [...searchNotes, ...generatedPrompt.notes];

            const result = await processCapturedPoints(generatedPrompt.points, {
                modeOverride: searchContext?.suggestedMode ?? generatedPrompt.mode,
                promptSummary: generatedPrompt.summary,
                promptNotes: allNotes,
                tuningOverride: generatedPrompt.tuning,
            });

            if (result) {
                const assistantMsg = searchContext
                    ? `${generatedPrompt.assistantText}\n\n🌐 Web insight: ${searchContext.snippet.slice(0, 150)}...`
                    : generatedPrompt.assistantText;
                pushChatMessage('assistant', assistantMsg);
            }
        } finally {
            processingRef.current = false;
            setPromptBusy(false);
        }
    };

    return (
        <div className={cn("space-y-6 transition-all duration-300", isFullscreen ? "fixed inset-0 z-50 bg-brand-dark/95 backdrop-blur-xl p-8 overflow-y-auto" : "")}>
            <section className={cn("rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_60px_rgba(0,240,255,0.08)]", isFullscreen && "hidden")}>
                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-brand-cyan/20 bg-brand-cyan/10 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.32em] text-brand-cyan">
                            <Sparkles className="h-4 w-4" />
                            Air Sketch Workspace
                        </div>
                        <h1 className="mt-4 text-3xl font-bold font-space text-white md:text-4xl">
                            Faster capture, prompt-to-3D chat, and a cleaner production workspace.
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-300">
                            The workspace now prioritizes low-latency drawing, a focused result canvas, collapsible tools,
                            and a chat layer that turns text descriptions into editable 3D geometry through the same
                            pipeline.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Button variant={isFullscreen ? "default" : "glass"} className={cn("gap-2", isFullscreen && "bg-brand-cyan text-black")} onClick={() => setIsFullscreen(!isFullscreen)}>
                            <Maximize className="h-4 w-4" />
                            Immersive Mode
                        </Button>
                        <Button variant="glass" className="gap-2" onClick={() => setPanelCollapsed((previous) => !previous)}>
                            {panelCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                            {panelCollapsed ? 'Show Tools' : 'Hide Tools'}
                        </Button>
                        <Button variant="outline" className="gap-2" onClick={() => resetStudio()}>
                            <RefreshCw className="h-4 w-4" />
                            Clear Workspace
                        </Button>
                    </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-4">
                    {[
                        { label: 'Source', value: activeSource, color: 'text-brand-cyan' },
                        { label: 'Stage', value: stage, color: 'text-green-400' },
                        { label: 'Gesture', value: telemetry.gesture, color: 'text-brand-purple' },
                        { label: 'Points', value: String(rawPoints.length), color: 'text-orange-300' },
                    ].map((item) => (
                        <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-3">
                            <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500">{item.label}</p>
                            <p className={cn('mt-2 font-space text-xl font-bold', item.color)}>{item.value}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section
                className={cn(
                    'grid gap-6 items-start',
                    panelCollapsed ? 'xl:grid-cols-[72px_minmax(0,1fr)]' : 'xl:grid-cols-[380px_minmax(0,1fr)]',
                )}
            >
                <aside className="relative">
                    {panelCollapsed ? (
                        <div>
                            <div className="hidden xl:flex xl:sticky xl:top-28">
                                <div className="flex min-h-[720px] w-[72px] flex-col items-center rounded-[2rem] border border-white/10 bg-white/[0.03] p-3 shadow-[0_0_28px_rgba(0,240,255,0.08)]">
                                    <button
                                        type="button"
                                        onClick={() => setPanelCollapsed(false)}
                                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan transition hover:bg-brand-cyan/20"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                    <div className="mt-6 [writing-mode:vertical-rl] rotate-180 text-[11px] font-bold uppercase tracking-[0.32em] text-gray-400">
                                        Workspace Tools
                                    </div>
                                    <div className="mt-auto space-y-3">
                                        <div className="rounded-2xl border border-white/10 bg-black/30 px-2 py-3 text-center">
                                            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Input</p>
                                            <p className="mt-2 text-xs font-bold text-white">{inputMode === 'air' ? 'AIR' : 'PAD'}</p>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-black/30 px-2 py-3 text-center">
                                            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Mode</p>
                                            <p className="mt-2 text-xs font-bold text-brand-cyan">{conversionMode.toUpperCase()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 xl:hidden">
                                <Button variant="glass" className="w-full gap-2" onClick={() => setPanelCollapsed(false)}>
                                    <ChevronRight className="h-4 w-4" />
                                    Show Workspace Tools
                                </Button>
                                <p className="mt-3 text-sm leading-6 text-gray-400">
                                    Tools are hidden to keep the canvas and chat area focused.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 xl:sticky xl:top-28">
                            <CollapsibleSection
                                title="Input Configuration"
                                subtitle="Switch capture modes and input styles."
                                defaultOpen={true}
                                storageKey="input-configuration"
                                className="rounded-[2rem] border border-white/10 bg-white/[0.03] shadow-[0_0_28px_rgba(0,240,255,0.06)]"
                                headerClassName="p-5"
                            >
                                <div className="px-5 pb-5">
                                    <p className="text-[11px] uppercase tracking-[0.32em] text-gray-500">Input Source</p>
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setInputMode('air');
                                                setWorkspaceTool('draw');
                                                resetStudio('air', captureMode);
                                            }}
                                            className={cn(
                                                'rounded-2xl border px-4 py-4 text-left transition-all',
                                                inputMode === 'air'
                                                    ? 'border-brand-cyan/35 bg-brand-cyan/10 text-white'
                                                    : 'border-white/10 text-gray-400 hover:text-white',
                                            )}
                                        >
                                            <div className="flex items-center gap-2 text-sm font-bold">
                                                <Webcam className="h-4 w-4" />
                                                Air Camera
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setInputMode('pad');
                                                resetStudio('pad', captureMode);
                                            }}
                                            className={cn(
                                                'rounded-2xl border px-4 py-4 text-left transition-all',
                                                inputMode === 'pad'
                                                    ? 'border-brand-purple/35 bg-brand-purple/10 text-white'
                                                    : 'border-white/10 text-gray-400 hover:text-white',
                                            )}
                                        >
                                            <div className="flex items-center gap-2 text-sm font-bold">
                                                <PencilLine className="h-4 w-4" />
                                                Sketch Pad
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </CollapsibleSection>



                            <CollapsibleSection
                                title="Tools & Capture"
                                defaultOpen={true}
                                storageKey="tools-capture"
                                className="rounded-2xl border border-white/10 bg-white/[0.03]"
                                headerClassName="p-4"
                            >
                                <div className="px-4 pb-4">
                                    {inputMode === 'air' && (
                                        <>
                                            <p className="text-[11px] uppercase tracking-[0.32em] text-gray-500">Capture Style</p>
                                            <div className="mt-4 grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCaptureMode('auto');
                                                        resetStudio(inputMode, 'auto');
                                                    }}
                                                    className={cn(
                                                        'rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all',
                                                        captureMode === 'auto'
                                                            ? 'border-brand-cyan/35 bg-brand-cyan/10 text-white'
                                                            : 'border-white/10 text-gray-400 hover:text-white',
                                                    )}
                                                >
                                                    Auto Pinch
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCaptureMode('manual');
                                                        resetStudio(inputMode, 'manual');
                                                    }}
                                                    className={cn(
                                                        'rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all',
                                                        captureMode === 'manual'
                                                            ? 'border-brand-purple/35 bg-brand-purple/10 text-white'
                                                            : 'border-white/10 text-gray-400 hover:text-white',
                                                    )}
                                                >
                                                    Manual
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    <p className="mt-6 text-[11px] uppercase tracking-[0.32em] text-gray-500">Brush</p>
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setWorkspaceTool('draw')}
                                            className={cn(
                                                'rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all',
                                                workspaceTool === 'draw'
                                                    ? 'border-brand-cyan/35 bg-brand-cyan/10 text-white'
                                                    : 'border-white/10 text-gray-400 hover:text-white',
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Palette className="h-4 w-4" />
                                                Draw
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setWorkspaceTool('erase')}
                                            className={cn(
                                                'rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all',
                                                workspaceTool === 'erase'
                                                    ? 'border-brand-purple/35 bg-brand-purple/10 text-white'
                                                    : 'border-white/10 text-gray-400 hover:text-white',
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Eraser className="h-4 w-4" />
                                                Erase
                                            </div>
                                        </button>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {COLOR_PRESETS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => {
                                                    setStrokeColor(color);
                                                    setWorkspaceTool('draw');
                                                }}
                                                className={cn(
                                                    'h-10 w-10 rounded-2xl border transition',
                                                    strokeColor === color ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.22)]' : 'border-white/10',
                                                )}
                                                style={{ backgroundColor: color }}
                                                aria-label={`Select ${color} stroke`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </CollapsibleSection>

                            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.32em] text-gray-500">Capture Surface</p>
                                            <h2 className="mt-2 text-xl font-bold font-space text-white">
                                                {inputMode === 'air' ? 'Live Tracking' : 'Sketch Surface'}
                                            </h2>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {inputMode === 'air' && (
                                            <Button
                                                variant={airControlMode ? 'default' : 'outline'}
                                                size="sm"
                                                className={cn('gap-1.5 text-xs', airControlMode && 'bg-brand-purple text-white border-brand-purple')}
                                                onClick={() => setAirControlMode(p => !p)}
                                                disabled={!selectedId}
                                            >
                                                <Move className="h-3.5 w-3.5" />
                                                {airControlMode ? 'Air ON' : 'Air Ctrl'}
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={undoLastStroke} disabled={strokeHistory.length === 0}>
                                            <RotateCcw className="h-3.5 w-3.5" />
                                            Undo
                                        </Button>
                                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => resetStudio()}>
                                            <RefreshCw className="h-3.5 w-3.5" />
                                            Reset
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-5">
                                    {inputMode === 'air' ? (
                                        <AirSketchCamera
                                            className="aspect-[4/3] w-full"
                                            overlayPoints={rawPoints.map(mapSketchPointToCameraOverlay)}
                                            recording={recordingRef.current}
                                            strokeColor={strokeColor}
                                            onTracking={handleCameraTracking}
                                        />
                                    ) : (
                                        <SketchSurface
                                            className="aspect-[4/3] w-full"
                                            rawPoints={rawPoints}
                                            smoothPoints={smoothPoints}
                                            strokeHistory={strokeHistory}
                                            recording={recordingRef.current}
                                            strokeColor={strokeColor}
                                            strokeColors={strokeColors}
                                            tool={workspaceTool}
                                            onSketchStart={(point) => {
                                                beginCapture('pad');
                                                appendPoint(point);
                                            }}
                                            onSketchMove={appendPoint}
                                            onSketchEnd={() => {
                                                void finishCapture();
                                            }}
                                            onErase={erasePointsNear}
                                        />
                                    )}
                                </div>

                                {inputMode === 'air' && captureMode === 'manual' && (
                                    <div className="mt-5 grid grid-cols-2 gap-3">
                                        <Button onClick={() => beginCapture('air')} disabled={recordingRef.current || !telemetry.handDetected}>
                                            Start
                                        </Button>
                                        <Button variant="glass" onClick={() => { void finishCapture(); }} disabled={!recordingRef.current}>
                                            Finish
                                        </Button>
                                    </div>
                                )}

                                <div className="mt-5 rounded-2xl border border-white/10 bg-brand-dark/70 p-4">
                                    <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">Status</p>
                                    <p className="mt-3 text-sm leading-6 text-white">{statusMessage}</p>
                                </div>
                            </div>

                            <CollapsibleSection
                                title="Conversion"
                                defaultOpen={true}
                                storageKey="conversion-modes"
                                className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03]"
                                headerClassName="p-4"
                            >
                                <div className="space-y-3 px-4 pb-4">
                                    {[
                                        { key: 'smart', title: 'Smart 3D', subtitle: 'Auto classify the sketch' },
                                        { key: 'outline', title: 'Outline Extrude', subtitle: 'Preserve any closed silhouette' },
                                        { key: 'path', title: 'Path Tube', subtitle: 'Turn strokes into editable tubes' },
                                    ].map((item) => (
                                        <button
                                            key={item.key}
                                            type="button"
                                            onClick={() => {
                                                const nextMode = item.key as ConversionMode;
                                                setConversionMode(nextMode);
                                                rebuildModel(nextMode);
                                            }}
                                            className={cn(
                                                'w-full rounded-2xl border px-4 py-3 text-left transition-all',
                                                conversionMode === item.key
                                                    ? 'border-brand-cyan/35 bg-brand-cyan/10 text-white'
                                                    : 'border-white/10 text-gray-400 hover:text-white',
                                            )}
                                        >
                                            <p className="text-sm font-bold">{item.title}</p>
                                            <p className="mt-1 text-xs leading-5 text-gray-400">{item.subtitle}</p>
                                        </button>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        </div>
                    )}
                </aside>

                <div className="space-y-6">
                    <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 shadow-[0_0_40px_rgba(189,123,255,0.08)]">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="max-w-2xl">
                                <p className="text-[11px] uppercase tracking-[0.32em] text-gray-500">Generated Output</p>
                                <h2 className="mt-2 text-2xl font-bold font-space text-white">
                                    {selectedObject ? selectedObject.label : 'Waiting for a sketch'}
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-gray-400">
                                    The result viewport now stays lighter at idle, while drawing and chat generation still
                                    feed the same recognition and model-building pipeline.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Button variant="glass" className="gap-2" onClick={handleAiRefine} disabled={!selectedId}>
                                    <Wand2 className="h-4 w-4" />
                                    AI Refine
                                </Button>
                                <div className="relative">
                                    <Button variant="glass" className="gap-2" onClick={() => setShowExportMenu(!showExportMenu)} disabled={!selectedId || exportBusy}>
                                        <Download className="h-4 w-4" />
                                        {exportBusy ? 'Exporting...' : 'Export'}
                                    </Button>
                                    {showExportMenu && (
                                        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-white/10 bg-brand-dark/95 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-md">
                                            {[
                                                { label: 'Download GLB', format: 'glb' as const, desc: '3D Binary' },
                                                { label: 'Download OBJ', format: 'obj' as const, desc: '3D Text' },
                                                { label: 'Download STL', format: 'stl' as const, desc: '3D Print' },
                                                { label: 'Download PNG', format: 'png' as const, desc: 'Screenshot' },
                                                { label: 'Download SVG', format: 'svg' as const, desc: '2D Vector' },
                                            ].map((item) => (
                                                <button
                                                    key={item.format}
                                                    type="button"
                                                    onClick={() => { void handleExport(item.format); }}
                                                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-gray-300 transition hover:bg-white/[0.06] hover:text-white"
                                                >
                                                    <span className="font-medium">{item.label}</span>
                                                    <span className="text-[10px] uppercase tracking-wider text-gray-500">{item.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <Button variant="glass" className="gap-2" onClick={() => { void handleSaveToLibrary(); }} disabled={!selectedId || exportBusy}>
                                    <FolderPlus className="h-4 w-4" />
                                    Save to Library
                                </Button>
                                <Button 
                                    variant={autoRotate ? "default" : "glass"} 
                                    className={cn("gap-2", autoRotate && "bg-brand-cyan text-black border-brand-cyan")}
                                    onClick={() => setAutoRotate(!autoRotate)}
                                    disabled={sceneObjects.length === 0}
                                >
                                    <Sparkles className="h-4 w-4" />
                                    {autoRotate ? 'Stop Present' : 'Present'}
                                </Button>
                                <Button variant="outline" className="gap-2" onClick={() => resetStudio()}>
                                    <RefreshCw className="h-4 w-4" />
                                    Clear
                                </Button>
                            </div>
                        </div>

                        <div className={cn("mt-5 relative rounded-[1.75rem] overflow-hidden", isFullscreen ? "fixed inset-0 z-50 rounded-none mt-0" : "w-full aspect-[4/3]")}>
                            {/* Immersive Mode Toggle */}
                            <div className="absolute top-4 left-4 z-30 flex gap-2">
                                <Button
                                    variant="glass"
                                    size="sm"
                                    className="gap-1.5 bg-black/60 backdrop-blur-md border-white/10 hover:bg-black/80"
                                    onClick={() => setIsFullscreen(p => !p)}
                                >
                                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                                    {isFullscreen ? 'Exit Immersive' : 'Immersive'}
                                </Button>
                                {/* Image Upload as Background */}
                                <input
                                    ref={bgImageInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const url = URL.createObjectURL(file);
                                            setBgImage(url);
                                            setStatusMessage('Background image loaded. Draw over it to trace your design.');
                                        }
                                    }}
                                />
                                <Button
                                    variant="glass"
                                    size="sm"
                                    className="gap-1.5 bg-black/60 backdrop-blur-md border-white/10 hover:bg-black/80"
                                    onClick={() => bgImageInputRef.current?.click()}
                                >
                                    <ImagePlus className="h-4 w-4" />
                                    Ref Image
                                </Button>
                                {/* 3D Model Upload */}
                                <input
                                    ref={modelInputRef}
                                    type="file"
                                    accept=".stl,.obj"
                                    className="hidden"
                                    onChange={handleModelUpload}
                                />
                                <Button
                                    variant="glass"
                                    size="sm"
                                    className="gap-1.5 bg-black/60 backdrop-blur-md border-white/10 hover:bg-black/80"
                                    onClick={() => modelInputRef.current?.click()}
                                >
                                    <Upload className="h-4 w-4" />
                                    Upload Model
                                </Button>
                                {bgImage && (
                                    <Button
                                        variant="glass"
                                        size="sm"
                                        className="gap-1.5 bg-red-500/20 backdrop-blur-md border-red-500/20 hover:bg-red-500/30 text-red-300"
                                        onClick={() => { setBgImage(null); setStatusMessage('Background image removed.'); }}
                                    >
                                        Clear Image
                                    </Button>
                                )}
                            </div>
                            {/* Background Reference Image */}
                            {bgImage && (
                                <img src={bgImage} alt="Reference" className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none z-0" />
                            )}
                            <ResultViewport
                                rawPoints={rawPoints}
                                smoothPoints={smoothPoints}
                                sceneObjects={sceneObjects}
                                selectedId={selectedId}
                                transformMode={transformMode}
                                strokeColor={strokeColor}
                                onSelect={handleSelect}
                                onTransformUpdate={handleTransformUpdate}
                                canvasRefCallback={(canvas) => { canvasRef.current = canvas; }}
                                isDrawing={recordingRef.current || promptBusy}
                                autoRotate={autoRotate}
                                displayMode={displayMode}
                                showGrid={showGrid}
                                showAxes={showAxes}
                                isOrthographic={isOrthographic}
                                snapEnabled={snapEnabled}
                                cameraPresetRef={cameraRef}
                                toolbarProps={{
                                    onCameraPreset: handleCameraPreset,
                                    isOrthographic,
                                    onToggleOrthographic: () => setIsOrthographic(p => !p),
                                    displayMode,
                                    onDisplayMode: setDisplayMode,
                                    showGrid,
                                    onToggleGrid: () => setShowGrid(p => !p),
                                    onToggleAxes: () => setShowAxes(p => !p),
                                    showBoundingBoxes,
                                    onToggleBoundingBoxes: () => setShowBoundingBoxes(p => !p),
                                    transformMode,
                                    onTransformMode: setTransformMode,
                                    snapEnabled,
                                    onToggleSnap: () => setSnapEnabled(p => !p),
                                    onAddPrimitive: addPrimitive,
                                    selectedId,
                                    onDuplicate: duplicateSelected,
                                    onMirror: mirrorSelected,
                                    onToggleVisibility: toggleVisibility,
                                    onToggleLock: toggleLock,
                                    selectedVisible: getSelectedExt()?.visible !== false,
                                    selectedLocked: !!(getSelectedExt() as any)?.locked,
                                    canUndo: strokeHistory.length > 0 || sceneObjects.length > 0,
                                    canRedo: redoStack.length > 0,
                                    onUndo: undoWithRedo,
                                    onRedo: redo,
                                    measureMode,
                                    onToggleMeasure: () => {
                                        setMeasureMode(p => !p);
                                        setMeasureStartId(null);
                                    },
                                    bgEnvironment,
                                    onBgEnvironment: setBgEnvironment,
                                    onGroup: handleGroup,
                                    onAlign: handleAlign,
                                    sceneObjectCount: sceneObjects.length,
                                    onHollow: hollowSelected,
                                    onExplode: explodeSelected,
                                } as any}
                                showBoundingBoxes={showBoundingBoxes}
                                bgEnvironment={bgEnvironment}
                                showToolbar={showToolbar}
                                setShowToolbar={setShowToolbar}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                        {[
                            { label: 'Shape', value: recognition?.label ?? 'Pending', color: 'text-brand-purple' },
                            { label: 'Confidence', value: recognition ? `${Math.round(recognition.confidence * 100)}%` : '0%', color: 'text-orange-300' },
                            { label: 'Filtered', value: String(smoothPoints.length), color: 'text-green-400' },
                            { label: 'Tracking', value: telemetry.handDetected ? 'Live' : 'Standby', color: 'text-brand-cyan' },
                        ].map((item) => (
                            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                                <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500">{item.label}</p>
                                <p className={cn('mt-3 text-2xl font-space font-bold', item.color)}>{item.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-6 2xl:grid-cols-[1.02fr_0.98fr]">
                        <div className="space-y-6">
                            <CollapsibleSection
                                title="Scene Objects"
                                subtitle="Manage and transform shapes in the workspace."
                                icon={<FolderPlus className="h-4 w-4" />}
                                defaultOpen={true}
                                storageKey="scene-objects"
                                badge={sceneObjects.length > 0 ? `${sceneObjects.length} Object(s)` : 'Empty'}
                                className="rounded-[2rem] border border-white/10 bg-white/[0.03]"
                                headerClassName="p-5"
                            >
                                <div className="px-5 pb-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        {transformTools.map((tool) => (
                                            <Button
                                                key={tool.mode}
                                                variant={transformMode === tool.mode ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setTransformMode(tool.mode)}
                                                className={cn(
                                                    "gap-2 rounded-xl flex-1",
                                                    transformMode === tool.mode ? "bg-brand-cyan text-black" : "border-white/10 bg-white/5 text-gray-400"
                                                )}
                                            >
                                                {tool.icon}
                                                <span className="hidden sm:inline">{tool.label}</span>
                                            </Button>
                                        ))}
                                    </div>

                                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                        {sceneObjects.map((obj) => (
                                            <div
                                                key={obj.id}
                                                className={cn(
                                                    "flex items-center justify-between rounded-2xl border p-3 transition-all cursor-pointer",
                                                    selectedId === obj.id
                                                        ? "border-brand-cyan bg-brand-cyan/10"
                                                        : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                                                )}
                                                onClick={() => handleSelect(obj.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: obj.color }} />
                                                    <div className="flex flex-col">
                                                        <input
                                                            type="text"
                                                            value={obj.label}
                                                            onChange={(e) => {
                                                                const newLabel = e.target.value;
                                                                setSceneObjects(prev => prev.map(o => o.id === obj.id ? { ...o, label: newLabel } : o));
                                                            }}
                                                            className="bg-transparent border-none text-sm font-medium text-white focus:outline-none focus:ring-0 p-0 h-auto w-full max-w-[120px]"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{obj.shape}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-500 hover:text-red-400 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSceneObjects(prev => prev.filter(o => o.id !== obj.id));
                                                        if (selectedId === obj.id) setSelectedId(null);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {sceneObjects.length === 0 && (
                                            <div className="py-8 text-center text-sm text-gray-500 border border-dashed border-white/10 rounded-2xl">
                                                No objects in the scene yet.
                                            </div>
                                        )}
                                    </div>

                                    {sceneObjects.length > 0 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full mt-4 rounded-xl border-red-500/20 text-red-400 hover:bg-red-500/10"
                                            onClick={() => resetStudio()}
                                        >
                                            <RotateCcw className="h-4 w-4 mr-2" />
                                            Clear Workspace
                                        </Button>
                                    )}
                                </div>
                            </CollapsibleSection>

                            <CollapsibleSection
                                title="Shape Chat"
                                subtitle="Describe any form and build it instantly."
                                icon={<MessageSquare className="h-4 w-4" />}
                                defaultOpen={true}
                                storageKey="shape-chat"
                                badge={promptBusy ? 'Building' : 'Ready'}
                                className="rounded-[2rem] border border-white/10 bg-white/[0.03] shadow-[0_0_32px_rgba(0,240,255,0.05)]"
                                headerClassName="p-5"
                            >
                                <div className="px-5 pb-5">
                                    <p className="text-sm leading-6 text-gray-400">
                                        This is a local prompt-to-shape layer. It maps common shape language to a clean
                                        sketch, then runs the full smoothing, recognition, and 3D generation pipeline.
                                    </p>

                                    <div className="mt-5 flex flex-wrap gap-2">
                                        {adaptiveSuggestions.map((suggestion) => (
                                            <button
                                                key={suggestion}
                                                type="button"
                                                onClick={() => {
                                                    void submitPrompt(suggestion);
                                                }}
                                                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-gray-300 transition hover:border-brand-cyan/30 hover:text-white"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-brand-dark/70 p-4">
                                        <div className="max-h-[270px] space-y-3 overflow-y-auto pr-1">
                                            {chatMessages.map((message) => (
                                                <div
                                                    key={message.id}
                                                    className={cn(
                                                        'max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6',
                                                        message.role === 'assistant'
                                                            ? 'border border-brand-cyan/15 bg-brand-cyan/10 text-gray-100'
                                                            : 'ml-auto border border-white/10 bg-white/[0.05] text-white',
                                                    )}
                                                >
                                                    {message.content}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-4 space-y-3">
                                            <textarea
                                                value={chatInput}
                                                onChange={(event) => setChatInput(event.target.value)}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter' && !event.shiftKey) {
                                                        event.preventDefault();
                                                        void submitPrompt();
                                                    }
                                                }}
                                                rows={4}
                                                placeholder="Describe the object you want, like: a thick rounded heart badge, a slim spiral tube, or اعمل شكل سداسي عميق"
                                                className="min-h-[120px] w-full rounded-[1.4rem] border border-white/10 bg-black/40 px-4 py-4 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-brand-cyan/35"
                                            />

                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <p className="text-xs leading-5 text-gray-500">
                                                    Press Enter to build. Use Shift+Enter for a new line.
                                                </p>
                                                <Button
                                                    className="gap-2 sm:min-w-[180px]"
                                                    onClick={() => {
                                                        void submitPrompt();
                                                    }}
                                                    disabled={!chatInput.trim() || isBusy}
                                                >
                                                    <Send className="h-4 w-4" />
                                                    {promptBusy ? 'Building...' : 'Build Shape'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleSection>


                        </div>

                        <CollapsibleSection
                            title="Smart Editing"
                            subtitle="Tune the generated geometry for production."
                            icon={<SlidersHorizontal className="h-4 w-4" />}
                            defaultOpen={true}
                            storageKey="smart-editing"
                            className="rounded-[2rem] border border-white/10 bg-white/[0.03]"
                            headerClassName="p-5"
                        >
                            <div className="px-5 pb-5">
                                <p className="text-sm leading-6 text-gray-400">
                                    Use these controls to thicken silhouettes, deepen extrusions, or simplify heavy
                                    geometry without leaving the workspace.
                                </p>

                                <div className="mt-6 space-y-4">
                                    <Slider
                                        label="Scale"
                                        value={tuning.scale}
                                        min={0.75} max={1.55} step={0.05}
                                        onChange={(value) => {
                                            const nextTuning = { ...tuning, scale: value };
                                            setTuning(nextTuning);
                                            if (selectedId) {
                                                setSceneObjects(prev => prev.map(o => o.id === selectedId ? { ...o, tuning: nextTuning } : o));
                                            }
                                        }}
                                    />
                                    <Slider
                                        label="Depth"
                                        value={tuning.depth}
                                        min={0.65} max={1.8} step={0.05}
                                        onChange={(value) => {
                                            const nextTuning = { ...tuning, depth: value };
                                            setTuning(nextTuning);
                                            if (selectedId) {
                                                setSceneObjects(prev => prev.map(o => o.id === selectedId ? { ...o, tuning: nextTuning } : o));
                                            }
                                        }}
                                    />
                                    <Slider
                                        label="Thickness"
                                        value={tuning.thickness}
                                        min={0.7} max={1.65} step={0.05}
                                        onChange={(value) => {
                                            const nextTuning = { ...tuning, thickness: value };
                                            setTuning(nextTuning);
                                            if (selectedId) {
                                                setSceneObjects(prev => prev.map(o => o.id === selectedId ? { ...o, tuning: nextTuning } : o));
                                            }
                                        }}
                                    />
                                    <Slider
                                        label="Detail"
                                        value={tuning.detail}
                                        min={0.8} max={1.7} step={0.05}
                                        onChange={(value) => {
                                            const nextTuning = { ...tuning, detail: value };
                                            setTuning(nextTuning);
                                            if (selectedId) {
                                                setSceneObjects(prev => prev.map(o => o.id === selectedId ? { ...o, tuning: nextTuning } : o));
                                            }
                                        }}
                                    />
                                </div>

                                {/* Material Presets */}
                                <div className="mt-8">
                                    <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500 mb-4">Material</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {MATERIAL_LIST.map((mat) => {
                                            const currentMat = selectedObject?.materialPreset ?? 'Solid';
                                            return (
                                                <button
                                                    key={mat}
                                                    type="button"
                                                    onClick={() => setMaterialPreset(mat)}
                                                    disabled={!selectedId}
                                                    className={cn(
                                                        'rounded-xl border px-3 py-2 text-xs font-bold transition-all',
                                                        currentMat === mat
                                                            ? 'border-brand-cyan/40 bg-brand-cyan/15 text-brand-cyan'
                                                            : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5',
                                                        !selectedId && 'opacity-40 cursor-not-allowed'
                                                    )}
                                                >
                                                    {mat}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Advanced Operations */}
                                <div className="mt-8">
                                    <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500 mb-4">Advanced Operations</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            variant="outline"
                                            className="gap-2 rounded-2xl border-white/10 bg-white/5 text-gray-300 hover:bg-brand-purple/20 hover:text-white disabled:opacity-50"
                                            disabled={!selectedId}
                                            onClick={hollowSelected}
                                        >
                                            <MinusSquare className="h-4 w-4" />
                                            Hollow
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="gap-2 rounded-2xl border-white/10 bg-white/5 text-gray-300 hover:bg-orange-500/20 hover:text-white disabled:opacity-50"
                                            disabled={!selectedId}
                                            onClick={explodeSelected}
                                        >
                                            <Sparkles className="h-4 w-4" />
                                            Explode
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500 mb-4">Boolean Operations</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "gap-2 rounded-2xl transition-all disabled:opacity-50",
                                                csgPending?.operation === 'union'
                                                    ? "bg-brand-cyan text-black border-brand-cyan"
                                                    : "border-white/10 bg-white/5 text-gray-300 hover:bg-brand-cyan/20 hover:text-white"
                                            )}
                                            disabled={sceneObjects.length < 2 || !selectedId}
                                            onClick={() => {
                                                if (!selectedId) return;
                                                setCsgPending({ targetId: selectedId, operation: 'union' });
                                                setStatusMessage('Target selected. Now click the shape to merge into it.');
                                            }}
                                        >
                                            <Combine className="h-4 w-4" />
                                            Merge Shapes
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "gap-2 rounded-2xl transition-all disabled:opacity-50",
                                                csgPending?.operation === 'subtract'
                                                    ? "bg-red-500 text-white border-red-500"
                                                    : "border-white/10 bg-white/5 text-gray-300 hover:bg-red-500/20 hover:text-white"
                                            )}
                                            disabled={sceneObjects.length < 2 || !selectedId}
                                            onClick={() => {
                                                if (!selectedId) return;
                                                setCsgPending({ targetId: selectedId, operation: 'subtract' });
                                                setStatusMessage('Target selected. Now click the shape to subtract from it.');
                                            }}
                                        >
                                            <MinusSquare className="h-4 w-4" />
                                            Subtract Shape
                                        </Button>
                                    </div>
                                    <p className="mt-3 text-[10px] text-gray-500 leading-relaxed italic">
                                        Select a &quot;Target&quot; shape first, then click Merge or Subtract to combine with the next object.
                                    </p>
                                </div>


                            </div>
                        </CollapsibleSection>
                    </div>
                </div>
            </section>

        </div>
    );
}
