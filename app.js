const API_BASE = (import.meta.env?.VITE_MPLAD_API_BASE || window.MPLAD_API_BASE || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const pageSize = 50;
const resultList = document.querySelector('#resultList');
const drawer = document.querySelector('#detailDrawer');
const drawerContent = document.querySelector('#drawerContent');
const loadMoreButton = document.querySelector('#loadMore');
const map = window.MPLAD_MAP;
const mapLayers = [];
const INDIA_CENTER = [22.5, 79];
let projects = [];
let totalResults = 0;
let nextOffset = 0;
let loading = false;
let facetLoading = false;
let metricsRequest = 0;
let searchTimer;

const formatNumber = (value) => Number.isFinite(Number(value)) ? new Intl.NumberFormat('en-IN').format(Number(value)) : '—';
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
const formatDate = (value) => { if (!value) return 'Not stated in source'; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'UTC' }).format(date); };
const value = (id) => document.querySelector(`#${id}`).value;

async function getJson(path, options) { const response = await fetch(`${API_BASE}${path}`, options); if (!response.ok) throw new Error(`API request failed: ${response.status}`); return response.json(); }

function setCatalogStatus(message, healthy = true) { const status = document.querySelector('#catalogStatus'); status.textContent = message; status.closest('.header-status')?.classList.toggle('error', !healthy); }

function currentQuery() {
  const params = new URLSearchParams();
  const fields = [['query', document.querySelector('#globalSearch').value.trim()], ['house', value('houseFilter')], ['term', value('termFilter')], ['state', value('stateFilter')], ['district', value('districtFilter')], ['constituency', value('constituencyFilter')], ['category', value('categoryFilter')]];
  fields.forEach(([key, item]) => { if (item) params.set(key, item); });
  return params;
}

function fillSelect(id, label, values, selected = '') {
  const select = document.querySelector(`#${id}`);
  select.innerHTML = `<option value="">${escapeHtml(label)}</option>${values.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('')}`;
  if ([...select.options].some((option) => option.value === selected)) select.value = selected;
}

async function loadFacets() {
  if (facetLoading) return;
  facetLoading = true;
  const selected = { house: value('houseFilter'), term: value('termFilter'), state: value('stateFilter'), district: value('districtFilter'), constituency: value('constituencyFilter'), category: value('categoryFilter') };
  try {
    const { data } = await getJson(`/catalog/facets?${currentQuery().toString()}`);
    fillSelect('houseFilter', 'All houses', data.houses, selected.house);
    fillSelect('termFilter', 'All terms', data.terms, selected.term);
    fillSelect('stateFilter', 'All states', data.states, selected.state);
    fillSelect('districtFilter', 'All districts', data.districts, selected.district);
    fillSelect('constituencyFilter', 'All constituencies', data.constituencies || [], selected.constituency);
    fillSelect('categoryFilter', 'All categories', data.categories, selected.category);
  } catch { setCatalogStatus('Source filters unavailable', false); }
  finally { facetLoading = false; }
}

function updateResultsCount() {
  document.querySelector('#resultsCount').textContent = `${formatNumber(totalResults)} works`;
  document.querySelector('#resultsRange').textContent = projects.length ? ` · showing 1–${formatNumber(projects.length)} from the matching source records` : ' · no matching records';
  loadMoreButton.hidden = !projects.length || projects.length >= totalResults;
  loadMoreButton.disabled = loading;
  document.querySelector('#scopeNote').textContent = `${formatNumber(totalResults)} source records match this scope. ${value('districtFilter') ? 'The district filter now uses the source IDA district field, not the block field.' : 'Choose a district to see its complete matching register.'}`;
  loadMoreButton.textContent = projects.length < totalResults ? `Load ${formatNumber(Math.min(pageSize, totalResults - projects.length))} more records ↓` : 'All matching records loaded';
}

