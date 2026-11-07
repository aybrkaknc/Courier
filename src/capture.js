import { TelegramError } from './telegram.js';

async function capture(windowId) {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(windowId, { format: 'png' });
    return await (await fetch(dataUrl)).blob();
  } catch {
    throw new TelegramError('errRestricted');
  }
}

export const captureVisible = capture;

export async function captureArea(windowId, rect, viewportWidth) {
  const image = await capture(windowId);
  const full = await createImageBitmap(image);
  // Scaling from the captured width also covers page zoom and high-DPI screens.
  const scale = full.width / viewportWidth;

  const x = Math.max(0, Math.round(rect.x * scale));
  const y = Math.max(0, Math.round(rect.y * scale));
  const width = Math.min(full.width - x, Math.round(rect.width * scale));
  const height = Math.min(full.height - y, Math.round(rect.height * scale));

  const canvas = new OffscreenCanvas(width, height);
  canvas.getContext('2d').drawImage(full, x, y, width, height, 0, 0, width, height);
  full.close();
  return canvas.convertToBlob({ type: 'image/png' });
}
