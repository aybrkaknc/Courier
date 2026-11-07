import { applyI18n, loadLanguage, t } from '../src/i18n.js';
import { getSettings, isConfigured } from '../src/storage.js';

const actions = document.getElementById('actions');
const status = document.getElementById('status');

function showStatus(text, isError = false) {
  status.textContent = text;
  status.classList.toggle('error', isError);
}

async function run(button) {
  const type = button.dataset.action;
  const buttons = actions.querySelectorAll('button');
  for (const item of buttons) item.disabled = true;
  showStatus(t('popupSending'));

  const result = await chrome.runtime.sendMessage({ type });

  if (result?.ok && type === 'send-area') {
    window.close();
    return;
  }
  for (const item of buttons) item.disabled = false;
  if (result?.ok) showStatus(t('popupSent'));
  else showStatus(result?.error ?? t('errUnknown'), true);
}

await loadLanguage();
applyI18n();

const { lastError } = await chrome.storage.session.get('lastError');
if (lastError) {
  document.getElementById('alert-text').textContent = lastError;
  document.getElementById('alert').hidden = false;
  await chrome.storage.session.remove('lastError');
}

// In a standalone alert window the active tab would be this window, so sending is hidden.
const isAlertWindow = new URLSearchParams(location.search).has('alert');
const configured = isConfigured(await getSettings());
actions.hidden = !configured || isAlertWindow;
document.getElementById('not-configured').hidden = configured;

actions.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (button) run(button);
});

document.getElementById('settings').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
  window.close();
});
