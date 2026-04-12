# Clipflow Browser Extension

Save any webpage to Clipflow for content repurposing with one click.

## Installation (Chrome / Edge)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select this `extension/` folder
5. The Clipflow icon will appear in your toolbar

## Authentication

1. Open your Clipflow app and go to **Settings → Extension**
2. Copy the token shown on that page
3. Click the Clipflow extension icon in your browser toolbar
4. Paste the token in the field shown and click **Save**
5. The extension will verify the token and load your workspaces

Your token is stored locally in the extension's storage. You can sign out at any time by clicking **Sign out** in the popup.

## Usage

1. Navigate to any webpage you want to save
2. Click the Clipflow extension icon
3. Select the target workspace from the dropdown
4. Click **Save to Clipflow**
5. The page URL will be added as a content item and Clipflow will open automatically

## Icons

The extension references `icon16.png`, `icon48.png`, and `icon128.png`. Add your own icon files to this directory in those sizes, or the extension will load without icons (the popup will still work).

## Development

To point the extension at a local dev server instead of production:

After authenticating, the `clipflow_api_base` key in chrome.storage.local controls which API the extension calls. It defaults to `https://clipflow.to`. To override it temporarily, open DevTools on the extension's background page and run:

```js
chrome.storage.local.set({ clipflow_api_base: 'http://localhost:3000' })
```

Then reload the extension.
