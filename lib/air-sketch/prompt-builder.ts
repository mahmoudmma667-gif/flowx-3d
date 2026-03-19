import type { AirSketchPoint, AirSketchTuning } from '@/lib/air-sketch/engine';

export type PromptConversionMode = 'smart' | 'outline' | 'path';

export interface PromptGeneratedSketch {
    prompt: string;
    mode: PromptConversionMode;
    points: AirSketchPoint[];
    summary: string;
    assistantText: string;
    notes: string[];
    tuning: Partial<AirSketchTuning>;
}

const BIG_TERMS = ['big', 'large', 'huge', 'oversized', 'wide', '\u0643\u0628\u064a\u0631', '\u0636\u062e\u0645', '\u0648\u0627\u0633\u0639'];
const SMALL_TERMS = ['small', 'tiny', 'mini', 'compact', '\u0635\u063a\u064a\u0631', '\u0645\u0635\u063a\u0631'];
const THICK_TERMS = ['thick', 'bold', 'solid', 'deep', 'dense', '\u0633\u0645\u064a\u0643', '\u0639\u0645\u064a\u0642', '\u0645\u062a\u064a\u0646', '\u0635\u0644\u0628'];
const THIN_TERMS = ['thin', 'slim', 'flat', 'light', '\u0631\u0641\u064a\u0639', '\u0646\u062d\u064a\u0641', '\u0645\u0633\u0637\u062d'];
const DETAIL_TERMS = ['detailed', 'smooth', 'clean', 'precise', 'high detail', '\u0646\u0627\u0639\u0645', '\u062f\u0642\u064a\u0642', '\u062a\u0641\u0635\u064a\u0644\u064a'];
const ROUNDED_TERMS = ['rounded', 'soft', 'pill', 'smooth', '\u0645\u062f\u0648\u0631', '\u0646\u0627\u0639\u0645'];
const SHARP_TERMS = ['sharp', 'edgy', 'pointed', 'faceted', '\u062d\u0627\u062f', '\u0645\u062f\u0628\u0628'];
const OPEN_PATH_TERMS = ['pipe', 'tube', 'curve', 'wave', 'ribbon', 'spiral', 'wire', 'cable', 'path', 'handle', '\u0623\u0646\u0628\u0648\u0628', '\u0645\u0627\u0633\u0648\u0631\u0629', '\u0645\u0648\u062c\u0629', '\u0645\u0646\u062d\u0646\u0649', '\u062d\u0644\u0632\u0648\u0646'];

function hasAnyTerm(value: string, terms: string[]) {
    return terms.some((term) => value.includes(term));
}

