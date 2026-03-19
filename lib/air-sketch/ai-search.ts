export interface ShapeSearchResult {
    title: string;
    snippet: string;
    shapeKeywords: string[];
    suggestedMode: 'smart' | 'outline' | 'path' | null;
    geometryHints: string[];
}

export interface ShapeSearchResponse {
    success: boolean;
    data?: ShapeSearchResult;
    message?: string;
}

export async function searchShapeReference(query: string): Promise<ShapeSearchResult | null> {
    try {
        const response = await fetch('/api/air-sketch/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
            signal: AbortSignal.timeout(6000),
        });

        if (!response.ok) return null;
        const result = (await response.json()) as ShapeSearchResponse;
        return result.success && result.data ? result.data : null;
    } catch {
        return null;
    }
}

export function buildSearchNotes(search: ShapeSearchResult): string[] {
    const notes: string[] = [];

    if (search.snippet && search.snippet.length > 30) {
        notes.push(`🔍 Web insight: ${search.snippet.slice(0, 200)}${search.snippet.length > 200 ? '...' : ''}`);
    }

    if (search.shapeKeywords.length > 0) {
        notes.push(`🧠 AI detected shape types: ${search.shapeKeywords.join(', ')}`);
    }

    if (search.geometryHints.length > 0) {
        notes.push(`📐 Geometry hints: ${search.geometryHints.join(', ')}`);
    }

    if (search.suggestedMode) {
        const modeLabels: Record<string, string> = {
            smart: 'Smart 3D (volumetric recognition)',
            outline: 'Outline Extrude (silhouette-based)',
            path: 'Path Tube (trajectory-based)',
        };
        notes.push(`💡 Recommended mode: ${modeLabels[search.suggestedMode] || search.suggestedMode}`);
    }

    return notes;
}

export function suggestNextShapes(history: string[]): string[] {
    const complements: Record<string, string[]> = {
        sphere: ['Create a cylinder pedestal', 'Add a ring around it', 'Build a cube frame'],
        cube: ['Add a sphere on top', 'Create a cylinder connector', 'Build a star badge'],
        cylinder: ['Add a cone cap', 'Create a ring base', 'Build a spiral around it'],
        cone: ['Create a cylinder base', 'Add a sphere tip', 'Build a ring at the base'],
        torus: ['Add a sphere in the center', 'Create a spiral through it', 'Build a diamond inside'],
        heart: ['Create a star medal', 'Add an arrow through it', 'Build a flower around it'],
        star: ['Create a circle badge behind it', 'Add a heart center', 'Build a gear frame'],
        spiral: ['Add straight connectors', 'Create a ring at the end', 'Build a sphere cap'],
    };

    const suggestions: string[] = [];
    const recent = history.slice(-3);

    for (const entry of recent) {
        const lower = entry.toLowerCase();
        for (const [key, values] of Object.entries(complements)) {
            if (lower.includes(key)) {
                suggestions.push(...values);
            }
        }
    }

    const unique = Array.from(new Set(suggestions));
    return unique.length > 0 ? unique.slice(0, 6) : [
        'Create a thick heart badge',
        'Build a tall cylinder tower',
        'Generate a smooth spiral pipe',
        'اعمل نجمة ثلاثية الأبعاد',
    ];
}
