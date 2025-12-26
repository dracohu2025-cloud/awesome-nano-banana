// Nano Banana Scraper - Background Service Worker
// Handles storage and data management

const STORAGE_KEY = 'nanoBananaScrapedTweets';

// Initialize storage
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
        if (!result[STORAGE_KEY]) {
            chrome.storage.local.set({ [STORAGE_KEY]: [] });
        }
    });
    console.log('🍌 Nano Banana Scraper installed');
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'saveTweet') {
        saveTweet(request.data)
            .then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
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
});

// Save tweet to storage
async function saveTweet(tweetData) {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    const tweets = result[STORAGE_KEY] || [];

    // Check for duplicates
    if (tweets.some(t => t.id === tweetData.id)) {
        throw new Error('Already saved');
    }

    // Add metadata
    const enrichedData = {
        ...tweetData,
        savedAt: new Date().toISOString(),
        prompt: tweetData.text || '', // Initial prompt from tweet text
        edited: false
    };

    tweets.unshift(enrichedData); // Add to beginning
    await chrome.storage.local.set({ [STORAGE_KEY]: tweets });

    // Update badge
    updateBadge(tweets.length);

    return enrichedData;
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
        throw new Error('No tweets to export');
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
        yaml += `  images:\n`;
        tweet.images.forEach(img => {
            yaml += `    - "${img}"\n`;
        });
        yaml += `  prompt: |\n`;
        // Indent prompt text properly for YAML multiline
        const promptLines = (tweet.prompt || '').split('\n');
        promptLines.forEach(line => {
            yaml += `    ${line}\n`;
        });
        yaml += '\n';
    });

    return yaml;
}

// Update extension badge with count
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
