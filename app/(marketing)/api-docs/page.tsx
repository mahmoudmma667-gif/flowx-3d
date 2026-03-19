export default function ApiDocsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold font-space text-white">API Documentation</h1>
                <p className="text-xl text-gray-400">Build the next generation of spatial apps with Flowx 3D.</p>
            </div>

            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 text-center space-y-6">
                <h2 className="text-2xl font-bold text-white">Developer Preview</h2>
                <p className="text-gray-400 max-w-lg mx-auto">
                    Our API is currently in private beta. We are working with select partners to refine the developer experience.
                </p>
                <div className="flex justify-center gap-4">
                    <button className="bg-brand-cyan text-brand-dark px-6 py-3 rounded-full font-bold hover:bg-brand-cyan/90 transition-colors">
                        Request Access
                    </button>
                    <button className="border border-white/20 text-white px-6 py-3 rounded-full font-bold hover:bg-white/10 transition-colors">
                        View Examples
                    </button>
                </div>
            </div>
        </div>
    );
}
