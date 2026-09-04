import 'ux4g-web-components/styles.css';
import 'ux4g-web-components/design-system';
import '../styles.css';
import './site-nav.js';

const API_BASE = (import.meta.env?.VITE_MPLAD_API_BASE || window.MPLAD_API_BASE || 'https://9swhxvuz7b.execute-api.eu-north-1.amazonaws.com/api').replace(/\/$/, '');
const pageSize = 24;
let offset = 0;
let total = 0;
let loading = false;
const $ = (id) => document.querySelector(`#${id}`);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
const number = (value) => Number.isFinite(Number(value)) ? new Intl.NumberFormat('en-IN').format(Number(value)) : '—';
async function get(path) { const response = await fetch(`${API_BASE}${path}`); if (!response.ok) throw new Error(`API request failed: ${response.status}`); return response.json(); }
function card(member) {
  const image = member.imageUrl ? `<img src="${esc(member.imageUrl)}" alt="Portrait of ${esc(member.name)}" loading="lazy" />` : '<div class="mp-no-photo" aria-hidden="true">Photo unavailable</div>';
  const credit = member.imageSourceUrl ? `<a class="image-credit" href="${esc(member.imageSourceUrl)}" target="_blank" rel="noreferrer">Image source ↗</a>` : '';
  return `<article class="mp-card">${image}<div class="mp-card-body"><p class="eyebrow">${esc(member.state || 'State not stated')}</p><h2>${esc(member.name)}</h2><p>${esc(member.constituencies?.slice(0, 2).join(' · ') || 'Constituency not stated')}</p><div class="mp-card-meta"><span>${number(member.projectCount)} works</span><span>${esc(member.houses?.join(' / ') || 'House not stated')}</span></div><div class="mp-card-actions"><a class="ux4g-btn-outline-primary" href="/mp.html?id=${encodeURIComponent(member.id)}">Open profile ↗</a>${credit}</div></div></article>`;
}
async function load(append = false) {
  if (loading) return;
  loading = true;
  if (!append) { offset = 0; $('mpGrid').innerHTML = '<div class="loading-state">Loading source members…</div>'; }
  const params = new URLSearchParams({ limit: String(pageSize), offset: String(append ? offset : 0) });
  const query = $('query').value.trim(); if (query) params.set('query', query);
  try {
    const payload = await get(`/mps?${params}`);
    const cards = payload.data.map(card).join('');
    $('mpGrid').innerHTML = append ? `${$('mpGrid').innerHTML}${cards}` : (cards || '<div class="empty-state">No source-backed members match this search.</div>');
    total = payload.meta.total; offset = payload.meta.offset + payload.meta.count;
    $('mpCount').textContent = `${number(total)} source-backed member records`;
    $('loadMore').hidden = !payload.meta.hasMore;
  } catch (error) { $('mpGrid').innerHTML = `<div class="empty-state">${esc(error.message)}</div>`; $('loadMore').hidden = true; }
  finally { loading = false; }
}
function setScale() { const root = document.documentElement; root.style.setProperty('--font-scale', Number(localStorage.getItem('mpworks-font-scale') || 1)); document.querySelectorAll('[data-font]').forEach((button) => button.addEventListener('click', () => { const current = Number(root.style.getPropertyValue('--font-scale') || 1); const next = button.dataset.font === 'increase' ? Math.min(1.25, current + .1) : button.dataset.font === 'decrease' ? Math.max(.85, current - .1) : 1; root.style.setProperty('--font-scale', next); localStorage.setItem('mpworks-font-scale', next); })); }
$('mpSearch').addEventListener('submit', (event) => { event.preventDefault(); load(); });
$('loadMore').addEventListener('click', () => load(true));
setScale();
load();
