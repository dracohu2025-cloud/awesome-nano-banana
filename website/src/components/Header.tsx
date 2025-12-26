'use client';

import Link from 'next/link';
import { Github, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
    onSearch?: (query: string) => void;
    searchQuery?: string;
}

export default function Header({ onSearch, searchQuery = '' }: HeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [localSearch, setLocalSearch] = useState(searchQuery);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch?.(localSearch);
    };

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

                    {/* Search - Desktop */}
                    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Search prompts..."
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                                className="neo-input w-full pl-10 pr-4"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        </div>
                        <button type="submit" className="neo-button ml-2">
                            Search
                        </button>
                    </form>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-4">
                        <a
                            href="https://github.com/JimmyLv/awesome-nano-banana"
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
                        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                            <input
                                type="text"
                                placeholder="Search prompts..."
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                                className="neo-input flex-1"
                            />
                            <button type="submit" className="neo-button">
                                <Search className="w-5 h-5" />
                            </button>
                        </form>
                        <a
                            href="https://github.com/JimmyLv/awesome-nano-banana"
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
