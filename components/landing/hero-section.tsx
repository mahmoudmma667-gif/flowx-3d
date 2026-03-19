'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ThreeBackground } from './three-background';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
            <ThreeBackground />

            <div className="container mx-auto px-4 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-6 max-w-4xl mx-auto pointer-events-none"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4 pointer-events-auto">
                        <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
                        <span className="text-xs text-brand-cyan uppercase tracking-wider font-semibold">مشروع فلوكس الإصدار 3.3</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold font-space tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-400">
                        Spatial Intelligence.
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-purple">Unleashed.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-inter leading-relaxed">
                        Flowx 3D is a next-generation neural interface that lets you manipulate complex 3D structures with zero friction.
                        <span className="block mt-2 text-brand-cyan/80 font-medium">
                            No sensors. No hardware. Just you and the machine.
                        </span>
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 pointer-events-auto">
                        <Link href="/upload">
                            <Button size="lg" className="group bg-brand-purple text-white hover:bg-brand-purple/90 shadow-[0_0_30px_rgba(189,0,255,0.3)] hover:shadow-[0_0_50px_rgba(189,0,255,0.5)] transition-all duration-300">
                                <span className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V3m0 0L8 7m4-4l4 4" />
                                    </svg>
                                    تحميل النموذج
                                </span>
                            </Button>
                        </Link>
                        <Link href="/air-sketch">
                            <Button size="lg" className="group bg-brand-cyan text-brand-dark hover:bg-brand-cyan/90 shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:shadow-[0_0_50px_rgba(0,240,255,0.5)] transition-all duration-300">
                                <span className="flex items-center gap-2 font-bold">
                                    ابدأ الرسم
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Button>
                        </Link>
                        <Link href="/air-sketch">
                            <Button variant="outline" size="lg" className="group border-white/20 text-white hover:bg-white/5 transition-all duration-300">
                                استوديو الإطلاق
                            </Button>
                        </Link>
                    </div>

                    <div className="pt-12 grid grid-cols-3 gap-8 max-w-lg mx-auto border-t border-white/5 mt-12">
                        {[
                            { label: 'كمون الاستجابة (ms)', value: '< 12ms' },
                            { label: 'دقة النمذجة (Spatial)', value: '99.9%' },
                            { label: 'الجلسات المتزامنة', value: '2500+' },
                        ].map((stat, i) => (
                            <div key={i} className="text-center group cursor-default">
                                <div className="text-2xl font-bold text-white font-space group-hover:text-brand-cyan transition-colors">{stat.value}</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mt-1 font-bold">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
