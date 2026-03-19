// Supported 3D formats with metadata
export const SUPPORTED_3D_FORMATS = {
    // glTF / GLB
    glb: { label: 'GLB', mime: 'model/gltf-binary', category: 'gltf' },
    gltf: { label: 'GLTF', mime: 'model/gltf+json', category: 'gltf' },
    // FBX
    fbx: { label: 'FBX', mime: 'application/octet-stream', category: 'fbx' },
    // Wavefront OBJ
    obj: { label: 'OBJ', mime: 'text/plain', category: 'obj' },
    mtl: { label: 'MTL', mime: 'text/plain', category: 'obj' },
    // STL
    stl: { label: 'STL', mime: 'model/stl', category: 'stl' },
    // PLY
    ply: { label: 'PLY', mime: 'application/x-ply', category: 'ply' },
    // Collada
    dae: { label: 'Collada', mime: 'model/vnd.collada+xml', category: 'dae' },
    // USDZ (Apple)
    usdz: { label: 'USDZ', mime: 'model/vnd.usdz+zip', category: 'usdz' },
    usda: { label: 'USDA', mime: 'text/plain', category: 'usdz' },
    // 3DS
    '3ds': { label: '3DS', mime: 'application/x-3ds', category: '3ds' },
    // 3MF
    '3mf': { label: '3MF', mime: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml', category: '3mf' },
    // VRML / X3D
    wrl: { label: 'VRML', mime: 'model/vrml', category: 'vrml' },
    // DRC (Draco compressed)
    drc: { label: 'Draco', mime: 'application/octet-stream', category: 'draco' },
} as const;

export type Format3D = keyof typeof SUPPORTED_3D_FORMATS;

export const ALL_3D_EXTENSIONS = Object.keys(SUPPORTED_3D_FORMATS).map(ext => `.${ext}`);

// Create accept object for react-dropzone
export function get3DDropzoneAccept() {
    const accept: Record<string, string[]> = {};
    for (const [ext, info] of Object.entries(SUPPORTED_3D_FORMATS)) {
        if (!accept[info.mime]) {
            accept[info.mime] = [];
        }
        accept[info.mime].push(`.${ext}`);
    }
    // Always add generic octet-stream for binary 3D files
    if (!accept['application/octet-stream']) {
        accept['application/octet-stream'] = [];
    }
    return accept;
}

export function getFormatFromFilename(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ext in SUPPORTED_3D_FORMATS ? ext : 'unknown';
}

export function getFormatCategory(format: string): string {
    if (format in SUPPORTED_3D_FORMATS) {
        return SUPPORTED_3D_FORMATS[format as Format3D].category;
    }
    return 'unknown';
}

export function getFormatLabel(format: string): string {
    if (format in SUPPORTED_3D_FORMATS) {
        return SUPPORTED_3D_FORMATS[format as Format3D].label;
    }
    return format.toUpperCase();
}

// File type categories for generic uploads
export const FILE_TYPE_MAP: Record<string, string> = {
    // Images
    jpg: 'IMAGE', jpeg: 'IMAGE', png: 'IMAGE', webp: 'IMAGE', gif: 'IMAGE', svg: 'IMAGE', bmp: 'IMAGE',
    // Videos
    mp4: 'VIDEO', webm: 'VIDEO', mov: 'VIDEO', avi: 'VIDEO',
    // Documents
    pdf: 'DOCUMENT', doc: 'DOCUMENT', docx: 'DOCUMENT', txt: 'DOCUMENT',
    // Archives
    zip: 'ARCHIVE', rar: 'ARCHIVE', '7z': 'ARCHIVE',
};

export function getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return FILE_TYPE_MAP[ext] || 'OTHER';
}