function renderResults() {
  if (!projects.length) { resultList.innerHTML = '<div class="empty-state">No source records match these filters.<br /><small>Try clearing the term, house or district filter.</small></div>'; updateResultsCount(); return; }
  resultList.innerHTML = `<div class="result-table-wrap"><table class="result-table"><thead><tr><th>Work</th><th>Location</th><th>House / term</th><th>Status</th><th>Amount</th><th><span class="sr-only">Details</span></th></tr></thead><tbody>${projects.map((project, index) => `<tr tabindex="0" data-index="${index}" aria-label="Open details for ${escapeHtml(project.title)}"><td><strong>${escapeHtml(project.title)}</strong><small>${escapeHtml(project.mp)}</small></td><td><span>${escapeHtml(project.district)}</span><small>${escapeHtml([project.block, project.villageRaw, project.state].filter(Boolean).join(' · '))}</small></td><td><span>${escapeHtml(project.house)}</span><small>${escapeHtml(project.term)}</small></td><td><span class="status-chip"><i></i>${escapeHtml(project.status)}</span><small>${escapeHtml(project.risk)}</small></td><td><strong>${escapeHtml(project.amount)}</strong><small>${escapeHtml(project.category)}</small></td><td><button class="row-action" data-open="${index}" type="button">View <span aria-hidden="true">↗</span></button></td></tr>`).join('')}</tbody></table></div>`;
  resultList.querySelectorAll('tr[data-index]').forEach((row) => { const open = () => openDrawer(Number(row.dataset.index)); row.addEventListener('click', (event) => { if (!event.target.closest('button')) open(); }); row.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } }); });
  resultList.querySelectorAll('[data-open]').forEach((button) => button.addEventListener('click', () => openDrawer(Number(button.dataset.open))));
  updateResultsCount();
}

async function loadCatalog({ append = false } = {}) {
  if (loading) return;
  if (append && nextOffset >= totalResults) return;
  loading = true;
  if (!append) { nextOffset = 0; resultList.innerHTML = '<div class="loading-state">Loading source records…</div>'; }
  const params = currentQuery(); params.set('limit', pageSize); params.set('offset', append ? nextOffset : 0);
  try {
    const payload = await getJson(`/projects?${params.toString()}`);
    projects = append ? [...projects, ...payload.data] : payload.data;
    totalResults = payload.meta.total; nextOffset = payload.meta.offset + payload.meta.count; renderResults();
    setCatalogStatus('Source snapshot connected');
    await refreshMap();
  } catch { projects = []; totalResults = 0; resultList.innerHTML = '<div class="empty-state error-state">The catalog could not be reached.<br /><small>Start the backend API on port 8000 and reload this page.</small></div>'; setCatalogStatus('Catalog unavailable', false); updateResultsCount(); }
  finally { loading = false; loadMoreButton.disabled = false; updateResultsCount(); }
}

async function loadMetrics() {
  const requestId = ++metricsRequest;
  const scope = currentQuery().toString();
  try {
    const { data } = await getJson(`/catalog/metrics?${scope}`);
    if (requestId !== metricsRequest) return;
    document.querySelector('#scopeAllocated').textContent = data.allocatedAmount == null ? 'Not available in snapshot' : `₹${formatNumber(data.allocatedAmount)}`;
    document.querySelector('#scopeUsed').textContent = data.expenditureAmount == null ? 'Not available in snapshot' : `₹${formatNumber(data.expenditureAmount)}`;
    document.querySelector('#scopeRecommended').textContent = formatNumber(data.worksRecommended);
    document.querySelector('#scopeSanctioned').textContent = formatNumber(data.worksSanctioned);
    document.querySelector('#scopeOngoing').textContent = formatNumber(data.worksOngoing);
    document.querySelector('#scopeCompleted').textContent = formatNumber(data.worksCompleted);
    document.querySelector('#scopeMetricsNote').textContent = data.note;
  } catch { document.querySelector('#scopeMetricsNote').textContent = 'Source metrics unavailable.'; }
}

async function loadSummary() {
  try {
    const { data } = await getJson('/catalog/summary');
    document.querySelector('#metricWorks').textContent = formatNumber(data.total); document.querySelector('#metricCompleted').textContent = formatNumber(data.completed); document.querySelector('#metricReview').textContent = formatNumber(data.review); document.querySelector('#metricImages').textContent = data.imageCoverage == null ? 'N/A' : `${data.imageCoverage}%`;
    document.querySelector('#sourceRecords').textContent = formatNumber(data.total); document.querySelector('#sourceCoverage').textContent = data.sourceCoverage == null ? 'N/A' : `${data.sourceCoverage}%`;
    document.querySelector('#sourceUpdated').textContent = `Snapshot through ${formatDate(data.sourceDataThrough)}`; document.querySelector('#sourceDescription').textContent = 'The catalog is source-attributed. The backend eSAKSHI agent can fetch live work reports, dashboard metrics and source attachments into CSV, Supabase and R2.';
  } catch { setCatalogStatus('Catalog unavailable', false); }
}

