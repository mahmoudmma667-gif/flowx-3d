import React from 'react';
import { StatCard } from '@/components/admin/stat-card';
import { getAdminStats } from '@/app/actions/admin';
import { 
    Users, 
    Box, 
    UploadCloud, 
    Activity,
    ArrowUpRight,
    Filter
} from 'lucide-react';

export default async function AdminOverview() {
    const stats = await getAdminStats();

    if (!stats.success) {
        return <div className="p-12 text-center text-white/40">Failed to load system statistics.</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">System Overview</h1>
                    <p className="text-white/40 mt-1 text-sm">Real-time health and performance metrics for Flowx 3D.</p>
                </div>
                
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors">
                        <Filter className="h-4 w-4" />
                        Filters
                    </button>
                    <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        Generate Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Total Registered Users"
                    value={stats.userCount || 0}
                    icon={<Users className="h-5 w-5" />}
                    trend={{ value: '12%', positive: true }}
                />
                <StatCard 
                    title="Models Generated"
                    value={stats.modelCount || 0}
                    icon={<Box className="h-5 w-5" />}
                    trend={{ value: '8.4%', positive: true }}
                />
                <StatCard 
                    title="Active Uploads"
                    value={stats.activeUploads || 0}
                    icon={<UploadCloud className="h-5 w-5" />}
                />
                <StatCard 
                    title="System Health"
                    value="99.9%"
                    icon={<Activity className="h-5 w-5" />}
                    trend={{ value: 'Stable', positive: true }}
                />
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Recent Activity Table */}
                <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">Latest Generation Events</h3>
                        <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                            View all <ArrowUpRight className="h-3 w-3" />
                        </button>
                    </div>
                    
                    <div className="overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="text-white/40 border-b border-white/5">
                                <tr>
                                    <th className="pb-3 font-medium">Model Name</th>
                                    <th className="pb-3 font-medium">Platform</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    <th className="pb-3 font-medium">Execution</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i} className="group">
                                        <td className="py-4 font-medium text-white/80 group-hover:text-white">Mechanical Bracket #{402 + i}</td>
                                        <td className="py-4 text-white/40">Air-Sketch Pro</td>
                                        <td className="py-4">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                                                Success
                                            </span>
                                        </td>
                                        <td className="py-4 text-white/40 tabular-nums">1.2s</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System Nodes / Server Status */}
                <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-md">
                    <h3 className="text-lg font-semibold mb-6">Platform Distribution</h3>
                    <div className="space-y-6">
                        {[
                            { label: 'Web (Canvas)', value: 68, color: 'bg-blue-500' },
                            { label: 'Mobile (Vision)', value: 24, color: 'bg-purple-500' },
                            { label: 'Desktop (CSG)', value: 8, color: 'bg-emerald-500' },
                        ].map((item) => (
                            <div key={item.label} className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/60">{item.label}</span>
                                    <span className="font-bold">{item.value}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className={cn("h-full rounded-full transition-all duration-1000", item.color)} style={{ width: `${item.value}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 bg-gradient-to-t from-blue-500/5 to-transparent rounded-b-2xl">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest text-center">Global GPU Utilization</p>
                                <p className="text-2xl font-bold text-center">42.8<span className="text-sm text-white/40">%</span></p>
                            </div>
                            <div className="h-12 w-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

type ClassValue = string | false | null | undefined;

function cn(...inputs: ClassValue[]) {
    return inputs.filter(Boolean).join(' ');
}
