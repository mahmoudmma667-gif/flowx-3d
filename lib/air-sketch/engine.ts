export type AirSketchShape = 'sphere' | 'cube' | 'cylinder' | 'tube' | 'extrusion' | 'cone' | 'torus' | 'lathe' | 'mechanical-bracket' | 'architectural-wall' | 'mechanical-gear' | 'uploaded';
export type AirSketchMaterial = 'Solid' | 'Wood' | 'Metal' | 'Glass' | 'Plastic' | 'Matte';

export interface AirSketchPoint {
    x: number;
    y: number;
    z: number;
    timestamp: number;
}

export interface AirSketchMetrics {
    width: number;
    height: number;
    depth: number;
    pathLength: number;
    closure: number;
    circularity: number;
    cornerCount: number;
    cornerDensity: number;
    verticalBias: number;
    isClosed: boolean;
}

export interface AirSketchRecognition {
    shape: AirSketchShape;
    label: string;
    confidence: number;
    metrics: AirSketchMetrics;
}

export interface AirSketchModel {
    id: string;
    label: string;
    description: string;
    shape: AirSketchShape;
    color: string;
    materialPreset?: AirSketchMaterial;
    rawPoints: AirSketchPoint[];
    smoothPoints: AirSketchPoint[];
    metrics: AirSketchMetrics;
    confidence: number;
    size: number;
    radius: number;
    depth: number;
    tubeRadius: number;
    segments: number;
    recommendedEdits: string[];
    dimensions?: { width: number; height: number; depth: number }; // Optional explicitly-scaled mm dimensions for CSG/CAD outputs
    position?: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
    scale?: { x: number; y: number; z: number };
    tuning?: AirSketchTuning;
    shatterOctant?: number;
    customGeometry?: any; // THREE.BufferGeometry
}

export type ConversionMode = 'smart' | 'outline' | 'path' | 'mechanical';

export interface AirSketchTuning {
    scale: number;
    depth: number;
    thickness: number;
    detail: number;
}

const MIN_DIMENSION = 0.001;

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function average(values: number[]) {
    if (values.length === 0) {
        return 0;
    }

    return values.reduce((total, value) => total + value, 0) / values.length;
}

function distance3D(left: AirSketchPoint, right: AirSketchPoint) {
    return Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z);
}

function createShapeLabel(shape: AirSketchShape) {
    switch (shape) {
        case 'sphere':
            return 'Sphere';
        case 'cube':
            return 'Cube';
        case 'cylinder':
            return 'Cylinder';
        case 'cone':
            return 'Cone';
        case 'torus':
            return 'Torus';
        case 'lathe':
            return 'Lathe Surface';
        case 'extrusion':
            return 'Extruded Form';
        case 'tube':
        default:
            return 'Pipe';
    }
}

function getBounds(points: AirSketchPoint[]) {
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const zs = points.map((point) => point.z);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    return {
        width: maxX - minX,
        height: maxY - minY,
        depth: maxZ - minZ,
    };
}

function countCorners(points: AirSketchPoint[]) {
    let corners = 0;

    for (let index = 1; index < points.length - 1; index += 1) {
        const previous = points[index - 1];
        const current = points[index];
        const next = points[index + 1];

        const vectorA = {
            x: current.x - previous.x,
            y: current.y - previous.y,
            z: current.z - previous.z,
        };
        const vectorB = {
            x: next.x - current.x,
            y: next.y - current.y,
            z: next.z - current.z,
        };

        const lengthA = Math.hypot(vectorA.x, vectorA.y, vectorA.z);
        const lengthB = Math.hypot(vectorB.x, vectorB.y, vectorB.z);

        if (lengthA < 0.05 || lengthB < 0.05) {
            continue;
        }

        const cosine =
            (vectorA.x * vectorB.x + vectorA.y * vectorB.y + vectorA.z * vectorB.z) /
            (lengthA * lengthB);

        const angle = Math.acos(clamp(cosine, -1, 1));

        if (angle > 0.7) {
            corners += 1;
        }
    }

    return corners;
}

export function smoothTrajectory(points: AirSketchPoint[], windowRadius = 2, passes = 2) {
    if (points.length <= 2) {
        return points.slice();
    }

    let smoothed = points.slice();

    for (let pass = 0; pass < passes; pass += 1) {
        const sourcePoints = smoothed;

        smoothed = sourcePoints.map((point, index) => {
            const start = Math.max(0, index - windowRadius);
            const end = Math.min(sourcePoints.length - 1, index + windowRadius);
            const samples = sourcePoints.slice(start, end + 1);

            return {
                x: average(samples.map((sample) => sample.x)),
                y: average(samples.map((sample) => sample.y)),
                z: average(samples.map((sample) => sample.z)),
                timestamp: point.timestamp,
            };
        });
    }

    return smoothed;
}

