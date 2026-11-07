import { t } from './i18n.js';

const API_ROOT = 'https://api.telegram.org';
const TEXT_LIMIT = 4096;
const CAPTION_LIMIT = 1024;
const PHOTO_UPLOAD_LIMIT = 10 * 1024 * 1024;
const UPLOAD_LIMIT = 50 * 1024 * 1024;

const MEDIA = {
  photo: { method: 'sendPhoto', field: 'photo' },
  video: { method: 'sendVideo', field: 'video' },
  audio: { method: 'sendAudio', field: 'audio' },
  document: { method: 'sendDocument', field: 'document' }
};

export class TelegramError extends Error {
  constructor(key, { code, description = '', substitutions } = {}) {
    super(description || key);
    this.key = key;
    this.code = code;
    this.description = description;
    this.substitutions = substitutions;
  }
}

export function errorText(error) {
  return error instanceof TelegramError ? t(error.key, error.substitutions) : t('errUnknown');
}

export const maskToken = (text) => String(text).replace(/bot\d+:[\w-]+/g, 'bot***');

function toError(status, body) {
  const code = body?.error_code ?? status;
  const description = body?.description ?? '';
  if (code === 401 || code === 404) return new TelegramError('errToken', { code, description });
  if (code === 409) return new TelegramError('errUpdatesConflict', { code, description });
  if (code === 403) return new TelegramError('errForbidden', { code, description });
  if (code === 413) return new TelegramError('errTooLarge', { code, description });
  if (code === 429) {
    const seconds = String(body?.parameters?.retry_after ?? '?');
    return new TelegramError('errRate', { code, description, substitutions: [seconds] });
  }
  if (/chat not found/i.test(description)) return new TelegramError('errChat', { code, description });
  return new TelegramError('errTelegram', { code, description, substitutions: [description || String(code)] });
}

async function call(token, method, fields = {}) {
  const hasFields = Object.keys(fields).length > 0;
  const body = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (value instanceof Blob) body.append(name, value, fields.__filename);
    else if (name !== '__filename') body.append(name, value);
  }

  let response;
  try {
    // Telegram answers an empty multipart body with a bare 400.
    response = await fetch(`${API_ROOT}/bot${token}/${method}`, hasFields ? { method: 'POST', body } : { method: 'POST' });
  } catch {
    throw new TelegramError('errNetwork');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) throw toError(response.status, data);
  return data.result;
}

export const getMe = (token) => call(token, 'getMe');

export const getUpdates = (token) => call(token, 'getUpdates', {
  limit: '100',
  allowed_updates: JSON.stringify(['message', 'channel_post', 'my_chat_member'])
});

export function chatsFromUpdates(updates) {
  const chats = new Map();
  for (const update of updates) {
    const chat = (update.message ?? update.channel_post ?? update.my_chat_member)?.chat;
    if (!chat || chats.has(chat.id)) continue;
    const name = chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username || String(chat.id);
    chats.set(chat.id, { id: String(chat.id), name });
  }
  return [...chats.values()];
}

function cutPoint(text, limit) {
  const code = text.charCodeAt(limit - 1);
  return code >= 0xd800 && code <= 0xdbff ? limit - 1 : limit;
}

function splitText(text) {
  const parts = [];
  let rest = text;
  while (rest.length > TEXT_LIMIT) {
    let cut = rest.lastIndexOf('\n', TEXT_LIMIT);
    if (cut < TEXT_LIMIT / 2) cut = cutPoint(rest, TEXT_LIMIT);
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut).replace(/^\n/, '');
  }
  if (rest) parts.push(rest);
  return parts;
}

const trimCaption = (caption) =>
  caption && caption.length > CAPTION_LIMIT ? caption.slice(0, cutPoint(caption, CAPTION_LIMIT)) : caption;

const baseFields = (settings) => ({
  chat_id: settings.chatId,
  disable_notification: settings.silent ? 'true' : undefined
});

export async function sendText(settings, text) {
  for (const part of splitText(text)) {
    await call(settings.token, 'sendMessage', {
      ...baseFields(settings),
      text: part,
      link_preview_options: settings.noPreview ? JSON.stringify({ is_disabled: true }) : undefined
    });
  }
}

export async function sendFile(settings, kind, blob, filename, caption) {
  if (blob.size > UPLOAD_LIMIT) throw new TelegramError('errTooLarge');

  const upload = (target) => call(settings.token, MEDIA[target].method, {
    ...baseFields(settings),
    caption: trimCaption(caption),
    [MEDIA[target].field]: blob,
    __filename: filename
  });

  if (kind !== 'photo') return upload(kind);
  if (blob.size > PHOTO_UPLOAD_LIMIT) return upload('document');
  try {
    return await upload('photo');
  } catch (error) {
    // Telegram rejects photos with extreme aspect ratios, for example a very thin selection.
    if (error.code === 400 && /PHOTO_/.test(error.description)) return upload('document');
    throw error;
  }
}

function fileNameFor(url, blob) {
  const { protocol, pathname } = new URL(url);
  if (protocol !== 'data:') {
    try {
      const name = decodeURIComponent(pathname.split('/').pop());
      if (name) return name;
    } catch {
      // Malformed escapes fall through to a generated name.
    }
  }
  const extension = (blob.type.split('/')[1] || 'bin').split(/[+;]/)[0];
  return `file.${extension}`;
}

async function download(url) {
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new TelegramError('errDownload');
  }
  if (!response.ok) throw new TelegramError('errDownload');
  if (Number(response.headers.get('content-length')) > UPLOAD_LIMIT) throw new TelegramError('errTooLarge');
  return response.blob();
}

async function canDownload(settings) {
  return settings.directDownload && chrome.permissions.contains({ origins: ['<all_urls>'] });
}

export async function sendFromUrl(settings, kind, url, caption) {
  let protocol = '';
  try {
    protocol = new URL(url).protocol;
  } catch {
    throw new TelegramError('errUnsupportedUrl');
  }

  if (protocol === 'data:') {
    const blob = await download(url);
    return sendFile(settings, kind, blob, fileNameFor(url, blob), caption);
  }
  if (protocol !== 'http:' && protocol !== 'https:') throw new TelegramError('errUnsupportedUrl');

  const { method, field } = MEDIA[kind];
  try {
    return await call(settings.token, method, {
      ...baseFields(settings),
      caption: trimCaption(caption),
      [field]: url
    });
  } catch (error) {
    if (error.code !== 400 || error.key === 'errChat') throw error;
    if (!(await canDownload(settings))) throw new TelegramError('errFetchDisabled');
    const blob = await download(url);
    return sendFile(settings, kind, blob, fileNameFor(url, blob), caption);
  }
}
