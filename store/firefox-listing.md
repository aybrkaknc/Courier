# Firefox Add-ons (AMO) submission notes

Submit at https://addons.mozilla.org/developers/ (free account, no fee).

## Upload
- File: `dist/firefox.zip` (run `npm run build` first). `npm run lint` must show 0 errors.
- Distribution: On this site (listed on addons.mozilla.org).
- Add-on ID: `courier@ayberk2766` (set in `manifests/firefox.json`). Never change it after the first release.
- Minimum Firefox: 142.

## Listing
- Name: Courier
- Summary (max 250 chars): from `extDesc` in `_locales/en/messages.json`
- Description: `description.en.md` and `description.tr.md` (plain text with simple formatting works)
- Category: Social & Communication
- License: MIT License
- Privacy policy: https://github.com/aybrkaknc/Courier/blob/main/PRIVACY.md
- Support site / homepage: https://github.com/aybrkaknc/Courier
- Support email: optional, leave empty to avoid publishing a personal address
- Screenshots: `store/screenshots/` (any size accepted; the 1280x800 files work)

## Data collection (already in the manifest)
`data_collection_permissions.required`: authenticationInfo, websiteContent, browsingActivity.
Courier sends the bot token (in the request URL) and the content the user chose to send (page URL and title, selected text, media, screenshots) to the Telegram Bot API, only on a deliberate user action. `none` is not correct for this behavior.

## Notes to reviewer
```
Courier sends content from the browser to the user's own Telegram chat through the user's own bot. All code is plain JavaScript, HTML and CSS; nothing is minified, transpiled or loaded remotely.

Source and build: the package is produced by `node scripts/build.mjs` (Node.js 22 or later, no dependencies). It copies src/, popup/, options/, _locales/ and icons/ unchanged and merges manifests/base.json with manifests/firefox.json into manifest.json. Source: https://github.com/aybrkaknc/Courier

To test you need a Telegram bot. Test bot credentials:
Bot token: [PASTE TEST BOT TOKEN]
Chat ID: [PASTE TEST CHAT ID]
You can also create your own with @BotFather (/newbot).

Steps: open the add-on's settings (toolbar icon, "Open settings"), allow access to api.telegram.org if asked, paste the token and chat ID, press Save, then "Send test message". Then open any https page and use the toolbar popup, the right-click menu or Alt+Shift+1, 2, 3 (page, screenshot of visible area, screenshot of selected area).

Permissions: contextMenus (right-click send items), storage (token and settings, local only), activeTab and scripting (read the current tab and show the area-selection overlay, only after a user action), host access to api.telegram.org (send messages). Access to all sites is optional, off by default, and only used to download media the user chose to send.
```

## After approval
- AMO review is mostly automatic and usually quick; new add-ons can also get a manual review.
- Bump the version in `manifests/base.json` and `package.json` for every new upload.