export function computeAirSketchMetrics(points: AirSketchPoint[]): AirSketchMetrics {
    const bounds = getBounds(points);
    const size = Math.max(bounds.width, bounds.height, bounds.depth, MIN_DIMENSION);
    const pathLength = points.slice(1).reduce((total, point, index) => total + distance3D(points[index], point), 0);
    const closure = points.length > 1 ? distance3D(points[0], points[points.length - 1]) / size : 1;
    const cornerCount = countCorners(points);
    const centerX = average(points.map((point) => point.x));
    const centerY = average(points.map((point) => point.y));
    const planarRadii = points.map((point) => Math.hypot(point.x - centerX, point.y - centerY));
    const averageRadius = Math.max(average(planarRadii), MIN_DIMENSION);
    const radiusDeviation = Math.sqrt(
        average(planarRadii.map((radius) => (radius - averageRadius) ** 2)),
    );

    return {
        width: bounds.width,
        height: bounds.height,
        depth: bounds.depth,
        pathLength,
        closure,
        circularity: clamp(1 - radiusDeviation / averageRadius, 0, 1),
        cornerCount,
        cornerDensity: cornerCount / Math.max(points.length / 10, 1),
        verticalBias: bounds.height / Math.max(bounds.width, bounds.depth, MIN_DIMENSION),
        isClosed: closure < 0.42,
    };
}

export function recognizeAirSketchShape(points: AirSketchPoint[]): AirSketchRecognition {
    const metrics = computeAirSketchMetrics(points);
    let shape: AirSketchShape = 'tube';
    let confidence = 0.62;

    if (metrics.isClosed && metrics.circularity > 0.72 && metrics.cornerDensity < 1.35) {
        shape = 'sphere';
        confidence = clamp(0.72 + metrics.circularity * 0.22, 0.72, 0.96);
    } else if (metrics.isClosed && metrics.cornerCount >= 4 && metrics.cornerDensity >= 1.05) {
        shape = 'cube';
        confidence = clamp(0.68 + metrics.cornerDensity * 0.08, 0.68, 0.93);
    } else if (metrics.isClosed && metrics.cornerCount === 3 && metrics.verticalBias > 0.9) {
        shape = 'cone';
        confidence = clamp(0.66 + metrics.verticalBias * 0.1, 0.66, 0.9);
    } else if (metrics.isClosed) {
        shape = 'extrusion';
        confidence = clamp(0.66 + (1 - metrics.closure) * 0.18, 0.66, 0.92);
    } else if (!metrics.isClosed && metrics.circularity > 0.65 && metrics.pathLength > metrics.width * 3.5) {
        shape = 'torus';
        confidence = clamp(0.64 + metrics.circularity * 0.2, 0.64, 0.9);
    } else if (!metrics.isClosed && metrics.verticalBias > 1.35 && metrics.height > Math.max(metrics.width, metrics.depth)) {
        shape = 'cylinder';
        confidence = clamp(0.66 + metrics.verticalBias * 0.08, 0.66, 0.9);
    }

    // Heuristics for CSG primitives if standard shapes fit mechanical rules loosely
    if (shape === 'cube' && metrics.width > metrics.height * 2.5) {
        shape = 'architectural-wall';
    } else if (shape === 'cube' && metrics.cornerCount > 5) {
        shape = 'mechanical-bracket';
    }

    return {
        shape,
        label: createShapeLabel(shape),
        confidence,
        metrics,
    };
}

