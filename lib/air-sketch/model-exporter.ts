'use client';

import * as THREE from 'three';
import type { AirSketchPoint, AirSketchModel } from '@/lib/air-sketch/engine';

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}

function downloadText(content: string, filename: string, mimeType = 'text/plain') {
    downloadBlob(new Blob([content], { type: mimeType }), filename);
}

function buildOutlineShape(points: AirSketchPoint[]) {
    if (points.length < 3) return null;
    const step = Math.max(1, Math.floor(points.length / 60));
    const sampled = points.filter((_, i) => i % step === 0 || i === points.length - 1);
    const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
    const cx = avg(sampled.map(p => p.x));
    const cy = avg(sampled.map(p => p.y));
    const outline = sampled.map(p => new THREE.Vector2(p.x - cx, p.y - cy));
    return outline.length >= 3 ? new THREE.Shape(outline) : null;
}

export function buildExportMesh(model: AirSketchModel): THREE.Mesh | null {
    const material = new THREE.MeshStandardMaterial({
        color: model.color,
        roughness: 0.24,
        metalness: 0.68,
    });

    let geometry: THREE.BufferGeometry | null = null;

    switch (model.shape) {
        case 'sphere':
            geometry = new THREE.SphereGeometry(model.radius, model.segments, model.segments);
            break;
        case 'cube':
            geometry = new THREE.BoxGeometry(model.size, model.size, model.depth);
            break;
        case 'cylinder':
            geometry = new THREE.CylinderGeometry(model.radius, model.radius, model.depth, Math.max(18, model.segments));
            break;
        case 'cone':
            geometry = new THREE.ConeGeometry(model.radius, model.depth, Math.max(18, model.segments));
            break;
        case 'torus':
            geometry = new THREE.TorusGeometry(model.radius, model.tubeRadius, 24, Math.max(32, model.segments));
            break;
        case 'extrusion': {
            const shape = buildOutlineShape(model.smoothPoints);
            if (!shape) return null;
            geometry = new THREE.ExtrudeGeometry(shape, {
                depth: model.depth,
                bevelEnabled: true,
                bevelThickness: model.tubeRadius * 0.55,
                bevelSize: model.tubeRadius * 0.36,
                bevelSegments: 3,
                curveSegments: Math.max(18, Math.round(model.segments * 0.6)),
            });
            break;
        }
        case 'lathe': {
            const lathePoints = model.smoothPoints.map(p => new THREE.Vector2(
                Math.abs(Math.hypot(p.x, p.z)),
                p.y
            ));
            if (lathePoints.length < 2) return null;
            geometry = new THREE.LatheGeometry(lathePoints, Math.max(32, model.segments));
            break;
        }
        case 'tube':
        default: {
            const closedPath = model.metrics.isClosed || model.metrics.closure < 0.32;
            const curve = new THREE.CatmullRomCurve3(
                model.smoothPoints.map(p => new THREE.Vector3(p.x, p.y, p.z)),
                closedPath, 'catmullrom', 0.45,
            );
            geometry = new THREE.TubeGeometry(curve, Math.max(32, model.segments), model.tubeRadius, 16, closedPath);
            break;
        }
    }

    if (!geometry) return null;
    return new THREE.Mesh(geometry, material);
}

export async function exportToGLB(model: AirSketchModel): Promise<void> {
    const mesh = buildExportMesh(model);
    if (!mesh) return;

    const { GLTFExporter } = await import('three-stdlib');
    const exporter = new GLTFExporter();
    const scene = new THREE.Scene();
    scene.add(mesh);

    return new Promise<void>((resolve) => {
        exporter.parse(
            scene,
            (result) => {
                const output = result instanceof ArrayBuffer
                    ? new Blob([result], { type: 'model/gltf-binary' })
                    : new Blob([JSON.stringify(result)], { type: 'application/json' });
                const safeName = (model.label || 'air-sketch-model').replace(/[^a-zA-Z0-9_-]/g, '_');
                downloadBlob(output, `${safeName}.glb`);
                resolve();
            },
            (error) => {
                console.error('GLB export failed:', error);
                resolve();
            },
            { binary: true },
        );
    });
}

export async function exportToOBJ(model: AirSketchModel): Promise<void> {
    const mesh = buildExportMesh(model);
    if (!mesh) return;

    const { OBJExporter } = await import('three-stdlib');
    const exporter = new OBJExporter();
    const scene = new THREE.Scene();
    scene.add(mesh);
    const result = exporter.parse(scene);
    const safeName = (model.label || 'air-sketch-model').replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadText(result, `${safeName}.obj`, 'model/obj');
}

export async function exportToSTL(model: AirSketchModel): Promise<void> {
    const mesh = buildExportMesh(model);
    if (!mesh) return;

    const { STLExporter } = await import('three-stdlib');
    const exporter = new STLExporter();
    const scene = new THREE.Scene();
    scene.add(mesh);
    const result = exporter.parse(scene, { binary: true });
    const blobData = result instanceof DataView ? new Uint8Array(result.buffer as ArrayBuffer, result.byteOffset, result.byteLength) : result;
    const blob = new Blob([blobData as BlobPart], { type: 'model/stl' });
    const safeName = (model.label || 'air-sketch-model').replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadBlob(blob, `${safeName}.stl`);
}

export function exportToPNG(canvas: HTMLCanvasElement | null, model: AirSketchModel): void {
    if (!canvas) return;
    canvas.toBlob((blob) => {
        if (!blob) return;
        const safeName = (model.label || 'air-sketch-model').replace(/[^a-zA-Z0-9_-]/g, '_');
        downloadBlob(blob, `${safeName}.png`);
    }, 'image/png');
}

export function exportToSVG(points: AirSketchPoint[], model: AirSketchModel): void {
    if (points.length < 2) return;

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const padding = 0.5;
    const vbX = minX - padding;
    const vbY = -(maxY + padding);
    const vbW = maxX - minX + padding * 2;
    const vbH = maxY - minY + padding * 2;

    const pathData = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(3)} ${(-p.y).toFixed(3)}`)
        .join(' ');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" width="800" height="800">
  <rect width="100%" height="100%" fill="#050b16"/>
  <path d="${pathData}" fill="none" stroke="${model.color}" stroke-width="0.06" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

    const safeName = (model.label || 'air-sketch-model').replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadText(svg, `${safeName}.svg`, 'image/svg+xml');
}

export async function exportToGLBBlob(model: AirSketchModel): Promise<Blob | null> {
    const mesh = buildExportMesh(model);
    if (!mesh) return null;

    const { GLTFExporter } = await import('three-stdlib');
    const exporter = new GLTFExporter();
    const scene = new THREE.Scene();
    scene.add(mesh);

    return new Promise<Blob | null>((resolve) => {
        exporter.parse(
            scene,
            (result) => {
                const blob = result instanceof ArrayBuffer
                    ? new Blob([result], { type: 'model/gltf-binary' })
                    : new Blob([JSON.stringify(result)], { type: 'application/json' });
                resolve(blob);
            },
            () => resolve(null),
            { binary: true },
        );
    });
}
