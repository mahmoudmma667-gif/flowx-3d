export interface WorkspaceUser {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    bio: string | null;
    role: string;
    createdAt: string;
    updatedAt: string;
}

export interface WorkspaceModel {
    id: string;
    name: string;
    description: string | null;
    url: string;
    thumbnail: string | null;
    format: string;
    size: number;
    vertices: number | null;
    published: boolean;
    userId: string;
    categoryId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface WorkspaceAttachment {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    modelId: string | null;
    userId: string;
    createdAt: string;
}

export interface WorkspaceModelWithAttachments extends WorkspaceModel {
    attachments: WorkspaceAttachment[];
}

export interface WorkspaceStoreData {
    user: WorkspaceUser;
    models: WorkspaceModel[];
    attachments: WorkspaceAttachment[];
}
