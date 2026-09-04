import 'ux4g-web-components/styles.css';
import 'ux4g-web-components/design-system';
import '../styles.css';
import './site-nav.js';

const DEFAULT_API_BASE = (import.meta.env?.VITE_MPLAD_API_BASE || window.MPLAD_API_BASE || 'https://9swhxvuz7b.execute-api.eu-north-1.amazonaws.com/api').replace(/\/$/, '');
const API_BASE_KEY = 'mpworks-api-base';

const endpoints = [
  { group: 'Essentials', method: 'GET', path: '/health', title: 'Health check', description: 'Confirm that the API is reachable and see its version.' },
  { group: 'Catalog', method: 'GET', path: '/catalog/summary', title: 'Catalog summary', description: 'Read the high-level record count, source coverage and update summary.' },
  { group: 'Catalog', method: 'GET', path: '/catalog/facets', title: 'Filter options', description: 'Load the states, districts, houses, terms and categories used by the explorer.' },
  { group: 'Catalog', method: 'GET', path: '/catalog/metrics', title: 'Scope metrics', description: 'Return recommended, sanctioned, ongoing and completed metrics for a filter scope.', query: [{ key: 'state', value: '' }, { key: 'district', value: '' }] },
  { group: 'Works', method: 'GET', path: '/projects', title: 'Search projects', description: 'Search source-backed work records with filters and pagination.', query: [{ key: 'limit', value: '5' }, { key: 'offset', value: '0' }] },
  { group: 'Works', method: 'GET', path: '/works/recommended', title: 'Recommended works', description: 'List recommended works in a bounded, paginated response.', query: [{ key: 'limit', value: '5' }, { key: 'offset', value: '0' }] },
  { group: 'Works', method: 'GET', path: '/works/completed', title: 'Completed works', description: 'List works whose status is completed or partially completed.', query: [{ key: 'limit', value: '5' }, { key: 'offset', value: '0' }] },
  { group: 'Members', method: 'GET', path: '/mps', title: 'Member directory', description: 'Return paginated, source-backed MP records.', query: [{ key: 'limit', value: '5' }, { key: 'offset', value: '0' }] },
  { group: 'Evidence', method: 'GET', path: '/projects/PROJECT_ID/evidence', displayPath: '/projects/:id/evidence', title: 'Evidence state', description: 'Inspect evidence files, persistence and the current review signal for one project.', query: [{ key: 'PROJECT_ID', value: 'replace-with-project-id', hidden: true }] },
  { group: 'Evidence', method: 'POST', path: '/projects/PROJECT_ID/evidence/refresh', displayPath: '/projects/:id/evidence/refresh', title: 'Queue evidence analysis', description: 'Start evidence retrieval and optional Gemini comparison. The route returns 202 while work is queued.' },
  { group: 'Analysis', method: 'POST', path: '/district-analysis', title: 'Start district analysis', description: 'Queue a district-level evidence analysis. Poll the returned job id for results.', body: { state: 'Madhya Pradesh', district: 'Indore', house: '', term: '' } },
  { group: 'Exports', method: 'GET', path: '/exports/csv', title: 'Export filtered CSV', description: 'Download a filtered project scope as CSV. The response body is shown as text.', query: [{ key: 'limit', value: '5' }, { key: 'offset', value: '0' }] },
  { group: 'Reference', method: 'GET', path: '/methodology', title: 'Methodology', description: 'Read risk language, methods, source metadata and known limitations.' },
  { group: 'Reference', method: 'GET', path: '/source-health', title: 'Source health', description: 'Inspect source freshness and catalog health information.' },
];

const $ = (selector) => document.querySelector(selector);
const endpointList = $('#endpointList');
const searchInput = $('#endpointSearch');
const filterButtons = [...document.querySelectorAll('.api-filter')];
const apiBaseInput = $('#apiBase');
const requestMethod = $('#requestMethod');
const requestPath = $('#requestPath');
const requestBody = $('#requestBody');
const bodyPanel = $('#bodyPanel');
const queryRows = $('#queryRows');
const endpointCount = $('#endpointCount');
const filteredEndpointCount = $('#filteredEndpointCount');
const endpointEmpty = $('#endpointEmpty');
const requestUrlPreview = $('#requestUrlPreview');
const curlPreview = $('#curlPreview');
const responseBody = $('#responseBody');
const responseStatus = $('#responseStatus');
const responseTime = $('#responseTime');
const responseSummary = $('#responseSummary');
const responseHeaders = $('#responseHeaders');
const copyResponseButton = $('#copyResponse');

