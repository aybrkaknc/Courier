let language = null;
let messages = null;

// chrome.i18n always follows the browser language, so a chosen language is read from _locales directly.
export async function loadLanguage() {
  const { language: stored } = await chrome.storage.local.get('language');
  language = stored === 'en' || stored === 'tr' ? stored : null;
  messages = null;
  if (language) {
    const response = await fetch(chrome.runtime.getURL(`_locales/${language}/messages.json`));
    messages = await response.json();
  }
}

export function t(key, substitutions = []) {
  const entry = messages?.[key];
  if (!entry) return chrome.i18n.getMessage(key, substitutions);
  return entry.message.replace(/\$(\w+)\$/g, (match, name) => {
    const content = entry.placeholders?.[name.toLowerCase()]?.content;
    return content ? substitutions[Number(content.slice(1)) - 1] ?? '' : match;
  });
}

export function applyI18n() {
  document.documentElement.lang = language ?? chrome.i18n.getUILanguage();
  for (const element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = t(element.dataset.i18n);
  }
}
