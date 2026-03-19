'use client';

import React from 'react';
import { Activity, Zap, Shield, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricsDisplayProps {
    accuracy: number;
    latency: number;
    fps: number;
    confidence: number;
    className?: string;
}

export function RealtimeAccuracyPanel({ accuracy, latency, fps, confidence, className }: MetricsDisplayProps) {
    return (
        <div className={cn(
            "rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl shadow-2xl overflow-hidden relative",
            className
        )}>
            {/* Animated Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-500 blur-sm animate-ping" />
                    </div>
                    <h4 className="text-sm font-semibold text-white tracking-wider uppercase opacity-80">
                        Live Engine Telemetry
                    </h4>
                </div>
                <Activity className="h-4 w-4 text-white/40" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Accuracy */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white/60">
                        <Shield className="h-3 w-3 text-blue-400" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Accuracy</span>
                    </div>
                    <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className="absolute h-full bg-blue-500 transition-all duration-500 rounded-full"
                            style={{ width: `${accuracy}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-xl font-mono font-bold text-white tracking-tighter">
                            {accuracy.toFixed(1)}%
                        </span>
                    </div>
                </div>

                {/* Confidence */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white/60">
                        <Zap className="h-3 w-3 text-amber-400" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Confidence</span>
                    </div>
                    <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className="absolute h-full bg-amber-500 transition-all duration-500 rounded-full"
                            style={{ width: `${confidence}%` }}
                        />
                    </div>
                    <div className="text-xl font-mono font-bold text-white tracking-tighter">
                        {confidence.toFixed(1)}%
                    </div>
                </div>

                {/* Latency */}
                <div className="pt-2 space-y-1">
                    <div className="flex items-center gap-2 text-white/40">
                        <BarChart3 className="h-3 w-3" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">latency</span>
                    </div>
                    <div className="text-sm font-mono font-semibold text-white/80">
                        {latency}ms
                    </div>
                </div>

                {/* FPS */}
                <div className="pt-2 space-y-1 text-right">
                    <div className="flex items-center gap-2 text-white/40 justify-end">
                        <span className="text-[10px] uppercase font-bold tracking-widest">stability</span>
                    </div>
                    <div className={cn(
                        "text-sm font-mono font-semibold",
                        fps > 55 ? "text-emerald-400" : fps > 30 ? "text-amber-400" : "text-rose-400"
                    )}>
                        {fps} FPS
                    </div>
                </div>
            </div>

            {/* Bottom Glow */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        </div>
    );
}
