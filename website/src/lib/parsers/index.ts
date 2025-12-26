import { Case, DataSource, ModelType } from '../types';
import { parseJimmyLvCases } from './jimmylv';
import { fetchAndParseGitHubReadme } from './markdown';
import fs from 'fs';
import path from 'path';

// Cache directory for external READMEs
const CACHE_DIR = path.join(process.cwd(), '.cache');

/**
 * Get all cases from all sources
 */
export async function getAllCasesFromAllSources(): Promise<Case[]> {
    const allCases: Case[] = [];

    // 1. JimmyLv - Local YAML files (always available)
    const jimmyLvCases = parseJimmyLvCases();
    allCases.push(...jimmyLvCases);
    console.log(`Loaded ${jimmyLvCases.length} cases from JimmyLv`);

    // 2. Try to load from cached READMEs first, then fetch if not available
    const externalSources: Array<{
        source: DataSource;
        owner: string;
        repo: string;
        model: ModelType;
        cacheFile: string;
    }> = [
            {
                source: 'picotrex',
                owner: 'PicoTrex',
                repo: 'Awesome-Nano-Banana-images',
                model: 'nano-banana',
                cacheFile: 'picotrex.md',
            },
            // ZeroLu removed due to high image defect rate
            {
                source: 'youmind',
                owner: 'YouMind-OpenLab',
                repo: 'awesome-nano-banana-pro-prompts',
                model: 'nano-banana-pro',
                cacheFile: 'youmind.md',
            },
        ];

    for (const { source, owner, repo, model, cacheFile } of externalSources) {
        try {
            const cases = await fetchAndParseGitHubReadme(owner, repo, source, model);
            allCases.push(...cases);
            console.log(`Loaded ${cases.length} cases from ${source}`);
        } catch (error) {
            console.warn(`Failed to load cases from ${source}:`, error);
        }
    }

    // Sort all cases: Pro first, then by case number descending
    allCases.sort((a, b) => {
        // Pro models first
        if (a.model !== b.model) {
            return a.model === 'nano-banana-pro' ? -1 : 1;
        }
        // Then by case number descending
        return b.case_no - a.case_no;
    });

    return allCases;
}

/**
 * Get case by unique ID
 */
export function getCaseById(cases: Case[], id: string): Case | undefined {
    return cases.find(c => c.id === id);
}

/**
 * Get all unique IDs
 */
export function getAllCaseIds(cases: Case[]): string[] {
    return cases.map(c => c.id);
}

/**
 * Get adjacent cases for navigation
 */
export function getAdjacentCases(cases: Case[], id: string): { prev: string | null; next: string | null } {
    const ids = getAllCaseIds(cases);
    const currentIndex = ids.indexOf(id);

    return {
        prev: currentIndex > 0 ? ids[currentIndex - 1] : null,
        next: currentIndex < ids.length - 1 ? ids[currentIndex + 1] : null,
    };
}

/**
 * Filter cases by source
 */
export function filterBySource(cases: Case[], source: DataSource): Case[] {
    return cases.filter(c => c.source === source);
}

/**
 * Filter cases by model
 */
export function filterByModel(cases: Case[], model: ModelType): Case[] {
    return cases.filter(c => c.model === model);
}

/**
 * Get statistics about loaded cases
 */
export function getCaseStats(cases: Case[]): {
    total: number;
    bySource: Record<DataSource, number>;
    byModel: Record<ModelType, number>;
} {
    const stats = {
        total: cases.length,
        bySource: {
            jimmylv: 0,
            picotrex: 0,
            zerolu: 0,
            youmind: 0,
        } as Record<DataSource, number>,
        byModel: {
            'nano-banana': 0,
            'nano-banana-pro': 0,
        } as Record<ModelType, number>,
    };

    for (const c of cases) {
        stats.bySource[c.source]++;
        stats.byModel[c.model]++;
    }

    return stats;
}

// Re-export types for convenience
export * from '../types';
