import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, watch } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDev } from './build.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const browser = process.argv[2] ?? 'chrome';
const PORT = 35871;
const DEBOUNCE_MS = 150;
const WATCHED = ['src', 'popup', 'options', '_locales', 'manifests', 'icons', 'scripts/dev-client.js'];
const CHECKED = ['src', 'popup', 'options', 'scripts'];
const PAGE_DIRS = ['popup', 'options'];
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

if (browser !== 'chrome' && browser !== 'firefox') {
  console.error('Usage: node scripts/dev.mjs [chrome|firefox]');
  process.exit(1);
}

const clients = new Set();
let buildId = Date.now();

function frame(text) {
  const payload = Buffer.from(text);
  return Buffer.concat([Buffer.from([0x81, payload.length]), payload]);
}

function broadcast(message) {
  for (const socket of clients) socket.write(frame(JSON.stringify(message)));
}

function startReloadServer() {
  const server = createServer((_, response) => response.writeHead(426).end());
  server.on('upgrade', (request, socket) => {
    const accept = createHash('sha1').update(request.headers['sec-websocket-key'] + WS_GUID).digest('base64');
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
    clients.add(socket);
    socket.on('data', () => {});
    socket.on('close', () => clients.delete(socket));
    socket.on('error', () => clients.delete(socket));
    socket.write(frame(JSON.stringify({ type: 'hello', id: buildId })));
  });
  server.on('error', (error) => {
    console.error(`Reload server failed on port ${PORT}: ${error.message}`);
    process.exit(1);
  });
  server.listen(PORT, '127.0.0.1');
}

function startFirefox() {
  const profile = join(root, '.dev-profile', 'firefox');
  // web-ext creates only the last folder, not its parent.
  mkdirSync(dirname(profile), { recursive: true });
  const binary = process.env.FIREFOX_BIN ? ` --firefox "${process.env.FIREFOX_BIN}"` : '';
  const child = spawn(
    `npx --yes web-ext run --source-dir dist/firefox-dev${binary} --firefox-profile "${profile}" --profile-create-if-missing --keep-profile-changes --no-input`,
    { cwd: root, shell: true, stdio: 'inherit' }
  );
  child.on('exit', () => process.exit());
}

function syntaxError() {
  for (const dir of CHECKED) {
    for (const entry of readdirSync(join(root, dir), { recursive: true })) {
      if (!entry.endsWith('.js')) continue;
      const result = spawnSync(process.execPath, ['--check', join(root, dir, entry)], { encoding: 'utf8' });
      if (result.status !== 0) return result.stderr;
    }
  }
  return null;
}

const time = () => new Date().toLocaleTimeString();
let timer;
let building = false;
let pendingFull = false;

async function rebuild() {
  if (building) {
    timer = setTimeout(rebuild, DEBOUNCE_MS);
    return;
  }
  const full = pendingFull;
  pendingFull = false;

  // A broken module would stop the service worker, and with it the reload client.
  const error = syntaxError();
  if (error) {
    console.error(`[${time()}] Syntax error, not reloading:\n${error}`);
    return;
  }

  building = true;
  try {
    await buildDev(browser);
    if (full) buildId = Date.now();
    if (browser === 'chrome') broadcast(full ? { type: 'full', id: buildId } : { type: 'page' });
    console.log(`[${time()}] Rebuilt (${full ? 'extension reload' : 'page reload'})`);
  } catch (buildError) {
    console.error(`[${time()}] Build failed: ${buildError.message}`);
  } finally {
    building = false;
  }
}

function onChange(path, filename) {
  const changed = join(path, filename ?? '');
  const isPage = PAGE_DIRS.some((dir) => changed.startsWith(`${dir}${sep}`));
  pendingFull ||= !isPage;
  clearTimeout(timer);
  timer = setTimeout(rebuild, DEBOUNCE_MS);
}

await buildDev(browser);
for (const path of WATCHED) {
  const absolute = join(root, path);
  if (existsSync(absolute)) watch(absolute, { recursive: true }, (_, filename) => onChange(path, filename));
}

if (browser === 'chrome') {
  startReloadServer();
  console.log(`Watching. Load dist/chrome-dev once as an unpacked extension. Reload server: ws://127.0.0.1:${PORT}`);
} else {
  startFirefox();
  console.log('Watching. web-ext reloads Firefox when dist/firefox-dev changes.');
}
