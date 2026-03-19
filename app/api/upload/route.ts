export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { NextRequest, NextResponse } from "next/server";
import { getFormatFromFilename, getFileType, SUPPORTED_3D_FORMATS } from "@/lib/format-utils";
import {
    getUploadSizeLimit,
    isSupportedMediaExtension,
    isUploadKind,
    type UploadKind,
} from "@/lib/upload-config";
import { createWorkspaceAttachment, createWorkspaceModel, getWorkspaceModelById } from "@/lib/workspace-store";
import { SecurityUtils } from "@/lib/security-utils";

const SUPPORTED_3D_EXTENSIONS = Object.keys(SUPPORTED_3D_FORMATS);

export async function POST(req: NextRequest) {
    try {
        // Get client IP for rate limiting
        const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        
        // Check rate limit
        const rateLimit = SecurityUtils.checkRateLimit(clientIP, 50, 60000); // 50 requests per minute
        if (!rateLimit.allowed) {
            return NextResponse.json({
                success: false,
                message: 'Rate limit exceeded. Please try again later.',
            }, { status: 429 });
        }

        const formData = await req.formData();
        const fileEntry = formData.get('file');
        const modelIdEntry = formData.get('modelId');
        const uploadKindEntry = formData.get('type');

        if (!(fileEntry instanceof File)) {
            return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
        }

        // Validate file using security utils
        const securityValidation = SecurityUtils.validateFile(fileEntry, 
            isUploadKind(uploadKindEntry) ? uploadKindEntry : '3d'
        );
        
        if (!securityValidation.isValid) {
            return NextResponse.json({
                success: false,
                message: securityValidation.error || 'File validation failed',
            }, { status: 400 });
        }

        // Sanitize file content for potentially dangerous files
        const isContentSafe = await SecurityUtils.sanitizeFileContent(fileEntry);
        if (!isContentSafe) {
            return NextResponse.json({
                success: false,
                message: 'File contains potentially malicious content',
            }, { status: 400 });
        }

        const uploadKind: UploadKind = isUploadKind(uploadKindEntry) ? uploadKindEntry : '3d';
        const modelId = typeof modelIdEntry === 'string' && modelIdEntry.trim().length > 0 ? modelIdEntry : null;
        const extension = fileEntry.name.split('.').pop()?.toLowerCase() || '';
        const is3DFile = SUPPORTED_3D_EXTENSIONS.includes(extension);
        const isMediaFile = isSupportedMediaExtension(extension);

        if (uploadKind === '3d' && !is3DFile) {
            return NextResponse.json({
                success: false,
                message: `Unsupported 3D file type: .${extension}. Supported formats: ${SUPPORTED_3D_EXTENSIONS.join(', ')}`,
            }, { status: 400 });
        }

        if (uploadKind === 'attachment' && !isMediaFile) {
            return NextResponse.json({
                success: false,
                message: `Unsupported attachment type: .${extension}`,
            }, { status: 400 });
        }

        const uploadLimit = getUploadSizeLimit(uploadKind);
        if (fileEntry.size > uploadLimit) {
            return NextResponse.json({
                success: false,
                message: `File exceeds the ${(uploadLimit / (1024 * 1024)).toFixed(0)} MB upload limit.`,
            }, { status: 413 });
        }

        if (uploadKind === 'attachment' && modelId) {
            const parentModel = await getWorkspaceModelById(modelId);

            if (!parentModel) {
                return NextResponse.json({ success: false, message: 'Model not found for attachment upload' }, { status: 404 });
            }
        }

        // Generate secure filename
        const secureFileName = SecurityUtils.generateSecureFilename(fileEntry.name);
        
        const bytes = await fileEntry.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const subDirectory = uploadKind === '3d' ? 'models' : 'uploads';
        const uploadDirectory = join(process.cwd(), 'public', subDirectory);
        await mkdir(uploadDirectory, { recursive: true });

        const filePath = join(uploadDirectory, secureFileName);
        
        // Check if file path is safe before writing
        if (!SecurityUtils.isSafeToServe(filePath)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid file path',
            }, { status: 400 });
        }

        await writeFile(filePath, buffer);

        const publicUrl = `/${subDirectory}/${secureFileName}`;

        if (uploadKind === '3d') {
            const model = await createWorkspaceModel({
                name: fileEntry.name.split('.').slice(0, -1).join('.') || 'Untitled Model',
                url: publicUrl,
                format: getFormatFromFilename(fileEntry.name),
                size: fileEntry.size,
            });
            return NextResponse.json({ success: true, type: '3d', data: model });
        }

        const attachment = await createWorkspaceAttachment({
            name: fileEntry.name,
            url: publicUrl,
            type: getFileType(fileEntry.name),
            size: fileEntry.size,
            modelId,
        });
        return NextResponse.json({ success: true, type: 'attachment', data: attachment });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Internal Server Error',
        }, { status: 500 });
    }
}