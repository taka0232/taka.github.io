/*
 * LAN Drop — dependency-free local file drop for Windows and iPhone.
 * Run: node server.js
 */
const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');

const PORT = Number(process.env.PORT) || 8787;
const ROOT = path.join(__dirname, 'public');
const DROP_DIR = path.join(__dirname, 'received');
const MAX_FILE_SIZE = 500 * 1024 * 1024;
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml' };

function safeName(name) {
  return path.basename(name).replace(/[^\p{L}\p{N}._() \-]/gu, '_').slice(0, 180) || 'file';
}
async function uniquePath(name) {
  const ext = path.extname(name), base = path.basename(name, ext);
  let candidate = path.join(DROP_DIR, name), count = 2;
  while (fs.existsSync(candidate)) candidate = path.join(DROP_DIR, `${base} (${count++})${ext}`);
  return candidate;
}
async function files() {
  const entries = await fsp.readdir(DROP_DIR, { withFileTypes: true });
  const result = await Promise.all(entries.filter(e => e.isFile()).map(async e => {
    const stat = await fsp.stat(path.join(DROP_DIR, e.name));
    return { name: e.name, size: stat.size, modified: stat.mtimeMs };
  }));
  return result.sort((a, b) => b.modified - a.modified);
}
function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(body);
}
function localAddresses() {
  return Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => `http://${i.address}:${PORT}`);
}

async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'GET' && url.pathname === '/api/files') return send(res, 200, JSON.stringify(await files()));
  if (req.method === 'POST' && url.pathname === '/api/upload') {
    const originalName = safeName(decodeURIComponent(req.headers['x-file-name'] || 'file'));
    const length = Number(req.headers['content-length'] || 0);
    if (length > MAX_FILE_SIZE) return send(res, 413, JSON.stringify({ error: 'ファイルは500MB以下にしてください。' }));
    const destination = await uniquePath(originalName);
    let written = 0, failed = false;
    const out = fs.createWriteStream(destination, { flags: 'wx' });
    req.on('data', chunk => { written += chunk.length; if (written > MAX_FILE_SIZE) { failed = true; req.destroy(); } });
    req.pipe(out);
    out.on('finish', () => failed ? fsp.unlink(destination).catch(() => {}) : send(res, 201, JSON.stringify({ name: path.basename(destination) })));
    out.on('error', () => send(res, 500, JSON.stringify({ error: '保存に失敗しました。' })));
    return;
  }
  if (req.method === 'GET' && url.pathname.startsWith('/download/')) {
    const name = safeName(decodeURIComponent(url.pathname.slice('/download/'.length)));
    const file = path.join(DROP_DIR, name);
    if (!fs.existsSync(file)) return send(res, 404, 'Not found', 'text/plain');
    res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(name)}` });
    return fs.createReadStream(file).pipe(res);
  }
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  const file = path.resolve(ROOT, `.${requested}`);
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) return send(res, 404, 'Not found', 'text/plain');
  return send(res, 200, await fsp.readFile(file), MIME[path.extname(file)] || 'application/octet-stream');
}

fsp.mkdir(DROP_DIR, { recursive: true }).then(() => http.createServer((req, res) => handler(req, res).catch(error => { console.error(error); send(res, 500, 'Server error', 'text/plain'); })).listen(PORT, '0.0.0.0', () => {
  console.log('\nLAN Drop is ready. Open one of these on your iPhone (same Wi-Fi):');
  localAddresses().forEach(address => console.log(`  ${address}`));
  console.log(`\nReceived files are saved in: ${DROP_DIR}\n`);
}));