function seedFromText(value: string) {
    return Array.from(value).reduce((total, character, index) => total + character.charCodeAt(0) * (index + 1), 0) || 97;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function createPoint(x: number, y: number, z: number, timestamp: number): AirSketchPoint {
    return { x, y, z, timestamp };
}

function closePath(points: AirSketchPoint[]) {
    if (points.length === 0) return points;
    const first = points[0];
    const last = points[points.length - 1];

    if (Math.hypot(first.x - last.x, first.y - last.y, first.z - last.z) < 0.001) {
        return points;
    }

    return [...points, createPoint(first.x, first.y, first.z, last.timestamp + 16)];
}

function scalePoints(points: AirSketchPoint[], scaleX: number, scaleY = scaleX, scaleZ = scaleX) {
    return points.map((point) => ({
        ...point,
        x: point.x * scaleX,
        y: point.y * scaleY,
        z: point.z * scaleZ,
    }));
}

function createInterpolatedPolygon(vertices: Array<{ x: number; y: number; z?: number }>, subdivisions = 10, closed = true) {
    const points: AirSketchPoint[] = [];
    const limit = closed ? vertices.length : vertices.length - 1;

    for (let index = 0; index < limit; index += 1) {
        const current = vertices[index];
        const next = vertices[(index + 1) % vertices.length];

        for (let step = 0; step < subdivisions; step += 1) {
            const progress = step / subdivisions;
            points.push(
                createPoint(
                    current.x + (next.x - current.x) * progress,
                    current.y + (next.y - current.y) * progress,
                    (current.z ?? 0) + ((next.z ?? 0) - (current.z ?? 0)) * progress,
                    points.length * 16,
                ),
            );
        }
    }

    if (!closed) {
        const last = vertices[vertices.length - 1];
        points.push(createPoint(last.x, last.y, last.z ?? 0, points.length * 16));
        return points;
    }

    return closePath(points);
}

function createCirclePoints(count = 72, radiusX = 1.2, radiusY = radiusX) {
    const points: AirSketchPoint[] = [];

    for (let index = 0; index < count; index += 1) {
        const angle = (index / count) * Math.PI * 2;
        points.push(createPoint(Math.cos(angle) * radiusX, Math.sin(angle) * radiusY, Math.sin(angle * 2) * 0.08, index * 16));
    }

    return closePath(points);
}

function createPolygonPoints(sides: number, radiusX = 1.25, radiusY = radiusX, subdivisions = 10) {
    return createInterpolatedPolygon(
        Array.from({ length: Math.max(3, sides) }, (_, index) => {
            const angle = -Math.PI / 2 + (index / Math.max(3, sides)) * Math.PI * 2;
            return { x: Math.cos(angle) * radiusX, y: Math.sin(angle) * radiusY };
        }),
        subdivisions,
        true,
    );
}

function createHeartPoints(count = 84) {
    const points: AirSketchPoint[] = [];

    for (let index = 0; index < count; index += 1) {
        const angle = (index / count) * Math.PI * 2;
        const x = 0.08 * 16 * Math.sin(angle) ** 3;
        const y = 0.08 * (13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
        points.push(createPoint(x, y, Math.sin(angle * 3) * 0.05, index * 16));
    }

    return closePath(points);
}

function createStarPoints(arms = 5, outerRadius = 1.45, innerRadius = 0.68) {
    const vertices: Array<{ x: number; y: number }> = [];

    for (let index = 0; index < arms * 2; index += 1) {
        const angle = -Math.PI / 2 + (index / (arms * 2)) * Math.PI * 2;
        const radius = index % 2 === 0 ? outerRadius : innerRadius;
        vertices.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }

    return createInterpolatedPolygon(vertices, 7, true);
}

function createFlowerPoints(petals = 6, outerRadius = 1.35, innerRadius = 0.56) {
    const points: AirSketchPoint[] = [];
    const count = Math.max(72, petals * 18);

    for (let index = 0; index < count; index += 1) {
        const angle = (index / count) * Math.PI * 2;
        const radius = innerRadius + ((Math.cos(angle * petals) + 1) / 2) * (outerRadius - innerRadius);
        points.push(createPoint(Math.cos(angle) * radius, Math.sin(angle) * radius, Math.sin(angle * petals) * 0.05, index * 16));
    }

    return closePath(points);
}

function createLeafPoints(count = 84) {
    const points: AirSketchPoint[] = [];

    for (let index = 0; index < count; index += 1) {
        const progress = index / count;
        const angle = progress * Math.PI * 2;
        const x = Math.sin(angle) * (1 - 0.35 * Math.cos(angle));
        const y = Math.cos(angle) * 1.42;
        points.push(createPoint(x, y, Math.sin(angle * 2) * 0.04, index * 16));
    }

    return closePath(points);
}

function createDropletPoints(count = 84) {
    const points: AirSketchPoint[] = [];

    for (let index = 0; index < count; index += 1) {
        const angle = (index / count) * Math.PI * 2;
        const radius = 1 - 0.35 * Math.sin(angle / 2);
        const x = Math.cos(angle) * radius * 0.95;
        const y = Math.sin(angle) * radius * 1.2 + 0.36;
        points.push(createPoint(x, y, Math.sin(angle * 4) * 0.04, index * 16));
    }

    return closePath(points);
}

function createCrescentPoints(count = 88) {
    const outer: AirSketchPoint[] = [];
    const inner: AirSketchPoint[] = [];

    for (let index = 0; index <= count / 2; index += 1) {
        const angle = -Math.PI / 2 + (index / (count / 2)) * Math.PI;
        outer.push(createPoint(Math.cos(angle) * 1.25, Math.sin(angle) * 1.55, 0.03, outer.length * 16));
    }

    for (let index = 0; index <= count / 2; index += 1) {
        const angle = Math.PI / 2 - (index / (count / 2)) * Math.PI;
        inner.push(createPoint(Math.cos(angle) * 0.78 + 0.42, Math.sin(angle) * 1.18, -0.03, (outer.length + inner.length) * 16));
    }

    return closePath([...outer, ...inner]);
}

function createCloudPoints(lobes = 5, count = 96) {
    const points: AirSketchPoint[] = [];

    for (let index = 0; index < count; index += 1) {
        const angle = (index / count) * Math.PI * 2;
        const radius = 0.92 + Math.max(0, Math.cos(angle * lobes)) * 0.42 + Math.sin(angle * 2) * 0.08;
        points.push(createPoint(Math.cos(angle) * radius * 1.3, Math.sin(angle) * radius * 0.92, Math.cos(angle * lobes) * 0.04, index * 16));
    }

    return closePath(points);
}

function createGearPoints(teeth = 8, outerRadius = 1.38, innerRadius = 1.02) {
    const vertices: Array<{ x: number; y: number }> = [];

    for (let index = 0; index < teeth * 2; index += 1) {
        const angle = -Math.PI / 2 + (index / (teeth * 2)) * Math.PI * 2;
        const radius = index % 2 === 0 ? outerRadius : innerRadius;
        vertices.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }

    return createInterpolatedPolygon(vertices, 4, true);
}

function createArrowPoints() {
    return createInterpolatedPolygon(
        [
            { x: -1.35, y: 0.25 },
            { x: 0.12, y: 0.25 },
            { x: 0.12, y: 0.86 },
            { x: 1.35, y: 0 },
            { x: 0.12, y: -0.86 },
            { x: 0.12, y: -0.25 },
            { x: -1.35, y: -0.25 },
        ],
        10,
        true,
    );
}

function createDiamondPoints() {
    return createInterpolatedPolygon(
        [
            { x: 0, y: 1.42 },
            { x: 1.12, y: 0 },
            { x: 0, y: -1.42 },
            { x: -1.12, y: 0 },
        ],
        12,
        true,
    );
}

function createRoundedRectanglePoints(width = 1.8, height = 1.45, cornerRadius = 0.35) {
    const steps = 12;
    const corners = [
        { centerX: width / 2 - cornerRadius, centerY: height / 2 - cornerRadius, startAngle: -Math.PI / 2 },
        { centerX: width / 2 - cornerRadius, centerY: -height / 2 + cornerRadius, startAngle: 0 },
        { centerX: -width / 2 + cornerRadius, centerY: -height / 2 + cornerRadius, startAngle: Math.PI / 2 },
        { centerX: -width / 2 + cornerRadius, centerY: height / 2 - cornerRadius, startAngle: Math.PI },
    ];
    const points: AirSketchPoint[] = [];

    corners.forEach((corner, cornerIndex) => {
        for (let step = 0; step < steps; step += 1) {
            const angle = corner.startAngle + (step / steps) * (Math.PI / 2);
            points.push(createPoint(corner.centerX + Math.cos(angle) * cornerRadius, corner.centerY + Math.sin(angle) * cornerRadius, Math.sin((cornerIndex * steps + step) * 0.24) * 0.04, points.length * 16));
        }
    });

    return closePath(points);
}

function createWavePoints(length = 3.4, amplitude = 1.1, segments = 76) {
    const points: AirSketchPoint[] = [];

    for (let index = 0; index < segments; index += 1) {
        const progress = index / Math.max(segments - 1, 1);
        const x = -length / 2 + progress * length;
        const y = Math.sin(progress * Math.PI * 2.4) * amplitude * (0.75 + Math.sin(progress * Math.PI) * 0.25);
        const z = Math.cos(progress * Math.PI * 3) * 0.34;
        points.push(createPoint(x, y, z, index * 16));
    }

    return points;
}

function createSpiralPoints(turns = 2.35, maxRadius = 1.55, segments = 96) {
    const points: AirSketchPoint[] = [];

    for (let index = 0; index < segments; index += 1) {
        const progress = index / Math.max(segments - 1, 1);
        const angle = progress * Math.PI * 2 * turns;
        const radius = 0.28 + progress * maxRadius;
        points.push(createPoint(Math.cos(angle) * radius, Math.sin(angle) * radius, (progress - 0.5) * 1.1, index * 16));
    }

    return points;
}

function createTowerPoints(height = 3.25, sway = 0.16, segments = 44) {
    const points: AirSketchPoint[] = [];

    for (let index = 0; index < segments; index += 1) {
        const progress = index / Math.max(segments - 1, 1);
        points.push(createPoint(Math.sin(progress * Math.PI * 1.6) * sway, -height / 2 + progress * height, Math.cos(progress * Math.PI * 1.1) * 0.16, index * 16));
    }

    return points;
}

function createOrganicOutline(seed: number, count = 92, complexity = 1) {
    const points: AirSketchPoint[] = [];
    const primaryLobe = 3 + (seed % 4);
    const secondaryLobe = 5 + (seed % 3);
    const wobble = 0.12 + (seed % 5) * 0.02 * complexity;

    for (let index = 0; index < count; index += 1) {
        const angle = (index / count) * Math.PI * 2;
        const radius = 1.08 + Math.sin(angle * primaryLobe) * wobble + Math.cos(angle * secondaryLobe) * wobble * 0.75;
        points.push(createPoint(Math.cos(angle) * radius, Math.sin(angle) * radius * (0.82 + (seed % 6) * 0.03), Math.sin(angle * (secondaryLobe + 1)) * 0.08, index * 16));
    }

    return closePath(points);
}

function extractNumber(value: string, relatedTerms: string[]) {
    const directMatch = value.match(/(\d{1,2})/);
    if (directMatch) return clamp(Number(directMatch[1]), 3, 16);

    const dictionary: Array<[number, string[]]> = [
        [3, ['three', 'triangle', '\u062b\u0644\u0627\u062b\u064a', '\u0645\u062b\u0644\u062b']],
        [4, ['four', 'square', '\u0623\u0631\u0628\u0639', '\u0645\u0631\u0628\u0639']],
        [5, ['five', 'pentagon', '\u062e\u0645\u0627\u0633\u064a']],
        [6, ['six', 'hexagon', '\u0633\u062f\u0627\u0633\u064a']],
        [7, ['seven', 'heptagon']],
        [8, ['eight', 'octagon', '\u062b\u0645\u0627\u0646\u064a']],
        [9, ['nine', 'nonagon']],
        [10, ['ten', 'decagon']],
    ];

    for (const [count, terms] of dictionary) {
        if (hasAnyTerm(value, [...relatedTerms, ...terms])) {
            return count;
        }
    }

    return null;
}

export function buildPromptGeneratedSketch(prompt: string): PromptGeneratedSketch {
    const normalizedPrompt = prompt.trim().toLowerCase();
    const seed = seedFromText(normalizedPrompt);
    const scale = hasAnyTerm(normalizedPrompt, BIG_TERMS) ? 1.25 : hasAnyTerm(normalizedPrompt, SMALL_TERMS) ? 0.84 : 1;
    const thickness = hasAnyTerm(normalizedPrompt, THICK_TERMS) ? 1.28 : hasAnyTerm(normalizedPrompt, THIN_TERMS) ? 0.82 : 1;
    const detail = hasAnyTerm(normalizedPrompt, DETAIL_TERMS) ? 1.18 : 1;
    const rounded = hasAnyTerm(normalizedPrompt, ROUNDED_TERMS);
    const sharp = hasAnyTerm(normalizedPrompt, SHARP_TERMS);

    const tuning: Partial<AirSketchTuning> = {
        scale,
        depth: thickness,
        thickness,
        detail,
    };

    const polygonSides = extractNumber(normalizedPrompt, ['sides', 'side', 'polygon', '\u0623\u0636\u0644\u0627\u0639']);
    const flowerPetals = extractNumber(normalizedPrompt, ['petals', 'petal', 'flower', '\u0628\u062a\u0644\u0627\u062a', '\u0632\u0647\u0631\u0629']);
    const gearTeeth = extractNumber(normalizedPrompt, ['teeth', 'gear', '\u062a\u0631\u0648\u0633']);

    let points = createOrganicOutline(seed, 92, detail);
    let mode: PromptConversionMode = hasAnyTerm(normalizedPrompt, OPEN_PATH_TERMS) ? 'path' : 'outline';
    let summary = 'Custom freeform silhouette';
    let assistantText = 'I generated a procedural freeform outline from your description and converted it into an editable 3D shape.';
    let notes = [
        'Prompt-to-shape mode now uses a broader procedural generator instead of only a fixed template set.',
        'Unknown prompts fall back to a learned freeform silhouette so the workspace always produces a usable 3D result.',
    ];

    if (hasAnyTerm(normalizedPrompt, ['sphere', 'ball', 'orb', 'circle', 'round', 'dome', '\u0643\u0631\u0629', '\u0643\u0631\u0648\u064a', '\u062f\u0627\u0626\u0631\u0629'])) {
        points = createCirclePoints(76, rounded ? 1.28 : 1.2, 1.2);
        mode = 'smart';
        summary = 'Rounded volumetric concept';
        assistantText = 'I mapped your description to a circular motion profile so the smart recognizer can inflate it into a volumetric rounded solid.';
        notes = [
            'Circular prompts are routed through Smart 3D recognition for a better spherical interpretation.',
            'Rounded wording increases symmetry and keeps the result clean for further refinement.',
        ];
    } else if (hasAnyTerm(normalizedPrompt, ['cube', 'box', 'square', 'block', '\u0645\u0643\u0639\u0628', '\u0635\u0646\u062f\u0648\u0642', '\u0645\u0631\u0628\u0639'])) {
        points = createPolygonPoints(4, sharp ? 1.24 : 1.12, sharp ? 1.24 : 1.12, sharp ? 8 : 14);
        mode = 'smart';
        summary = 'Cubic product mass';
        assistantText = 'I generated a corner-rich profile so the smart recognizer can build a cleaner cube-like solid.';
        notes = [
            'Square and box prompts lean into Smart 3D to create a stronger volumetric read.',
            'Sharp wording increases corner contrast before recognition.',
        ];
    } else if (hasAnyTerm(normalizedPrompt, ['cylinder', 'tower', 'pillar', 'column', '\u0627\u0633\u0637\u0648\u0627\u0646\u0629', '\u0639\u0645\u0648\u062f', '\u0628\u0631\u062c'])) {
        points = createTowerPoints();
        mode = 'smart';
        summary = 'Tall cylindrical form';
        assistantText = 'I built a tall vertical stroke so the engine can interpret it as a stable cylindrical form.';
        notes = [
            'Tall prompts are kept vertically biased to improve cylinder recognition.',
            'Depth and thickness can quickly move this between a slim post and a heavy structural column.',
        ];
    } else if (hasAnyTerm(normalizedPrompt, ['ring', 'donut', 'torus', 'halo', '\u062d\u0644\u0642\u0629', '\u062f\u0648\u0646\u0627\u062a'])) {
        points = createCirclePoints(86, 1.35, 1.1);
        mode = 'path';
        summary = 'Looped ring path';
        assistantText = 'I generated a closed loop path and routed it through the tube workflow to create a ring-like 3D form.';
        notes = [
            'Loop prompts use the path workflow so they stay editable and easier to sculpt.',
            'Increase thickness to push the silhouette closer to a torus-style object.',
        ];
    } else if (hasAnyTerm(normalizedPrompt, ['spiral', 'helix', 'coil', '\u062d\u0644\u0632\u0648\u0646', '\u0644\u0648\u0644\u0628'])) {
        points = createSpiralPoints();
        mode = 'path';
        summary = 'Spiral path concept';
        assistantText = 'I translated your prompt into a spatial spiral path and meshed it as an editable tubular form.';
        notes = [
            'Spiral prompts are procedural now and no longer limited to a single fixed sample shape.',
            'Thickness and detail are the fastest controls for making coils feel industrial or decorative.',
        ];
    } else if (hasAnyTerm(normalizedPrompt, ['wave', 'ribbon', 'cable', 'wire', 'path', 'handle', '\u0645\u0648\u062c\u0629', '\u0633\u0644\u0643', '\u0645\u0642\u0628\u0636'])) {
        points = createWavePoints(rounded ? 3.9 : 3.4, sharp ? 0.92 : 1.1);
        mode = 'path';
        summary = 'Flow path concept';
        assistantText = 'I converted your description into a flowing spatial path that can be meshed as a tube or handle-like form.';
        notes = [
            'Path prompts now adapt their wave amplitude and length based on your wording.',
            'This is useful for handles, cables, ribbons, and routing concepts.',
        ];
    } else if (hasAnyTerm(normalizedPrompt, ['heart', 'badge', 'love', '\u0642\u0644\u0628'])) {
        points = createHeartPoints();
        mode = 'outline';
        summary = 'Heart badge concept';
        assistantText = 'I created a heart silhouette and extruded it into a clean badge-style 3D form.';
        notes = [
            'Decorative silhouettes are preserved as outline extrusions for better shape fidelity.',
            'Rounded and thick wording produces softer, more badge-like results.',
        ];
    } else if (hasAnyTerm(normalizedPrompt, ['star', 'medal', '\u0646\u062c\u0645\u0629', '\u0648\u0633\u0627\u0645'])) {
        points = createStarPoints(clamp(extractNumber(normalizedPrompt, ['points', 'point', '\u0646\u0642\u0627\u0637']) ?? 5, 4, 10), sharp ? 1.54 : 1.42, rounded ? 0.82 : 0.66);
        mode = 'outline';
        summary = 'Star badge concept';
        assistantText = 'I generated a star profile procedurally and extruded it into a sharper 3D emblem.';
        notes = [
            'Star prompts support variable point counts now instead of a single fixed star.',
            'Sharp language exaggerates the point contrast while rounded language softens the notches.',
        ];
    } else if (polygonSides) {
        points = createPolygonPoints(polygonSides, rounded ? 1.24 : 1.18, rounded ? 1.24 : 1.18, rounded ? 16 : 10);
        mode = polygonSides <= 4 ? 'smart' : 'outline';
        summary = `${polygonSides}-sided polygon concept`;
        assistantText = `I generated a procedural ${polygonSides}-sided profile from your prompt and converted it into an editable 3D solid.`;
        notes = [
            'Number-aware polygon generation is now supported, including direct side counts from text.',
            'Lower-side polygons can be routed through Smart 3D while higher-side profiles stay closer to their original outline.',
        ];
    } else if (flowerPetals || hasAnyTerm(normalizedPrompt, ['flower', 'petal', 'bloom', '\u0632\u0647\u0631\u0629', '\u0628\u062a\u0644\u0629'])) {
        points = createFlowerPoints(clamp(flowerPetals ?? 6, 4, 12), rounded ? 1.45 : 1.32, rounded ? 0.74 : 0.56);
        mode = 'outline';
        summary = 'Floral silhouette concept';
        assistantText = 'I procedurally expanded your prompt into a petal-based silhouette and extruded it into a decorative 3D form.';
        notes = [
            'Flower prompts now support petal counts from your text.',
            'Rounded language adds fuller petals while sharper language makes the flower more graphic and emblem-like.',
        ];
    } else if (gearTeeth || hasAnyTerm(normalizedPrompt, ['gear', 'cog', 'mechanical', '\u062a\u0631\u0633', '\u0645\u064a\u0643\u0627\u0646\u064a\u0643\u064a'])) {
        points = createGearPoints(clamp(gearTeeth ?? 8, 6, 14), sharp ? 1.46 : 1.34, sharp ? 0.92 : 1.04);
        mode = 'outline';
        summary = 'Mechanical gear concept';
        assistantText = 'I generated a toothed mechanical silhouette and converted it into an extruded 3D part.';
        notes = [
            'Mechanical prompts now use a dedicated procedural gear generator with tooth count support.',
            'This is useful for tokens, dials, gears, and mechanical badges.',
        ];
    } else if (hasAnyTerm(normalizedPrompt, ['leaf', 'organic', '\u0648\u0631\u0642\u0629', '\u0639\u0636\u0648\u064a'])) {
        points = createLeafPoints();
        mode = 'outline';
        summary = 'Organic leaf concept';
        assistantText = 'I shaped your prompt into an organic leaf-like silhouette for a softer, more natural extrusion.';
        notes = [
            'Organic prompts follow a dedicated leaf-style generator to avoid looking like generic polygons.',
            'Rounded wording pushes the profile toward softer botanical forms.',
        ];
    } else if (hasAnyTerm(normalizedPrompt, ['drop', 'droplet', 'tear', 'water', '\u0642\u0637\u0631\u0629', '\u062f\u0645\u0639\u0629', '\u0645\u0627\u0621'])) {
        points = createDropletPoints();
        mode = 'outline';
        summary = 'Droplet concept';
        assistantText = 'I translated your description into a teardrop-style outline and extruded it into a clean 3D form.';
        notes = [
            'Droplet prompts are useful for water icons, pendants, and organic product shells.',
            'Thickness can turn this from a flat badge into a heavy volumetric object.',
        ];
    } else if (hasAnyTerm(normalizedPrompt, ['moon', 'crescent', '\u0647\u0644\u0627\u0644', '\u0642\u0645\u0631'])) {
        points = createCrescentPoints();
        mode = 'outline';
        summary = 'Crescent profile concept';
        assistantText = 'I built a crescent profile and extruded it into a cleaner symbolic 3D form.';
        notes = [
            'Crescent prompts now use a dedicated profile instead of falling back to a generic outline.',
            'The resulting profile keeps its inner cutout better than a basic circle subtraction look.',
        ];
    } else if (hasAnyTerm(normalizedPrompt, ['cloud', 'bubble', '\u0633\u062d\u0627\u0628\u0629', '\u0641\u0642\u0627\u0639\u0629'])) {
        points = createCloudPoints(clamp(extractNumber(normalizedPrompt, ['lobes', 'cloud']) ?? 5, 4, 8));
        mode = 'outline';
        summary = 'Cloud silhouette concept';
        assistantText = 'I generated a cloud-like profile with multiple soft lobes and extruded it into an editable 3D form.';
        notes = [
            'Cloud prompts are now procedural and can vary in lobe count.',
            'This works well for playful branding, icons, and soft UI object exploration.',
        ];
    } else if (hasAnyTerm(normalizedPrompt, ['arrow', 'direction', '\u0633\u0647\u0645', '\u0627\u062a\u062c\u0627\u0647'])) {
        points = createArrowPoints();
        mode = 'outline';
        summary = 'Directional arrow concept';
        assistantText = 'I generated a directional arrow profile and extruded it into a clean 3D marker-like form.';
        notes = [
            'Arrow prompts use a dedicated silhouette so the direction stays readable after extrusion.',
            'Sharp language helps keep the tip more assertive.',
        ];
    } else if (hasAnyTerm(normalizedPrompt, ['diamond', 'kite', 'gem', '\u0645\u0627\u0633\u0629', '\u0645\u0639\u064a\u0646'])) {
        points = createDiamondPoints();
        mode = 'outline';
        summary = 'Diamond profile concept';
        assistantText = 'I generated a diamond-like profile and extruded it into a sharper faceted form.';
        notes = [
            'Diamond prompts now use a dedicated polygon profile instead of a generic square fallback.',
            'Increase depth for gem-like volume or keep it shallow for panel and icon work.',
        ];
    } else if (hasAnyTerm(normalizedPrompt, ['panel', 'screen', 'card', 'tablet', '\u0644\u0648\u062d\u0629', '\u0634\u0627\u0634\u0629', '\u0628\u0637\u0627\u0642\u0629'])) {
        points = createRoundedRectanglePoints(rounded ? 2 : 1.82, rounded ? 1.52 : 1.4, rounded ? 0.42 : 0.28);
        mode = 'outline';
        summary = 'Rounded panel concept';
        assistantText = 'I generated a rounded panel-like outline so you can turn it into a shell, tablet, plate, or interface surface.';
        notes = [
            'Rounded rectangular prompts are useful for product shells, UI panels, and device concepts.',
            'Depth controls the move from flat mockups to heavier industrial enclosures.',
        ];
    } else if (hasAnyTerm(normalizedPrompt, ['logo', 'icon', 'symbol', 'badge', '\u0634\u0639\u0627\u0631', '\u0623\u064a\u0642\u0648\u0646\u0629', '\u0631\u0645\u0632'])) {
        points = createOrganicOutline(seed, 92, sharp ? 1.4 : 1.1);
        mode = 'outline';
        summary = 'Custom emblem concept';
        assistantText = 'I generated a custom emblem-style silhouette from the prompt and prepared it as a clean extrudable logo form.';
        notes = [
            'Branding prompts now land on a stable emblem generator rather than a random organic outline.',
            'The result is still freeform, but tuned for cleaner extrusion and editability.',
        ];
    }

    return {
        prompt,
        mode,
        points: scalePoints(points, scale, scale, scale * 0.9),
        summary,
        assistantText,
        notes,
        tuning,
    };
}