let activeFilter = 'all';
let selectedEndpoint = endpoints[0];
let lastResponseText = '';

function readStoredBase() {
  try { return localStorage.getItem(API_BASE_KEY) || DEFAULT_API_BASE; } catch { return DEFAULT_API_BASE; }
}

function saveBase(value) {
  try { localStorage.setItem(API_BASE_KEY, value); } catch {}
}

function addText(parent, tag, text, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  parent.append(node);
  return node;
}

function endpointMatches(endpoint) {
  const query = searchInput.value.trim().toLowerCase();
  const haystack = `${endpoint.group} ${endpoint.method} ${endpoint.path} ${endpoint.displayPath || ''} ${endpoint.title} ${endpoint.description}`.toLowerCase();
  return (activeFilter === 'all' || endpoint.method === activeFilter) && (!query || haystack.includes(query));
}

function renderEndpointList() {
  const visible = endpoints.filter(endpointMatches);
  endpointList.replaceChildren();
  visible.forEach((endpoint) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `api-endpoint-card${endpoint === selectedEndpoint ? ' is-selected' : ''}`;
    button.setAttribute('aria-label', `${endpoint.method} ${endpoint.displayPath || endpoint.path}, ${endpoint.title}`);
    button.addEventListener('click', () => selectEndpoint(endpoint));
    const top = document.createElement('span');
    top.className = 'api-endpoint-card-top';
    addText(top, 'span', endpoint.method, `api-method-badge ${endpoint.method.toLowerCase()}`);
    addText(top, 'span', endpoint.group, 'api-endpoint-group');
    button.append(top);
    addText(button, 'code', endpoint.displayPath || endpoint.path, 'api-endpoint-path');
    addText(button, 'strong', endpoint.title, 'api-endpoint-title');
    endpointList.append(button);
  });
  endpointEmpty.hidden = visible.length > 0;
  filteredEndpointCount.textContent = `${visible.length} shown`;
}

function queryEntries() {
  return [...queryRows.querySelectorAll('.api-query-row')].map((row) => ({
    key: row.querySelector('[data-query-key]')?.value.trim() || '',
    value: row.querySelector('[data-query-value]')?.value || '',
  })).filter((entry) => entry.key);
}

function addQueryRow(entry = {}) {
  const row = document.createElement('div');
  row.className = 'api-query-row';
  const keyInput = document.createElement('input');
  keyInput.type = 'text'; keyInput.placeholder = 'key'; keyInput.value = entry.key || '';
  keyInput.dataset.queryKey = 'true'; keyInput.setAttribute('aria-label', 'Query parameter name');
  const valueInput = document.createElement('input');
  valueInput.type = 'text'; valueInput.placeholder = 'value'; valueInput.value = entry.value || '';
  valueInput.dataset.queryValue = 'true'; valueInput.setAttribute('aria-label', `Value for ${entry.key || 'query parameter'}`);
  const removeButton = document.createElement('button');
  removeButton.type = 'button'; removeButton.className = 'api-remove-query'; removeButton.textContent = '×';
  removeButton.setAttribute('aria-label', 'Remove query parameter');
  removeButton.addEventListener('click', () => { row.remove(); updateRequestPreview(); });
  [keyInput, valueInput].forEach((input) => input.addEventListener('input', updateRequestPreview));
  row.append(keyInput, valueInput, removeButton);
  queryRows.append(row);
}

function renderQueryRows(entries = []) {
  queryRows.replaceChildren();
  entries.filter((entry) => !entry.hidden).forEach(addQueryRow);
  if (!entries.some((entry) => !entry.hidden)) addQueryRow();
}

function baseUrl() {
  const raw = apiBaseInput.value.trim() || DEFAULT_API_BASE;
  const base = new URL(raw, window.location.href);
  return `${base.origin}${base.pathname.replace(/\/$/, '')}`;
}

