import { captureArea, captureVisible } from './capture.js';
import { loadLanguage, t } from './i18n.js';
import { resolveLink } from './links.js';
import { getSettings, isConfigured } from './storage.js';
import { TelegramError, errorText, maskToken, sendFile, sendFromUrl, sendText } from './telegram.js';

const BADGE_MS = 4000;
const COLOR_OK = '#2e7d32';
const COLOR_ERROR = '#c62828';

const MENU_ITEMS = [
  { id: 'page', title: 'menuPage', contexts: ['page', 'frame'] },
  { id: 'page-file', title: 'menuPageFile', contexts: ['page', 'frame', 'selection'], documentUrlPatterns: ['*://*/*.pdf*'] },
  { id: 'link', title: 'menuLink', contexts: ['link'] },
  { id: 'link-file', title: 'menuLinkFile', contexts: ['link'] },
  { id: 'selection', title: 'menuSelection', contexts: ['selection'] },
  { id: 'image', title: 'menuImage', contexts: ['image'] },
  { id: 'video', title: 'menuVideo', contexts: ['video'] },
  { id: 'audio', title: 'menuAudio', contexts: ['audio'] }
];

let languageReady = loadLanguage();

async function refreshBadge() {
  const configured = isConfigured(await getSettings());
  await chrome.action.setBadgeBackgroundColor({ color: COLOR_ERROR });
  await chrome.action.setBadgeText({ text: configured ? '' : '!' });
}

async function flashBadge(text, color) {
  await chrome.action.setBadgeBackgroundColor({ color });
  await chrome.action.setBadgeText({ text });
  setTimeout(refreshBadge, BADGE_MS);
}

async function requireSettings() {
  const settings = await getSettings();
  if (isConfigured(settings)) return settings;
  await chrome.runtime.openOptionsPage();
  throw new TelegramError('popupNotConfigured');
}

async function failure(error) {
  console.error(maskToken(error?.message ?? error));
  await flashBadge('!', COLOR_ERROR);
  // Missing settings already opened the settings page, so no alert is needed.
  return { ok: false, error: errorText(error), silent: error?.key === 'popupNotConfigured' };
}

async function perform(task) {
  await languageReady;
  try {
    await task(await requireSettings());
    await flashBadge('OK', COLOR_OK);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

async function showAlert(text) {
  await chrome.storage.session.set({ lastError: text });
  try {
    await chrome.action.openPopup();
  } catch {
    await chrome.windows.create({
      url: chrome.runtime.getURL('popup/popup.html?alert=1'),
      type: 'popup',
      width: 320,
      height: 260
    });
  }
}

// For sends started outside the popup, where nothing else would show the error text.
async function withAlert(promise) {
  const result = await promise;
  if (!result.ok && !result.silent) await showAlert(result.error);
  return result;
}

function pageText(tab) {
  if (!tab?.url) throw new TelegramError('errRestricted');
  return tab.title && tab.title !== tab.url ? `${tab.title}\n${tab.url}` : tab.url;
}

const sendPage = (tab) => perform((settings) => sendText(settings, pageText(tab)));

const sendScreenshot = (tab) => perform(async (settings) => {
  const image = await captureVisible(tab.windowId);
  await sendFile(settings, 'photo', image, 'screenshot.png', tab.url);
});

async function startArea(tab) {
  await languageReady;
  try {
    await requireSettings();
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (hint) => { window.courierOverlayHint = hint; },
      args: [t('overlayHint')]
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['src/selection-overlay.js']
    });
    return { ok: true };
  } catch (error) {
    return failure(error instanceof TelegramError ? error : new TelegramError('errRestricted'));
  }
}

const sendArea = (tab, rect, viewportWidth) => perform(async (settings) => {
  const image = await captureArea(tab.windowId, rect, viewportWidth);
  await sendFile(settings, 'photo', image, 'screenshot.png', tab.url);
});

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab;
}

const ACTIONS = {
  'send-page': sendPage,
  'send-screenshot': sendScreenshot,
  'send-area': startArea
};

function handleMenuClick(info, tab) {
  const source = info.pageUrl;
  return perform((settings) => {
    switch (info.menuItemId) {
      case 'page':
        return sendText(settings, pageText(tab ?? { url: source }));
      case 'page-file':
        return sendFromUrl(settings, 'document', source, tab?.title);
      case 'link':
        return sendText(settings, resolveLink(info.linkUrl));
      case 'link-file':
        return sendFromUrl(settings, 'document', resolveLink(info.linkUrl), source);
      case 'selection':
        // A preview of the source URL would look like a sent file when the source is a PDF.
        return sendText({ ...settings, noPreview: true }, `${info.selectionText}\n\n${t('selectionSource')}: ${source}`);
      case 'image':
        return sendFromUrl(settings, 'photo', info.srcUrl, source);
      case 'video':
        return sendFromUrl(settings, 'video', info.srcUrl, source);
      case 'audio':
        return sendFromUrl(settings, 'audio', info.srcUrl, source);
      default:
        return undefined;
    }
  });
}

async function createMenus() {
  await languageReady;
  await chrome.contextMenus.removeAll();
  for (const { title, ...item } of MENU_ITEMS) {
    chrome.contextMenus.create({ ...item, title: t(title) });
  }
}

function prepare() {
  createMenus();
  refreshBadge();
}

chrome.runtime.onInstalled.addListener(prepare);
chrome.runtime.onStartup.addListener(prepare);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.token || changes.chatId) refreshBadge();
  if (changes.language) {
    languageReady = loadLanguage();
    createMenus();
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => withAlert(handleMenuClick(info, tab)));

chrome.commands.onCommand.addListener(async (command) => {
  const tab = await activeTab();
  if (tab && ACTIONS[command]) await withAlert(ACTIONS[command](tab));
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const respond = (promise) => {
    promise.then(sendResponse);
    return true;
  };

  if (message.type === 'area-selected' && sender.tab) {
    return respond(withAlert(sendArea(sender.tab, message.rect, message.viewportWidth)));
  }
  if (ACTIONS[message.type]) {
    return respond(activeTab().then((tab) => ACTIONS[message.type](tab)));
  }
  return false;
});
