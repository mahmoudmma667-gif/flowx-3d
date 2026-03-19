'use server';

import { prisma } from "@/lib/prisma";

export type PerformanceMetric = {
    modelId?: string;
    eventType: 'FPS' | 'LATENCY' | 'ERROR' | 'RECOGNITION';
    value: number | string;
    meta?: Record<string, unknown>;
};

export async function logPerformanceEvent(data: PerformanceMetric) {
    try {
        await prisma.analyticsEvent.create({
            data: {
                modelId: data.modelId || 'SYSTEM',
                eventType: data.eventType,
                meta: JSON.stringify({
                    value: data.value,
                    timestamp: new Date().toISOString(),
                    ...data.meta
                }),
            },
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to log performance event:", error);
        return { success: false, error: "Database write failed" };
    }
}

export async function logAdminAction(userId: string, action: string, target?: string, details?: string) {
    try {
        await prisma.adminLog.create({
            data: {
                userId,
                action,
                target,
                details
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to log admin action:", error);
        return { success: false };
    }
}
