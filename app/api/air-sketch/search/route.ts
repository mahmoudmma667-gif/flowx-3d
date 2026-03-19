export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';

interface SearchHint {
    title: string;
    snippet: string;
    shapeKeywords: string[];
    suggestedMode: 'smart' | 'outline' | 'path' | null;
    geometryHints: string[];
}

const SHAPE_KEYWORDS_MAP: Record<string, string[]> = {
    sphere: ['sphere', 'ball', 'round', 'globe', 'orb', 'dome', 'hemisphere'],
    cube: ['cube', 'box', 'block', 'rectangular', 'square', 'brick', 'prism'],
    cylinder: ['cylinder', 'pillar', 'column', 'tube', 'pipe', 'rod', 'post', 'tower'],
    cone: ['cone', 'pyramid', 'funnel', 'conical', 'pointed', 'tapered'],
    torus: ['torus', 'ring', 'donut', 'loop', 'annular', 'halo', 'circular ring'],
    helix: ['helix', 'spiral', 'coil', 'dna', 'spring', 'twisted', 'helical', 'corkscrew'],
    star: ['star', 'asterisk', 'pentagram', 'stellar'],
    heart: ['heart', 'cardiac', 'love', 'valentine'],
    gear: ['gear', 'cog', 'sprocket', 'mechanical', 'tooth'],
    leaf: ['leaf', 'petal', 'botanical', 'organic', 'natural'],
    arrow: ['arrow', 'chevron', 'pointer', 'direction', 'indicator'],
    wave: ['wave', 'sine', 'oscillation', 'ripple', 'undulation'],
    diamond: ['diamond', 'rhombus', 'gemstone', 'crystal'],
    cloud: ['cloud', 'cumulus', 'fluffy', 'nebula'],
    crescent: ['crescent', 'moon', 'lunar', 'sickle'],
    flower: ['flower', 'bloom', 'blossom', 'rosette', 'daisy'],
};

function extractShapeKeywords(text: string): string[] {
    const lower = text.toLowerCase();
    const found: string[] = [];
    for (const [shape, keywords] of Object.entries(SHAPE_KEYWORDS_MAP)) {
        if (keywords.some(kw => lower.includes(kw))) {
            found.push(shape);
        }
    }
    return found;
}

function suggestMode(keywords: string[]): 'smart' | 'outline' | 'path' | null {
    const smartShapes = ['sphere', 'cube', 'cylinder', 'cone'];
    const pathShapes = ['helix', 'wave', 'torus'];
    if (keywords.some(k => smartShapes.includes(k))) return 'smart';
    if (keywords.some(k => pathShapes.includes(k))) return 'path';
    if (keywords.length > 0) return 'outline';
    return null;
}

function extractGeometryHints(text: string): string[] {
    const hints: string[] = [];
    const lower = text.toLowerCase();

    if (/symmet/i.test(lower)) hints.push('symmetric');
    if (/hollow|empty|shell/i.test(lower)) hints.push('hollow');
    if (/solid|filled|dense/i.test(lower)) hints.push('solid');
    if (/smooth|curved|rounded/i.test(lower)) hints.push('smooth');
    if (/sharp|angular|faceted/i.test(lower)) hints.push('angular');
    if (/thin|slim|flat/i.test(lower)) hints.push('thin');
    if (/thick|heavy|bold/i.test(lower)) hints.push('thick');
    if (/tall|vertical|upright/i.test(lower)) hints.push('tall');
    if (/wide|horizontal|flat/i.test(lower)) hints.push('wide');
    if (/spiral|twist|rotate/i.test(lower)) hints.push('spiral');
    if (/double|twin|pair/i.test(lower)) hints.push('double');
    if (/branch|fork|split/i.test(lower)) hints.push('branching');

    return hints;
}

async function searchDuckDuckGo(query: string): Promise<{ title: string; snippet: string } | null> {
    try {
        const encoded = encodeURIComponent(`${query} 3D shape geometry`);
        const response = await fetch(
            `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`,
            { signal: AbortSignal.timeout(4000) },
        );

        if (!response.ok) return null;

        const data = await response.json() as {
            Abstract?: string;
            AbstractText?: string;
            Heading?: string;
            RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
        };

        const abstract = data.AbstractText || data.Abstract || '';
        const heading = data.Heading || query;

        if (abstract && abstract.length > 20) {
            return { title: heading, snippet: abstract.slice(0, 500) };
        }

        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            const topics = data.RelatedTopics
                .filter(t => t.Text)
                .slice(0, 3)
                .map(t => t.Text!)
                .join(' | ');
            if (topics.length > 15) {
                return { title: heading, snippet: topics.slice(0, 500) };
            }
        }

        return null;
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as { query?: string };
        const query = (body.query || '').trim();

        if (!query || query.length < 2) {
            return NextResponse.json({ success: false, message: 'Query too short' }, { status: 400 });
        }

        const webResult = await searchDuckDuckGo(query);
        const combinedText = `${query} ${webResult?.snippet ?? ''}`;

        const shapeKeywords = extractShapeKeywords(combinedText);
        const geometryHints = extractGeometryHints(combinedText);
        const suggestedModeValue = suggestMode(shapeKeywords);

        const hint: SearchHint = {
            title: webResult?.title ?? query,
            snippet: webResult?.snippet ?? `No web results found for "${query}". Using local shape intelligence.`,
            shapeKeywords,
            suggestedMode: suggestedModeValue,
            geometryHints,
        };

        return NextResponse.json({ success: true, data: hint });
    } catch (error) {
        console.error('Air Sketch search error:', error);
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Internal search error',
        }, { status: 500 });
    }
}
