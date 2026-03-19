import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flowx 3D",
  description: "Next-Gen Hand-Controlled 3D Design Platform",
  keywords: ["3D Design", "Hand Tracking", "Flowx 3D"],
  authors: [{ name: "Mahmoud Labib" }],
  openGraph: {
    title: "Flowx 3D",
    description: "Next-Gen Hand-Controlled 3D Design Platform",
    url: "https://flowx3d.com",
    siteName: "Flowx 3D",
    type: "website",
  },
};

import { TechParticles } from "@/components/visual/tech-particles";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}
        suppressHydrationWarning
      >
        <TechParticles />
        {children}
      </body>
    </html>
  );
}
