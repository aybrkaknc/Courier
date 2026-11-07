import { applyI18n, loadLanguage, t } from '../src/i18n.js';
import { clearSettings, getSettings, saveSettings } from '../src/storage.js';
import { errorText, getMe, sendText } from '../src/telegram.js';

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
