import 'ux4g-web-components/styles.css';
import 'ux4g-web-components/design-system';
import '../styles.css';

const API_BASE = (import.meta.env?.VITE_MPLAD_API_BASE || window.MPLAD_API_BASE || 'https://9swhxvuz7b.execute-api.eu-north-1.amazonaws.com/api').replace(/\/$/, '');
const id = new URLSearchParams(location.search).get('id');
const root = document.querySelector('#profile');
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
const number = (value) => Number.isFinite(Number(value)) ? new Intl.NumberFormat('en-IN').format(Number(value)) : '—';
async function get(path) { const response = await fetch(`${API_BASE}${path}`); if (!response.ok) throw new Error(`API request failed: ${response.status}`); return response.json(); }
function projectRow(project) { return `<tr><td><strong>${esc(project.title)}</strong><small>${esc(project.mp)}</small></td><td>${esc(project.district)}<small>${esc([project.villageRaw, project.state].filter(Boolean).join(' · '))}</small></td><td>${esc(project.house)}<small>${esc(project.term)}</small></td><td>${esc(project.status)}</td><td>${esc(project.amount)}<small>${number(project.attachmentCount)} evidence files</small></td><td><a class="row-action" href="/project.html?id=${encodeURIComponent(project.id)}">Open record ↗</a></td></tr>`; }
function render(member, projects, meta) {
  const image = member.imageUrl ? `<img class="profile-photo" src="${esc(member.imageUrl)}" alt="Portrait of ${esc(member.name)}" />` : '<div class="profile-photo mp-no-photo">Photo unavailable</div>';
  const credit = member.imageSourceUrl ? `<a class="image-credit" href="${esc(member.imageSourceUrl)}" target="_blank" rel="noreferrer">Image source ↗</a>` : '';
  root.innerHTML = `<section class="profile-card"><div>${image}${credit}</div><div class="profile-copy"><p class="eyebrow">Member of Parliament</p><h1>${esc(member.name)}</h1><p>${esc(member.state || 'State not stated')}</p><dl class="profile-facts"><div><dt>Works in register</dt><dd>${number(member.projectCount)}</dd></div><div><dt>House</dt><dd>${esc(member.houses?.join(' / ') || 'Not stated')}</dd></div><div><dt>Terms</dt><dd>${esc(member.terms?.join(' / ') || 'Not stated')}</dd></div><div><dt>Constituency</dt><dd>${esc(member.constituencies?.join(' · ') || 'Not stated')}</dd></div></dl></div></section><section class="register-section profile-register"><div class="register-toolbar"><div><p class="eyebrow">Source-backed work history</p><h2>${number(meta.total)} projects</h2></div><a class="ux4g-btn-outline-primary" href="/mps.html">Back to MP profiles</a></div><div class="register-table"><div class="result-table-wrap"><table class="result-table"><thead><tr><th>Work description</th><th>Location</th><th>House / term</th><th>Status</th><th>Amount / evidence</th><th>Record</th></tr></thead><tbody>${projects.map(projectRow).join('') || '<tr><td colspan="6">No source projects were found for this member.</td></tr>'}</tbody></table></div></div></section>`;
}
async function init() {
  if (!id) { root.innerHTML = '<div class="empty-state">No member was selected.</div>'; return; }
  try { const [member, projects] = await Promise.all([get(`/mps/${encodeURIComponent(id)}`), get(`/mps/${encodeURIComponent(id)}/projects?limit=200`)]); render(member.data, projects.data, projects.meta); }
  catch (error) { root.innerHTML = `<div class="empty-state">${esc(error.message)}</div>`; }
}
init();