function buildRequestUrl() {
  const url = new URL(`${baseUrl()}${requestPath.value.trim().startsWith('/') ? requestPath.value.trim() : `/${requestPath.value.trim()}`}`);
  queryEntries().forEach(({ key, value }) => { if (value !== '') url.searchParams.set(key, value); });
  return url;
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function updateCurlPreview() {
  let url;
  try { url = buildRequestUrl().toString(); } catch { url = `${apiBaseInput.value.trim() || DEFAULT_API_BASE}${requestPath.value}`; }
  const lines = [`curl --request ${requestMethod.value} ${shellQuote(url)}`, '  --header \'Accept: application/json\''];
  if (requestMethod.value !== 'GET' && requestBody.value.trim()) {
    lines.push(`  --header 'Content-Type: application/json'`, `  --data-raw ${shellQuote(requestBody.value.trim())}`);
  }
  curlPreview.textContent = lines.join(' \\\n');
}

function updateRequestPreview() {
  try { requestUrlPreview.textContent = buildRequestUrl().toString(); }
  catch { requestUrlPreview.textContent = 'Enter a valid API base URL and path'; }
  updateCurlPreview();
}

function selectEndpoint(endpoint) {
  selectedEndpoint = endpoint;
  $('#selectedEndpointGroup').textContent = endpoint.group;
  $('#requestTitle').textContent = endpoint.title;
  $('#selectedEndpointDescription').textContent = endpoint.description;
  $('#requestMethodBadge').textContent = endpoint.method;
  $('#requestMethodBadge').className = `api-method-badge ${endpoint.method.toLowerCase()}`;
  requestMethod.value = endpoint.method;
  requestPath.value = endpoint.path;
  requestBody.value = endpoint.body ? `${JSON.stringify(endpoint.body, null, 2)}\n` : '';
  bodyPanel.hidden = endpoint.method === 'GET';
  renderQueryRows(endpoint.query || []);
  responseSummary.textContent = 'Run a request to see its status, headers and payload here.';
  renderEndpointList();
  updateRequestPreview();
}

function statusClass(status) {
  if (status >= 200 && status < 300) return 'success';
  if (status >= 400) return 'error';
  return 'neutral';
}

function formatPayload(text, contentType) {
  if (!text) return '(empty response body)';
  if (contentType.includes('json')) {
    try { return JSON.stringify(JSON.parse(text), null, 2); } catch {}
  }
  return text;
}

function renderHeaders(headers) {
  responseHeaders.replaceChildren();
  const entries = [...headers.entries()];
  if (!entries.length) {
    const row = document.createElement('div');
    addText(row, 'dt', 'Info'); addText(row, 'dd', 'No response headers were returned.');
    responseHeaders.append(row); return;
  }
  entries.forEach(([name, value]) => {
    const row = document.createElement('div');
    addText(row, 'dt', name); addText(row, 'dd', value); responseHeaders.append(row);
  });
}

function setResponseState(statusText, className, summary) {
  responseStatus.textContent = statusText;
  responseStatus.className = `api-status-chip ${className}`;
  responseSummary.textContent = summary;
}

async function sendRequest(event) {
  event.preventDefault();
  const submitButton = $('#sendRequest');
  let url;
  try { url = buildRequestUrl(); } catch { setResponseState('Invalid URL', 'error', 'Check the API base URL and request path, then try again.'); responseBody.textContent = '// The request was not sent.'; return; }
  if (requestPath.value.includes('PROJECT_ID')) { setResponseState('Missing ID', 'error', 'Replace PROJECT_ID in the path with a real project identifier before sending.'); responseBody.textContent = '// Edit the path before sending this request.'; return; }
  let parsedBody;
  if (requestMethod.value !== 'GET' && requestBody.value.trim()) {
    try { parsedBody = JSON.parse(requestBody.value); } catch { setResponseState('Invalid JSON', 'error', 'The request body is not valid JSON. Fix the syntax before sending.'); responseBody.textContent = '// JSON.parse failed for the request body.'; return; }
  }
  submitButton.disabled = true;
  submitButton.classList.add('is-loading');
  submitButton.querySelector('span').textContent = 'Sending…';
  setResponseState('Waiting', 'neutral', 'The API is processing the request…');
  responseBody.textContent = '// Waiting for response…';
  responseTime.textContent = '…';
  copyResponseButton.disabled = true;
  const started = performance.now();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20_000);
  try {
    const options = { method: requestMethod.value, headers: { Accept: 'application/json' }, signal: controller.signal };
    if (requestMethod.value !== 'GET' && parsedBody !== undefined) { options.headers['Content-Type'] = 'application/json'; options.body = JSON.stringify(parsedBody); }
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';
    let text = '';
    if (/application\/(pdf|octet-stream)|application\/vnd\./i.test(contentType)) {
      const buffer = await response.arrayBuffer();
      text = JSON.stringify({ message: 'Binary response received.', contentType, bytes: buffer.byteLength, contentDisposition: response.headers.get('content-disposition') || null }, null, 2);
    } else text = await response.text();
    lastResponseText = formatPayload(text, contentType);
    responseBody.textContent = lastResponseText;
    renderHeaders(response.headers);
    const duration = Math.round(performance.now() - started);
    responseTime.textContent = `${duration} ms`;
    const size = new Blob([text]).size;
    setResponseState(`${response.status} ${response.statusText || ''}`.trim(), statusClass(response.status), response.ok ? `Request completed · ${size.toLocaleString()} bytes` : `The server returned an error · ${size.toLocaleString()} bytes`);
    copyResponseButton.disabled = !lastResponseText;
  } catch (error) {
    const message = error.name === 'AbortError' ? 'The request timed out after 20 seconds.' : `The browser could not reach the API. ${error.message}`;
    lastResponseText = message;
    responseBody.textContent = `// ${message}`;
    responseTime.textContent = `${Math.round(performance.now() - started)} ms`;
    setResponseState('Network error', 'error', message + ' Check CORS, the base URL and whether the backend is running.');
  } finally {
    window.clearTimeout(timeout);
    submitButton.disabled = false;
    submitButton.classList.remove('is-loading');
    submitButton.querySelector('span').textContent = 'Send request';
  }
}

