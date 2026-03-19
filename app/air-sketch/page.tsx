"use client";

import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/navbar";

const AirSketchStudio = dynamic(
    () => import("@/components/air-sketch/air-sketch-studio"),
    {
        ssr: false,
        loading: () => (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-sm text-gray-300">
                Initializing Air Sketch workspace...
            </div>
        ),
    },
);

export default function AirSketchPage() {
    return (
        <main className="min-h-screen bg-brand-dark text-white selection:bg-brand-cyan/30">
            <Navbar />

            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,240,255,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(189,123,255,0.12),transparent_26%),radial-gradient(circle_at_bottom,rgba(255,158,87,0.1),transparent_24%)]" />

                <div className="relative mx-auto max-w-[1520px] px-4 pb-12 pt-24 sm:px-6 lg:px-8 xl:pb-8">
                    <AirSketchStudio />
                </div>
            </div>
        </main>
    );
}
