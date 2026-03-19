'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Hand, Box, Zap, Layers, BarChart, MonitorSmartphone } from 'lucide-react';

const features = [
    {
        icon: <Hand className="w-8 h-8 text-brand-cyan" />,
        title: "Neural Hand Tracking",
        description: "Zero-latency computer vision mapping 21 keypoints with sub-millimeter precision.",
        tags: ["MediaPipe", "21 Keypoints", "Real-time"],
        glowColor: "rgba(0, 240, 255, 0.15)",
        bgIcon: <Hand className="absolute -right-4 -top-4 w-32 h-32 opacity-10 text-brand-cyan blur-sm" />
    },
    {
        icon: <Box className="w-8 h-8 text-brand-purple" />,
        title: "Spatial Manipulation",
        description: "Intuitive physics-based interactions that transcend traditional input boundaries.",
        tags: ["Physics-based", "6DOF", "Intuitive"],
        glowColor: "rgba(189, 0, 255, 0.15)",
        bgIcon: <Box className="absolute -right-4 -top-4 w-32 h-32 opacity-10 text-brand-purple blur-sm" />
    },
    {
        icon: <Zap className="w-8 h-8 text-yellow-400" />,
        title: "Deterministic Sync",
        description: "60 FPS deterministic engine ensures fluid motion across all browser environments.",
        tags: ["60 FPS", "Low Latency", "Sync"],
        glowColor: "rgba(250, 204, 21, 0.15)",
        bgIcon: <Zap className="absolute -right-4 -top-4 w-32 h-32 opacity-10 text-yellow-400 blur-sm" />
    },
    {
        icon: <Layers className="w-8 h-8 text-pink-500" />,
        title: "Modular Engine",
        description: "Seamlessly integrate GLB/GLTF assets into the Flowx spatial processing pipeline.",
        tags: ["GLTF/GLB", "Extensible", "PBR"],
        glowColor: "rgba(236, 72, 153, 0.15)",
        bgIcon: <Layers className="absolute -right-4 -top-4 w-32 h-32 opacity-10 text-pink-500 blur-sm" />
    },
    {
        icon: <MonitorSmartphone className="w-8 h-8 text-green-400" />,
        title: "Silicon Optimization",
        description: "Highly optimized WebGL kernels designed for maximum efficiency on any hardware.",
        tags: ["WebGL", "GPU", "Efficient"],
        glowColor: "rgba(74, 222, 128, 0.15)",
        bgIcon: <MonitorSmartphone className="absolute -right-4 -top-4 w-32 h-32 opacity-10 text-green-400 blur-sm" />
    },
    {
        icon: <BarChart className="w-8 h-8 text-blue-500" />,
        title: "Telemetry & Insights",
        description: "Real-time diagnostic metrics on tracking stability and spatial accuracy.",
        tags: ["Metrics", "Stability", "Real-time"],
        glowColor: "rgba(59, 130, 246, 0.15)",
        bgIcon: <BarChart className="absolute -right-4 -top-4 w-32 h-32 opacity-10 text-blue-500 blur-sm" />
    },
];

export function FeaturesSection() {
    return (
        <section id="features" className="py-32 relative bg-brand-dark overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-cyan/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-20 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl md:text-6xl font-bold font-space text-white leading-tight">
                            The Next Frontier of <span className="text-brand-purple">Interface.</span>
                        </h2>
                        <p className="text-gray-500 max-w-2xl mx-auto text-lg mt-4">
                            Harnessing advanced neural tracking to redefine how we interact with the digital world.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.6 }}
                            viewport={{ once: true, margin: "-100px" }}
                            className="group relative"
                        >
                            {/* Card Container */}
                            <div className="relative h-full overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.03] p-10 backdrop-blur-xl transition-all duration-500 hover:border-brand-cyan/20 hover:bg-white/[0.05] hover:-translate-y-2 shadow-2xl">
                                {feature.bgIcon}
                                
                                {/* Glow Effect */}
                                <div 
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                                    style={{ background: `radial-gradient(circle at 10% 20%, ${feature.glowColor}, transparent 70%)` }}
                                />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="mb-8 bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:bg-brand-cyan/10 group-hover:scale-110 transition-all duration-300 border border-white/5">
                                        {feature.icon}
                                    </div>

                                    <h3 className="text-2xl font-bold font-space text-white mb-4 group-hover:text-brand-cyan transition-colors">
                                        {feature.title}
                                    </h3>

                                    <p className="text-gray-400 leading-relaxed font-light mb-8">
                                        {feature.description}
                                    </p>

                                    <div className="mt-auto flex flex-wrap gap-2">
                                        {feature.tags.map((tag) => (
                                            <span 
                                                key={tag}
                                                className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 transition-colors group-hover:border-white/20 group-hover:text-white"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