function initializeMap() {
  if (!map) return;
  map.setView(INDIA_CENTER, 5);
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
}

async function refreshMap() {
  if (!map) return;
  try {
    const { data } = await getJson(`/map/locations?${currentQuery().toString()}`);
    mapLayers.splice(0).forEach((layer) => map.removeLayer(layer));
    if (!data.points.length) { document.querySelector('#mapStatus').textContent = data.message || data.precision; return; }
    const bounds = [];
    data.points.forEach((point) => {
      const marker = window.L.circleMarker([point.lat, point.lon], { radius: Math.min(18, 7 + Math.log10(point.count + 1) * 4), color: '#087F8C', fillColor: '#087F8C', fillOpacity: .82, weight: 2 });
      marker.bindPopup(`<strong>${escapeHtml(point.district)}</strong><br>${formatNumber(point.count)} matching source records<br><small>Approximate district location</small>`).addTo(map); mapLayers.push(marker); bounds.push([point.lat, point.lon]);
    });
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 10 });
    document.querySelector('#mapStatus').textContent = `${formatNumber(data.totalMatches)} matching records · ${data.precision}`;
  } catch { document.querySelector('#mapStatus').textContent = 'Map location service unavailable. The register remains available in the table.'; }
}

function evidenceMarkup(items = []) { return items.map((item) => `<div class="evidence-item"><span>${escapeHtml(item.label)}</span><strong class="evidence-${escapeHtml(item.status)}">${escapeHtml(item.status)}</strong></div>`).join(''); }
function evidenceFilesMarkup(files = []) { return files.map((file) => { const url = /^https:\/\//i.test(file.r2Url || '') ? file.r2Url : ''; const label = file.fileName || file.sourceAttachmentId || file.sha256 || 'source evidence'; if (!url) return `<div class="evidence-file"><span>${escapeHtml(label)}</span><small>${escapeHtml(file.mimeType || 'evidence')} · ${file.status === 'discovered' ? 'analyzed; R2 storage not configured' : 'stored in R2'}</small></div>`; return file.mimeType === 'application/pdf' ? `<div class="evidence-file"><a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">Open PDF: ${escapeHtml(label)} ↗</a><small>${escapeHtml(file.sha256 || '')} · permanent R2 copy</small></div>` : `<figure class="evidence-preview"><img src="${escapeHtml(url)}" alt="Source evidence for project" loading="lazy"><figcaption><a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">Open image ↗</a><small>${escapeHtml(label)} · permanent R2 copy</small></figcaption></figure>`; }).join(''); }
function comparisonMarkup(comparison) { if (!comparison || comparison.status === 'inconclusive') return comparison?.reason ? `<p class="evidence-note">${escapeHtml(comparison.reason)}</p>` : ''; const issues = Array.isArray(comparison.possibleIssues) ? comparison.possibleIssues : []; return `<div class="comparison-result"><strong>Evidence comparison: ${escapeHtml(comparison.consistency || comparison.status)}</strong><p>${escapeHtml(comparison.summary || 'The model returned structured review findings.')}</p>${issues.length ? `<ul>${issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join('')}</ul>` : ''}<small>Confidence: ${comparison.confidence == null ? 'not stated' : escapeHtml(comparison.confidence)} · human review required</small></div>`; }

async function openDrawer(index) {
  const summaryProject = projects[index]; if (!summaryProject) return;
  drawerContent.innerHTML = '<div class="loading-state">Loading source record…</div>'; drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
  try {
    const [{ data: project }, { data: evidence }] = await Promise.all([getJson(`/projects/${summaryProject.id}`), getJson(`/projects/${summaryProject.id}/evidence`)]);
    drawerContent.innerHTML = `<div class="drawer-kicker">MPLADS source record</div><h2 id="drawerTitle">${escapeHtml(project.title)}</h2><p class="drawer-location">${escapeHtml(project.district)} · ${escapeHtml(project.state)}</p><div class="drawer-tags"><span>${escapeHtml(project.house)}</span><span>${escapeHtml(project.term)}</span><span>${escapeHtml(project.status)}</span></div><section class="drawer-section"><h3>Administrative fields</h3><dl class="drawer-fields"><div><dt>MP</dt><dd>${escapeHtml(project.mp)}</dd></div><div><dt>Constituency</dt><dd>${escapeHtml(project.constituency)}</dd></div><div><dt>District</dt><dd>${escapeHtml(project.district)}</dd></div><div><dt>Block</dt><dd>${escapeHtml(project.block)}</dd></div><div><dt>Village</dt><dd>${escapeHtml(project.villageRaw)}</dd></div><div><dt>Allocation</dt><dd>${escapeHtml(project.amount)}</dd></div><div><dt>Recommended</dt><dd>${escapeHtml(formatDate(project.sourceDate))}</dd></div><div><dt>Member type</dt><dd>${escapeHtml(project.memberType)}</dd></div></dl></section><section class="drawer-section"><h3>Evidence and analysis</h3><p class="drawer-explanation">${escapeHtml(project.summary)}</p><div class="evidence-list">${evidenceMarkup(evidence.items)}</div><button id="refreshEvidence" class="ux4g-btn-outline-primary evidence-refresh" type="button">Fetch &amp; analyze source images / PDFs</button><div id="evidenceResult" class="evidence-result" aria-live="polite"></div></section><section class="drawer-section"><h3>Source provenance</h3><p class="drawer-explanation">Record fetched ${escapeHtml(formatDate(project.fetchTimestamp))}. Risk: <strong>${escapeHtml(project.risk)}</strong>. No automated risk score is calculated.</p></section><div class="drawer-actions"><a class="ux4g-btn-primary" href="${escapeHtml(project.sourceUrl)}" target="_blank" rel="noreferrer">Open MPLADS portal ↗</a></div>`;
    drawerContent.querySelector('#refreshEvidence').addEventListener('click', async (event) => { event.currentTarget.disabled = true; document.querySelector('#evidenceResult').innerHTML = '<p>Fetching source attachments, analyzing them against the project record, and saving evidence…</p>'; try { const { data } = await getJson(`/projects/${project.id}/evidence/refresh`, { method: 'POST' }); const persistence = data.persistence?.r2 === 'ready' ? 'R2 persistence enabled.' : 'R2 persistence is not configured yet.'; document.querySelector('#evidenceResult').innerHTML = `<p>${escapeHtml(data.note)} ${escapeHtml(persistence)}</p>${comparisonMarkup(data.comparison)}<div class="evidence-files">${evidenceFilesMarkup(data.files)}</div>`; } catch { document.querySelector('#evidenceResult').textContent = 'The source attachment request could not be completed.'; } finally { event.currentTarget.disabled = false; } });
  } catch { drawerContent.innerHTML = '<div class="empty-state error-state">This source record could not be loaded.</div>'; }
}

function closeDrawer() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }

document.querySelector('#filtersForm').addEventListener('submit', async (event) => { event.preventDefault(); document.querySelector('#explore').scrollIntoView({ behavior: 'smooth', block: 'start' }); await loadCatalog(); await loadMetrics(); });
document.querySelector('#globalSearch').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(async () => { await loadCatalog(); await loadMetrics(); }, 300); });
document.querySelectorAll('#houseFilter, #termFilter, #stateFilter, #districtFilter, #constituencyFilter, #categoryFilter').forEach((select) => select.addEventListener('change', async () => { await loadFacets(); await loadCatalog(); await loadMetrics(); }));
document.querySelector('#clearFilters').addEventListener('click', async () => { document.querySelector('#globalSearch').value = ''; ['houseFilter', 'termFilter', 'stateFilter', 'districtFilter', 'constituencyFilter', 'categoryFilter'].forEach((id) => { document.querySelector(`#${id}`).value = ''; }); await loadFacets(); await loadCatalog(); await loadMetrics(); });
document.querySelector('#loadMore').addEventListener('click', () => loadCatalog({ append: true }));
document.querySelector('#resetMap').addEventListener('click', () => { map?.setView(INDIA_CENTER, 5); refreshMap(); });
document.querySelector('#closeDrawer').addEventListener('click', closeDrawer); document.querySelector('.drawer-backdrop').addEventListener('click', closeDrawer); document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDrawer(); });
document.querySelectorAll('.view-toggle button').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.view-toggle button').forEach((item) => item.classList.remove('active')); button.classList.add('active'); document.querySelector('.workspace-grid').classList.toggle('table-only', button.dataset.view === 'table'); setTimeout(() => map?.invalidateSize(), 50); }));

initializeMap();
Promise.all([loadFacets(), loadSummary(), loadCatalog(), loadMetrics()]);
