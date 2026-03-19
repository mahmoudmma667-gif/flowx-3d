import { MAX_MODEL_UPLOAD_BYTES, MAX_ATTACHMENT_UPLOAD_BYTES } from './upload-config';

export class SecurityUtils {
    // File validation and security checks
    static validateFile(file: File, type: '3d' | 'attachment'): {
        isValid: boolean;
        error?: string;
    } {
        // Check file size
        const maxSize = type === '3d' ? MAX_MODEL_UPLOAD_BYTES : MAX_ATTACHMENT_UPLOAD_BYTES;
        if (file.size > maxSize) {
            return {
                isValid: false,
                error: `File exceeds the ${(maxSize / (1024 * 1024)).toFixed(0)} MB limit`
            };
        }

        // Check file extension
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension) {
            return {
                isValid: false,
                error: 'File must have a valid extension'
            };
        }

        // Validate file type based on extension
        if (type === '3d') {
            const supported3D = ['glb', 'gltf', 'fbx', 'obj', 'stl', 'ply', 'dae'];
            if (!supported3D.includes(extension)) {
                return {
                    isValid: false,
                    error: `Unsupported 3D file format: .${extension}`
                };
            }
        } else {
            const supportedAttachments = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'pdf', 'doc', 'docx', 'txt', 'mp4', 'webm', 'zip', 'rar'];
            if (!supportedAttachments.includes(extension)) {
                return {
                    isValid: false,
                    error: `Unsupported file format: .${extension}`
                };
            }
        }

        // Check for potentially dangerous file names
        const dangerousPatterns = [
            /script/i,
            /javascript/i,
            /vbscript/i,
            /<script/i,
            /<\/script/i,
            /eval\(/i,
            /expression\(/i,
            /javascript:/i,
            /mocha:/i,
            /livescript:/i,
            /about:/i,
            /file:/i,
            /data:/i,
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(file.name)) {
                return {
                    isValid: false,
                    error: 'File name contains potentially dangerous content'
                };
            }
        }

        return { isValid: true };
    }

    // Sanitize file content (basic implementation)
    static async sanitizeFileContent(file: File): Promise<boolean> {
        try {
            // For text-based files, check for malicious content
            if (file.type.startsWith('text/') || file.name.endsWith('.js') || file.name.endsWith('.html')) {
                const content = await file.text();
                
                // Check for common malicious patterns
                const maliciousPatterns = [
                    /<script[^>]*>[\s\S]*?<\/script>/i,
                    /javascript:/i,
                    /eval\(/i,
                    /expression\(/i,
                    /document\./i,
                    /window\./i,
                    /alert\(/i,
                ];

                for (const pattern of maliciousPatterns) {
                    if (pattern.test(content)) {
                        return false;
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error sanitizing file:', error);
            return false;
        }
    }

    // Generate secure filename
    static generateSecureFilename(originalName: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = originalName.split('.').pop()?.toLowerCase() || 'bin';
        
        // Remove potentially dangerous characters
        const safeName = originalName
            .split('.')[0]
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .substring(0, 50); // Limit length

        return `${timestamp}-${random}-${safeName}.${extension}`;
    }

    // Rate limiting utilities
    private static requestCounts = new Map<string, { count: number; resetTime: number }>();

    static checkRateLimit(ip: string, maxRequests: number = 100, windowMs: number = 60000): {
        allowed: boolean;
        remaining: number;
        resetTime: number;
    } {
        const now = Date.now();
        const record = this.requestCounts.get(ip);

        if (!record || now > record.resetTime) {
            // Reset window
            this.requestCounts.set(ip, {
                count: 1,
                resetTime: now + windowMs
            });
            return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
        }

        if (record.count >= maxRequests) {
            return { allowed: false, remaining: 0, resetTime: record.resetTime };
        }

        record.count++;
        this.requestCounts.set(ip, record);
        return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
    }

    // Clean up old rate limit records
    static cleanupRateLimit(): void {
        const now = Date.now();
        for (const [ip, record] of this.requestCounts.entries()) {
            if (now > record.resetTime) {
                this.requestCounts.delete(ip);
            }
        }
    }

    // Input validation
    static sanitizeInput(input: string): string {
        return input
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    }

    // Check if file is safe to serve
    static isSafeToServe(filePath: string): boolean {
        const dangerousPaths = [
            '../',
            '..\\',
            '/etc/',
            '/proc/',
            '/sys/',
            '/var/',
            'C:\\',
            'D:\\',
            'A:\\',
        ];

        return !dangerousPaths.some(path => filePath.includes(path));
    }
}

// Initialize rate limit cleanup
setInterval(() => {
    SecurityUtils.cleanupRateLimit();
}, 300000); // Clean up every 5 minutes