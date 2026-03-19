'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Cpu, Zap, Layers } from 'lucide-react';

const techCards = [
    {
        icon: <Eye className="w-8 h-8 text-brand-cyan" />,
        title: "رؤية الحاسوب",
        description: "باستخدام إطار عمل MediaPipe، نقوم بتتبع اليد في الوقت الفعلي بدقة تصل إلى أقل من ملليمتر مباشرة في المتصفح.",
        tags: ["أيدي ميديا بايب", "TensorFlow.js", "WASM"],
        glowColor: "rgba(0, 240, 255, 0.15)",
        bgIcon: <Eye className="absolute -right-4 -top-4 w-32 h-32 opacity-10 text-brand-cyan blur-sm" />
    },
    {
        icon: <Layers className="w-8 h-8 text-brand-purple" />,
        title: "محرك عرض ثلاثي الأبعاد",
        description: "تم بناؤها على أساس Three.js و React Three Fiber، مما يضمن أداءً بمعدل 60 إطارًا في الثانية وعرضًا واقعيًا بتقنية PBR.",
        tags: ["WebGL 2.0", "ألياف رياكت ثري", "Three.js"],
        glowColor: "rgba(189, 0, 255, 0.15)",
        bgIcon: <Layers className="absolute -right-4 -top-4 w-32 h-32 opacity-10 text-brand-purple blur-sm" />
    },
    {
        icon: <Zap className="w-8 h-8 text-yellow-400" />,
        title: "تحسين الأداء",
        description: "الاستفادة من (WASM) WebAssembly و Web Workers متعددة الخيوط لتفريغ العمليات الحسابية الثقيلة من الخيط الرئيسي.",
        tags: ["توربو باك", "OffscreenCanvas", "عمال الويب"],
        glowColor: "rgba(250, 204, 21, 0.15)",
        bgIcon: <Zap className="absolute -right-4 -top-4 w-32 h-32 opacity-10 text-yellow-400 blur-sm" />
    },
    {
        icon: <Cpu className="w-8 h-8 text-green-400" />,
        title: "التعرف على الإيماءات",
        description: "يقوم محرك الإيماءات الخاص بنا بترجمة بيانات المعالم الخام إلى إجراءات دلالية مثل الإمساك والضغط والتمرير.",
        tags: ["التنعيم التنبؤي", "آلات الحالة", "حلول IK مخصصة"],
        glowColor: "rgba(74, 222, 128, 0.15)",
        bgIcon: <Cpu className="absolute -right-4 -top-4 w-32 h-32 opacity-10 text-green-400 blur-sm" />
    }
];

export function TechStackSection() {
    return (
        <section className="py-32 relative bg-brand-dark overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {techCards.map((card, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1, duration: 0.6 }}
                            viewport={{ once: true }}
                            className="group relative"
                        >
                            {/* Card Container */}
                            <div className="relative h-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-10 backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:bg-white/[0.05]">
                                {card.bgIcon}
                                
                                {/* Glow Effect */}
                                <div 
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                                    style={{ background: `radial-gradient(circle at 70% 30%, ${card.glowColor}, transparent 70%)` }}
                                />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="mb-8 flex items-center justify-between">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-white/5 shadow-2xl transition-transform duration-500 group-hover:scale-110">
                                            {card.icon}
                                        </div>
                                    </div>

                                    <h3 className="mb-4 font-space text-3xl font-bold text-white pr-2 border-r-4 border-brand-cyan/40">
                                        {card.title}
                                    </h3>

                                    <p className="mb-8 text-lg leading-relaxed text-gray-400 text-right dir-rtl">
                                        {card.description}
                                    </p>

                                    <div className="mt-auto flex flex-wrap gap-2 justify-end">
                                        {card.tags.map((tag) => (
                                            <span 
                                                key={tag}
                                                className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-300 transition-colors group-hover:border-white/20 group-hover:text-white"
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
