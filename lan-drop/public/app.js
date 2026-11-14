const list = document.querySelector('#file-list');
const status = document.querySelector('#upload-status');
const input = document.querySelector('#file-input');
const zone = document.querySelector('#drop-zone');
const format = new Intl.NumberFormat('ja-JP', { style: 'unit', unit: 'megabyte', maximumFractionDigits: 1 });
const bytes = value => value < 1024 * 1024 ? `${Math.ceil(value / 1024)} KB` : format.format(value / 1024 / 1024);
async function refresh() { const files = await fetch('/api/files').then(r => r.json()); list.innerHTML = files.length ? files.map(file => `<li><a href="/download/${encodeURIComponent(file.name)}">${escapeHtml(file.name)}</a><small>${bytes(file.size)}</small></li>`).join('') : '<li class="loading">まだファイルはありません。</li>'; }
function escapeHtml(value) { const el = document.createElement('span'); el.textContent = value; return el.innerHTML; }
async function upload(files) { for (const file of files) { status.textContent = `${file.name} を送信中…`; const response = await fetch('/api/upload', { method: 'POST', headers: { 'X-File-Name': encodeURIComponent(file.name), 'Content-Length': file.size }, body: file }); if (!response.ok) { status.textContent = `${file.name} を送信できませんでした。`; return; } } status.textContent = '送信しました。'; refresh(); }
input.addEventListener('change', () => upload(input.files));
['dragenter','dragover'].forEach(type => zone.addEventListener(type, event => { event.preventDefault(); zone.classList.add('over'); }));
['dragleave','drop'].forEach(type => zone.addEventListener(type, event => { event.preventDefault(); zone.classList.remove('over'); }));
zone.addEventListener('drop', event => upload(event.dataTransfer.files));
document.querySelector('#refresh').addEventListener('click', refresh); refresh();
