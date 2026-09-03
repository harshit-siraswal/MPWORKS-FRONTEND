const API_BASE = (window.MPLAD_API_BASE || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const pageSize = 12;
const resultList = document.querySelector('#resultList');
const drawer = document.querySelector('#detailDrawer');
const drawerContent = document.querySelector('#drawerContent');
const loadMoreButton = document.querySelector('#loadMore');
let projects = [];
let totalResults = 0;
let nextOffset = 0;
let loading = false;
let searchTimer;

const formatNumber = (value) => Number.isFinite(Number(value)) ? new Intl.NumberFormat('en-IN').format(Number(value)) : '—';
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
const selectedValue = (id) => document.querySelector(`#${id}`).value;

async function getJson(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
}

function setCatalogStatus(message, healthy = true) {
  const status = document.querySelector('#catalogStatus');
  status.innerHTML = `<span class="live-dot"></span><span>${escapeHtml(message)}</span>`;
  status.classList.toggle('catalog-error', !healthy);
}

function setMetric(id, value) { document.querySelector(`#${id}`).textContent = value; }

function formatDate(value) {
  if (!value) return 'Not stated in source';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}

function populateSelect(id, label, values) {
  const select = document.querySelector(`#${id}`);
  select.innerHTML = `<option>${label}</option>${values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}`;
}

function updateResultsCount() {
  document.querySelector('#resultsCount').textContent = `${formatNumber(totalResults)} works`;
  document.querySelector('#contextCount').textContent = formatNumber(totalResults);
  loadMoreButton.hidden = !projects.length || projects.length >= totalResults;
  loadMoreButton.disabled = loading;
}

function renderResults() {
  if (!projects.length) {
    resultList.innerHTML = '<div class="empty-state">No works match the current search.<br /><small>Try a district, MP, or village name, or clear the filters.</small></div>';
    updateResultsCount();
    return;
  }
  resultList.innerHTML = projects.map((project, index) => `<article class="result-card ux4g-card ux4g-card-outline ux4g-card-vertical" data-index="${index}" tabindex="0" role="button" aria-label="Open details for ${escapeHtml(project.title)}">
    <div class="result-meta"><span class="result-status review"><i class="status-dot"></i>${escapeHtml(project.status)}</span><span>${escapeHtml(formatDate(project.updated))}</span></div>
    <h3>${escapeHtml(project.title)}</h3><div class="result-location">⌖ ${escapeHtml(project.location)}</div>
    <span class="risk-badge"><i class="risk-swatch medium"></i>${escapeHtml(project.risk)}</span>
    <div class="result-footer"><strong>${escapeHtml(project.amount)}</strong><span>·</span><span>${escapeHtml(project.category)}</span><span class="evidence-count">◉ ${escapeHtml(project.evidence)}</span></div>
  </article>`).join('');
  resultList.querySelectorAll('.result-card').forEach((card) => {
    const open = () => openDrawer(Number(card.dataset.index));
    card.addEventListener('click', open);
    card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
  });
  updateResultsCount();
}

function currentQuery() {
  const params = new URLSearchParams();
  const query = document.querySelector('#globalSearch').value.trim();
  if (query) params.set('query', query);
  if (selectedValue('stateFilter') !== 'All states') params.set('state', selectedValue('stateFilter'));
  if (selectedValue('districtFilter') !== 'All districts') params.set('district', selectedValue('districtFilter'));
  if (selectedValue('categoryFilter') !== 'All categories') params.set('category', selectedValue('categoryFilter'));
  return params;
}

async function loadCatalog({ append = false } = {}) {
  if (loading) return;
  loading = true;
  loadMoreButton.disabled = true;
  if (!append) {
    nextOffset = 0;
    resultList.innerHTML = '<div class="empty-state">Loading live source records…</div>';
  }
  const params = currentQuery();
  params.set('limit', pageSize);
  params.set('offset', append ? nextOffset : 0);
  try {
    const payload = await getJson(`/projects?${params.toString()}`);
    projects = append ? [...projects, ...payload.data] : payload.data;
    totalResults = payload.meta.total;
    nextOffset = payload.meta.offset + payload.meta.count;
    renderResults();
    setCatalogStatus('Source snapshot connected');
  } catch {
    projects = [];
    totalResults = 0;
    resultList.innerHTML = '<div class="empty-state error-state">The live catalog could not be reached.<br /><small>Start the backend API on port 8000 and reload this page.</small></div>';
    setCatalogStatus('Live catalog unavailable', false);
    updateResultsCount();
  } finally {
    loading = false;
    loadMoreButton.disabled = false;
    updateResultsCount();
  }
}

async function loadSummary() {
  try {
    const { data } = await getJson('/catalog/summary');
    setMetric('metricWorks', formatNumber(data.total));
    setMetric('metricCompleted', formatNumber(data.completed));
    setMetric('metricReview', formatNumber(data.review));
    setMetric('metricImages', data.imageCoverage == null ? 'N/A' : `${data.imageCoverage}%`);
    document.querySelector('#metricWorksFoot').textContent = 'Records parsed from source snapshot';
    document.querySelector('#metricCompletedFoot').textContent = 'Status value retained from source';
    document.querySelector('#metricReviewFoot').textContent = 'Manual verification required by design';
    document.querySelector('#metricImagesFoot').textContent = data.imageCoverage == null ? 'Not reported by source snapshot' : 'Source-reported image coverage';
    document.querySelector('#sourceCoverage').textContent = data.sourceCoverage == null ? 'N/A' : `${data.sourceCoverage}%`;
    document.querySelector('#sourceUpdated').textContent = formatDate(data.lastUpdated);
    document.querySelector('#contextCount').textContent = formatNumber(data.total);
  } catch { setCatalogStatus('Live catalog unavailable', false); }
}

async function loadFacets() {
  try {
    const { data } = await getJson('/catalog/facets');
    populateSelect('stateFilter', 'All states', data.states);
    populateSelect('districtFilter', 'All districts', data.districts);
    populateSelect('categoryFilter', 'All categories', data.categories);
  } catch { setCatalogStatus('Source filters unavailable', false); }
}

async function openDrawer(index) {
  const summaryProject = projects[index];
  if (!summaryProject) return;
  drawerContent.innerHTML = '<div class="empty-state">Loading source record…</div>';
  drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
  try {
    const [{ data: project }, { data: evidence }] = await Promise.all([getJson(`/projects/${summaryProject.id}`), getJson(`/projects/${summaryProject.id}/evidence`)]);
    const evidenceRows = evidence.items.map((item) => `<div class="drawer-field"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.status)}</strong></div>`).join('');
    drawerContent.innerHTML = `<div class="drawer-kicker">Source record · ${escapeHtml(project.id)}</div>
      <h2 id="drawerTitle">${escapeHtml(project.title)}</h2><div class="drawer-location">⌖ ${escapeHtml(project.location)}</div>
      <div class="drawer-status-row"><span class="result-status review"><i class="status-dot"></i>${escapeHtml(project.status)}</span><span class="drawer-score">${project.score == null ? 'No score calculated' : `Priority score ${escapeHtml(project.score)}/100`}</span></div>
      <section class="drawer-section"><h3>Declared project</h3><div class="drawer-fields"><div class="drawer-field"><span>MP</span><strong>${escapeHtml(project.mp)}</strong></div><div class="drawer-field"><span>Category</span><strong>${escapeHtml(project.category)}</strong></div><div class="drawer-field"><span>Allocation</span><strong>${escapeHtml(project.amount)}</strong></div><div class="drawer-field"><span>Source date</span><strong>${escapeHtml(formatDate(project.sourceDate))}</strong></div></div></section>
      <section class="drawer-section"><h3>Review context</h3><div class="signal"><span class="signal-icon">!</span><div><h4>${escapeHtml(project.risk)}</h4><p>${escapeHtml(project.summary)}</p></div></div><div class="signal"><span class="signal-icon">◌</span><div><h4>Transparent limitation</h4><p>Missing evidence is reported as a gap, not a conclusion. No automated signals are calculated for this source snapshot.</p></div></div></section>
      <section class="drawer-section"><h3>Available evidence</h3><div class="drawer-fields">${evidenceRows}</div></section>
      <div class="drawer-actions"><a class="secondary ux4g-btn-outline-primary ux4g-btn-sm" href="${escapeHtml(project.sourceUrl)}" target="_blank" rel="noreferrer">Open source ↗</a><button class="ux4g-btn-primary ux4g-btn-sm" data-report>Report this project</button></div>`;
    drawerContent.querySelector('[data-report]').addEventListener('click', () => {
      drawerContent.querySelector('[data-report]').textContent = 'Use public moderation flow next';
    });
  } catch {
    drawerContent.innerHTML = '<div class="empty-state error-state">This source record could not be loaded.</div>';
  }
}

function closeDrawer() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }

