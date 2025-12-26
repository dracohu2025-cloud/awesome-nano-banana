// Nano Banana Scraper - Popup Script
// Manages the extension popup UI

document.addEventListener('DOMContentLoaded', init);

let currentEditId = null;

async function init() {
    await refreshTweetList();
    setupEventListeners();
}

function setupEventListeners() {
    // Export button
    document.getElementById('exportBtn').addEventListener('click', handleExport);

    // Clear button
    document.getElementById('clearBtn').addEventListener('click', handleClearAll);

    // Modal controls
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelEdit').addEventListener('click', closeModal);
    document.getElementById('saveEdit').addEventListener('click', handleSaveEdit);

    // Close modal on backdrop click
    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target.id === 'editModal') closeModal();
    });
}

async function refreshTweetList() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getTweets' });

        if (!response.success) {
            console.error('Failed to get tweets:', response.error);
            return;
        }

        const tweets = response.tweets;
        updateStats(tweets);
        renderTweetList(tweets);
    } catch (error) {
        console.error('Error refreshing tweet list:', error);
    }
}

function updateStats(tweets) {
    document.getElementById('totalCount').textContent = tweets.length;

    const imageCount = tweets.reduce((sum, t) => sum + t.images.length, 0);
    document.getElementById('imageCount').textContent = imageCount;
}

function renderTweetList(tweets) {
    const container = document.getElementById('tweetList');
    const emptyState = document.getElementById('emptyState');

    if (tweets.length === 0) {
        emptyState.style.display = 'flex';
        container.innerHTML = '';
        container.appendChild(emptyState);
        return;
    }

    emptyState.style.display = 'none';
    container.innerHTML = tweets.map(tweet => createTweetCard(tweet)).join('');

    // Attach event listeners
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });

    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => handleDelete(btn.dataset.id));
    });

    container.querySelectorAll('.open-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            chrome.tabs.create({ url: btn.dataset.url });
        });
    });
}

function createTweetCard(tweet) {
    const date = tweet.savedAt ? new Date(tweet.savedAt).toLocaleDateString() : '';
    const promptPreview = tweet.prompt ?
        tweet.prompt.substring(0, 100) + (tweet.prompt.length > 100 ? '...' : '') :
        '(No prompt)';

    const imagesHtml = tweet.images.slice(0, 4).map(img =>
        `<img src="${img}" alt="Image" loading="lazy">`
    ).join('');

    return `
    <div class="tweet-card" data-id="${tweet.id}">
      <div class="tweet-header">
        <div>
          <span class="tweet-author">${escapeHtml(tweet.author || 'Unknown')}</span>
          <span class="tweet-handle">@${escapeHtml(tweet.authorHandle || 'unknown')}</span>
        </div>
        <span class="tweet-date">${date}</span>
      </div>
      <div class="tweet-images">${imagesHtml}</div>
      <div class="tweet-prompt">${escapeHtml(promptPreview)}</div>
      <div class="tweet-actions">
        <button class="tweet-action-btn edit-btn" data-id="${tweet.id}">Edit Prompt</button>
        <button class="tweet-action-btn open-btn" data-url="${tweet.url}">Open Tweet</button>
        <button class="tweet-action-btn delete-btn" data-id="${tweet.id}">Delete</button>
      </div>
    </div>
  `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function openEditModal(id) {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getTweets' });
        const tweet = response.tweets.find(t => t.id === id);

        if (!tweet) return;

        currentEditId = id;

        // Show images
        const imagesContainer = document.getElementById('previewImages');
        imagesContainer.innerHTML = tweet.images.map(img =>
            `<img src="${img}" alt="Preview">`
        ).join('');

        // Set prompt
        document.getElementById('promptEditor').value = tweet.prompt || '';

        // Show modal
        document.getElementById('editModal').classList.add('active');
    } catch (error) {
        console.error('Error opening edit modal:', error);
    }
}

function closeModal() {
    currentEditId = null;
    document.getElementById('editModal').classList.remove('active');
}

async function handleSaveEdit() {
    if (!currentEditId) return;

    const prompt = document.getElementById('promptEditor').value;

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'updateTweet',
            id: currentEditId,
            updates: { prompt }
        });

        if (response.success) {
            closeModal();
            await refreshTweetList();
        } else {
            alert('Failed to save: ' + response.error);
        }
    } catch (error) {
        console.error('Error saving edit:', error);
        alert('Failed to save changes');
    }
}

async function handleDelete(id) {
    if (!confirm('Delete this saved tweet?')) return;

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'deleteTweet',
            id
        });

        if (response.success) {
            await refreshTweetList();
        } else {
            alert('Failed to delete: ' + response.error);
        }
    } catch (error) {
        console.error('Error deleting tweet:', error);
    }
}

async function handleClearAll() {
    if (!confirm('Delete ALL saved tweets? This cannot be undone.')) return;

    try {
        const response = await chrome.runtime.sendMessage({ action: 'clearAll' });

        if (response.success) {
            await refreshTweetList();
        } else {
            alert('Failed to clear: ' + response.error);
        }
    } catch (error) {
        console.error('Error clearing tweets:', error);
    }
}

async function handleExport() {
    const btn = document.getElementById('exportBtn');
    const originalText = btn.innerHTML;

    btn.innerHTML = 'Exporting...';
    btn.disabled = true;

    try {
        const response = await chrome.runtime.sendMessage({ action: 'exportYAML' });

        if (!response.success) {
            throw new Error(response.error);
        }

        // Create and download file
        const blob = new Blob([response.yaml], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().split('T')[0];

        const a = document.createElement('a');
        a.href = url;
        a.download = `nano-banana-scraped-${timestamp}.yaml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      Exported!
    `;

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 2000);

    } catch (error) {
        console.error('Export error:', error);
        alert('Export failed: ' + error.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}
