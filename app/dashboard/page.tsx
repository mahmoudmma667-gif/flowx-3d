export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { User, Box, Sparkles, Clock } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { ModelCard } from "@/components/library/model-card";
import { getOrCreateAppUser } from "@/lib/app-user";
import { getWorkspaceModelsByUserId } from "@/lib/workspace-store";

export default async function DashboardPage() {
    const user = await getOrCreateAppUser();
    const userModels = await getWorkspaceModelsByUserId(user.id);

    const stats = [
        { label: "Total Models", value: userModels.length, icon: Box },
        { label: "Workspace", value: "Open", icon: Sparkles },
        { label: "Since", value: new Date(user.createdAt).toLocaleDateString(), icon: Clock },
    ];

    return (
        <main className="min-h-screen bg-brand-dark text-white selection:bg-brand-cyan/30">
            <Navbar />

            <div className="container mx-auto px-4 pt-32 pb-20">
                <div className="glass-panel rounded-3xl p-8 mb-12 flex flex-col md:flex-row items-center gap-8 border border-white/5">
                    <div className="relative">
                        {user.image ? (
                            <Image
                                src={user.image}
                                alt={`${user.name ?? "User"} avatar`}
                                width={128}
                                height={128}
                                unoptimized
                                className="w-32 h-32 rounded-3xl border-2 border-brand-cyan/50 shadow-[0_0_30px_rgba(0,240,255,0.2)]"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-3xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan border-2 border-brand-cyan/30">
                                <User className="w-12 h-12" />
                            </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 bg-brand-cyan text-brand-dark text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                            Open
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-bold font-space mb-2">{user.name ?? "Flowx Workspace"}</h1>
                        <p className="text-gray-400 mb-6">{user.email ?? "workspace@flowx.local"}</p>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            {stats.map((stat, index) => (
                                <div key={index} className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                                    <stat.icon className="w-4 h-4 text-brand-cyan" />
                                    <span className="text-sm font-medium">{stat.label}:</span>
                                    <span className="text-sm font-space font-bold text-white">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold font-space flex items-center gap-3">
                            Workspace <span className="text-brand-purple">Projects</span>
                            <span className="text-xs bg-brand-purple/20 text-brand-purple px-2 py-1 rounded-lg uppercase tracking-wider">
                                {userModels.length}
                            </span>
                        </h2>
                    </div>

                    {userModels.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {userModels.map((model) => (
                                <ModelCard key={model.id} model={model} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                            <Box className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-500 mb-2">No projects yet</h3>
                            <p className="text-gray-600 mb-8">Upload your first model to populate the workspace.</p>
                            <Link href="/upload">
                                <button className="bg-brand-cyan text-brand-dark px-8 py-3 rounded-full font-bold hover:bg-brand-cyan/90 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                                    Upload Your First Model
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
