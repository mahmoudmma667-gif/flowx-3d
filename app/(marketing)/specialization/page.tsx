import { Box, Layers, Monitor, ScanFace } from "lucide-react";

export default function SpecializationPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold font-space text-white">Our Specialization & Expertise</h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    Narrow focus, deep impact. We specialize in the intersection of Web, 3D, and AI.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {[
                    {
                        title: "Web-Based Spatial Computing",
                        desc: "Bringing high-fidelity spatial experiences to standard web browsers without downloads or installations.",
                        icon: Monitor
                    },
                    {
                        title: "Human-Computer Interaction (HCI)",
                        desc: "Researching and developing novel input methods that prioritize natural human movement over abstract controllers.",
                        icon: ScanFace
                    },
                    {
                        title: "Real-Time 3D Optimization",
                        desc: "Optimizing complex geometries and textures for performance on mobile and lower-end devices.",
                        icon: Box
                    },
                    {
                        title: "AI-Driven UX",
                        desc: "Using machine learning to predict user intent and adapt interfaces contextually.",
                        icon: Layers
                    }
                ].map((spec, i) => (
                    <div key={i} className="flex gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-colors">
                        <div className="shrink-0 w-12 h-12 bg-gradient-to-br from-brand-cyan to-brand-purple rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-cyan/20">
                            <spec.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">{spec.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{spec.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
