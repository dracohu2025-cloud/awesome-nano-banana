// Nano Banana Scraper - Background Service Worker
// Handles storage, data management, and GitHub sync

const STORAGE_KEY = 'nanoBananaScrapedTweets';
const SETTINGS_KEY = 'nanoBananaSettings';

// Initialize storage
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
        if (!result[STORAGE_KEY]) {
            chrome.storage.local.set({ [STORAGE_KEY]: [] });
        }
    });
    console.log('🍌 Nano Banana Scraper installed');
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'saveTweet') {
        saveTweet(request.data)
            .then((result) => sendResponse({ success: true, ...result }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'getTweets') {
        getTweets()
            .then((tweets) => sendResponse({ success: true, tweets }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'deleteTweet') {
        deleteTweet(request.id)
            .then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'updateTweet') {
        updateTweet(request.id, request.updates)
            .then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'clearAll') {
        clearAllTweets()
            .then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'exportYAML') {
        exportToYAML()
            .then((yaml) => sendResponse({ success: true, yaml }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'syncToGitHub') {
        syncTweetToGitHub(request.id)
            .then((result) => sendResponse({ success: true, ...result }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'getSettings') {
        getSettings()
            .then((settings) => sendResponse({ success: true, settings }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

// Get settings
async function getSettings() {
    const result = await chrome.storage.local.get([SETTINGS_KEY]);
    return result[SETTINGS_KEY] || null;
}

// Save tweet to storage and optionally sync to GitHub
async function saveTweet(tweetData) {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    const tweets = result[STORAGE_KEY] || [];

    // Check for duplicates
    if (tweets.some(t => t.id === tweetData.id)) {
        throw new Error('已保存过此推文');
    }

    // Add metadata
    const enrichedData = {
        ...tweetData,
        savedAt: new Date().toISOString(),
        prompt: tweetData.text || '',
        edited: false,
        synced: false
    };

    tweets.unshift(enrichedData);
    await chrome.storage.local.set({ [STORAGE_KEY]: tweets });
    updateBadge(tweets.length);

    // Check if auto-sync is enabled
    const settings = await getSettings();
    if (settings && settings.autoSync && settings.githubPat) {
        try {
            const syncResult = await syncToGitHub(enrichedData);
            // Update synced status
            enrichedData.synced = true;
            enrichedData.syncedAt = new Date().toISOString();
            tweets[0] = enrichedData;
            await chrome.storage.local.set({ [STORAGE_KEY]: tweets });
            return { synced: true, ...syncResult };
        } catch (error) {
            console.error('Auto-sync failed:', error);
            return { synced: false, syncError: error.message };
        }
    }

    return { synced: false };
}

// Sync specific tweet to GitHub
async function syncTweetToGitHub(id) {
    const tweets = await getTweets();
    const tweet = tweets.find(t => t.id === id);
    if (!tweet) throw new Error('推文未找到');

    const result = await syncToGitHub(tweet);

    // Update synced status
    tweet.synced = true;
    tweet.syncedAt = new Date().toISOString();
    const index = tweets.findIndex(t => t.id === id);
    tweets[index] = tweet;
    await chrome.storage.local.set({ [STORAGE_KEY]: tweets });

    return result;
}

// Sync tweet data to GitHub
async function syncToGitHub(tweetData) {
    const settings = await getSettings();
    if (!settings || !settings.githubPat) {
        throw new Error('请先在设置中配置 GitHub Token');
    }

    const targetFile = settings.targetFile || 'NANO_BANANA_PRO_PROMPTS.md';

    // Get existing file content
    let existingContent = '';
    let sha = null;

    try {
        const response = await fetch(
            `https://api.github.com/repos/${settings.repoOwner}/${settings.repoName}/contents/${targetFile}`,
            {
                headers: {
                    'Authorization': `Bearer ${settings.githubPat}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            }
        );

        if (response.ok) {
            const data = await response.json();
            existingContent = decodeURIComponent(escape(atob(data.content)));
            sha = data.sha;
        }
    } catch (error) {
        console.log('File does not exist, will create new');
    }

    // Generate case ID and check for duplicates
    const caseId = `twitter-${tweetData.id}`;

    // Check if tweet already exists in file (deduplication)
    if (existingContent && existingContent.includes(`## Case: ${caseId}`)) {
        console.log(`Tweet ${caseId} already exists in GitHub, skipping...`);
        return {
            caseId,
            targetFile,
            skipped: true,
            reason: '该推文已存在于 GitHub 文件中'
        };
    }

    // Generate new content entry
    const timestamp = new Date().toISOString();

    let newEntry = `\n---\n\n## Case: ${caseId}\n\n`;
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
    newEntry += `\`\`\`\n${tweetData.prompt || '(待添加)'}\n\`\`\`\n`;

    // Combine content
    let finalContent;
    if (existingContent) {
        finalContent = existingContent + newEntry;
    } else {
        finalContent = `# Nano Banana Pro - Twitter Collection\n\n`;
        finalContent += `> Scraped from Twitter/X using Nano Banana Scraper Chrome Extension\n`;
        finalContent += newEntry;
    }

    // Commit to GitHub
    const commitMessage = `Add: ${caseId} from @${tweetData.authorHandle || 'unknown'}`;

    const body = {
        message: commitMessage,
        content: btoa(unescape(encodeURIComponent(finalContent))),
        branch: 'main'
    };

    if (sha) {
        body.sha = sha;
    }

    const commitResponse = await fetch(
        `https://api.github.com/repos/${settings.repoOwner}/${settings.repoName}/contents/${targetFile}`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${settings.githubPat}`,
                'Accept': 'application/vnd.github.v3+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }
    );

    if (!commitResponse.ok) {
        const error = await commitResponse.json();
        throw new Error(error.message || `GitHub API 错误: ${commitResponse.status}`);
    }

    const commitData = await commitResponse.json();
    return {
        caseId,
        commitUrl: commitData.commit.html_url,
        targetFile,
        skipped: false
    };
}

// Get all tweets
async function getTweets() {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    return result[STORAGE_KEY] || [];
}

// Delete tweet
async function deleteTweet(id) {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    const tweets = result[STORAGE_KEY] || [];
    const filtered = tweets.filter(t => t.id !== id);
    await chrome.storage.local.set({ [STORAGE_KEY]: filtered });
    updateBadge(filtered.length);
}

// Update tweet
async function updateTweet(id, updates) {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    const tweets = result[STORAGE_KEY] || [];
    const index = tweets.findIndex(t => t.id === id);

    if (index === -1) {
        throw new Error('Tweet not found');
    }

    tweets[index] = { ...tweets[index], ...updates, edited: true };
    await chrome.storage.local.set({ [STORAGE_KEY]: tweets });
}

// Clear all tweets
async function clearAllTweets() {
    await chrome.storage.local.set({ [STORAGE_KEY]: [] });
    updateBadge(0);
}

// Export to YAML format
async function exportToYAML() {
    const tweets = await getTweets();

    if (tweets.length === 0) {
        throw new Error('没有可导出的推文');
    }

    let yaml = '# Nano Banana Pro - Scraped from Twitter/X\n';
    yaml += `# Generated: ${new Date().toISOString()}\n`;
    yaml += `# Total items: ${tweets.length}\n\n`;

    tweets.forEach((tweet, index) => {
        yaml += `# Case ${index + 1}\n`;
        yaml += `- id: "${tweet.id}"\n`;
        yaml += `  author: "${tweet.author || 'Unknown'}"\n`;
        yaml += `  author_handle: "${tweet.authorHandle || 'unknown'}"\n`;
        yaml += `  url: "${tweet.url || ''}"\n`;
        yaml += `  timestamp: "${tweet.timestamp || ''}"\n`;
        yaml += `  saved_at: "${tweet.savedAt}"\n`;
        yaml += `  synced: ${tweet.synced || false}\n`;
        yaml += `  images:\n`;
        tweet.images.forEach(img => {
            yaml += `    - "${img}"\n`;
        });
        yaml += `  prompt: |\n`;
        const promptLines = (tweet.prompt || '').split('\n');
        promptLines.forEach(line => {
            yaml += `    ${line}\n`;
        });
        yaml += '\n';
    });

    return yaml;
}

// Update extension badge
function updateBadge(count) {
    const text = count > 0 ? count.toString() : '';
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#FFD700' });
}

// Initialize badge on startup
chrome.storage.local.get([STORAGE_KEY], (result) => {
    const tweets = result[STORAGE_KEY] || [];
    updateBadge(tweets.length);
});
