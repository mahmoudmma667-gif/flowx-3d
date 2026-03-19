'use client';

import React, { useRef } from 'react';
import type { AirSketchPoint } from '@/lib/air-sketch/engine';
import { cn } from '@/lib/utils';

interface SketchSurfaceProps {
    className?: string;
    rawPoints: AirSketchPoint[];
    smoothPoints: AirSketchPoint[];
    strokeHistory: AirSketchPoint[][];
    recording: boolean;
    strokeColor?: string;
    strokeColors?: string[];
    tool?: 'draw' | 'erase';
    onSketchStart: (point: AirSketchPoint) => void;
    onSketchMove: (point: AirSketchPoint) => void;
    onSketchEnd: () => void;
    onErase?: (point: AirSketchPoint) => void;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function worldToSurface(point: AirSketchPoint) {
    const normalizedX = clamp(point.x / 6 + 0.5, 0, 1);
    const normalizedY = clamp(0.5 - point.y / 4.5, 0, 1);

    return {
        x: normalizedX * 100,
        y: normalizedY * 100,
    };
}

function pointerToPoint(event: React.PointerEvent<HTMLDivElement>, rect: DOMRect): AirSketchPoint {
    const normalizedX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const normalizedY = clamp((event.clientY - rect.top) / rect.height, 0, 1);

    return {
        x: (normalizedX - 0.5) * 6,
        y: (0.5 - normalizedY) * 4.5,
        z: 0,
        timestamp: performance.now(),
    };
}

function toPolyline(points: AirSketchPoint[]) {
    return points
        .map((point) => {
            const projected = worldToSurface(point);
            return `${projected.x},${projected.y}`;
        })
        .join(' ');
}

export function SketchSurface({
    className,
    rawPoints,
    smoothPoints,
    strokeHistory,
    recording,
    strokeColor = '#00f0ff',
    strokeColors = [],
    tool = 'draw',
    onSketchStart,
    onSketchMove,
    onSketchEnd,
    onErase,
}: SketchSurfaceProps) {
    const surfaceRef = useRef<HTMLDivElement>(null);
    const drawingRef = useRef(false);

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        const rect = surfaceRef.current?.getBoundingClientRect();

        if (!rect) {
            return;
        }

        drawingRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        const point = pointerToPoint(event, rect);

        if (tool === 'erase') {
            onErase?.(point);
            return;
        }

        onSketchStart(point);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!drawingRef.current) {
            return;
        }

        const rect = surfaceRef.current?.getBoundingClientRect();

        if (!rect) {
            return;
        }

        const point = pointerToPoint(event, rect);

        if (tool === 'erase') {
            onErase?.(point);
            return;
        }

        onSketchMove(point);
    };

    const finishDrawing = () => {
        if (!drawingRef.current) {
            return;
        }

        drawingRef.current = false;
        if (tool === 'erase') {
            return;
        }
        onSketchEnd();
    };

    const totalStrokes = strokeHistory.length + (rawPoints.length > 1 ? 1 : 0);

    return (
        <div
            ref={surfaceRef}
            className={cn(
                "relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top,#0d2033,transparent_42%),linear-gradient(180deg,#060d18,#07101f)]",
                tool === 'erase' ? 'cursor-cell' : 'cursor-crosshair',
                className,
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrawing}
            onPointerLeave={finishDrawing}
            onPointerCancel={finishDrawing}
        >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:36px_36px] opacity-25" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.08),transparent_55%)]" />

            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                {strokeHistory.map((stroke, index) => (
                    stroke.length > 1 && (
                        <polyline
                            key={`history-${index}`}
                            fill="none"
                            stroke={strokeColors[index] || strokeColor}
                            strokeOpacity="0.5"
                            strokeWidth="1.2"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            points={toPolyline(stroke)}
                        />
                    )
                ))}
                {rawPoints.length > 1 && (
                    <polyline
                        fill="none"
                        stroke={strokeColor}
                        strokeOpacity="0.65"
                        strokeWidth="1.3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points={toPolyline(rawPoints)}
                    />
                )}
                {smoothPoints.length > 1 && (
                    <polyline
                        fill="none"
                        stroke={strokeColor}
                        strokeOpacity="0.92"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points={toPolyline(smoothPoints)}
                    />
                )}
            </svg>

            <div className="absolute left-5 top-5 flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/80">
                    {tool === 'erase' ? 'Eraser active' : recording ? 'Drawing on pad' : 'Sketch Pad'}
                </span>
                {totalStrokes > 0 && (
                    <span className="rounded-full border border-brand-cyan/20 bg-brand-cyan/10 px-2.5 py-1 text-[10px] font-bold text-brand-cyan">
                        {totalStrokes} stroke{totalStrokes !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            <div className="absolute bottom-5 left-5 max-w-xs rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-white/80">
                {tool === 'erase'
                    ? 'Drag the eraser across the path to remove sections of the draft before rebuilding the model.'
                    : 'Draw freely — lift and continue drawing to add more strokes. All strokes combine into one 3D model.'}
            </div>
        </div>
    );
}
