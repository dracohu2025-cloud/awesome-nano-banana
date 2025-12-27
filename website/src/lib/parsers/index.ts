import { Case, DataSource, ModelType } from '../types';
import { fetchAndParseGitHubReadme } from './markdown';

/**
 * Get all cases from all sources
 * Now reads from our own NANO_BANANA_PRO_PROMPTS_V2.md file
 */
export async function getAllCasesFromAllSources(): Promise<Case[]> {
    const allCases: Case[] = [];

    // Read from our own repo's scraped prompts file
    const externalSources: Array<{
        source: DataSource;
        owner: string;
        repo: string;
        model: ModelType;
        filePath: string;
    }> = [
            {
                source: 'scraped',  // Use 'scraped' parser for our format
                owner: 'dracohu2025-cloud',
                repo: 'awesome-nano-banana',
                model: 'nano-banana-pro',
                filePath: 'NANO_BANANA_PRO_PROMPTS_V2.md',
            },
        ];

    for (const { source, owner, repo, model, filePath } of externalSources) {
        try {
            const cases = await fetchAndParseGitHubReadme(owner, repo, source, model, 'main', filePath);
            allCases.push(...cases);
            console.log(`Loaded ${cases.length} cases from ${owner}/${repo}/${filePath}`);
        } catch (error) {
            console.warn(`Failed to load cases from ${owner}/${repo}:`, error);
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
            scraped: 0,
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
