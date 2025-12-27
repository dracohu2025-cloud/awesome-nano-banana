import { Case, DataSource, ModelType } from '../types';

/**
 * Parse markdown content to extract cases
 * Handles various formats from different repos
 */

// Pattern for Chinese case format: ### 例 N: [Title](link)
const CHINESE_CASE_REGEX = /###?\s*例\s*(\d+)[：:]\s*\[([^\]]+)\]\(([^)]+)\)/;

// Pattern for ZeroLu format: ### 1.1. Title (stop at newline)
const ZEROLU_CASE_REGEX = /###?\s*(\d+)\.(\d+)\.\s+([^\n]+)/;

// Pattern for images - multiple formats
const IMAGE_PATTERNS = [
    /<img[^>]*src="([^"]+)"[^>]*>/g,              // HTML img tag (priority)
    /!\[[^\]]*\]\(([^)]+)\)/g,                    // Standard markdown
];

// Pattern for code blocks (prompts)
const CODE_BLOCK_PATTERN = /```(?:\w*\n)?([\s\S]*?)```/g;

// Pattern for author in YouMind format: **Author:** [Name](link)
const YOUMIND_AUTHOR_PATTERN = /\*\*Author:\*\*\s*\[([^\]]+)\]\(([^)]+)\)/;

// Pattern for source: *Source: [@author](link)* or **Source:** [link](url)
const SOURCE_PATTERN = /\*?Source:\s*\[@?([^\]]+)\]\(([^)]+)\)\*?/i;

/**
 * Check if image URL is valid and accessible (not private GitHub CDN)
 */
function isValidImageUrl(url: string): boolean {
    if (!url || url.trim() === '') return false;

    // Filter out GitHub private CDN (user-attachments)
    if (url.includes('user-attachments/assets')) return false;
    if (url.includes('github.com/user-attachments')) return false;

    // Filter out badges
    if (url.includes('shields.io')) return false;
    if (url.includes('badge')) return false;

    // Must be valid image format OR known CDN
    const validPatterns = [
        '.jpg', '.jpeg', '.png', '.webp', '.gif',
        'youmind.com', 'cms-assets.youmind.com',
        'pbs.twimg.com', 'x.com',
        'raw.githubusercontent.com'
    ];

    return validPatterns.some(p => url.toLowerCase().includes(p));
}

/**
 * Split markdown by case boundaries - optimized for large files
 */
