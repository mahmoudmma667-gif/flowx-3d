'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    defaultOpen?: boolean;
    storageKey?: string;
    badge?: string;
    children: React.ReactNode;
    className?: string;
    headerClassName?: string;
}

export function CollapsibleSection({
    title,
    subtitle,
    icon,
    defaultOpen = true,
    storageKey,
    badge,
    children,
    className,
    headerClassName,
}: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(() => {
        if (!storageKey || typeof window === 'undefined') {
            return defaultOpen;
        }
        try {
            const stored = localStorage.getItem(`flowx-collapse-${storageKey}`);
            return stored === null ? defaultOpen : stored === 'true';
        } catch {
            return defaultOpen;
        }
    });
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!storageKey) return;
        try {
            localStorage.setItem(`flowx-collapse-${storageKey}`, String(isOpen));
        } catch { /* ignore */ }
    }, [isOpen, storageKey]);

    useLayoutEffect(() => {
        const element = contentRef.current;
        if (!element) return;

        if (isOpen) {
            const height = element.scrollHeight;
            element.style.maxHeight = `${height}px`;
            const timer = window.setTimeout(() => {
                if (contentRef.current) {
                    contentRef.current.style.maxHeight = 'none';
                }
            }, 350);
            return () => window.clearTimeout(timer);
        }

        const height = element.scrollHeight;
        element.style.maxHeight = `${height}px`;
        requestAnimationFrame(() => {
            if (contentRef.current) {
                contentRef.current.style.maxHeight = '0px';
            }
        });
    }, [isOpen]);

    return (
        <div className={className}>
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className={cn(
                    'group flex w-full items-center justify-between gap-3 rounded-2xl px-1 py-2 text-left transition-colors hover:bg-white/[0.03]',
                    headerClassName,
                )}
            >
                <div className="flex items-center gap-3 min-w-0">
                    {icon && <span className="flex-shrink-0 text-brand-cyan">{icon}</span>}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-gray-400 group-hover:text-gray-300 transition-colors">
                                {title}
                            </span>
                            {badge && (
                                <span className="rounded-full bg-brand-cyan/15 px-2 py-0.5 text-[10px] font-bold text-brand-cyan">
                                    {badge}
                                </span>
                            )}
                        </div>
                        {subtitle && (
                            <span className="block text-xs text-gray-500 truncate mt-0.5">{subtitle}</span>
                        )}
                    </div>
                </div>
                <ChevronDown
                    className={cn(
                        'h-4 w-4 flex-shrink-0 text-gray-500 transition-transform duration-300',
                        isOpen ? 'rotate-0' : '-rotate-90',
                    )}
                />
            </button>
            <div
                ref={contentRef}
                className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                style={{ maxHeight: isOpen ? 'none' : '0px' }}
            >
                <div className="pt-3">{children}</div>
            </div>
        </div>
    );
}
