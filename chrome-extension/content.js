// Nano Banana Scraper - Content Script
// Detects tweets and adds scrape buttons

(function () {
    'use strict';

    // Track processed tweets to avoid duplicates
    const processedTweets = new Set();

    // Debug logging
    const DEBUG = true;
    function log(...args) {
        if (DEBUG) console.log('🍌 [NanoBanana]', ...args);
    }

    // Create scrape button element
    function createScrapeButton(tweetElement) {
        const button = document.createElement('button');
        button.className = 'nano-banana-scrape-btn';
        button.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
      <span>Scrape</span>
    `;
        button.title = 'Save to Nano Banana collection';

        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            scrapeTweet(tweetElement, button);
        });

        return button;
    }

    // Extract tweet data
    function extractTweetData(tweetElement) {
        const data = {
            id: null,
            author: null,
            authorHandle: null,
            text: null,
            images: [],
            timestamp: null,
            url: null
        };

        try {
            // Get tweet link for ID and URL - try multiple selectors
            const tweetLinks = tweetElement.querySelectorAll('a[href*="/status/"]');
            for (const link of tweetLinks) {
                const match = link.href.match(/\/status\/(\d+)/);
                if (match) {
                    data.id = match[1];
                    data.url = link.href;
                    break;
                }
            }

            // Get author info from various possible selectors
            const authorElement = tweetElement.querySelector('[data-testid="User-Name"]');
            if (authorElement) {
                const spans = authorElement.querySelectorAll('span');
                if (spans.length > 0) data.author = spans[0].textContent;

                const handleLink = authorElement.querySelector('a[href^="/"]');
                if (handleLink) {
                    const handleMatch = handleLink.href.match(/\/([^\/\?]+)(?:\?|$)/);
                    if (handleMatch) data.authorHandle = handleMatch[1];
                }
            }

            // Get tweet text
            const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
            if (textElement) {
                data.text = textElement.textContent;
            }

            // Get images - ONLY from tweetPhoto containers (main tweet images)
            // This avoids capturing profile pics, quote tweet avatars, etc.
            const photoContainers = tweetElement.querySelectorAll('[data-testid="tweetPhoto"]');
            photoContainers.forEach(container => {
                const img = container.querySelector('img');
                if (img && img.src) {
                    let src = img.src;
                    // Skip if already added
                    if (data.images.includes(src)) return;
                    // Skip profile pics and emojis (they're typically < 100px or from profile_images)
                    if (src.includes('profile_images') || src.includes('emoji')) return;

                    // Convert to original quality
                    src = src.replace(/[?&]name=\w+/, '');
                    if (src.includes('?')) {
                        src += '&name=orig';
                    } else {
                        src += '?name=orig';
                    }
                    data.images.push(src);
                }
            });

            // Get timestamp
            const timeElement = tweetElement.querySelector('time');
            if (timeElement) {
                data.timestamp = timeElement.getAttribute('datetime');
            }
        } catch (error) {
            console.error('Error extracting tweet data:', error);
        }

        log('Extracted data:', data);
        return data;
    }

    // Scrape tweet and save
    async function scrapeTweet(tweetElement, button) {
        const originalContent = button.innerHTML;
        button.innerHTML = '<span class="loading">保存中...</span>';
        button.disabled = true;

        try {
            // Check if extension context is still valid
            if (!chrome.runtime || !chrome.runtime.sendMessage) {
                throw new Error('请刷新页面后重试 (Cmd+R)');
            }

            const tweetData = extractTweetData(tweetElement);

            if (!tweetData.id) {
                throw new Error('无法获取推文 ID');
            }

            if (tweetData.images.length === 0) {
                throw new Error('未找到图片');
            }

            // Send to background script for storage
            const response = await chrome.runtime.sendMessage({
                action: 'saveTweet',
                data: tweetData
            });

            if (response.success) {
                button.innerHTML = `
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          <span>已保存!</span>
        `;
                button.classList.add('saved');

                if (response.synced) {
                    button.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span>已同步!</span>
          `;
                }
            } else {
                throw new Error(response.error || '保存失败');
            }
        } catch (error) {
            console.error('Scrape error:', error);
            button.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <span>${error.message}</span>
      `;
            button.classList.add('error');

            // Reset after 3 seconds
            setTimeout(() => {
                button.innerHTML = originalContent;
                button.classList.remove('error');
                button.disabled = false;
            }, 3000);
        }
    }

    // Find and process tweets
    function processTweets() {
        // Try multiple selectors for tweet containers
        const tweetSelectors = [
            'article[data-testid="tweet"]',
            'article[role="article"]',
            '[data-testid="cellInnerDiv"] article'
        ];

        let tweets = [];
        for (const selector of tweetSelectors) {
            const found = document.querySelectorAll(selector);
            if (found.length > 0) {
                tweets = Array.from(found);
                log(`Found ${tweets.length} tweets using: ${selector}`);
                break;
            }
        }

        if (tweets.length === 0) {
            log('No tweets found on page');
            return;
        }

        tweets.forEach(tweet => {
            // Skip if already processed
            if (processedTweets.has(tweet)) return;

            // Check if tweet has images - try multiple selectors
            const hasImages = tweet.querySelector('img[src*="pbs.twimg.com/media"]') ||
                tweet.querySelector('img[src*="/media/"]') ||
                tweet.querySelector('[data-testid="tweetPhoto"]');

            if (!hasImages) {
                log('Tweet has no images, skipping');
                return;
            }

            // Find the action bar
            const actionBar = tweet.querySelector('[role="group"]');
            if (!actionBar) {
                log('No action bar found, skipping');
                return;
            }

            // Check if button already exists
            if (tweet.querySelector('.nano-banana-scrape-btn')) {
                return;
            }

            // Mark as processed
            processedTweets.add(tweet);

            // Create and insert button
            const button = createScrapeButton(tweet);

            // Insert as wrapper to match Twitter's style
            const wrapper = document.createElement('div');
            wrapper.className = 'nano-banana-btn-wrapper';
            wrapper.appendChild(button);

            actionBar.appendChild(wrapper);
            log('Added Scrape button to tweet');
        });
    }

    // Observe DOM changes for infinite scroll
    const observer = new MutationObserver((mutations) => {
        let shouldProcess = false;
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0) {
                shouldProcess = true;
            }
        });
        if (shouldProcess) {
            // Debounce processing
            clearTimeout(window._nanoBananaTimeout);
            window._nanoBananaTimeout = setTimeout(processTweets, 300);
        }
    });

    // Initialize with retry
    function init() {
        log('Initializing...');

        // Process immediately
        processTweets();

        // Also process after a delay (for slow-loading content)
        setTimeout(processTweets, 1000);
        setTimeout(processTweets, 2000);
        setTimeout(processTweets, 3000);

        // Watch for new tweets (infinite scroll)
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        log('Initialized! Watching for tweets...');
    }

    // Wait for page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
