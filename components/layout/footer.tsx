import Link from 'next/link';
import { Hexagon } from 'lucide-react';

export function Footer() {
    return (
        <footer className="border-t border-white/5 bg-brand-dark/80 backdrop-blur-xl pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Hexagon className="w-7 h-7 text-brand-cyan group-hover:scale-110 transition-transform" />
                            <span className="font-space font-bold text-xl text-white">
                                Flowx <span className="text-brand-cyan">3D</span>
                            </span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            أحد ابتكارات كلية التربية النوعية بجامعة بنها. نطور أدوات تجعل التفاعل ثلاثي الأبعاد طبيعيًا وبديهيًا للجميع.
                            <br />
                            <span className="text-brand-cyan/80 mt-2 block font-medium">مطور بواسطة محمود لبيب</span>
                        </p>
                    </div>

                    {/* Product Section */}
                    <div>
                        <h4 className="font-space font-bold text-white mb-6">Product</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><Link href="/#features" className="hover:text-brand-cyan transition-colors">Features</Link></li>
                            <li><Link href="/library" className="hover:text-brand-cyan transition-colors">Model Library</Link></li>
                            <li><Link href="/air-sketch" className="hover:text-brand-cyan transition-colors">Launch Studio</Link></li>
                            <li><Link href="/library" className="hover:text-brand-cyan transition-colors">Library</Link></li>
                            <li><Link href="/api-docs" className="hover:text-brand-cyan transition-colors">API Documentation</Link></li>
                        </ul>
                    </div>

                    {/* Company Section */}
                    <div>
                        <h4 className="font-space font-bold text-white mb-6">Company</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><Link href="/about" className="hover:text-brand-cyan transition-colors">About Us</Link></li>
                            <li><Link href="/careers" className="hover:text-brand-cyan transition-colors">Careers</Link></li>
                            <li><Link href="/blog" className="hover:text-brand-cyan transition-colors">Blog</Link></li>
                            <li><Link href="/press" className="hover:text-brand-cyan transition-colors">Press Kit</Link></li>
                            <li><Link href="/partners" className="hover:text-brand-cyan transition-colors">Partners</Link></li>
                        </ul>
                    </div>

                    {/* Vision Section */}
                    <div>
                        <h4 className="font-space font-bold text-white mb-6">Vision</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><Link href="/mission" className="hover:text-brand-cyan transition-colors">Our Mission</Link></li>
                            <li><Link href="/technology" className="hover:text-brand-cyan transition-colors">Technology</Link></li>
                            <li><Link href="/roadmap" className="hover:text-brand-cyan transition-colors">Roadmap</Link></li>
                            <li><Link href="/specialization" className="hover:text-brand-cyan transition-colors">Specialization</Link></li>
                            <li><Link href="/accessibility" className="hover:text-brand-cyan transition-colors">Accessibility</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} Flowx 3D. ابتكار: محمود لبيب - جامعة بنها. جميع الحقوق محفوظة.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