export function buildAirSketchModel(
    rawPoints: AirSketchPoint[],
    smoothPoints: AirSketchPoint[],
    recognition: AirSketchRecognition,
): AirSketchModel {
    const footprint = Math.max(recognition.metrics.width, recognition.metrics.height, 0.45);
    const volumeDepth = Math.max(recognition.metrics.depth, footprint * 0.45, 0.35);
    const segments = Math.round(clamp(28 + rawPoints.length * 0.3, 24, 96));

    switch (recognition.shape) {
        case 'sphere': {
            const radius = clamp(footprint * 0.55, 0.45, 2.2);
            return {
                id: `air-sphere-${Date.now()}`,
                label: recognition.label,
                description: 'Closed circular motion recognized and inflated into a balanced volumetric sphere.',
                shape: 'sphere',
                color: '#00f0ff',
                rawPoints,
                smoothPoints,
                metrics: recognition.metrics,
                confidence: recognition.confidence,
                size: radius * 2,
                radius,
                depth: Math.max(volumeDepth, radius * 1.9),
                tubeRadius: clamp(radius * 0.2, 0.12, 0.4),
                segments,
                recommendedEdits: [
                    'Closed loop detected and converted into a volumetric sphere.',
                    'Symmetry increased to stabilize the silhouette.',
                    'Surface density tuned for smoother highlights.',
                ],
            };
        }
        case 'cube': {
            const size = clamp(Math.max(footprint, volumeDepth) * 1.1, 0.65, 2.6);
            return {
                id: `air-cube-${Date.now()}`,
                label: recognition.label,
                description: 'Corner-rich closed sketch snapped into a clean solid cube.',
                shape: 'cube',
                color: '#7cf7c2',
                rawPoints,
                smoothPoints,
                metrics: recognition.metrics,
                confidence: recognition.confidence,
                size,
                radius: size * 0.5,
                depth: size,
                tubeRadius: clamp(size * 0.15, 0.1, 0.36),
                segments: 24,
                recommendedEdits: [
                    'Sharp directional changes mapped to orthogonal cube faces.',
                    'Axes aligned to produce a cleaner printable solid.',
                    'Volume thickness normalized for easier downstream edits.',
                ],
            };
        }
        case 'cylinder': {
            const radius = clamp(Math.max(recognition.metrics.width, recognition.metrics.depth, 0.3) * 0.35, 0.22, 1.6);
            const depth = clamp(Math.max(recognition.metrics.height * 1.2, 0.9), 0.9, 3.4);
            return {
                id: `air-cylinder-${Date.now()}`,
                label: recognition.label,
                description: 'Tall open trajectory interpreted as an extruded cylindrical form.',
                shape: 'cylinder',
                color: '#ff9e57',
                rawPoints,
                smoothPoints,
                metrics: recognition.metrics,
                confidence: recognition.confidence,
                size: radius * 2,
                radius,
                depth,
                tubeRadius: clamp(radius * 0.3, 0.1, 0.32),
                segments,
                recommendedEdits: [
                    'Vertical gesture preserved as an extruded cylinder.',
                    'Radius constrained to prevent wobble from noisy depth input.',
                    'Height expanded slightly for a stronger spatial read.',
                ],
            };
        }
        case 'extrusion': {
            const size = clamp(Math.max(footprint, 0.8), 0.8, 3.2);
            const depth = clamp(Math.max(volumeDepth, footprint * 0.55), 0.45, 2.6);
            return {
                id: `air-extrusion-${Date.now()}`,
                label: recognition.label,
                description: 'A custom closed sketch has been converted into an extruded 3D outline.',
                shape: 'extrusion',
                color: '#5de1ff',
                rawPoints,
                smoothPoints,
                metrics: recognition.metrics,
                confidence: recognition.confidence,
                size,
                radius: size * 0.5,
                depth,
                tubeRadius: clamp(size * 0.1, 0.08, 0.28),
                segments,
                recommendedEdits: [
                    'Closed freeform outline converted into a solid extrusion.',
                    'Perimeter smoothing reduced wobble before generating thickness.',
                    'Depth applied automatically so any sketch becomes a usable 3D form.',
                ],
            };
        }
        case 'tube':
        default: {
            const size = clamp(Math.max(footprint, volumeDepth), 0.75, 3.4);
            return {
                id: `air-pipe-${Date.now()}`,
                label: recognition.label,
                description: 'Open path transformed into a smooth pipe following the sketched trajectory.',
                shape: 'tube',
                color: '#bd7bff',
                rawPoints,
                smoothPoints,
                metrics: recognition.metrics,
                confidence: recognition.confidence,
                size,
                radius: size * 0.5,
                depth: Math.max(volumeDepth, size * 0.8),
                tubeRadius: clamp(size * 0.12, 0.08, 0.36),
                segments,
                recommendedEdits: [
                    'Open gesture preserved as a spatial pipe along the cleaned path.',
                    'Signal smoothing reduced jitter before meshing the curve.',
                    'Thickness calibrated for a readable, editable silhouette.',
                ],
            };
        }
        case 'cone': {
            const radius = clamp(Math.max(recognition.metrics.width, recognition.metrics.depth, 0.3) * 0.4, 0.25, 1.8);
            const depth = clamp(Math.max(recognition.metrics.height * 1.15, 0.85), 0.85, 3.2);
            return {
                id: `air-cone-${Date.now()}`,
                label: recognition.label,
                description: 'Triangular closed gesture interpreted as a tapered conical form.',
                shape: 'cone',
                color: '#f97393',
                rawPoints,
                smoothPoints,
                metrics: recognition.metrics,
                confidence: recognition.confidence,
                size: radius * 2,
                radius,
                depth,
                tubeRadius: clamp(radius * 0.25, 0.08, 0.3),
                segments,
                recommendedEdits: [
                    'Triangular gesture converted into a tapered cone.',
                    'Height increased for a stronger visual cone read.',
                    'Use scale and depth sliders to adjust the taper ratio.',
                ],
            };
        }
        case 'torus': {
            const radius = clamp(footprint * 0.45, 0.4, 2.0);
            const tubeRad = clamp(radius * 0.28, 0.1, 0.45);
            return {
                id: `air-torus-${Date.now()}`,
                label: recognition.label,
                description: 'Circular open trajectory looped into a toroidal ring form.',
                shape: 'torus',
                color: '#7cf7c2',
                rawPoints,
                smoothPoints,
                metrics: recognition.metrics,
                confidence: recognition.confidence,
                size: radius * 2,
                radius,
                depth: radius * 2,
                tubeRadius: tubeRad,
                segments,
                recommendedEdits: [
                    'Circular open path looped into a torus ring.',
                    'Tube radius calibrated for a balanced ring appearance.',
                    'Increase thickness for a heavier industrial ring look.',
                ],
            };
        }
        case 'lathe': {
            const size = clamp(Math.max(footprint, volumeDepth), 0.7, 3.0);
            return {
                id: `air-lathe-${Date.now()}`,
                label: recognition.label,
                description: 'Half-profile rotated around a central axis to create a revolution surface.',
                shape: 'lathe',
                color: '#ffb86c',
                rawPoints,
                smoothPoints,
                metrics: recognition.metrics,
                confidence: recognition.confidence,
                size,
                radius: size * 0.5,
                depth: Math.max(volumeDepth, size * 0.6),
                tubeRadius: clamp(size * 0.08, 0.06, 0.24),
                segments,
                recommendedEdits: [
                    'Profile revolved around the Y axis to generate a smooth surface of revolution.',
                    'Detail slider controls the number of radial segments for smoother edges.',
                    'Try drawing half of a vase, bottle, or goblet profile.',
                ],
            };
        }
    }
}

