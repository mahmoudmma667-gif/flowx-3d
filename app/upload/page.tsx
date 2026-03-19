import { Navbar } from "@/components/layout/navbar";
import { UploadDropzone } from "@/components/upload/upload-dropzone";

export default function UploadPage() {
    return (
        <main className="min-h-screen bg-brand-dark text-white selection:bg-brand-cyan/30">
            <Navbar />
            <div className="container mx-auto px-4 pt-32 pb-20">
                <div className="max-w-2xl mx-auto text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold font-space mb-4">
                        Upload Your <span className="text-brand-purple">Model</span>
                    </h1>
                    <p className="text-gray-400">
                        Bring your 3D creations to life. No login is required and uploads are saved directly to your local Flowx workspace.
                    </p>
                </div>

                <UploadDropzone />
            </div>
        </main>
    );
}
