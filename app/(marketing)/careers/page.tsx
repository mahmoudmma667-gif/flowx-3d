import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CareersPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold font-space text-white">
                    Join the <span className="text-brand-cyan">Revolution</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    Help us build the future of spatial computing. We&apos;re looking for visionaries, creators, and problem solvers.
                </p>
            </div>

            <div className="bg-gradient-to-r from-brand-cyan/20 to-brand-purple/20 rounded-3xl p-8 md:p-12 text-center space-y-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white">Why Flowx 3D?</h2>
                <p className="text-gray-300 max-w-2xl mx-auto">
                    Work on cutting-edge WebXR and Computer Vision technology.
                    Enjoy a remote-first culture, competitive equity packages, and the freedom to innovate.
                </p>
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-bold font-space text-white border-b border-white/10 pb-4">Open Positions</h2>

                <div className="grid gap-4">
                    {[
                        { role: "Senior 3D Graphics Engineer", type: "Remote", dept: "Engineering" },
                        { role: "Computer Vision Researcher", type: "Remote", dept: "R&D" },
                        { role: "Product Designer (UI/UX)", type: "Remote", dept: "Design" },
                        { role: "Full Stack Developer", type: "Remote", dept: "Engineering" }
                    ].map((job, index) => (
                        <div key={index} className="flex items-center justify-between p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group cursor-pointer">
                            <div>
                                <h3 className="text-lg font-bold text-white group-hover:text-brand-cyan transition-colors">{job.role}</h3>
                                <div className="flex gap-4 text-sm text-gray-400 mt-1">
                                    <span>{job.dept}</span>
                                    <span>/</span>
                                    <span>{job.type}</span>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform">
                                Apply <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
            <div className="text-center pt-8">
                <p className="text-gray-500">Don&apos;t see your role? Email us at careers@flowx3d.com</p>
            </div>
        </div>
    );
}
