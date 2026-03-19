import { Cpu, Eye, Layers, Zap } from "lucide-react";

export default function TechnologyPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-16">
            <div className="text-center space-y-6">
                <h1 className="text-4xl md:text-5xl font-bold font-space text-white">
                    Powered by <span className="text-brand-cyan">Advanced AI</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    Under the hood of Flowx 3D lies a sophisticated stack of computer vision, machine learning, and graphics rendering technologies.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {[
                    {
                        icon: Eye,
                        title: "Computer Vision",
                        desc: "Using Google's MediaPipe framework, we perform real-time hand tracking with sub-millimeter precision directly in the browser.",
                        tech: ["MediaPipe Hands", "TensorFlow.js", "WASM"]
                    },
                    {
                        icon: Layers,
                        title: "3D Rendering Engine",
                        desc: "Built on top of Three.js and React Three Fiber, ensuring 60fps performance and photorealistic PBR rendering.",
                        tech: ["Three.js", "React Three Fiber", "WebGL 2.0"]
                    },
                    {
                        icon: Zap,
                        title: "Performance Optimization",
                        desc: "Leveraging WebAssembly (WASM) and multi-threaded Web Workers to offload heavy computation from the main thread.",
                        tech: ["Web Workers", "OffscreenCanvas", "Turbopack"]
                    },
                    {
                        icon: Cpu,
                        title: "Gesture Recognition",
                        desc: "Our proprietary gesture engine translates raw landmark data into semantic actions like Grab, Pinch, and Swipe.",
                        tech: ["Custom IK Solvers", "State Machines", "Predictive Smoothing"]
                    }
                ].map((item, i) => (
                    <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <item.icon className="w-32 h-32 text-brand-cyan" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-brand-cyan mb-6">
                                <item.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                            <p className="text-gray-400 mb-6 leading-relaxed">{item.desc}</p>
                            <div className="flex flex-wrap gap-2">
                                {item.tech.map((t) => (
                                    <span key={t} className="px-3 py-1 rounded-full bg-brand-cyan/5 text-brand-cyan text-xs font-mono border border-brand-cyan/20">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
