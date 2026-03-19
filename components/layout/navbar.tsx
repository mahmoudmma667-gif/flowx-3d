'use client';

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutDashboard, Menu, Settings, Upload, X, Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";

const primaryLinks = [
    { label: "Features", href: "/#features" },
    { label: "How it Works", href: "/#how-it-works" },
    { label: "Air Sketch", href: "/air-sketch" },
    { label: "Library", href: "/library" },
    { label: "Upload", href: "/upload" },
];

const workspaceLinks = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Settings", href: "/settings", icon: Settings },
];

export function Navbar() {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-brand-dark/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative">
                        <Hexagon className="w-9 h-9 text-brand-cyan fill-brand-cyan/10 group-hover:text-white transition-all duration-500" />
                        <div className="absolute inset-0 bg-brand-cyan/20 blur-xl rounded-full group-hover:bg-white/20 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)]" />
                    </div>
                    <span className="font-space font-extrabold text-2xl tracking-tighter text-white">
                        Flowx <span className="text-brand-cyan">3D</span>
                    </span>
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    {primaryLinks.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="text-sm font-medium text-gray-400 hover:text-brand-cyan transition-colors"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="hidden md:flex items-center gap-3">
                    {workspaceLinks.map((item) => (
                        <Link key={item.label} href={item.href}>
                            <Button variant="ghost" size="sm" className="gap-2">
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </Button>
                        </Link>
                    ))}
                    <Link href="/air-sketch">
                        <Button variant="default" size="sm" className="gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                            <Upload className="w-4 h-4" />
                            Start Sketch
                        </Button>
                    </Link>
                </div>

                <button
                    className="md:hidden text-white"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="md:hidden absolute top-16 left-0 right-0 bg-brand-dark border-b border-white/10 p-4 flex flex-col gap-4"
                >
                    {primaryLinks.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="text-base font-medium text-gray-300 hover:text-brand-cyan"
                            onClick={() => setIsOpen(false)}
                        >
                            {item.label}
                        </Link>
                    ))}
                    <div className="flex flex-col gap-2 mt-4 border-t border-white/5 pt-4">
                        {workspaceLinks.map((item) => (
                            <Link key={item.label} href={item.href} onClick={() => setIsOpen(false)}>
                                <Button variant="ghost" className="w-full justify-start gap-2">
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </Button>
                            </Link>
                        ))}
                        <Link href="/air-sketch" onClick={() => setIsOpen(false)}>
                            <Button variant="default" className="w-full justify-start gap-2">
                                <Upload className="w-4 h-4" />
                                Start Sketch
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            )}
        </nav>
    );
}
