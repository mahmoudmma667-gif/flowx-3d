import { get3DDropzoneAccept } from "@/lib/format-utils";
import type { WorkspaceAttachment, WorkspaceModel } from "@/lib/workspace-types";

export const MAX_MODEL_UPLOAD_BYTES = 200 * 1024 * 1024;
export const MAX_ATTACHMENT_UPLOAD_BYTES = 100 * 1024 * 1024;

export const MODEL_DROPZONE_ACCEPT = get3DDropzoneAccept();
export const PREVIEWABLE_MODEL_DROPZONE_ACCEPT: Record<string, string[]> = {
    "model/gltf-binary": [".glb"],
    "model/gltf+json": [".gltf"],
    "application/octet-stream": [".fbx"],
    "text/plain": [".obj"],
    "model/stl": [".stl"],
    "application/x-ply": [".ply"],
    "model/vnd.collada+xml": [".dae"],
};

export const ATTACHMENT_DROPZONE_ACCEPT: Record<string, string[]> = {
    "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".bmp"],
    "video/*": [".mp4", ".webm", ".mov"],
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "text/plain": [".txt"],
    "application/zip": [".zip"],
    "application/x-rar-compressed": [".rar"],
};

export const SUPPORTED_MEDIA_EXTENSIONS = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "svg",
    "bmp",
    "mp4",
    "webm",
    "mov",
    "pdf",
    "doc",
    "docx",
    "txt",
    "zip",
    "rar",
] as const;

export type UploadKind = "3d" | "attachment";
export type SupportedMediaExtension = (typeof SUPPORTED_MEDIA_EXTENSIONS)[number];

export type UploadSuccessResponse =
    | { success: true; type: "3d"; data: WorkspaceModel }
    | { success: true; type: "attachment"; data: WorkspaceAttachment };

export type UploadErrorResponse = {
    success: false;
    message: string;
    error?: string;
};

export type UploadResponse = UploadSuccessResponse | UploadErrorResponse;

export function isUploadKind(value: FormDataEntryValue | null): value is UploadKind {
    return value === "3d" || value === "attachment";
}

export function isSupportedMediaExtension(extension: string): extension is SupportedMediaExtension {
    return SUPPORTED_MEDIA_EXTENSIONS.includes(extension as SupportedMediaExtension);
}

export function getUploadSizeLimit(uploadKind: UploadKind) {
    return uploadKind === "3d" ? MAX_MODEL_UPLOAD_BYTES : MAX_ATTACHMENT_UPLOAD_BYTES;
}

export function sanitizeUploadFilename(fileName: string) {
    const lastDotIndex = fileName.lastIndexOf(".");
    const rawName = lastDotIndex > 0 ? fileName.slice(0, lastDotIndex) : fileName;
    const rawExtension = lastDotIndex > 0 ? fileName.slice(lastDotIndex).toLowerCase() : "";

    const safeName =
        rawName
            .normalize("NFKD")
            .replace(/[^\x00-\x7F]/g, "")
            .replace(/[^a-zA-Z0-9._-]+/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_+|_+$/g, "") || "upload";

    const safeExtension = rawExtension.replace(/[^.a-z0-9]/g, "");

    return `${safeName}${safeExtension}`;
}
