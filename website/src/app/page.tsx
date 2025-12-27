import { getAllCasesFromAllSources, getCaseStats, Case, MODEL_INFO, ModelType } from '@/lib/parsers';
import Header from '@/components/Header';
import CaseCard from '@/components/CaseCard';
import { ArrowRight, Sparkles, Github, Star } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-static';
export const revalidate = 60; // Revalidate every minute

export default async function Home() {
  const cases = await getAllCasesFromAllSources();
  const stats = getCaseStats(cases);

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="py-12 md:py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="neo-card p-8 md:p-12 bg-[var(--accent-yellow)]">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-5xl md:text-6xl animate-float">🍌</span>
                    <Sparkles className="w-8 h-8 text-black" />
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black uppercase leading-tight mb-4">
                    Awesome<br />
                    Nano Banana<br />
                    <span className="text-[var(--accent-coral)]">Gallery</span>
                  </h1>
                  <p className="text-lg md:text-xl font-medium mb-6 max-w-lg">
                    Explore <strong>{stats.total}+</strong> curated AI image generation prompts.
                    Featuring Gemini Nano Banana and <strong>Nano Banana Pro</strong>.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a href="#gallery" className="neo-button neo-button-coral flex items-center gap-2">
                      Explore Cases <ArrowRight className="w-5 h-5" />
                    </a>
                    <a
                      href="https://github.com/dracohu2025-cloud/awesome-nano-banana"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="neo-button bg-black text-white flex items-center gap-2"
                    >
                      <Github className="w-5 h-5" />
                      <Star className="w-4 h-4" />
                      Star on GitHub
                    </a>
                  </div>
                </div>

                {/* Featured Images Preview */}
                <div className="relative w-full md:w-96 h-64 md:h-80">
                  {cases
                    .filter(c => c.image_url && c.image_url.trim() !== '')
                    .slice(0, 3)
                    .map((c, i) => (
                      <div
                        key={c.id}
                        className={`absolute neo-card overflow-hidden ${i === 0 ? 'top-0 right-0 w-48 h-48 rotate-3 z-10' :
                          i === 1 ? 'top-8 left-0 w-48 h-48 -rotate-6 z-20' :
                            'bottom-0 right-8 w-40 h-40 rotate-12'
                          }`}
                      >
                        <img
                          src={c.image_url}
                          alt={c.title_en}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-y-4 border-black bg-white">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              {/* Nano Banana Pro Count */}
              <div className="flex items-center gap-3 px-4 py-2 neo-card bg-[var(--accent-coral)] hover:translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all cursor-default">
                <span className="text-2xl">🍌✨</span>
                <div>
                  <div className="font-black text-lg">{stats.byModel['nano-banana-pro']}</div>
                  <div className="text-xs font-bold uppercase">Nano Banana Pro</div>
                </div>
              </div>

              {/* Latest Post */}
              {cases[0]?.scraped_at && (
                <div className="flex items-center gap-3 px-4 py-2 neo-card bg-[var(--accent-mint)] hover:translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all cursor-default">
                  <span className="text-2xl">🕐</span>
                  <div>
                    <div className="font-black text-lg">
                      {new Date(cases[0].scraped_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-xs font-bold uppercase">Latest Post</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section id="gallery" className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h2 className="text-3xl md:text-4xl font-black uppercase">
                📖 Prompt Gallery
              </h2>
              <div className="text-sm font-medium text-gray-600">
                Showing {cases.length} cases • From {Object.values(stats.bySource).filter(v => v > 0).length} sources
              </div>
            </div>

            {/* Cases Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cases.map((caseData) => (
                <CaseCard key={caseData.id} caseData={caseData} locale="en" />
              ))}
            </div>
          </div>
        </section>


      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="font-medium mb-2">
            Made with 🍌 by the community
          </p>
          <a
            href="https://github.com/dracohu2025-cloud/awesome-nano-banana"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline hover:no-underline"
          >
            View on GitHub
          </a>
          <p className="text-sm text-gray-600 mt-4">
            Licensed under CC BY 4.0
          </p>
        </div>
      </footer>
    </div>
  );
}
