'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Hand, MousePointerClick, ArrowRight } from 'lucide-react';

const steps = [
    {
        icon: <Camera className="w-10 h-10 text-brand-cyan" />,
        title: "Initialize Vision",
        description: "Secure local handshake with your device's camera. Zero data leaves your machine.",
    },
    {
        icon: <Hand className="w-10 h-10 text-brand-purple" />,
        title: "Neural Calibration",
        description: "Our light-weight neural engine maps your anatomy into a high-fidelity control rig.",
    },
    {
        icon: <MousePointerClick className="w-10 h-10 text-white" />,
        title: "Seamless Control",
        description: "Manipulate digital geometry with the same intuition as physical objects.",
    },
];

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-32 relative overflow-hidden bg-brand-dark">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-purple/5 blur-[120px] rounded-full -z-10" />

            <div className="container mx-auto px-4">
                <div className="text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-6xl font-bold font-space text-white mb-6">
                            Zero Friction. <span className="text-brand-cyan">Total Mastery.</span>
                        </h2>
                        <p className="text-gray-500 text-lg uppercase tracking-widest font-bold">Calibration in <span className="text-white">~400ms</span></p>
                    </motion.div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative max-w-6xl mx-auto">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-cyan/40 to-transparent -z-10">
                        <motion.div
                            initial={{ scaleX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            className="w-full h-full bg-brand-cyan origin-left shadow-[0_0_15px_rgba(0,240,255,0.5)]"
                        />
                    </div>

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.3, duration: 0.8 }}
                            viewport={{ once: true }}
                            className="flex flex-col items-center text-center max-w-xs relative group"
                        >
                            <div className="w-24 h-24 rounded-[2rem] glass-panel border border-white/10 flex items-center justify-center mb-8 shadow-2xl group-hover:border-brand-cyan/50 group-hover:bg-brand-cyan/5 transition-all duration-500 scale-100 group-hover:rotate-6">
                                {step.icon}
                            </div>
                            <h3 className="text-2xl font-bold font-space text-white mb-4 group-hover:text-brand-cyan transition-colors">{step.title}</h3>
                            <p className="text-gray-400 leading-relaxed font-light">{step.description}</p>

                            {index < steps.length - 1 && (
                                <ArrowRight className="md:hidden w-6 h-6 text-brand-cyan mt-12 rotate-90 animate-bounce" />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
