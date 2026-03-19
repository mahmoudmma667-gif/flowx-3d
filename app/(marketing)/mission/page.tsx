export default function MissionPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-16">
            <div className="text-center space-y-6">
                <span className="px-3 py-1 rounded-full bg-brand-cyan/10 text-brand-cyan text-sm font-medium border border-brand-cyan/20">
                    Our Purpose
                </span>
                <h1 className="text-4xl md:text-6xl font-bold font-space text-white leading-tight">
                    Democratizing <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-purple">Spatial Interaction</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    بدأ مشروعنا في أكتوبر 2025 بجامعة بنها كفكرة لكسر الحواجز بين الشاشات والمحتوى ثلاثي الأبعاد، وجعل التجارب الغامرة متاحة للجميع بدون أجهزة مكلفة.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="w-12 h-12 bg-brand-cyan/20 rounded-xl flex items-center justify-center text-brand-cyan mb-6 text-2xl font-bold">1</div>
                    <h3 className="text-xl font-bold text-white mb-4">Accessibility First</h3>
                    <p className="text-gray-400 leading-relaxed">
                        We believe the metaverse shouldn&apos;t require a $3,000 headset. Our technology runs on the devices you already own - laptops, tablets, and phones.
                    </p>
                </div>
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mb-6 text-2xl font-bold">2</div>
                    <h3 className="text-xl font-bold text-white mb-4">Natural Interface</h3>
                    <p className="text-gray-400 leading-relaxed">
                        Your hands are the ultimate controller. We build interfaces that understand natural gestures, making technology feel invisible.
                    </p>
                </div>
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center text-pink-400 mb-6 text-2xl font-bold">3</div>
                    <h3 className="text-xl font-bold text-white mb-4">Open Standard</h3>
                    <p className="text-gray-400 leading-relaxed">
                        We champion open standards like WebXR and glTF, ensuring that the 3D web remains open, interoperable, and free from walled gardens.
                    </p>
                </div>
            </div>

            <div className="bg-brand-dark/50 p-12 rounded-3xl border border-white/10 text-center">
                <h2 className="text-3xl font-bold text-white mb-6">The Road Ahead</h2>
                <p className="text-gray-400 max-w-3xl mx-auto mb-8">
                    Our vision extends beyond just viewing models. We are building a full spatial operating system for the web - enabling collaboration, creation, and interaction in shared 3D spaces.
                </p>
            </div>
        </div>
    );
}
