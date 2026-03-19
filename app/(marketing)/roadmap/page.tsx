export default function RoadmapPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold font-space text-white">Product Roadmap</h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    Our journey to redefine spatial computing. Here&apos;s what we&apos;ve built and where we&apos;re going next.
                </p>
            </div>

            <div className="relative border-l border-white/10 ml-4 md:ml-0 space-y-12 md:space-y-0">
                {[
                    {
                        phase: "Phase 1: Foundation",
                        date: "Q4 2024",
                        status: "Completed",
                        items: ["Core 3D Engine", "Basic Hand Tracking", "GLB/GLTF Support", "Alpha Release"],
                        color: "brand-cyan"
                    },
                    {
                        phase: "Phase 2: Interaction",
                        date: "Q1 2025",
                        status: "In Progress",
                        items: ["Advanced Gestures (Grab, Pinch)", "Physics Integration", "Login & User Profiles", "Model Library V1"],
                        color: "brand-purple"
                    },
                    {
                        phase: "Phase 3: Collaboration",
                        date: "Q3 2025",
                        status: "Planned",
                        items: ["Multi-user Rooms", "Voice Chat", "Shared Spatial Context", "Cloud Saving"],
                        color: "pink-500"
                    },
                    {
                        phase: "Phase 4: Ecosystem",
                        date: "2026",
                        status: "Vision",
                        items: ["Developer API / SDK", "Plugin Store", "VR/AR Headset Support (WebXR)", "Enterprise Solutions"],
                        color: "yellow-500"
                    }
                ].map((phase, index) => (
                    <div key={index} className="md:flex group">
                        <div className={`absolute left-0 md:left-1/2 w-4 h-4 -ml-2 rounded-full border-2 border-white/20 bg-brand-dark group-hover:border-${phase.color} group-hover:scale-125 transition-all z-10`} style={{ top: '2rem' }} />

                        <div className={`md:w-1/2 p-4 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:ml-auto'}`}>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
                                <div className={`flex items-center gap-3 mb-2 ${index % 2 === 0 ? 'md:justify-end' : ''}`}>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded text-${phase.color} bg-${phase.color}/10 border border-${phase.color}/20`}>
                                        {phase.status}
                                    </span>
                                    <span className="text-sm text-gray-500 font-mono">{phase.date}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4">{phase.phase}</h3>
                                <ul className={`space-y-2 text-sm text-gray-400 ${index % 2 === 0 ? 'md:flex md:flex-col md:items-end' : ''}`}>
                                    {phase.items.map((item, itemIndex) => (
                                        <li key={itemIndex} className="flex items-center gap-2">
                                            {index % 2 !== 0 && <span className={`w-1.5 h-1.5 rounded-full bg-${phase.color}`}></span>}
                                            {item}
                                            {index % 2 === 0 && <span className={`w-1.5 h-1.5 rounded-full bg-${phase.color}`}></span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