document.querySelector('#globalSearch').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => loadCatalog(), 250); });
document.querySelector('#searchButton').addEventListener('click', () => { document.querySelector('#explore').scrollIntoView({ behavior: 'smooth' }); loadCatalog(); });
document.querySelector('#closeDrawer').addEventListener('click', closeDrawer);
document.querySelector('.drawer-backdrop').addEventListener('click', closeDrawer);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDrawer(); });
document.querySelectorAll('.quick-action').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.quick-action').forEach((item) => item.classList.remove('active')); button.classList.add('active');
  const input = document.querySelector('#globalSearch');
  if (button.dataset.mode === 'village') { input.placeholder = 'Try a village name, even without map geometry…'; input.focus(); }
  else if (button.dataset.mode === 'select') { input.placeholder = 'Search by MP, district, area, or village name…'; document.querySelector('#stateFilter').focus(); }
  else { input.placeholder = 'Search by MP, district, area, or village name…'; document.querySelector('.map-panel').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
}));
document.querySelectorAll('.view-button').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.view-button').forEach((item) => item.classList.remove('active')); button.classList.add('active');
  document.querySelector('.workspace-grid').classList.toggle('table-mode', button.dataset.view === 'table');
}));
document.querySelectorAll('#stateFilter, #districtFilter, #categoryFilter').forEach((select) => select.addEventListener('change', () => loadCatalog()));
document.querySelector('#clearFilters').addEventListener('click', () => { document.querySelector('#globalSearch').value = ''; document.querySelectorAll('select').forEach((select) => { select.selectedIndex = 0; }); loadCatalog(); });
document.querySelectorAll('.risk-option').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.risk-option').forEach((item) => item.classList.remove('selected')); button.classList.add('selected'); }));
loadMoreButton.addEventListener('click', () => loadCatalog({ append: true }));

Promise.all([loadFacets(), loadSummary(), loadCatalog()]);
