import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { Case, Attribution } from '../types';

const CASES_DIR = path.join(process.cwd(), '..', 'cases');

interface RawCaseData {
    title: string;
    title_en: string;
    author: string;
    author_link: string;
    source_links: { url: string }[];
    image: string;
    alt_text: string;
    alt_text_en: string;
    prompt: string;
    prompt_en: string;
    prompt_note: string;
    prompt_note_en: string;
    reference_note: string;
    reference_note_en: string;
    submitter: string;
    submitter_link: string;
}

export function parseJimmyLvCases(): Case[] {
    if (!fs.existsSync(CASES_DIR)) {
        console.warn('JimmyLv cases directory not found');
        return [];
    }

    const caseDirs = fs.readdirSync(CASES_DIR);
    const numericDirs = caseDirs.filter(dir => !isNaN(Number(dir)));

    const cases: Case[] = numericDirs.map(dir => {
        const caseNumber = parseInt(dir);
        const casePath = path.join(CASES_DIR, dir, 'case.yml');

        if (!fs.existsSync(casePath)) {
            return null;
        }

        const caseData = yaml.load(fs.readFileSync(casePath, 'utf8')) as RawCaseData;

        // Try to load attribution
        let attribution: Attribution | undefined;
        const attributionPath = path.join(CASES_DIR, dir, 'ATTRIBUTION.yml');
        if (fs.existsSync(attributionPath)) {
            attribution = yaml.load(fs.readFileSync(attributionPath, 'utf8')) as Attribution;
        }

        // Get image path
        const imagePath = `/cases/${dir}/${caseData.image}`;

        return {
            id: `jimmylv-${caseNumber}`,
            case_no: caseNumber,
            title: caseData.title || caseData.title_en,
            title_en: caseData.title_en || caseData.title,
            author: caseData.author,
            author_link: caseData.author_link,
            source_link: caseData.source_links?.[0]?.url || '',
            image_url: imagePath,
            prompt: caseData.prompt?.trim() || '',
            prompt_en: caseData.prompt_en?.trim() || caseData.prompt?.trim() || '',
            prompt_note: caseData.prompt_note?.trim(),
            prompt_note_en: caseData.prompt_note_en?.trim(),
            reference_note: caseData.reference_note?.trim(),
            reference_note_en: caseData.reference_note_en?.trim(),
            model: 'nano-banana' as const,
            source: 'jimmylv' as const,
            attribution,
            imagePath,
        } as Case;
    }).filter((c): c is Case => c !== null);

    return cases;
}
