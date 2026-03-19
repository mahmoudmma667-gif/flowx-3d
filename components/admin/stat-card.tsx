import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: {
        value: string;
        positive: boolean;
    };
    description?: string;
    className?: string;
}

export function StatCard({ title, value, icon, trend, description, className }: StatCardProps) {
    return (
        <div className={cn(
            "relative group overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all hover:bg-white/10 hover:border-white/20",
            className
        )}>
            {/* Glow Effect */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-3xl transition-all group-hover:bg-blue-500/20" />
            
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-white/60">{title}</p>
                    <h3 className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</h3>
                    
                    {trend && (
                        <div className="mt-2 flex items-center gap-1">
                            <span className={cn(
                                "text-xs font-semibold",
                                trend.positive ? "text-emerald-400" : "text-rose-400"
                            )}>
                                {trend.positive ? '+' : ''}{trend.value}
                            </span>
                            <span className="text-xs text-white/40">from last week</span>
                        </div>
                    )}
                    
                    {description && (
                        <p className="mt-4 text-xs text-white/40">{description}</p>
                    )}
                </div>
                
                <div className="rounded-xl bg-white/5 p-3 text-white/80 ring-1 ring-white/10 transition-all group-hover:scale-110 group-hover:bg-white/10 group-hover:text-white">
                    {icon}
                </div>
            </div>
        </div>
    );
}
