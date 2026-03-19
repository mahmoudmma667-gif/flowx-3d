import { Navbar } from "@/components/layout/navbar";
import { ModelViewerContainer } from "@/components/viewer/model-viewer-container";
import { ModelInfoOverlay } from "@/components/models/model-info-overlay";
import { CameraView } from "@/components/vision/camera-view";
import { notFound } from "next/navigation";
import { getWorkspaceModelById } from "@/lib/workspace-store";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ModelPage({ params }: PageProps) {
    const { id } = await params;

    const model = await getWorkspaceModelById(id);

    if (!model) {
        notFound();
    }

    return (
        <main className="h-screen w-screen bg-brand-dark overflow-hidden flex flex-col selection:bg-brand-cyan/30">
            <Navbar />

            <div className="flex-1 relative flex">
                {/* Main Viewer - Now using the interactive container */}
                <div className="flex-1 relative">
                    <ModelViewerContainer model={model} />
                </div>

                {/* Left Sidebar Info Overlay (Client Component) */}
                <ModelInfoOverlay model={model} />

                {/* Hand Tracking Camera View */}
                <div className="absolute top-24 right-8 z-10">
                    <CameraView />
                </div>
            </div>
        </main>
    );
}
