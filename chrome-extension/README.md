# 🍌 Nano Banana Scraper

A Chrome extension to scrape Nano Banana Pro images and prompts from Twitter/X.

## Features

- **One-Click Scraping**: Adds a "Scrape" button to tweets with images
- **Prompt Editing**: Edit and refine prompts before export
- **Local Storage**: All data saved locally in your browser
- **YAML Export**: Export to YAML format for easy integration

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `chrome-extension` folder

## Usage

1. **Browse Twitter/X** for Nano Banana Pro content
2. **Click "Scrape"** on tweets with AI-generated images
3. **Edit prompts** via the extension popup if needed
4. **Export YAML** when ready to add to your collection

## Export Format

```yaml
- id: "1234567890"
  author: "Username"
  author_handle: "handle"
  url: "https://x.com/handle/status/1234567890"
  timestamp: "2024-01-15T10:30:00.000Z"
  saved_at: "2024-01-15T12:00:00.000Z"
  images:
    - "https://pbs.twimg.com/media/xxx.jpg?name=orig"
  prompt: |
    Your edited prompt here...
```

## Privacy

- All data stored locally in Chrome
- No external servers or tracking
- Your data never leaves your browser

## Development

```bash
# Watch for changes (optional)
# Just reload extension in chrome://extensions after edits
```

## License

MIT License - See repository for details.
