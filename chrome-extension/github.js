// Nano Banana Scraper - GitHub API Module
// Handles all GitHub API interactions

const SETTINGS_KEY = 'nanoBananaSettings';

// Get settings from storage
async function getSettings() {
    const result = await chrome.storage.local.get([SETTINGS_KEY]);
    return result[SETTINGS_KEY] || null;
}

// Make authenticated GitHub API request
async function githubFetch(endpoint, options = {}) {
    const settings = await getSettings();
    if (!settings || !settings.githubPat) {
        throw new Error('GitHub 未配置');
    }

    const url = endpoint.startsWith('https://')
        ? endpoint
        : `https://api.github.com${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${settings.githubPat}`,
            'Accept': 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `GitHub API error: ${response.status}`);
    }

    return response.json();
}

// Get file content from repo
async function getFileContent(path) {
    const settings = await getSettings();
    try {
        const data = await githubFetch(
            `/repos/${settings.repoOwner}/${settings.repoName}/contents/${path}`
        );
        return {
            content: atob(data.content),
            sha: data.sha
        };
    } catch (error) {
        if (error.message.includes('404')) {
            return null; // File doesn't exist
        }
        throw error;
    }
}

// Create or update file in repo
async function updateFile(path, content, message, sha = null) {
    const settings = await getSettings();

    const body = {
        message,
        content: btoa(unescape(encodeURIComponent(content))), // Properly encode UTF-8
        branch: 'main'
    };

    if (sha) {
        body.sha = sha;
    }

    return await githubFetch(
        `/repos/${settings.repoOwner}/${settings.repoName}/contents/${path}`,
        {
            method: 'PUT',
            body: JSON.stringify(body)
        }
    );
}

// Append scraped content to the prompts file
async function appendToPromptsFile(tweetData) {
    const settings = await getSettings();
    if (!settings) throw new Error('请先配置 GitHub 设置');

    const targetFile = settings.targetFile || 'NANO_BANANA_PRO_PROMPTS.md';

    // Get existing file content
    const existing = await getFileContent(targetFile);

    // Generate new content entry
    const timestamp = new Date().toISOString();
    const caseId = `twitter-${tweetData.id}`;

    let newEntry = `\n---\n\n## Twitter Case: ${caseId}\n\n`;
    newEntry += `**Author:** [@${tweetData.authorHandle || 'unknown'}](https://twitter.com/${tweetData.authorHandle || 'unknown'})\n`;
    newEntry += `**Tweet:** [View Original](${tweetData.url})\n`;
    newEntry += `**Scraped:** ${timestamp}\n\n`;

    // Add images
    if (tweetData.images && tweetData.images.length > 0) {
        newEntry += `### Images\n\n`;
        tweetData.images.forEach((img, i) => {
            newEntry += `![Image ${i + 1}](${img})\n\n`;
        });
    }

    // Add prompt
    newEntry += `### Prompt\n\n`;
    newEntry += `\`\`\`\n${tweetData.prompt || '(Prompt to be added)'}\n\`\`\`\n`;

    // Combine with existing content
    let finalContent;
    if (existing) {
        finalContent = existing.content + newEntry;
    } else {
        // Create new file with header
        finalContent = `# Nano Banana Pro - Twitter Collection\n\n`;
        finalContent += `> Automatically scraped from Twitter/X using Nano Banana Scraper\n`;
        finalContent += newEntry;
    }

    // Commit to GitHub
    const commitMessage = `Add Twitter case ${caseId} from @${tweetData.authorHandle || 'unknown'}`;

    await updateFile(
        targetFile,
        finalContent,
        commitMessage,
        existing?.sha
    );

    return {
        caseId,
        targetFile,
        commitMessage
    };
}

// Download image and convert to base64 (for future use if storing images in repo)
async function downloadImageAsBase64(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Failed to download image:', error);
        return null;
    }
}

// Export functions for use in background.js
if (typeof module !== 'undefined') {
    module.exports = {
        getSettings,
        githubFetch,
        getFileContent,
        updateFile,
        appendToPromptsFile,
        downloadImageAsBase64
    };
}
