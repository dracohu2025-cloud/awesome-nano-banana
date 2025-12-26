'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ImageComparisonProps {
    geminiSrc: string;
    gpt4oSrc?: string;
    alt: string;
}

export default function ImageComparison({ geminiSrc, gpt4oSrc, alt }: ImageComparisonProps) {
    const [activeTab, setActiveTab] = useState<'gemini' | 'gpt4o'>('gemini');

    // If no GPT-4o comparison, just show the image
    if (!gpt4oSrc) {
        return (
            <div className="neo-card overflow-hidden">
                <div className="bg-[var(--accent-mint)] px-4 py-2 border-b-3 border-black">
                    <span className="font-black uppercase">🍌 Gemini Nano Banana</span>
                </div>
                <div className="relative aspect-[4/3] bg-gray-100">
                    <Image
                        src={geminiSrc}
                        alt={alt}
                        fill
                        className="object-contain"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        priority
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="neo-card overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b-3 border-black">
                <button
                    onClick={() => setActiveTab('gemini')}
                    className={`flex-1 px-4 py-3 font-black uppercase text-sm transition-colors ${activeTab === 'gemini'
                            ? 'bg-[var(--accent-mint)]'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                >
                    🍌 Gemini
                </button>
                <button
                    onClick={() => setActiveTab('gpt4o')}
                    className={`flex-1 px-4 py-3 font-black uppercase text-sm border-l-3 border-black transition-colors ${activeTab === 'gpt4o'
                            ? 'bg-[var(--accent-coral)]'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                >
                    🤖 GPT-4o
                </button>
            </div>

            {/* Image */}
            <div className="relative aspect-[4/3] bg-gray-100">
                <Image
                    src={activeTab === 'gemini' ? geminiSrc : gpt4oSrc}
                    alt={alt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                />
            </div>
        </div>
    );
}
