export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-4xl font-bold font-space text-white">Privacy Policy</h1>
            <p className="text-gray-500">Last updated: February 14, 2026</p>

            <div className="prose prose-invert prose-lg max-w-none text-gray-400">
                <p>
                    At Flowx 3D, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information when you use our website and services.
                </p>

                <h3 className="text-white">1. Information We Collect</h3>
                <p>
                    We collect information you provide directly to us, such as when you create an account, subscribe to our newsletter, or contact us for support. This may include your name, email address, and usage data.
                </p>

                <h3 className="text-white">2. Camera Data & Hand Tracking</h3>
                <p>
                    All hand tracking and image processing is performed <strong>locally on your device</strong> using client-side technologies (MediaPipe). We do <strong>not</strong> upload, store, or transmit your camera feed or images to our servers. Only the abstract coordinate data (hand landmarks) is processed locally to enable interaction.
                </p>

                <h3 className="text-white">3. How We Use Your Information</h3>
                <p>
                    We use the information we collect to provide, maintain, and improve our services, communicate with you, and ensure the security of our platform.
                </p>

                <h3 className="text-white">4. Contact Us</h3>
                <p>
                    If you have any questions about this Privacy Policy, please contact us at privacy@flowx3d.com.
                </p>
            </div>
        </div>
    );
}
