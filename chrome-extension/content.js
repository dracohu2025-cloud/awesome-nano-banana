// Nano Banana Scraper - Content Script
// Detects tweets and adds scrape buttons

(function () {
    'use strict';

    // Track processed tweets to avoid duplicates
    const processedTweets = new Set();

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
            // Get tweet link for ID and URL
            const tweetLink = tweetElement.querySelector('a[href*="/status/"]');
            if (tweetLink) {
                const match = tweetLink.href.match(/\/status\/(\d+)/);
                if (match) {
                    data.id = match[1];
                    data.url = tweetLink.href;
                }
            }

            // Get author info
            const authorElement = tweetElement.querySelector('[data-testid="User-Name"]');
            if (authorElement) {
                const displayName = authorElement.querySelector('span');
                const handle = authorElement.querySelector('a[href^="/"]');
                if (displayName) data.author = displayName.textContent;
                if (handle) data.authorHandle = handle.href.split('/').pop();
            }

            // Get tweet text
            const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
            if (textElement) {
                data.text = textElement.textContent;
            }

            // Get images
            const imageElements = tweetElement.querySelectorAll('img[src*="pbs.twimg.com/media"]');
            imageElements.forEach(img => {
                // Get the highest quality version
                let src = img.src;
                // Convert to original quality if possible
                src = src.replace(/&name=\w+/, '&name=orig');
                if (!src.includes('&name=')) {
                    src += '?format=jpg&name=orig';
                }
                data.images.push(src);
            });

            // Get timestamp
            const timeElement = tweetElement.querySelector('time');
            if (timeElement) {
                data.timestamp = timeElement.getAttribute('datetime');
            }
        } catch (error) {
            console.error('Error extracting tweet data:', error);
        }

        return data;
    }

    // Scrape tweet and save
    async function scrapeTweet(tweetElement, button) {
        const originalContent = button.innerHTML;
        button.innerHTML = '<span class="loading">Saving...</span>';
        button.disabled = true;

        try {
            const tweetData = extractTweetData(tweetElement);

            if (!tweetData.id) {
                throw new Error('Could not extract tweet ID');
            }

            if (tweetData.images.length === 0) {
                throw new Error('No images found in this tweet');
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
          <span>Saved!</span>
        `;
                button.classList.add('saved');
            } else {
                throw new Error(response.error || 'Failed to save');
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
        const tweets = document.querySelectorAll('article[data-testid="tweet"]');

        tweets.forEach(tweet => {
            // Skip if already processed
            if (processedTweets.has(tweet)) return;
            processedTweets.add(tweet);

            // Check if tweet has images from pbs.twimg.com
            const hasImages = tweet.querySelector('img[src*="pbs.twimg.com/media"]');
            if (!hasImages) return;

            // Find the action bar
            const actionBar = tweet.querySelector('[role="group"]');
            if (!actionBar) return;

            // Check if button already exists
            if (tweet.querySelector('.nano-banana-scrape-btn')) return;

            // Create and insert button
            const button = createScrapeButton(tweet);

            // Insert as wrapper to match Twitter's style
            const wrapper = document.createElement('div');
            wrapper.className = 'nano-banana-btn-wrapper';
            wrapper.appendChild(button);

            actionBar.appendChild(wrapper);
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
            processTweets();
        }
    });

    // Initialize
    function init() {
        // Process existing tweets
        processTweets();

        // Watch for new tweets (infinite scroll)
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('🍌 Nano Banana Scraper initialized');
    }

    // Wait for page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
