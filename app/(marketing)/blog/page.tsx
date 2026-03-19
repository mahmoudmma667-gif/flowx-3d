import { Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function BlogPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold font-space text-white">From the Blog</h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    Insights, updates, and tutorials from the Flowx 3D team.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                    {
                        title: "Introducing Flowx 3D: The Future of WebXR",
                        excerpt: "Today we are excited to announce the public beta of Flowx 3D, bringing hand-tracking to the browser.",
                        date: "Feb 10, 2026",
                        author: "CEO",
                        category: "Announcement"
                    },
                    {
                        title: "How MediaPipe Revoultionized Hand Tracking",
                        excerpt: "A deep dive into the computer vision technology that powers our gesture recognition engine.",
                        date: "Jan 28, 2026",
                        author: "CTO",
                        category: "Engineering"
                    },
                    {
                        title: "Building Performant 3D Scenes with React Three Fiber",
                        excerpt: "Best practices for optimizing WebGL rendering in Next.js applications.",
                        date: "Jan 15, 2026",
                        author: "Lead Dev",
                        category: "Tutorial"
                    },
                ].map((post, i) => (
                    <div key={i} className="bg-white/5 rounded-3xl overflow-hidden border border-white/10 hover:border-brand-cyan/50 transition-all group flex flex-col">
                        <div className="aspect-video bg-gray-800 relative">
                            <div className="absolute inset-0 bg-brand-cyan/10 group-hover:bg-brand-cyan/20 transition-colors" />
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                                <span className="text-brand-cyan uppercase tracking-wider font-bold">{post.category}</span>
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-cyan transition-colors">{post.title}</h3>
                            <p className="text-gray-400 text-sm mb-6 flex-1">{post.excerpt}</p>

                            <Link href="#" className="inline-flex items-center text-brand-cyan font-bold text-sm hover:gap-2 transition-all">
                                Read Article <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
