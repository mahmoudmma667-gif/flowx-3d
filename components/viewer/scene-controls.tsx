'use client';

import React from 'react';
import { Environment, useInteractionStore } from '@/lib/store/interaction-store';
import { motion } from 'framer-motion';
import {
    Sun, Grid3x3, Box, Play, Pause, RotateCcw,
    ChevronDown, Zap
} from 'lucide-react';

const ENVIRONMENTS = [
    { value: 'city', label: 'City' },
    { value: 'sunset', label: 'Sunset' },
    { value: 'dawn', label: 'Dawn' },
    { value: 'night', label: 'Night' },
    { value: 'studio', label: 'Studio' },
    { value: 'park', label: 'Park' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'forest', label: 'Forest' },
    { value: 'lobby', label: 'Lobby' },
    { value: 'warehouse', label: 'Warehouse' },
] as const;

function SliderControl(props: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (v: number) => void;
    icon: React.ElementType;
    unit?: string;
}) {
    const { label, value, min, max, step, onChange, icon, unit = '' } = props;
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {React.createElement(icon, { className: "w-3.5 h-3.5 text-brand-cyan" })}
                    <span className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">{label}</span>
                </div>
                <span className="text-xs font-mono text-white">{value.toFixed(step < 1 ? 1 : 0)}{unit}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-brand-cyan
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-cyan
                    [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,240,255,0.5)]
                    [&::-webkit-slider-thumb]:cursor-pointer
                    hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform"
            />
        </div>
    );
}

function ToggleSwitch(props: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    icon: React.ElementType;
}) {
    const { label, checked, onChange, icon } = props;
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                {React.createElement(icon, { className: "w-3.5 h-3.5 text-brand-cyan" })}
                <span className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">{label}</span>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative w-10 h-5 rounded-full transition-all duration-300 ${checked
                    ? 'bg-brand-cyan/30 border border-brand-cyan/50'
                    : 'bg-white/10 border border-white/10'
                    }`}
            >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${checked
                    ? 'left-5 bg-brand-cyan shadow-[0_0_8px_rgba(0,240,255,0.5)]'
                    : 'left-0.5 bg-gray-500'
                    }`} />
            </button>
        </div>
    );
}

interface SceneControlsProps {
    hasAnimations?: boolean;
    animationNames?: string[];
}

export function SceneControls({ hasAnimations = false, animationNames = [] }: SceneControlsProps) {
    const {
        rotation,
        scale,
        environment,
        wireframe,
        showGrid,
        lightIntensity,
        animationPlaying,
        animationSpeed,
        selectedAnimation,
        availableAnimations,
        updateRotation,
        updateScale,
        resetTransform,
        setEnvironment,
        setWireframe,
        setShowGrid,
        setLightIntensity,
        setAnimationPlaying,
        setAnimationSpeed,
        setSelectedAnimation,
    } = useInteractionStore();

    const resolvedAnimationNames = animationNames.length > 0 ? animationNames : availableAnimations;
    const shouldShowAnimations = hasAnimations || resolvedAnimationNames.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className="w-72 glass-panel rounded-3xl border border-white/5 overflow-hidden flex flex-col max-h-[calc(100vh-120px)]"
        >
            <div className="p-5 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-brand-cyan/10 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-brand-cyan" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white font-space">Scene Controls</h3>
                        <p className="text-[10px] text-gray-500">Customize your view</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Transform</p>
                        <button
                            onClick={resetTransform}
                            className="text-[10px] text-brand-cyan hover:text-white transition-colors flex items-center gap-1"
                        >
                            <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                    </div>

                    <SliderControl
                        label="Rotation X"
                        value={rotation.x}
                        min={-Math.PI}
                        max={Math.PI}
                        step={0.01}
                        onChange={(value) => updateRotation(0, (value - rotation.x) * 200)}
                        icon={RotateCcw}
                        unit="rad"
                    />
                    <SliderControl
                        label="Rotation Y"
                        value={rotation.y}
                        min={-Math.PI}
                        max={Math.PI}
                        step={0.01}
                        onChange={(value) => updateRotation((value - rotation.y) * 200, 0)}
                        icon={RotateCcw}
                        unit="rad"
                    />
                    <SliderControl
                        label="Scale"
                        value={scale}
                        min={0.5}
                        max={3}
                        step={0.1}
                        onChange={(value) => updateScale(value / scale)}
                        icon={Box}
                        unit="x"
                    />
                </div>

                <div className="space-y-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Environment</p>

                    <div className="relative">
                        <select
                            value={environment}
                            onChange={(e) => setEnvironment(e.target.value as Environment)}
                            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white
                                focus:outline-none focus:border-brand-cyan/50 cursor-pointer transition-colors
                                hover:border-white/20"
                        >
                            {ENVIRONMENTS.map((env) => (
                                <option key={env.value} value={env.value} className="bg-brand-dark text-white">
                                    {env.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>

                    <SliderControl
                        label="Light Intensity"
                        value={lightIntensity}
                        min={0}
                        max={2}
                        step={0.1}
                        onChange={setLightIntensity}
                        icon={Sun}
                    />
                </div>

                <div className="space-y-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Display</p>

                    <ToggleSwitch
                        label="Wireframe"
                        checked={wireframe}
                        onChange={setWireframe}
                        icon={Grid3x3}
                    />
                    <ToggleSwitch
                        label="Grid Floor"
                        checked={showGrid}
                        onChange={setShowGrid}
                        icon={Grid3x3}
                    />
                </div>

                {shouldShowAnimations && resolvedAnimationNames.length > 0 && (
                    <div className="space-y-4">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Animation</p>

                        {resolvedAnimationNames.length > 1 && (
                            <div className="relative">
                                <select
                                    value={selectedAnimation}
                                    onChange={(e) => setSelectedAnimation(parseInt(e.target.value, 10))}
                                    className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white
                                        focus:outline-none focus:border-brand-cyan/50 cursor-pointer transition-colors"
                                >
                                    {resolvedAnimationNames.map((name, index) => (
                                        <option key={name} value={index} className="bg-brand-dark text-white">
                                            {name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setAnimationPlaying(!animationPlaying)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${animationPlaying
                                    ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30'
                                    : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
                                    }`}
                            >
                                {animationPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>

                            <div className="flex-1">
                                <SliderControl
                                    label="Speed"
                                    value={animationSpeed}
                                    min={0.1}
                                    max={3}
                                    step={0.1}
                                    onChange={setAnimationSpeed}
                                    icon={Zap}
                                    unit="x"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