async function copyText(text, button, successLabel) {
  if (!text) return;
  try { await navigator.clipboard.writeText(text); } catch {
    const fallback = document.createElement('textarea'); fallback.value = text; document.body.append(fallback); fallback.select(); document.execCommand('copy'); fallback.remove();
  }
  const original = button.textContent; button.textContent = successLabel; window.setTimeout(() => { button.textContent = original; }, 1400);
}

document.querySelectorAll('[data-font]').forEach((button) => button.addEventListener('click', () => {
  const root = document.documentElement;
  const current = Number(root.style.getPropertyValue('--font-scale') || localStorage.getItem('mpworks-font-scale') || 1);
  const next = button.dataset.font === 'increase' ? Math.min(1.25, current + .1) : button.dataset.font === 'decrease' ? Math.max(.85, current - .1) : 1;
  root.style.setProperty('--font-scale', next); localStorage.setItem('mpworks-font-scale', String(next));
}));

apiBaseInput.value = readStoredBase();
endpointCount.textContent = `${endpoints.length} endpoints`;
filterButtons.forEach((button) => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  filterButtons.forEach((item) => { const active = item === button; item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', String(active)); });
  renderEndpointList();
}));
searchInput.addEventListener('input', renderEndpointList);
apiBaseInput.addEventListener('input', () => { saveBase(apiBaseInput.value.trim()); updateRequestPreview(); });
$('#resetApiBase').addEventListener('click', () => { apiBaseInput.value = DEFAULT_API_BASE; saveBase(DEFAULT_API_BASE); updateRequestPreview(); });
requestMethod.addEventListener('change', () => { bodyPanel.hidden = requestMethod.value === 'GET'; updateRequestPreview(); });
requestPath.addEventListener('input', updateRequestPreview);
requestBody.addEventListener('input', updateCurlPreview);
$('#addQueryParam').addEventListener('click', () => { addQueryRow(); queryRows.lastElementChild?.querySelector('input')?.focus(); updateRequestPreview(); });
$('#apiRequestForm').addEventListener('submit', sendRequest);
$('#copyCurl').addEventListener('click', () => copyText(curlPreview.textContent, $('#copyCurl'), 'Copied'));
copyResponseButton.addEventListener('click', () => copyText(lastResponseText, copyResponseButton, 'Copied'));

selectEndpoint(selectedEndpoint);
