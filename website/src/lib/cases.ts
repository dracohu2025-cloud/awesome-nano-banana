// Re-export everything from parsers
export * from './parsers';

// Legacy compatibility - these functions work with the new system
import { parseJimmyLvCases } from './parsers/jimmylv';
import { Case } from './types';

/**
 * @deprecated Use getAllCasesFromAllSources() instead
 * Kept for backward compatibility
 */
export function getAllCases(): Case[] {
    return parseJimmyLvCases();
}

/**
 * @deprecated Use getCaseById from parsers instead
 */
export function getCaseById(id: number): Case | undefined {
    const cases = getAllCases();
    return cases.find(c => c.case_no === id);
}

/**
 * @deprecated Use getAllCaseIds from parsers instead
 */
export function getCaseIds(): number[] {
    const cases = getAllCases();
    return cases.map(c => c.case_no).sort((a, b) => b - a);
}

/**
 * @deprecated Use getAdjacentCases from parsers instead
 */
export function getAdjacentCases(id: number): { prev: number | null; next: number | null } {
    const ids = getCaseIds();
    const currentIndex = ids.indexOf(id);

    return {
        prev: currentIndex > 0 ? ids[currentIndex - 1] : null,
        next: currentIndex < ids.length - 1 ? ids[currentIndex + 1] : null,
    };
}

export function getCategories(): string[] {
    return ['All', 'Art Style', 'Character', 'Object', 'Scene', 'Interior'];
}
