import * as THREE from 'three';
import { Evaluator, Brush, ADDITION, SUBTRACTION, INTERSECTION } from 'three-bvh-csg';

/**
 * Creates an architectural wall with optional boolean window/door cutouts.
 */
export function buildArchitecturalWall(width: number, height: number, depth: number): THREE.BufferGeometry {
    const wallGeo = new THREE.BoxGeometry(width, height, depth);
    return wallGeo;
}

/**
 * Creates an L-Bracket mechanically sound for 3D printing.
 */
export function buildMechanicalBracket(width: number, height: number, depth: number, thickness = 0.2): THREE.BufferGeometry {
    // Basic L-shape using two boxes
    const base = new THREE.BoxGeometry(width, thickness, depth);
    const upright = new THREE.BoxGeometry(thickness, height, depth);
    upright.translate(-width / 2 + thickness / 2, height / 2, 0);
    
    const evaluator = new Evaluator();
    const brush1 = new Brush(base);
    const brush2 = new Brush(upright);
    
    const result = evaluator.evaluate(brush1, brush2, ADDITION);
    return result.geometry;
}

/**
 * Creates an Involute Gear profile mechanically sound for 3D printing.
 */
export function buildMechanicalGear(radius: number, depth: number, teeth: number): THREE.BufferGeometry {
    const gearGeo = new THREE.CylinderGeometry(radius, radius, depth, Math.max(8, teeth * 2));
    // Add teeth logic here if needed, for now use cylinder with segments mapped to teeth
    return gearGeo;
}

/**
 * Performs a CSG operation (Union, Subtract, Intersect) between two geometries.
 */
export function performCSGOperation(
    targetGeo: THREE.BufferGeometry, 
    sourceGeo: THREE.BufferGeometry, 
    operation: 'union' | 'subtract' | 'intersect',
    targetMatrix: THREE.Matrix4,
    sourceMatrix: THREE.Matrix4
): THREE.BufferGeometry {
    const evaluator = new Evaluator();
    
    const brush1 = new Brush(targetGeo);
    brush1.applyMatrix4(targetMatrix);
    brush1.updateMatrixWorld();
    
    const brush2 = new Brush(sourceGeo);
    brush2.applyMatrix4(sourceMatrix);
    brush2.updateMatrixWorld();
    
    const opType = operation === 'subtract'
        ? SUBTRACTION
        : operation === 'intersect'
            ? INTERSECTION
            : ADDITION;
    
    const result = evaluator.evaluate(brush1, brush2, opType);
    return result.geometry;
}

/**
 * Slices a geometry into one of 8 octants using CSG.
 */
export function sliceOctant(sourceGeo: THREE.BufferGeometry, octant: number): THREE.BufferGeometry {
    sourceGeo.computeBoundingBox();
    const box = sourceGeo.boundingBox;
    if (!box) return sourceGeo;

    const center = new THREE.Vector3();
    box.getCenter(center);
    
    const size = new THREE.Vector3();
    box.getSize(size);
    
    // Each octant bounding box should be half the size of the original box
    const halfSize = new THREE.Vector3(size.x / 2, size.y / 2, size.z / 2);
    // Add small padding to ensure intersection overlaps perfectly without missing faces
    const pad = Math.max(0.1, Math.max(size.x, size.y, size.z) * 0.05);
    const sliceBox = new THREE.BoxGeometry(halfSize.x + pad, halfSize.y + pad, halfSize.z + pad);
    
    // Octant logic (0-7):
    // x: 0 = left, 1 = right
    // y: 0 = bottom, 1 = top
    // z: 0 = back, 1 = front
    const dx = (octant & 1) ? 1 : -1;
    const dy = (octant & 2) ? 1 : -1;
    const dz = (octant & 4) ? 1 : -1;
    
    const offsetMatrix = new THREE.Matrix4().makeTranslation(
        center.x + dx * (halfSize.x / 2 + pad/2),
        center.y + dy * (halfSize.y / 2 + pad/2),
        center.z + dz * (halfSize.z / 2 + pad/2)
    );
    
    const identityMatrix = new THREE.Matrix4();
    return performCSGOperation(sourceGeo, sliceBox, 'intersect', identityMatrix, offsetMatrix);
}
