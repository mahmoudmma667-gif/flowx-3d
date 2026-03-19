import { getWorkspaceUser } from "@/lib/workspace-store";
import type { WorkspaceUser } from "@/lib/workspace-types";

export async function getOrCreateAppUser(): Promise<WorkspaceUser> {
    return getWorkspaceUser();
}

export async function getOrCreateAppUserId() {
    const user = await getWorkspaceUser();
    return user.id;
}
