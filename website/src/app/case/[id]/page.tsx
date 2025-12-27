import { getAllCasesFromAllSources, getCaseById, getAdjacentCases, SOURCE_INFO, MODEL_INFO } from '@/lib/parsers';
import Header from '@/components/Header';
import PromptBlock from '@/components/PromptBlock';
import ImageComparison from '@/components/ImageComparison';
import { ArrowLeft, ArrowRight, ExternalLink, User } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export const dynamic = 'force-static';

// Generate static params for all cases
export async function generateStaticParams() {
    const cases = await getAllCasesFromAllSources();
    return cases.map((c) => ({
        id: c.id,
    }));
}

// Generate metadata for each case
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const cases = await getAllCasesFromAllSources();
    const caseData = getCaseById(cases, id);

    if (!caseData) {
        return { title: 'Case Not Found' };
    }

    return {
        title: `${caseData.title_en} | Nano Banana Gallery`,
        description: caseData.prompt_en?.slice(0, 160) || caseData.prompt?.slice(0, 160),
        openGraph: {
            title: caseData.title_en,
            description: caseData.prompt_en?.slice(0, 160),
            images: caseData.image_url ? [caseData.image_url] : [],
        },
    };
}

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const cases = await getAllCasesFromAllSources();
    const caseData = getCaseById(cases, id);

    if (!caseData) {
        notFound();
    }

    const { prev, next } = getAdjacentCases(cases, id);
    const sourceInfo = SOURCE_INFO[caseData.source];
    const modelInfo = MODEL_INFO[caseData.model];

    return (
        <div className="min-h-screen">
            <Header />

            <main className="py-8 px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <Link
                            href="/"
                            className="neo-button py-2 px-4 flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Gallery
                        </Link>

                        <div className="flex gap-2">
                            {prev && (
                                <Link
                                    href={`/case/${prev}`}
                                    className="neo-button py-2 px-4 flex items-center gap-1"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Prev
                                </Link>
                            )}
                            {next && (
                                <Link
                                    href={`/case/${next}`}
                                    className="neo-button py-2 px-4 flex items-center gap-1"
                                >
                                    Next
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Case Header */}
                    <div className={`neo-card p-6 mb-8 ${modelInfo.color}`}>
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`neo-tag ${sourceInfo.color}`}>{sourceInfo.name}</span>
                                    <span className="neo-tag bg-white">{modelInfo.emoji} {modelInfo.name}</span>
                                </div>
                                <h1 className="text-2xl md:text-4xl font-black uppercase leading-tight">
                                    {caseData.title_en}
                                </h1>
                                {caseData.title !== caseData.title_en && (
                                    <p className="text-lg mt-1 opacity-80">{caseData.title}</p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                {caseData.author && (
                                    <a
                                        href={caseData.author_link || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="neo-button bg-white py-2 px-4 flex items-center gap-2"
                                    >
                                        <User className="w-4 h-4" />
                                        {caseData.author}
                                    </a>
                                )}
                                {caseData.source_link && (
                                    <a
                                        href={caseData.source_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="neo-button bg-white py-2 px-4 flex items-center gap-2"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        View Source
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Image Display */}
                    {(caseData.image_urls?.length || caseData.image_url) && (
                        <div className="mb-8">
                            <div className="neo-card overflow-hidden">
                                <div className="bg-[var(--accent-mint)] px-4 py-2 border-b-3 border-black flex items-center justify-between">
                                    <span className="font-black uppercase">
                                        {modelInfo.emoji} Generated Image{(caseData.image_urls?.length || 1) > 1 ? 's' : ''}
                                        {(caseData.image_urls?.length || 1) > 1 && ` (${caseData.image_urls?.length})`}
                                    </span>
                                </div>
                                <div className="relative bg-gray-100 p-4">
                                    {(caseData.image_urls && caseData.image_urls.length > 1) ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {caseData.image_urls.map((url, index) => (
                                                <div key={index} className="flex items-center justify-center">
                                                    <img
                                                        src={url}
                                                        alt={`${caseData.title_en} - Image ${index + 1}`}
                                                        className="max-w-full max-h-[400px] object-contain"
                                                        loading={index === 0 ? "eager" : "lazy"}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center">
                                            <img
                                                src={caseData.image_url}
                                                alt={caseData.title_en}
                                                className="max-w-full max-h-[600px] object-contain"
                                                loading="eager"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Prompt Section */}
                    <div className="space-y-6">
                        {/* English Prompt */}
                        {caseData.prompt_en && (
                            <PromptBlock
                                prompt={caseData.prompt_en}
                                note={caseData.prompt_note_en}
                                title="English Prompt"
                            />
                        )}

                        {/* Chinese Prompt (if different) */}
                        {caseData.prompt && caseData.prompt !== caseData.prompt_en && (
                            <PromptBlock
                                prompt={caseData.prompt}
                                note={caseData.prompt_note}
                                title="中文 Prompt"
                            />
                        )}

                        {/* Reference Note */}
                        {(caseData.reference_note_en || caseData.reference_note) && (
                            <div className="neo-card p-6 bg-[var(--accent-mint)]">
                                <h3 className="font-black uppercase mb-2">📷 Reference Image Required</h3>
                                <p>{caseData.reference_note_en || caseData.reference_note}</p>
                            </div>
                        )}

                        {/* Attribution */}
                        {caseData.attribution && (
                            <div className="neo-card p-6 bg-gray-100">
                                <h3 className="font-black uppercase mb-3">📜 Attribution</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    {caseData.attribution.image_copyright_holder && (
                                        <div>
                                            <span className="font-bold">Image Copyright:</span>{' '}
                                            {caseData.attribution.image_copyright_holder}
                                        </div>
                                    )}
                                    {caseData.attribution.image_license && (
                                        <div>
                                            <span className="font-bold">License:</span>{' '}
                                            {caseData.attribution.image_license}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Source Info */}
                        <div className="neo-card p-4 bg-gray-50 text-sm">
                            <p>
                                <span className="font-bold">Source:</span>{' '}
                                <a
                                    href={caseData.source_link || sourceInfo.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline"
                                >
                                    {sourceInfo.name}
                                </a>
                                {' • '}
                                <span className="font-bold">Model:</span> {modelInfo.name}
                            </p>
                        </div>
                    </div>

                    {/* Bottom Navigation */}
                    <div className="flex items-center justify-between mt-12 pt-8 border-t-4 border-black">
                        {prev ? (
                            <Link
                                href={`/case/${prev}`}
                                className="neo-button flex items-center gap-2"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Previous
                            </Link>
                        ) : (
                            <div />
                        )}

                        <Link
                            href="/"
                            className="neo-button neo-button-coral"
                        >
                            Back to Gallery
                        </Link>

                        {next ? (
                            <Link
                                href={`/case/${next}`}
                                className="neo-button flex items-center gap-2"
                            >
                                Next
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        ) : (
                            <div />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
