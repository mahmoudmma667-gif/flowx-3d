'use server';

import { prisma } from "@/lib/prisma";

export async function getAdminStats() {
    try {
        const [userCount, modelCount, activeUploads, totalLogs] = await Promise.all([
            prisma.user.count(),
            prisma.model3D.count(),
            prisma.uploadSession.count({ where: { status: 'STARTED' } }),
            prisma.adminLog.count()
        ]);

        return {
            userCount,
            modelCount,
            activeUploads,
            totalLogs,
            success: true
        };
    } catch (error) {
        console.error("Admin stats fetch failed:", error);
        return { success: false };
    }
}

export async function getRecentAnalytics(limit = 50) {
    try {
        return await prisma.analyticsEvent.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { model: true }
        });
    } catch (error) {
        console.error("Analytics fetch failed:", error);
        return [];
    }
}

export async function getUsersList() {
    try {
        return await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { models: true }
                }
            }
        });
    } catch (error) {
        console.error("Users fetch failed:", error);
        return [];
    }
}
