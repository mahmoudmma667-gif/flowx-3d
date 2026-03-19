import { Hexagon } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div className="space-y-4 text-center">
                <h1 className="text-4xl md:text-5xl font-bold font-space bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    About Flowx 3D
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    Redefining how humans interact with the digital world through gesture-based spatial computing.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold font-space text-white">قصة النجاح</h2>
                    <p className="text-gray-400 leading-relaxed">
                        نشأت فكرة Flowx 3D في أكتوبر 2025 كأحد الابتكارات المميزة من داخل كلية التربية النوعية بجامعة بنها. 
                        بقيادة المطور <strong>محمود لبيب</strong>، نسعى لإعادة تعريف العلاقة بين الإنسان والآلة.
                    </p>
                    <p className="text-gray-400 leading-relaxed">
                        نؤمن بأن المستقبل هو &quot;الحوسبة المكانية&quot; التي تعتمد على حركة اليد الطبيعية، دون الحاجة لأجهزة باهظة الثمن أو مستشعرات معقدة.
                    </p>
                    <div className="pt-4 space-y-3 border-t border-white/5">
                        <p className="text-brand-cyan font-bold">تواصل مع المطور:</p>
                        <p className="text-gray-300 text-sm italic">محمود لبيب (Mahmoud Labib)</p>
                        <p className="text-gray-400 text-sm">التليفون: <a href="tel:+201094282301" className="text-white hover:text-brand-cyan">+201094282301</a> (مصر)</p>
                        <p className="text-gray-400 text-sm">الإيميل: <a href="mailto:mahmoudmma667@gmail.com" className="text-white hover:text-brand-cyan">mahmoudmma667@gmail.com</a></p>
                    </div>
                </div>
                <div className="bg-white/5 rounded-3xl p-8 border border-white/10 backdrop-blur-sm">
                    <div className="aspect-video rounded-xl bg-brand-cyan/10 flex flex-col items-center justify-center gap-4 border border-brand-cyan/20">
                        <Hexagon className="w-20 h-20 text-brand-cyan" />
                        <span className="text-2xl font-bold font-space text-white">جامعة بنها</span>
                        <span className="text-xs text-brand-cyan uppercase tracking-widest text-center px-4">كلية التربية النوعية <br/> ابتكارات 2025</span>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <h2 className="text-2xl font-bold font-space text-white text-center">Our Core Values</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { title: "Innovation", desc: "Pushing the boundaries of what&apos;s possible in the browser." },
                        { title: "Accessibility", desc: "Making advanced 3D tools available to everyone, regardless of hardware." },
                        { title: "Simplicity", desc: "Complex technology, delivered through a simple, intuitive interface." }
                    ].map((value, index) => (
                        <div key={index} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-cyan/50 transition-colors">
                            <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                            <p className="text-gray-400 text-sm">{value.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
