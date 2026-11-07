<div align="center">

<img src="icons/icon-128.png" alt="" width="104">

# Courier

**Send anything from your browser to Telegram.**

Send pages, links, selected text, media and screenshots to Telegram through your own bot. Messages go directly from your browser to the Telegram Bot API. There is no intermediate server and no telemetry.

[Türkçe](README.tr.md)

[![Download](https://img.shields.io/badge/Download-Latest_release-2ea043?style=for-the-badge)](../../releases)

![Platform](https://img.shields.io/badge/Platform-Chrome_and_Firefox-0078D4)
![Version](https://img.shields.io/badge/version-0.1.0-7b3fb3)
![License](https://img.shields.io/badge/license-MIT-blue)

</div>

<br>

## What you can do

| Area | What you can do |
|---|---|
| **Pages** | Send the current page (title and URL) from the popup, the right-click menu or a shortcut |
| **Content** | Send links, selected text, images, video, audio, linked files and open PDFs from the right-click menu |
| **Screenshots** | Send a screenshot of the visible area or a selected area |

**And also:**

- Optional silent sending and link preview removal
- A clear alert when a send fails
- English and Turkish interface with a language setting, light and dark themes

## Getting started

1. **Install** the extension from the [Releases page](../../releases), or build it from source below.
2. **Create a bot.** Use [@BotFather](https://t.me/BotFather) and copy the token.
3. **Find your chat ID.** Send your bot a message, open `https://api.telegram.org/bot<token>/getUpdates` and copy the value of `chat.id`.
4. **Connect.** Open the extension settings, enter the token and chat ID, then save and send a test message.

### Shortcuts

| Action | Default |
|---|---|
| Send the current page | Alt+Shift+T |
| Screenshot of the visible area | Alt+Shift+S |
| Screenshot of a selected area | Alt+Shift+A |

## Requirements

- Chrome 116 or later, or Firefox 142 or later
- A Telegram bot token from @BotFather

## Questions

**Where does my data go?**
Straight from your browser to `api.telegram.org` through your bot. See [PRIVACY.md](PRIVACY.md).

**What are the limits?**
Bots can upload files up to 50 MB. Telegram fetches media URLs itself; if that fails, you can turn on browser downloads in settings, which asks for access to all sites. `blob:` and streaming addresses cannot be sent.

## Reporting problems

If something goes wrong, open an [issue](../../issues/new/choose) and attach the browser, its version and the error message you saw.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). To report a security problem, see [SECURITY.md](SECURITY.md).

## Building from source

Requires Node.js. The build has no dependencies.

```
npm run build
npm run lint
```

- Chrome: open `chrome://extensions`, turn on Developer mode, choose Load unpacked and select `dist/chrome`.
- Firefox: open `about:debugging#/runtime/this-firefox`, choose Load Temporary Add-on and select `dist/firefox/manifest.json`.

### Hot reload

- Chrome: run `npm run dev`, then load `dist/chrome-dev` as an unpacked extension once. Saving a file rebuilds it. Changes in `popup/` or `options/` refresh open extension tabs; other changes reload the whole extension, which closes those tabs.
- Firefox: run `npm run dev:firefox`. It opens Firefox through `web-ext` with a profile kept in `.dev-profile/`. Set the `FIREFOX_BIN` environment variable to the path of `firefox.exe` if Firefox is not installed in a default location.
- If the extension fails while starting, fix the error and reload it once from the extensions page. Files with syntax errors are not deployed.

Dev builds are never included in the store packages. They add the `tabs` permission and a connection to `127.0.0.1:35871`.

## License

Courier is free and open source under the MIT license. See [LICENSE](LICENSE) for details.
