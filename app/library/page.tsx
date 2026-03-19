import { Navbar } from "@/components/layout/navbar";
import { ModelCard } from "@/components/library/model-card";
import { getWorkspaceModels } from "@/lib/workspace-store";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
    const models = await getWorkspaceModels();

    return (
        <main className="min-h-screen bg-brand-dark text-white selection:bg-brand-cyan/30">
            <Navbar />
            <div className="container mx-auto px-4 pt-32 pb-20">
                <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold font-space mb-2">
                            Model <span className="text-brand-purple">Library</span>
                        </h1>
                        <p className="text-gray-400">
                            Explore user-generated 3D content ready for interaction.
                        </p>
                    </div>
                    <Link href="/upload">
                        <Button className="shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                            <Plus className="w-4 h-4 mr-2" /> Upload New
                        </Button>
                    </Link>
                </div>

                {models.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {models.map((model) => (
                            <ModelCard key={model.id} model={model} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
                        <h3 className="text-xl font-bold text-gray-500 mb-4">No models found</h3>
                        <p className="text-gray-600 mb-8">Be the first to upload a 3D model to the platform.</p>
                        <Link href="/upload">
                            <Button variant="outline">Upload Model</Button>
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
