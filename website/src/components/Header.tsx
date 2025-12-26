'use client';

import Link from 'next/link';
import { Github, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 bg-[var(--bg-primary)] border-b-4 border-black">
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="text-3xl group-hover:animate-bounce">🍌</span>
                        <span className="font-black text-xl md:text-2xl uppercase tracking-tight hidden sm:block">
                            Nano Banana
                        </span>
                    </Link>

                    {/* GitHub Link - Desktop */}
                    <nav className="hidden md:flex items-center gap-4">
                        <a
                            href="https://github.com/dracohu2025-cloud/awesome-nano-banana"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="neo-button flex items-center gap-2"
                        >
                            <Github className="w-5 h-5" />
                            <span>GitHub</span>
                        </a>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden neo-button p-2"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden mt-4 pt-4 border-t-2 border-black">
                        <a
                            href="https://github.com/dracohu2025-cloud/awesome-nano-banana"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="neo-button flex items-center justify-center gap-2 w-full"
                        >
                            <Github className="w-5 h-5" />
                            <span>Star on GitHub</span>
                        </a>
                    </div>
                )}
            </div>
        </header>
    );
}
