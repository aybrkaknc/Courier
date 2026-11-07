const DEFAULTS = {
  token: '',
  chatId: '',
  silent: false,
  noPreview: false,
  directDownload: false,
  language: 'auto'
};

export const getSettings = () => chrome.storage.local.get(DEFAULTS);
export const saveSettings = (values) => chrome.storage.local.set(values);
export const clearSettings = () => chrome.storage.local.clear();
export const isConfigured = (settings) => Boolean(settings.token && settings.chatId);
