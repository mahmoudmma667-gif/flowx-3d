import { Download } from "lucide-react";

export default function PressPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold font-space text-white">Press & Media</h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    Resources, assets, and contact information for media inquiries.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                    <h2 className="text-2xl font-bold text-white mb-4">Media Inquiries</h2>
                    <p className="text-gray-400 mb-6">
                        For interview requests, press releases, or commentary on spatial computing, please contact our PR team.
                    </p>
                    <a href="mailto:press@flowx3d.com" className="text-brand-cyan font-bold hover:underline text-lg">
                        press@flowx3d.com
                    </a>
                </div>

                <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                    <h2 className="text-2xl font-bold text-white mb-4">Brand Assets</h2>
                    <p className="text-gray-400 mb-6">
                        Download our logo pack, product screenshots, and executive headshots.
                    </p>
                    <button className="flex items-center gap-2 bg-white text-brand-dark px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors">
                        <Download className="w-4 h-4 text-brand-dark" /> Download Media Kit
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Recent Coverage</h2>
                <div className="space-y-4">
                    {[
                        { outlet: "TechCrunch", title: "Flowx 3D Brings Minority Report Style Controls to the Web", date: "Feb 2026" },
                        { outlet: "The Verge", title: "Hands-on with the future of browser-based VR", date: "Jan 2026" },
                        { outlet: "Wired", title: "Why Spatial Computing is the Next Big Thing", date: "Dec 2025" }
                    ].map((news, i) => (
                        <div key={i} className="border-b border-white/10 pb-4 last:border-0 hover:bg-white/5 p-4 rounded-xl transition-colors cursor-pointer">
                            <p className="text-sm text-brand-cyan font-bold mb-1">{news.outlet}</p>
                            <h3 className="text-lg text-white hover:text-brand-cyan transition-colors">{news.title}</h3>
                            <p className="text-xs text-gray-500 mt-1">{news.date}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
