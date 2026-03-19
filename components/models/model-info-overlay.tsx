'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ModelInfoOverlayProps {
    model: {
        id: string;
        name: string;
        description: string | null;
    };
}

export function ModelInfoOverlay({ model }: ModelInfoOverlayProps) {
    return (
        <div className="absolute top-24 left-8 pointer-events-none z-10">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-md"
            >
                <Link href="/library" className="pointer-events-auto inline-block mb-8">
                    <Button variant="ghost" size="sm" className="text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all group">
                        <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Library
                    </Button>
                </Link>

                <div className="space-y-4">
                    <div>
                        <h1 className="text-5xl font-bold font-space text-white leading-tight mb-2 uppercase tracking-tighter">
                            {model.name}
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-1 rounded bg-brand-cyan/10 text-brand-cyan text-[10px] font-bold tracking-widest border border-brand-cyan/20">3D ASSET</span>
                            <span className="text-white/40 text-xs font-mono lowercase">ID: {model.id.slice(0, 8)}...</span>
                        </div>
                    </div>

                    <div className="p-6 glass-panel rounded-3xl border border-white/5 pointer-events-auto max-w-[320px] group transition-all hover:border-brand-cyan/20">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                <Info className="w-5 h-5 text-brand-cyan" />
                            </div>
                            <div className="space-y-4 flex-1">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Description</p>
                                    <p className="text-sm text-white/70 leading-relaxed italic">
                                        {model.description || "A high-fidelity 3D model processed through the Flowx 3D spatial intelligence engine."}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Scale</p>
                                        <p className="text-sm font-mono text-white">1:1 REAL</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Env</p>
                                        <p className="text-sm font-mono text-white">STUDIO</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
