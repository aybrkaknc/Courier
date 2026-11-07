import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const SOURCES = ['src', 'popup', 'options', '_locales'];
const ICON_SIZES = [16, 32, 48, 128];

const readJson = async (path) => JSON.parse(await readFile(join(root, path), 'utf8'));

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  }));
  return nested.flat().sort();
}

async function zipDirectory(dir, target) {
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const file of await listFiles(dir)) {
    const name = Buffer.from(relative(dir, file).split(sep).join('/'));
    const data = await readFile(file);
    const packed = deflateRawSync(data);
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(0x21, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(packed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);

    locals.push(local, name, packed);
    centrals.push(central, name);
    offset += local.length + name.length + packed.length;
  }

  const centralData = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(centrals.length / 2, 8);
  end.writeUInt16LE(centrals.length / 2, 10);
  end.writeUInt32LE(centralData.length, 12);
  end.writeUInt32LE(offset, 16);

  await writeFile(target, Buffer.concat([...locals, centralData, end]));
}

function iconEntries() {
  const icons = {};
  for (const size of ICON_SIZES) {
    const path = `icons/icon-${size}.png`;
    if (existsSync(join(root, path))) icons[size] = path;
  }
  return icons;
}

async function addChromeDevClient(out, manifest) {
  await cp(join(root, 'scripts/dev-client.js'), join(out, 'src/dev-client.js'));
  await writeFile(join(out, 'src/dev-background.js'), "import './dev-client.js';\nimport './background.js';\n");
  manifest.background = { ...manifest.background, service_worker: 'src/dev-background.js' };
  manifest.permissions = [...manifest.permissions, 'tabs'];
  manifest.host_permissions = [...manifest.host_permissions, 'http://127.0.0.1/*'];
}

export async function buildDev(browser) {
  return build(browser, await readJson('manifests/base.json'), true);
}

async function build(browser, base, dev = false) {
  const out = join(dist, dev ? `${browser}-dev` : browser);
  await mkdir(out, { recursive: true });
  for (const source of SOURCES) await cp(join(root, source), join(out, source), { recursive: true });

  const manifest = { ...base, ...(await readJson(`manifests/${browser}.json`)) };
  if (dev && browser === 'chrome') await addChromeDevClient(out, manifest);
  const icons = iconEntries();
  if (Object.keys(icons).length) {
    await cp(join(root, 'icons'), join(out, 'icons'), { recursive: true });
    manifest.icons = icons;
    manifest.action = { ...manifest.action, default_icon: icons };
  }

  await writeFile(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
  if (dev) return;
  await zipDirectory(out, join(dist, `${browser}.zip`));
  console.log(`Built dist/${browser} and dist/${browser}.zip`);
}

const isMain = resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
if (isMain) {
  const base = await readJson('manifests/base.json');
  for (const browser of ['chrome', 'firefox']) {
    await rm(join(dist, browser), { recursive: true, force: true });
    await build(browser, base);
  }
}
