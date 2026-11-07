import { applyI18n, loadLanguage, t } from '../src/i18n.js';
import { clearSettings, getSettings, saveSettings } from '../src/storage.js';
import { chatsFromUpdates, errorText, getMe, getUpdates, sendText } from '../src/telegram.js';

const API_ORIGINS = { origins: ['https://api.telegram.org/*'] };
const ALL_ORIGINS = { origins: ['<all_urls>'] };

const element = (id) => document.getElementById(id);
const tokenInput = element('token');
const chatInput = element('chat-id');
const silentInput = element('silent');
const noPreviewInput = element('no-preview');
const directInput = element('direct-download');
const languageInput = element('language');
const toggleToken = element('toggle-token');
const status = element('status');
const apiPermission = element('api-permission');
const botInfo = element('bot-info');
const openBot = element('open-bot');
const findChat = element('find-chat');
const chatChoices = element('chat-choices');

function showStatus(text, kind = '') {
  status.textContent = text;
  status.className = kind;
}

function readForm() {
  const token = tokenInput.value.trim();
  const chatId = chatInput.value.trim();
  if (!/^\d+:[\w-]+$/.test(token)) {
    showStatus(t('optInvalidToken'), 'error');
    return null;
  }
  if (!/^(-?\d+|@\w+)$/.test(chatId)) {
    showStatus(t('optInvalidChat'), 'error');
    return null;
  }
  return { token, chatId };
}

function setTokenVisible(visible) {
  tokenInput.type = visible ? 'text' : 'password';
  toggleToken.textContent = t(visible ? 'optHide' : 'optShow');
}

async function refreshApiPermission() {
  apiPermission.hidden = await chrome.permissions.contains(API_ORIGINS);
}

async function refreshLanguage() {
  await loadLanguage();
  applyI18n();
  setTokenVisible(tokenInput.type === 'text');
}

const TOKEN_PATTERN = /\d{6,}:[\w-]{30,}/;

async function verifyToken() {
  const token = tokenInput.value.trim();
  botInfo.textContent = '';
  openBot.hidden = true;
  if (!/^\d+:[\w-]+$/.test(token)) return;
  try {
    const bot = await getMe(token);
    if (tokenInput.value.trim() !== token) return;
    botInfo.textContent = t('optBotVerified', [`@${bot.username}`]);
    openBot.href = `https://t.me/${bot.username}`;
    openBot.hidden = false;
  } catch (error) {
    if (tokenInput.value.trim() === token) botInfo.textContent = errorText(error);
  }
}

// A pasted BotFather message contains the token among other text.
tokenInput.addEventListener('paste', (event) => {
  const match = (event.clipboardData?.getData('text') ?? '').match(TOKEN_PATTERN);
  if (!match) return;
  event.preventDefault();
  tokenInput.value = match[0];
  verifyToken();
});
tokenInput.addEventListener('change', verifyToken);

function pickChat(chat) {
  chatInput.value = chat.id;
  chatChoices.textContent = '';
  showStatus(t('optChatFound', [chat.name]), 'success');
}

let search = null;

findChat.addEventListener('click', async () => {
  if (search) {
    search.cancelled = true;
    return;
  }
  const token = tokenInput.value.trim();
  if (!/^\d+:[\w-]+$/.test(token)) {
    showStatus(t('optInvalidToken'), 'error');
    return;
  }
  const run = search = { cancelled: false };
  const deadline = Date.now() + 120000;
  chatChoices.textContent = '';
  findChat.textContent = t('optCancel');
  showStatus(t('optChatSearching'));
  try {
    while (!run.cancelled && Date.now() < deadline) {
      const chats = chatsFromUpdates(await getUpdates(token));
      if (chats.length === 1) return pickChat(chats[0]);
      if (chats.length > 1) {
        for (const chat of chats) {
          const choice = document.createElement('button');
          choice.type = 'button';
          choice.className = 'secondary';
          choice.textContent = `${chat.name} (${chat.id})`;
          choice.addEventListener('click', () => pickChat(chat));
          chatChoices.append(choice);
        }
        showStatus(t('optChatPick'));
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    if (run.cancelled) showStatus('');
    else showStatus(t('optChatNone'), 'error');
  } catch (error) {
    showStatus(errorText(error), 'error');
  } finally {
    search = null;
    findChat.textContent = t('optFindChat');
  }
});

async function load() {
  const settings = await getSettings();
  languageInput.value = settings.language;
  tokenInput.value = settings.token;
  chatInput.value = settings.chatId;
  silentInput.checked = settings.silent;
  noPreviewInput.checked = settings.noPreview;
  directInput.checked = settings.directDownload && await chrome.permissions.contains(ALL_ORIGINS);
  tokenInput.type = 'password';
  await refreshLanguage();
  await refreshApiPermission();
  verifyToken();
}

element('bot-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = readForm();
  if (!values) return;
  await saveSettings(values);
  try {
    const bot = await getMe(values.token);
    showStatus(t('optSaved', [`@${bot.username}`]), 'success');
  } catch (error) {
    showStatus(`${t('optSavedUnverified')} ${errorText(error)}`, 'error');
  }
});

element('test').addEventListener('click', async () => {
  const values = readForm();
  if (!values) return;
  try {
    await sendText({ ...values, silent: silentInput.checked, noPreview: noPreviewInput.checked }, t('testMessage'));
    showStatus(t('optTestSent'), 'success');
  } catch (error) {
    showStatus(errorText(error), 'error');
  }
});

toggleToken.addEventListener('click', () => setTokenVisible(tokenInput.type === 'password'));

silentInput.addEventListener('change', () => saveSettings({ silent: silentInput.checked }));
noPreviewInput.addEventListener('change', () => saveSettings({ noPreview: noPreviewInput.checked }));

// permissions.request needs a user gesture, so it must run before any other await.
directInput.addEventListener('change', async () => {
  if (directInput.checked) {
    directInput.checked = await chrome.permissions.request(ALL_ORIGINS);
  } else {
    await chrome.permissions.remove(ALL_ORIGINS);
  }
  await saveSettings({ directDownload: directInput.checked });
});

languageInput.addEventListener('change', async () => {
  await saveSettings({ language: languageInput.value });
  await refreshLanguage();
  showStatus('');
});

element('open-shortcuts').addEventListener('click', () => {
  if (chrome.commands.openShortcutSettings) chrome.commands.openShortcutSettings();
  else chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

element('grant-api').addEventListener('click', async () => {
  await chrome.permissions.request(API_ORIGINS);
  await refreshApiPermission();
});

element('delete').addEventListener('click', async () => {
  if (!window.confirm(t('optDeleteConfirm'))) return;
  await chrome.permissions.remove(ALL_ORIGINS);
  await clearSettings();
  await load();
  showStatus(t('optDeleted'), 'success');
});

await load();
