# Chrome Web Store submission notes

Copy these into the developer dashboard (https://chrome.google.com/webstore/devconsole).

## Store listing
- Name: Courier (from the manifest)
- Summary (max 132 chars): from manifest `extDesc` (EN 89, TR 112 chars)
- Description: `description.en.md` and `description.tr.md`
- Category: Productivity
- Languages: English, Turkish
- Icon: `icons/icon-128.png` (128x128, included in the package)
- Screenshots (required, 1 to 5): 1280x800 or 640x400, PNG or JPEG. Suggested: popup, right-click menu, area selection, settings page.
- Small promo tile (440x280): optional but recommended.
- Privacy policy URL: https://github.com/aybrkaknc/Courier/blob/main/PRIVACY.md
- Homepage URL: https://github.com/aybrkaknc/Courier

## Privacy practices tab
Single purpose:
Send the current page, links, selected text, media and screenshots from the browser to the user's own Telegram chat through the user's own bot.

Permission justifications:
- contextMenus: adds the right-click "send to Telegram" options for links, selected text and media.
- storage: keeps the user's bot token, chat ID and settings on their device.
- activeTab: reads the title and URL of the current tab, and captures it, only after the user clicks the popup, a menu item or a shortcut.
- scripting: shows the area-selection overlay on the current tab, only after the user starts an area screenshot.
- Host permission https://api.telegram.org/*: sends the user's messages and files to the Telegram Bot API.
- Optional host permission <all_urls>: requested only if the user turns on "download media in the browser". Used only to download media the user chose to send, up to 50 MB.

Remote code: No, the extension does not use remote code.

Data usage disclosure:
- Collected from the user: authentication information (the bot token, stored locally) and website content the user chooses to send (page URL and title, selected text, media, screenshots).
- It is sent only to the Telegram Bot API, only when the user triggers a send, and only to the user's own chat.
- The developer receives no data. No analytics, no telemetry, no sale or transfer to third parties, no use for unrelated purposes.
- Certify the three limited-use statements.

## Before submitting
1. Run `npm run build`, upload `dist/chrome.zip`.
2. Bump the version in `manifests/base.json` and `package.json` for every new upload.
3. Developer account registration fee is a one-time 5 USD.
