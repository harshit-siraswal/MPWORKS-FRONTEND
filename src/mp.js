import 'ux4g-web-components/styles.css';
import 'ux4g-web-components/design-system';
import '../styles.css';
import './site-nav.js';

const API_BASE = (import.meta.env?.VITE_MPLAD_API_BASE || window.MPLAD_API_BASE || 'https://9swhxvuz7b.execute-api.eu-north-1.amazonaws.com/api').replace(/\/$/, '');
const id = new URLSearchParams(location.search).get('id');
const root = document.querySelector('#profile');
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
const number = (value) => Number.isFinite(Number(value)) ? new Intl.NumberFormat('en-IN').format(Number(value)) : '—';
const statusFilters = [
  ['all', 'All work statuses'],
  ['completed', 'Work completed'],
  ['sanctioned', 'Work sanctioned'],
  ['ongoing', 'Work ongoing'],
  ['recommended', 'Work recommended'],
  ['unsanctioned', 'Unsanctioned works']
];

async function get(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
}

function projectRow(project) {
  const feedback = project.publicFeedback?.ratingCount ? ` · public ${esc(project.publicFeedback.averageRating)}/10` : '';
  const evidence = project.attachmentCount ? `${number(project.attachmentCount)} evidence files` : project.evidenceStatus === 'source-pending-index' ? 'Source evidence pending fetch' : 'No evidence indexed';
  const estimate = project.amountEstimate;
  const estimateText = estimate ? `AI estimate: ${esc(estimate.formatted)} · ${esc(estimate.varianceLabel)}` : '';
  return `<tr><td><strong>${esc(project.title)}</strong><small>${esc(project.mp)}</small></td><td>${esc(project.district)}<small>${esc([project.villageRaw, project.state].filter(Boolean).join(' · '))}</small></td><td>${esc(project.house)}<small>${esc(project.term)}</small></td><td>${esc(project.status)}</td><td>${esc(project.amount)}<small>${evidence}</small><small>${estimateText}</small><small>Review index: ${esc(project.riskIndex?.score ?? '—')}/100${feedback}</small></td><td><a class="row-action" href="/project.html?id=${encodeURIComponent(project.id)}">Open record ↗</a></td></tr>`;
}

function tableMarkup(projects) {
  return `<div class="result-table-wrap"><table class="result-table"><thead><tr><th>Work description</th><th>Location</th><th>House / term</th><th>Status</th><th>Amount / evidence</th><th>Record</th></tr></thead><tbody>${projects.map(projectRow).join('') || '<tr><td colspan="6">No source projects matched this work-status filter.</td></tr>'}</tbody></table></div>`;
}

function render(member, projects, meta) {
  const image = member.imageUrl ? `<img class="profile-photo" src="${esc(member.imageUrl)}" alt="Portrait of ${esc(member.name)}" />` : '<div class="profile-photo mp-no-photo">Photo unavailable</div>';
  const credit = member.imageSourceUrl ? `<a class="image-credit" href="${esc(member.imageSourceUrl)}" target="_blank" rel="noreferrer">Image source ↗</a>` : '';
  const statusOptions = statusFilters.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
  root.innerHTML = `<section class="profile-card"><div>${image}${credit}</div><div class="profile-copy"><p class="eyebrow">Member of Parliament</p><h1>${esc(member.name)}</h1><p>${esc(member.state || 'State not stated')}</p><dl class="profile-facts"><div><dt>Works in register</dt><dd>${number(member.projectCount)}</dd></div><div><dt>House</dt><dd>${esc(member.houses?.join(' / ') || 'Not stated')}</dd></div><div><dt>Terms</dt><dd>${esc(member.terms?.join(' / ') || 'Not stated')}</dd></div><div><dt>Constituency</dt><dd>${esc(member.constituencies?.join(' · ') || 'Not stated')}</dd></div></dl></div></section><section class="register-section profile-register"><div class="register-toolbar"><div><p class="eyebrow">Source-backed work history</p><h2 id="profileProjectCount">${number(meta.total)} projects</h2></div><div class="profile-controls"><label class="profile-filter">Filter work <select id="profileStatus" class="ux4g-input">${statusOptions}</select></label><label class="profile-sort">Sort projects <select id="profileSort" class="ux4g-input"><option value="">Source order</option><option value="risk-desc">Highest review index</option><option value="risk-asc">Lowest review index</option><option value="evidence-desc">Most evidence</option></select></label><a class="ux4g-btn-outline-primary" href="/mps.html">Back to MP profiles</a></div></div><div id="profileProjectList" class="register-table">${tableMarkup(projects)}</div></section>`;

  const update = async () => {
    const statusGroup = document.querySelector('#profileStatus')?.value || 'all';
    const sort = document.querySelector('#profileSort')?.value || '';
    const params = new URLSearchParams({ limit: '200' });
    if (statusGroup !== 'all') params.set('statusGroup', statusGroup);
    if (sort) params.set('sort', sort);
    const list = document.querySelector('#profileProjectList');
    if (list) list.innerHTML = '<div class="loading-state">Loading filtered source records…</div>';
    try {
      const response = await get(`/mps/${encodeURIComponent(id)}/projects?${params}`);
      if (list) list.innerHTML = tableMarkup(response.data || []);
      const count = document.querySelector('#profileProjectCount');
      if (count) count.textContent = `${number(response.meta?.total ?? response.data?.length ?? 0)} projects`;
    } catch (error) {
      if (list) list.innerHTML = `<div class="empty-state">${esc(error.message)}</div>`;
    }
  };
  document.querySelector('#profileStatus')?.addEventListener('change', update);
  document.querySelector('#profileSort')?.addEventListener('change', update);
}

async function init() {
  if (!id) { root.innerHTML = '<div class="empty-state">No member was selected.</div>'; return; }
  try {
    const [member, projects] = await Promise.all([get(`/mps/${encodeURIComponent(id)}`), get(`/mps/${encodeURIComponent(id)}/projects?limit=200`)]);
    render(member.data, projects.data, projects.meta);
  } catch (error) { root.innerHTML = `<div class="empty-state">${esc(error.message)}</div>`; }
}

init();
