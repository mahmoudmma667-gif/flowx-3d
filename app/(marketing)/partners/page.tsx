import { Component, Cpu, Database, Globe } from "lucide-react";

export default function PartnersPage() {
    return (
        <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold font-space text-white">Our Partners</h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    We collaborate with industry leaders to push the boundaries of the 3D web.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                    { name: "TechCorp", icon: Cpu },
                    { name: "GlobalNet", icon: Globe },
                    { name: "DataFlow", icon: Database },
                    { name: "Pixel Studio", icon: Component },
                    { name: "AI Research Lab", icon: Cpu },
                    { name: "Web Foundation", icon: Globe },
                    { name: "Cloud Systems", icon: Database },
                    { name: "Design Co", icon: Component },
                ].map((partner, i) => (
                    <div key={i} className="aspect-square bg-white/5 rounded-3xl flex flex-col items-center justify-center gap-4 hover:bg-white/10 transition-colors border border-white/5 cursor-pointer group">
                        <partner.icon className="w-12 h-12 text-gray-600 group-hover:text-brand-cyan transition-colors" />
                        <span className="font-bold text-gray-500 group-hover:text-white transition-colors">{partner.name}</span>
                    </div>
                ))}
            </div>

            <div className="bg-brand-cyan/10 rounded-3xl p-12 text-center border border-brand-cyan/20">
                <h2 className="text-2xl font-bold text-white mb-4">Become a Partner</h2>
                <p className="text-gray-400 mb-8 max-w-xl mx-auto">Join us in shaping the future of spatial computing. Get early access to our APIs and co-marketing opportunities.</p>
                <button className="bg-brand-cyan text-brand-dark px-8 py-3 rounded-full font-bold hover:bg-brand-cyan/90 transition-colors">
                    Apply for Partnership
                </button>
            </div>
        </div>
    );
}
