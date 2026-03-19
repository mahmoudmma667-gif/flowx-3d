import { SecurityUtils } from '../lib/security-utils';
import { describe, it, expect } from 'vitest';

describe('SecurityUtils', () => {
    describe('validateFile', () => {
        it('should validate 3D files correctly', () => {
            const validFile = new File(['test'], 'test.glb', { type: 'model/gltf-binary' });
            const result = SecurityUtils.validateFile(validFile, '3d');
            expect(result.isValid).toBe(true);
        });

        it('should reject oversized files', () => {
            const largeFile = new File(['x'.repeat(300 * 1024 * 1024)], 'large.glb', { type: 'model/gltf-binary' });
            const result = SecurityUtils.validateFile(largeFile, '3d');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('exceeds');
        });

        it('should reject files with dangerous names', () => {
            const maliciousFile = new File(['test'], 'script.js', { type: 'text/javascript' });
            const result = SecurityUtils.validateFile(maliciousFile, 'attachment');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('dangerous');
        });
    });

    describe('generateSecureFilename', () => {
        it('should generate secure filenames', () => {
            const original = 'test file with spaces.js';
            const secure = SecurityUtils.generateSecureFilename(original);
            expect(secure).toMatch(/^\d+-[a-z0-9]+-test-file-with-spaces\.js$/);
            expect(secure).not.toContain(' ');
        });

        it('should handle files without extensions', () => {
            const original = 'filename';
            const secure = SecurityUtils.generateSecureFilename(original);
            expect(secure).toMatch(/^\d+-[a-z0-9]+-filename\.bin$/);
        });
    });

    describe('checkRateLimit', () => {
        it('should allow requests within limit', () => {
            const result = SecurityUtils.checkRateLimit('test-ip', 5, 60000);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(4);
        });

        it('should block requests over limit', () => {
            // Make 5 requests to reach limit
            for (let i = 0; i < 5; i++) {
                SecurityUtils.checkRateLimit('test-ip', 5, 60000);
            }
            
            const result = SecurityUtils.checkRateLimit('test-ip', 5, 60000);
            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
        });
    });

    describe('sanitizeInput', () => {
        it('should remove script tags', () => {
            const input = '<script>alert("xss")</script>';
            const sanitized = SecurityUtils.sanitizeInput(input);
            expect(sanitized).not.toContain('<script>');
        });

        it('should remove javascript: protocol', () => {
            const input = 'javascript:alert("xss")';
            const sanitized = SecurityUtils.sanitizeInput(input);
            expect(sanitized).not.toContain('javascript:');
        });
    });

    describe('isSafeToServe', () => {
        it('should detect dangerous paths', () => {
            expect(SecurityUtils.isSafeToServe('../etc/passwd')).toBe(false);
            expect(SecurityUtils.isSafeToServe('C:\\windows\\system32\\cmd.exe')).toBe(false);
            expect(SecurityUtils.isSafeToServe('/safe/path/file.txt')).toBe(true);
        });
    });
});

describe('Performance Tests', () => {
    it('should handle file validation quickly', () => {
        const start = performance.now();
        const file = new File(['test'], 'test.glb', { type: 'model/gltf-binary' });
        
        for (let i = 0; i < 100; i++) {
            SecurityUtils.validateFile(file, '3d');
        }
        
        const duration = performance.now() - start;
        expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });
});