function splitByCases(markdown: string, source: DataSource): string[] {
    // Scraped uses "## Case: twitter-xxx" format
    const parts = markdown.split(/^(## Case: [^\n]+)/m);
    const sections: string[] = [];

    for (let i = 1; i < parts.length; i += 2) {
        if (i + 1 < parts.length) {
            sections.push(parts[i] + parts[i + 1]);
        } else {
            sections.push(parts[i]);
        }
    }

    return sections.length > 0 ? sections : markdown.split(/(?=###\s+)/);
}

export function parseMarkdownCases(
    markdown: string,
    source: DataSource,
    defaultModel: ModelType = 'nano-banana-pro'
): Case[] {
    const cases: Case[] = [];

    // Use source-specific splitting
    const sections = splitByCases(markdown, source);

    for (const section of sections) {
        if (!section.trim()) continue;

        let caseNumber: number | null = null;
        let title: string = '';
        let sourceLink: string = '';
        let category: string | undefined;

        // Try ZeroLu format first: ### 1.1. Title
        const zeroluMatch = section.match(ZEROLU_CASE_REGEX);
        if (zeroluMatch) {
            // Convert "1.1" to unique number: section * 100 + subsection
            caseNumber = parseInt(zeroluMatch[1]) * 100 + parseInt(zeroluMatch[2]);
            title = zeroluMatch[3].trim();
        }

        // Try YouMind format: ### No. N: Category / Subcategory - Title OR ### No. N: Title
        if (caseNumber === null) {
            // Match the full line after "No. N: "
            const youmindBaseMatch = section.match(/###?\s*No\.\s*(\d+):\s*([^\n]+)/);
            if (youmindBaseMatch) {
                caseNumber = parseInt(youmindBaseMatch[1]);
                const fullTitle = youmindBaseMatch[2]?.trim() || '';

                // Check if title contains " - " (category separator)
                // Format: "Profile / Avatar - Photorealistic Mirror Selfie"
                const lastDashIndex = fullTitle.lastIndexOf(' - ');
                if (lastDashIndex > 0) {
                    // Has category/subcategory before the dash
                    category = fullTitle.substring(0, lastDashIndex).trim();
                    title = fullTitle.substring(lastDashIndex + 3).trim();
                } else {
                    // No category, just title
                    title = fullTitle;
                }
            }
        }

        // Try Chinese format: ### 例 N: [Title](link)
        if (caseNumber === null) {
            const chineseMatch = section.match(CHINESE_CASE_REGEX);
            if (chineseMatch) {
                caseNumber = parseInt(chineseMatch[1]);
                title = chineseMatch[2];
                sourceLink = chineseMatch[3];
            }
        }

        // Try Scraped format: ## Case: twitter-xxx
        let scrapedAt = '';
        if (caseNumber === null) {
            const scrapedMatch = section.match(/## Case:\s*(twitter-(\d+))/);
            if (scrapedMatch) {
                // Use last 6 digits of tweet ID as case number
                const tweetId = scrapedMatch[2];
                caseNumber = parseInt(tweetId.slice(-6)) || parseInt(tweetId);

                // Get original tweet link FIRST (this is the source_link)
                const tweetLinkMatch = section.match(/\*\*Tweet:\*\*\s*\[View Original\]\(([^)]+)\)/);
                if (tweetLinkMatch) {
                    sourceLink = tweetLinkMatch[1];
                }

                // Get scraped timestamp
                const scrapedAtMatch = section.match(/\*\*Scraped:\*\*\s*(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)/);
                if (scrapedAtMatch) {
                    scrapedAt = scrapedAtMatch[1];
                }

                // Try to get author from **Author:** [@xxx](link)
                const authorMatch = section.match(/\*\*Author:\*\*\s*\[@([^\]]+)\]\(([^)]+)\)/);
                if (authorMatch) {
                    title = `Twitter Prompt by @${authorMatch[1]}`;
                    // Note: authorMatch[2] is the author's profile link, not the tweet link
                } else {
                    title = `Twitter Prompt ${scrapedMatch[1]}`;
                }
            }
        }

        // Skip if no case found
        if (caseNumber === null) continue;

        // Extract image URL (try multiple patterns)
        let imageUrl = '';
        for (const pattern of IMAGE_PATTERNS) {
            const matches = [...section.matchAll(pattern)];
            if (matches.length > 0) {
                // Find first valid image
                const validImage = matches.find(m => isValidImageUrl(m[1]));
                if (validImage) {
                    imageUrl = validImage[1];
                    break;
                }
            }
        }

        // Extract prompt from code block
        const codeBlocks = [...section.matchAll(CODE_BLOCK_PATTERN)];
        const prompt = codeBlocks[0]?.[1]?.trim() || '';

        // Extract author
        let author = '';
        let authorLink = '';

        // Try YouMind author format
        const youmindAuthorMatch = section.match(YOUMIND_AUTHOR_PATTERN);
        if (youmindAuthorMatch) {
            author = `@${youmindAuthorMatch[1]}`;
            authorLink = youmindAuthorMatch[2];
        }

        // Try source pattern
        if (!author) {
            const sourceMatch = section.match(SOURCE_PATTERN);
            if (sourceMatch) {
                author = `@${sourceMatch[1]}`;
                authorLink = sourceMatch[2];
                if (!sourceLink) {
                    sourceLink = sourceMatch[2];
                }
            }
        }

        // Only add if we have prompt (image is optional now since we filter CDN images)
        if (title && prompt) {
            cases.push({
                id: `${source}-${caseNumber}`,
                case_no: caseNumber,
                title: title,
                title_en: title,
                author,
                author_link: authorLink,
                source_link: sourceLink,
                image_url: imageUrl, // May be empty if no valid image
                prompt,
                prompt_en: prompt,
                model: defaultModel,
                source,
                category,
                scraped_at: scrapedAt || undefined,
            });
        }
    }

    return cases;
}

/**
 * Fetch and parse README from a GitHub repo
 */
export async function fetchAndParseGitHubReadme(
    owner: string,
    repo: string,
    source: DataSource,
    defaultModel: ModelType = 'nano-banana-pro',
    branch: string = 'main',
    filePath: string = 'README.md'
): Promise<Case[]> {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;

    try {
        const response = await fetch(url, {
            next: { revalidate: 60 } // Cache for 1 minute
        });
        if (!response.ok) {
            console.warn(`Failed to fetch ${filePath} from ${url}: ${response.status}`);
            return [];
        }

        const markdown = await response.text();
        return parseMarkdownCases(markdown, source, defaultModel);
    } catch (error) {
        console.error(`Error fetching ${filePath} from ${url}:`, error);
        return [];
    }
}
