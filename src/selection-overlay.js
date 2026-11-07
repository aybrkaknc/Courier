(() => {
  const OVERLAY_ID = 'courier-overlay';
  const MIN_SIZE = 5;

  document.getElementById(OVERLAY_ID)?.remove();

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483647;cursor:crosshair;background:rgba(0,0,0,.35);touch-action:none;';

  const hint = document.createElement('div');
  hint.textContent = window.courierOverlayHint;
  hint.style.cssText = 'all:initial;position:fixed;top:16px;left:50%;transform:translateX(-50%);padding:8px 12px;border-radius:6px;background:#1f2937;color:#fff;font:14px system-ui,sans-serif;pointer-events:none;';

  const box = document.createElement('div');
  box.style.cssText = 'all:initial;position:fixed;display:none;border:2px solid #fff;box-sizing:border-box;box-shadow:0 0 0 100vmax rgba(0,0,0,.35);pointer-events:none;';

  overlay.append(hint, box);

  let start = null;
  let rect = null;

  function close() {
    overlay.remove();
    window.removeEventListener('keydown', onKeyDown, true);
  }

  function onKeyDown(event) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    close();
  }

  overlay.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    overlay.setPointerCapture(event.pointerId);
    start = { x: event.clientX, y: event.clientY };
    overlay.style.background = 'transparent';
    hint.style.display = 'none';
    box.style.display = 'block';
  });

  overlay.addEventListener('pointermove', (event) => {
    if (!start) return;
    rect = {
      x: Math.min(start.x, event.clientX),
      y: Math.min(start.y, event.clientY),
      width: Math.abs(event.clientX - start.x),
      height: Math.abs(event.clientY - start.y)
    };
    box.style.left = `${rect.x}px`;
    box.style.top = `${rect.y}px`;
    box.style.width = `${rect.width}px`;
    box.style.height = `${rect.height}px`;
  });

  overlay.addEventListener('pointerup', () => {
    if (!start) return;
    close();
    if (!rect || rect.width < MIN_SIZE || rect.height < MIN_SIZE) return;

    // Wait until the browser has painted the page without the overlay.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      chrome.runtime.sendMessage({ type: 'area-selected', rect, viewportWidth: window.innerWidth });
    }));
  });

  window.addEventListener('keydown', onKeyDown, true);
  document.documentElement.append(overlay);
})();
