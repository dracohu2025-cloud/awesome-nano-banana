// Nano Banana Scraper - Options Page Script
// Manages GitHub PAT settings

const SETTINGS_KEY = 'nanoBananaSettings';

document.addEventListener('DOMContentLoaded', init);

async function init() {
    await loadSettings();
    setupEventListeners();
}

function setupEventListeners() {
    // Toggle password visibility
    document.getElementById('togglePat').addEventListener('click', () => {
        const input = document.getElementById('githubPat');
        input.type = input.type === 'password' ? 'text' : 'password';
    });

    // Test connection
    document.getElementById('testBtn').addEventListener('click', testConnection);

    // Save settings
    document.getElementById('settingsForm').addEventListener('submit', saveSettings);
}

async function loadSettings() {
    try {
        const result = await chrome.storage.local.get([SETTINGS_KEY]);
        const settings = result[SETTINGS_KEY] || {};

        if (settings.githubPat) {
            document.getElementById('githubPat').value = settings.githubPat;
        }
        if (settings.repoOwner) {
            document.getElementById('repoOwner').value = settings.repoOwner;
        }
        if (settings.repoName) {
            document.getElementById('repoName').value = settings.repoName;
        }
        if (settings.targetFile) {
            document.getElementById('targetFile').value = settings.targetFile;
        }
        if (settings.autoSync !== undefined) {
            document.getElementById('autoSync').checked = settings.autoSync;
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

async function saveSettings(e) {
    e.preventDefault();

    const settings = {
        githubPat: document.getElementById('githubPat').value.trim(),
        repoOwner: document.getElementById('repoOwner').value.trim(),
        repoName: document.getElementById('repoName').value.trim(),
        targetFile: document.getElementById('targetFile').value.trim() || 'NANO_BANANA_PRO_PROMPTS.md',
        autoSync: document.getElementById('autoSync').checked
    };

    // Validate
    if (!settings.githubPat) {
        showMessage('请输入 GitHub Token', 'error');
        return;
    }
    if (!settings.repoOwner || !settings.repoName) {
        showMessage('请输入仓库信息', 'error');
        return;
    }

    try {
        await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
        showMessage('✅ 设置已保存！', 'success');

        // Show status section
        document.getElementById('statusSection').style.display = 'block';
    } catch (error) {
        console.error('Failed to save settings:', error);
        showMessage('保存失败: ' + error.message, 'error');
    }
}

async function testConnection() {
    const btn = document.getElementById('testBtn');
    const originalText = btn.textContent;
    btn.textContent = '测试中...';
    btn.disabled = true;

    const pat = document.getElementById('githubPat').value.trim();
    const owner = document.getElementById('repoOwner').value.trim();
    const repo = document.getElementById('repoName').value.trim();

    if (!pat || !owner || !repo) {
        showMessage('请先填写 Token 和仓库信息', 'error');
        btn.textContent = originalText;
        btn.disabled = false;
        return;
    }

    try {
        // Test API access
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: {
                'Authorization': `Bearer ${pat}`,
                'Accept': 'application/vnd.github.v3+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        const statusSection = document.getElementById('statusSection');
        const statusDot = statusSection.querySelector('.status-dot');
        const statusText = statusSection.querySelector('.status-text');
        statusSection.style.display = 'block';

        if (response.ok) {
            const data = await response.json();
            statusDot.className = 'status-dot connected';
            statusText.textContent = `已连接: ${data.full_name} (${data.private ? '私有' : '公开'})`;
            showMessage('✅ 连接成功！可以使用自动同步功能', 'success');
        } else if (response.status === 401) {
            statusDot.className = 'status-dot error';
            statusText.textContent = 'Token 无效或已过期';
            showMessage('❌ Token 无效，请检查是否正确', 'error');
        } else if (response.status === 404) {
            statusDot.className = 'status-dot error';
            statusText.textContent = '仓库不存在或无权限';
            showMessage('❌ 仓库不存在，或 Token 没有访问权限', 'error');
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Connection test failed:', error);
        showMessage('❌ 连接失败: ' + error.message, 'error');
    }

    btn.textContent = originalText;
    btn.disabled = false;
}

function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    messageEl.className = 'message ' + type;
    messageEl.innerHTML = `<p>${text}</p>`;

    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageEl.innerHTML = '';
    }, 5000);
}
