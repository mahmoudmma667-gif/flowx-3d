'use client';

import Link from 'next/link';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cuboid, Eye, Heart } from 'lucide-react';

interface Model3DData {
    id: string;
    name: string;
    size: number;
    format: string;
    createdAt: string | Date;
}

interface ModelCardProps {
    model: Model3DData;
}

export function ModelCard({ model }: ModelCardProps) {
    return (
        <Card className="hover:border-brand-cyan/50 transition-colors group bg-brand-dark/40 border-white/10">
            <div className="aspect-video bg-black/40 rounded-t-xl relative overflow-hidden flex items-center justify-center border-b border-white/5">
                {/* Thumbnail Placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-dark to-black/80" />
                <Cuboid className="w-12 h-12 text-white/20 group-hover:text-brand-cyan group-hover:scale-110 transition-all duration-300 relative z-10" />

                {/* Floating details on hover */}
                <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform bg-black/60 backdrop-blur-sm flex justify-between items-center z-20">
                    <span className="text-xs text-brand-cyan font-mono">{(model.size / (1024 * 1024)).toFixed(1)} MB</span>
                    <span className="text-[10px] text-brand-purple font-mono uppercase bg-brand-purple/10 px-2 py-0.5 rounded-md border border-brand-purple/20">{model.format || 'GLB'}</span>
                </div>
            </div>

            <CardHeader className="p-4">
                <CardTitle className="text-lg truncate">{model.name}</CardTitle>
                <p className="text-xs text-gray-500">Uploaded {new Date(model.createdAt).toLocaleDateString()}</p>
            </CardHeader>

            <CardFooter className="p-4 pt-0 flex gap-2">
                <Link href={`/models/${model.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full group-hover:bg-brand-cyan group-hover:text-brand-dark transition-colors">
                        <Eye className="w-4 h-4 mr-2" /> View
                    </Button>
                </Link>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Heart className="w-4 h-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
