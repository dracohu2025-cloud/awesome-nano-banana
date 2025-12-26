'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface PromptBlockProps {
    prompt: string;
    note?: string;
    title?: string;
}

export default function PromptBlock({ prompt, note, title = 'Prompt' }: PromptBlockProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="neo-card overflow-hidden">
            {/* Header */}
            <div className="bg-[var(--accent-yellow)] px-4 py-2 border-b-3 border-black flex items-center justify-between">
                <span className="font-black uppercase tracking-wide">{title}</span>
                <button
                    onClick={handleCopy}
                    className="neo-button py-1 px-3 text-sm flex items-center gap-1 bg-white"
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4" />
                            Copy
                        </>
                    )}
                </button>
            </div>

            {/* Prompt Content */}
            <div className="neo-code">
                {prompt}
            </div>

            {/* Note */}
            {note && (
                <div className="p-4 bg-[var(--accent-lavender)] border-t-3 border-black">
                    <p className="text-sm font-medium">
                        <span className="font-black">📝 Note:</span> {note}
                    </p>
                </div>
            )}
        </div>
    );
}
