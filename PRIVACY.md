# Privacy Policy

[Türkçe](PRIVACY.tr.md)

Courier has no server of its own and collects no analytics or telemetry. The developer receives none of your data.

## Data stored on your device

Your bot token, chat ID and settings are kept in the browser's local extension storage. They are not synced. "Delete all data" in settings removes them.

When you press Find chat ID in settings, Courier asks Telegram for the bot's recent updates to read the chat ID. Nothing from them is stored except the chat ID you pick.

## Data sent to Telegram

Only when you trigger a send, the content you chose goes to `api.telegram.org` through your bot: the page title and URL, a link, selected text, a media URL or file, or a screenshot. Media and screenshot captions contain the page URL. If you send a media URL, Telegram's servers fetch that address. Telegram's own [privacy policy](https://telegram.org/privacy) applies to this data.

## Permissions

- `contextMenus`: adds the right-click send options.
- `storage`: keeps your token, chat ID and settings on your device.
- `activeTab`: reads the current tab's title and URL and captures it, only after you act.
- `scripting`: shows the area selection overlay on the current tab, only after you act.
- Access to `api.telegram.org`: sends your messages.
- Optional access to all sites: only if you turn on browser downloads, used to download media you chose to send.
