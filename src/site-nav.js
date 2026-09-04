const links = [
  ['Dashboard', '/'],
  ['Recommended works', '/works.html?kind=recommended'],
  ['Completed works', '/works.html?kind=completed'],
  ['MP profiles', '/mps.html'],
  ['Developer API', '/developer.html'],
  ['Methodology', '/#methodology'],
  ['Official eSAKSHI ↗', 'https://mplads.mospi.gov.in/digigov/dashboard.html']
];

function activeFor(path, search) {
  if (path === '/' || path.endsWith('/index.html')) return 'Dashboard';
  if (path.endsWith('/works.html')) return new URLSearchParams(search).get('kind') === 'completed' ? 'Completed works' : 'Recommended works';
  if (path.endsWith('/mps.html') || path.endsWith('/mp.html')) return 'MP profiles';
  return '';
}

export function normalizeSiteNavigation() {
  const nav = document.querySelector('.primary-nav .nav-inner');
  if (!nav) return;
  const active = activeFor(location.pathname, location.search);
  const items = links.map(([label, href]) => `<a${label === active ? ' class="active"' : ''} href="${href}"${label.startsWith('Official') ? ' target="_blank" rel="noreferrer"' : ''}>${label}</a>`).join('');
  nav.innerHTML = `${items}<span class="nav-status"><i id="statusDot"></i><span id="catalogStatus">Connecting to source…</span></span>`;
}

normalizeSiteNavigation();
