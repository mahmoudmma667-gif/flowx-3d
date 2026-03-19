export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { updateWorkspaceUser } from "@/lib/workspace-store";

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json() as { name?: unknown; bio?: unknown };
        const name = typeof body.name === 'string' ? body.name.trim() : undefined;
        const bio = typeof body.bio === 'string' ? body.bio.trim() : undefined;
        const updatedUser = await updateWorkspaceUser({
            ...(name !== undefined ? { name: name || null } : {}),
            ...(bio !== undefined ? { bio: bio || null } : {}),
        });

        return NextResponse.json({ success: true, data: updatedUser });
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Internal Server Error',
        }, { status: 500 });
    }
}