export function applyAirSketchTuning(model: AirSketchModel, tuning: AirSketchTuning): AirSketchModel {
    const detail = clamp(tuning.detail, 0.75, 1.8);
    const thickness = clamp(tuning.thickness, 0.7, 1.8);
    const scale = clamp(tuning.scale, 0.7, 1.8);
    const depth = clamp(tuning.depth, 0.6, 1.9);

    return {
        ...model,
        size: model.size * scale * (model.shape === 'cube' ? thickness ** 0.18 : 1),
        radius: model.radius * scale * (model.shape === 'sphere' || model.shape === 'cylinder' ? thickness : 1),
        depth: model.depth * depth,
        tubeRadius: model.tubeRadius * thickness,
        segments: Math.round(clamp(model.segments * detail, 16, 120)),
    };
}

export function refineAirSketchModel(model: AirSketchModel, searchContext?: string, prompt?: string): AirSketchModel {
    const refinedSmoothPoints =
        model.shape === 'tube' || model.shape === 'mechanical-bracket'
            ? smoothTrajectory(model.smoothPoints, 3, 2)
            : smoothTrajectory(model.smoothPoints, 2, 1);

    // Parse dimensions from DuckDuckGo context if available
    let parsedDimensions = model.dimensions;
    if (searchContext && searchContext.includes('mm') && prompt?.toLowerCase().includes('mm')) {
        const matches = searchContext.match(/(\d+(?:\.\d+)?)\s?[x*×]\s?(\d+(?:\.\d+)?)\s?[x*×]\s?(\d+(?:\.\d+)?)\s*mm/i);
        if (matches) {
            parsedDimensions = {
                width: parseFloat(matches[1]),
                depth: parseFloat(matches[2]),
                height: parseFloat(matches[3])
            };
        }
    }

    const baseRefinements: Record<AirSketchShape, Partial<AirSketchModel> & { notes?: string[] }> = {
        uploaded: {},
        sphere: {
            radius: model.radius * 1.05,
            depth: model.depth * 1.03,
            segments: Math.round(clamp(model.segments * 1.2, 32, 108)),
            tubeRadius: model.tubeRadius,
            size: model.size * 1.04,
            notes: ['AI co-designer increased symmetry and tessellation for a smoother sphere.'],
        },
        cube: {
            radius: model.radius,
            depth: model.depth * 1.04,
            segments: 28,
            tubeRadius: model.tubeRadius,
            size: model.size * 1.06,
            notes: ['AI squared off corner tangents to sharpen edge bevels.'],
        },
        cylinder: {
            radius: model.radius,
            depth: model.depth * 1.12,
            segments: Math.round(clamp(model.segments * 1.15, 24, 88)),
            tubeRadius: model.tubeRadius,
            size: model.size,
            notes: ['AI emphasized the vertical axis based on perceived motion intent.'],
        },
        cone: {
            radius: model.radius,
            depth: model.depth * 1.15,
            segments: Math.round(clamp(model.segments * 1.15, 24, 72)),
            tubeRadius: model.tubeRadius,
            size: model.size,
            notes: ['Base smoothed and tip sharpened for ideal conical projection.'],
        },
        torus: {
            radius: model.radius * 1.05,
            depth: model.tubeRadius * 2,
            segments: Math.round(clamp(model.segments * 1.25, 48, 128)),
            tubeRadius: clamp(model.tubeRadius * 1.1, 0.1, model.radius * 0.45),
            size: model.size * 1.05,
            notes: ['Ring path smoothed and outer radii balanced for torus.'],
        },
        lathe: {
            radius: model.radius * 1.05,
            depth: model.depth * 1.05,
            segments: Math.round(clamp(model.segments * 1.25, 32, 128)),
            tubeRadius: model.tubeRadius,
            size: model.size * 1.05,
            notes: ['Profile artifacts removed and revolved 360 degrees.'],
        },
        tube: {
            radius: model.radius,
            depth: model.depth,
            segments: Math.round(clamp(model.segments * 0.85, 12, 64)),
            tubeRadius: clamp(model.tubeRadius * 1.18, 0.08, 0.4),
            size: model.size,
            notes: ['Path splines relaxed and tube thickness increased for structural integrity.'],
        },
        extrusion: {
            radius: model.radius,
            depth: model.depth * 1.2,
            segments: Math.round(clamp(model.segments * 0.7, 16, 56)),
            tubeRadius: model.tubeRadius,
            size: model.size,
            notes: ['Planar silhouette cleaned and depth extrusion stepped up.'],
        },
        'mechanical-bracket': {
            radius: model.radius,
            depth: model.depth * 1.5,
            segments: 4,
            tubeRadius: model.tubeRadius,
            size: model.size,
            dimensions: parsedDimensions || model.dimensions,
            notes: ['Converted stroke into precise L-bracket boolean CSG.'],
        },
        'architectural-wall': {
            radius: model.radius,
            depth: model.depth * 2.0,
            segments: 4,
            tubeRadius: model.tubeRadius,
            size: model.size,
            dimensions: parsedDimensions || model.dimensions,
            notes: ['Linear snap activated. Extruded into architectural bearing wall CSG.'],
        },
        'mechanical-gear': {
            radius: model.radius * 1.1,
            depth: model.depth * 0.5,
            segments: 64,
            tubeRadius: model.tubeRadius,
            size: model.size,
            dimensions: parsedDimensions || model.dimensions,
            notes: ['Recognized rotational symmetry. Generating involute teeth profile CSG.'],
        }
    };

    const changes = baseRefinements[model.shape] || {
        radius: model.radius,
        depth: model.depth * 1.08,
        segments: Math.round(clamp(model.segments * 1.25, 32, 120)),
        tubeRadius: model.tubeRadius * 1.12,
        size: model.size,
        notes: ['AI co-designer applied refinements to the geometry.'],
    };

    return {
        ...model,
        smoothPoints: refinedSmoothPoints,
        size: changes.size ?? model.size,
        radius: changes.radius ?? model.radius,
        depth: changes.depth ?? model.depth,
        tubeRadius: changes.tubeRadius ?? model.tubeRadius,
        segments: changes.segments ?? model.segments,
        dimensions: changes.dimensions ?? model.dimensions,
        recommendedEdits: Array.from(new Set([
            ...model.recommendedEdits, 
            ...(changes.notes ?? []),
            parsedDimensions ? `Applied real-world precision (${parsedDimensions.width}x${parsedDimensions.depth}x${parsedDimensions.height} mm) from web search.` : 'Tension released on interior vertices.',
            'Normals recalculated for crisp rendering.',
        ])),
    };
}
