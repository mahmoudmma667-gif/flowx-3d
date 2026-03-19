import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="min-h-screen bg-brand-dark selection:bg-brand-cyan/30 text-white">
            <Navbar />
            <div className="pt-24 pb-16 container mx-auto px-4">
                {children}
            </div>
            <Footer />
        </main>
    );
}
