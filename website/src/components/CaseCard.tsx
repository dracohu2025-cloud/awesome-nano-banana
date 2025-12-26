'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Case, SOURCE_INFO, MODEL_INFO } from '@/lib/types';

interface CaseCardProps {
    caseData: Case;
    locale?: 'zh' | 'en';
}

const accentColors = [
    'bg-[var(--accent-yellow)]',
    'bg-[var(--accent-coral)]',
    'bg-[var(--accent-lavender)]',
    'bg-[var(--accent-mint)]',
    'bg-[var(--accent-blue)]',
    'bg-[var(--accent-pink)]',
];

export default function CaseCard({ caseData, locale = 'en' }: CaseCardProps) {
    const [imgError, setImgError] = useState(false);

    // Clean title - remove any extra content after newlines
    const rawTitle = locale === 'zh' ? caseData.title : caseData.title_en;
    const title = rawTitle?.split('\n')[0]?.trim() || 'Untitled';

    const colorClass = accentColors[caseData.case_no % accentColors.length];
    const sourceInfo = SOURCE_INFO[caseData.source];
    const modelInfo = MODEL_INFO[caseData.model];

    // Determine if image is external or local
    const hasImage = caseData.image_url && caseData.image_url.trim() !== '';
    const isExternalImage = hasImage && caseData.image_url.startsWith('http');
    const showPlaceholder = !hasImage || imgError;

    return (
        <Link href={`/case/${caseData.id}`} className="block group">
            <article className="neo-card overflow-hidden h-full flex flex-col">
                {/* Header with case number and source */}
                <div className={`${modelInfo.color} px-3 py-1.5 border-b-3 border-black flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                        <span className="font-black text-sm">{modelInfo.emoji}</span>
                        <span className="text-xs font-bold">{caseData.source}</span>
                    </div>
                    <span className="text-xs font-bold opacity-70 truncate max-w-[100px]">
                        {caseData.author}
                    </span>
                </div>

                {/* Image Container */}
                <div className="relative aspect-square overflow-hidden bg-gray-100 flex-shrink-0">
                    {!showPlaceholder && isExternalImage && (
                        <img
                            src={caseData.image_url}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            onError={() => setImgError(true)}
                        />
                    )}
                    {!showPlaceholder && !isExternalImage && (
                        <Image
                            src={caseData.image_url}
                            alt={title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                    )}
                    {/* Placeholder for missing/broken images */}
                    {showPlaceholder && (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-4xl">🍌</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4 border-t-3 border-black bg-white flex-1 flex flex-col min-h-[100px]">
                    <h3
                        className="font-black text-sm uppercase leading-tight overflow-hidden line-clamp-2"
                        title={title}
                    >
                        {title}
                    </h3>
                    <div className="mt-auto pt-2 flex items-center gap-1 flex-wrap">
                        <span className={`neo-tag ${sourceInfo.color} text-[10px]`}>
                            {sourceInfo.name}
                        </span>
                        {caseData.prompt && (
                            <span className="neo-tag bg-gray-100 text-[10px]">
                                Prompt
                            </span>
                        )}
                    </div>
                </div>
            </article>
        </Link>
    );
}
