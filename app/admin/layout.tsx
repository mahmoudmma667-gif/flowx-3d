import React from 'react';
import { 
    LayoutDashboard, 
    Users, 
    Box, 
    BarChart3, 
    History, 
    ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const navItems = [
        { label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" />, href: '/admin' },
        { label: 'Users', icon: <Users className="h-4 w-4" />, href: '/admin/users' },
        { label: '3D Models', icon: <Box className="h-4 w-4" />, href: '/admin/models' },
        { label: 'Performance', icon: <BarChart3 className="h-4 w-4" />, href: '/admin/performance' },
        { label: 'Audit Logs', icon: <History className="h-4 w-4" />, href: '/admin/logs' },
    ];

    return (
        <div className="flex min-h-screen bg-[#050505] text-white">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/5 bg-black/20 backdrop-blur-2xl">
                <div className="flex h-16 items-center px-6 border-b border-white/5">
                    <ShieldCheck className="h-6 w-6 text-blue-500 mr-2" />
                    <span className="text-sm font-bold tracking-tight uppercase">Flowx Admin</span>
                </div>
                
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/60 transition-all hover:bg-white/5 hover:text-white"
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="absolute bottom-4 left-4 right-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-lg">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                            <div>
                                <p className="text-xs font-medium">Administrator</p>
                                <p className="text-[10px] text-white/40">Root Access</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1 p-8">
                {children}
            </main>
        </div>
    );
}
