import { Navbar } from "@/components/layout/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { TechStackSection } from "@/components/landing/tech-stack-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-brand-dark selection:bg-brand-cyan/30 text-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <TechStackSection />
      <HowItWorks />
      <Footer />
    </main>
  );
}
