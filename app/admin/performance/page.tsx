import React from 'react';
import { getRecentAnalytics } from '@/app/actions/admin';
import { 
    Activity, 
    Gauge, 
    AlertTriangle,
    BarChart3,
    ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function PerformanceAnalytics() {
    const events = await getRecentAnalytics(100);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Performance Analysis</h1>
                    <p className="text-white/40 mt-1 text-sm">Deep dive into engine stability, latency, and system health.</p>
                </div>
                
                <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
                    <button className="px-3 py-1.5 text-xs font-bold bg-white/10 rounded-md">Live</button>
                    <button className="px-3 py-1.5 text-xs font-bold text-white/40 hover:text-white transition-colors">24h</button>
                    <button className="px-3 py-1.5 text-xs font-bold text-white/40 hover:text-white transition-colors">7d</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Summary Metrics */}
                <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-blue-500/5 to-transparent p-6 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-4">
                        <Gauge className="h-5 w-5 text-blue-400" />
                        <h4 className="text-sm font-semibold uppercase tracking-widest text-white/60">Avg. Generation Latency</h4>
                    </div>
                    <p className="text-4xl font-bold tracking-tighter">842<span className="text-xl text-blue-400 font-mono">ms</span></p>
                    <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[72%]" />
                    </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-emerald-500/5 to-transparent p-6 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-4">
                        <Activity className="h-5 w-5 text-emerald-400" />
                        <h4 className="text-sm font-semibold uppercase tracking-widest text-white/60">System Stability (FPS)</h4>
                    </div>
                    <p className="text-4xl font-bold tracking-tighter">59.8<span className="text-xl text-emerald-400 font-mono">avg</span></p>
                    <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[98%]" />
                    </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-amber-500/5 to-transparent p-6 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                        <h4 className="text-sm font-semibold uppercase tracking-widest text-white/60">Recognition Fail Rate</h4>
                    </div>
                    <p className="text-4xl font-bold tracking-tighter">0.42<span className="text-xl text-amber-400 font-mono">%</span></p>
                    <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[12%]" />
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-black/40 p-6 backdrop-blur-md overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="h-5 w-5 text-purple-400" />
                        <h3 className="text-lg font-bold">Real-time Telemetry Stream</h3>
                    </div>
                    <span className="px-2 py-1 rounded bg-white/5 text-[10px] font-mono text-white/40 uppercase tracking-widest">polling active</span>
                </div>

                <div className="space-y-3">
                    {events.map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold",
                                    event.eventType === 'FPS' ? "bg-emerald-500/10 text-emerald-500" :
                                    event.eventType === 'ERROR' ? "bg-rose-500/10 text-rose-500" :
                                    "bg-blue-500/10 text-blue-500"
                                )}>
                                    {event.eventType === 'FPS' ? 'S' : event.eventType === 'ERROR' ? 'E' : 'T'}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">{event.eventType} Event logged</p>
                                    <p className="text-[10px] text-white/20 uppercase font-mono">{new Date(event.createdAt).toLocaleTimeString()}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-xs font-mono text-white/60 font-medium">
                                        {event.meta ? JSON.parse(event.meta).value : 'N/A'}
                                    </p>
                                    <p className="text-[10px] text-white/20 uppercase font-bold tracking-tighter">Value</p>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-white/10 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
