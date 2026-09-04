import 'ux4g-web-components/styles.css';
import 'ux4g-web-components/design-system';
import '../styles.css';
import './site-nav.js';

const API_BASE = (import.meta.env?.VITE_MPLAD_API_BASE || window.MPLAD_API_BASE || 'https://mpworks-api-public.onrender.com/api').replace(/\/$/, '');
const baseLabel = document.querySelector('#apiBaseLabel');
const quickstart = document.querySelector('#quickstartCode');
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[character]));

baseLabel.textContent = API_BASE;
quickstart.textContent = `curl "${API_BASE}/projects?limit=20&offset=0"\n\n# JavaScript\nconst response = await fetch("${API_BASE}/projects?limit=20");\nconst { data, meta } = await response.json();`;

document.querySelector('#copyBase')?.addEventListener('click', async () => {
  const status = document.querySelector('#copyStatus');
  try { await navigator.clipboard.writeText(API_BASE); status.textContent = 'Copied.'; }
  catch { status.textContent = 'Copy unavailable; select the URL above.'; }
  setTimeout(() => { status.textContent = ''; }, 2500);
});

document.querySelectorAll('[data-font]').forEach((button) => button.addEventListener('click', () => {
  const root = document.documentElement;
  const current = Number(root.style.getPropertyValue('--font-scale') || localStorage.getItem('mpworks-font-scale') || 1);
  const next = button.dataset.font === 'increase' ? Math.min(1.25, current + .1) : button.dataset.font === 'decrease' ? Math.max(.85, current - .1) : 1;
  root.style.setProperty('--font-scale', next);
  localStorage.setItem('mpworks-font-scale', String(next));
}));

document.querySelectorAll('.endpoint-try').forEach((button) => button.addEventListener('click', async () => {
  const output = button.nextElementSibling;
  button.disabled = true;
  output.hidden = false;
  output.textContent = 'Requesting...';
  try {
    const response = await fetch(`${API_BASE}${button.dataset.path}`);
    const text = await response.text();
    let payload;
    try { payload = JSON.parse(text); } catch { payload = text; }
    output.textContent = JSON.stringify({ status: response.status, response: payload }, null, 2);
  } catch (error) {
    output.textContent = JSON.stringify({ error: error.message }, null, 2);
  } finally { button.disabled = false; }
}));
