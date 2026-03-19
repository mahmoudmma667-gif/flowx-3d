export default function AccessibilityPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold font-space text-white">Accessibility Commitment</h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    We believe 3D content should be inclusive. We are committed to making Flowx 3D usable by everyone.
                </p>
            </div>

            <div className="prose prose-invert max-w-none space-y-8">
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                    <h2 className="text-2xl font-bold text-white mb-4">Our Standards</h2>
                    <p className="text-gray-400">
                        We strive to adhere to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.
                        While spatial interfaces present new challenges for accessibility, we are pioneering new patterns to support screen readers, keyboard navigation, and alternative input methods within 3D environments.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white">Current Features</h3>
                        <ul className="list-disc list-inside text-gray-400 space-y-2">
                            <li>Keyboard navigation support for all UI elements.</li>
                            <li>High contrast modes for better visibility.</li>
                            <li>Alternative text for 3D model descriptions.</li>
                            <li>Motion sensitivity settings (reduce motion).</li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white">Planned Improvements</h3>
                        <ul className="list-disc list-inside text-gray-400 space-y-2">
                            <li>Voice control for total hands-free navigation.</li>
                            <li>Spatial audio cues for visually impaired users.</li>
                            <li>Haptic feedback support for compatible devices.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
