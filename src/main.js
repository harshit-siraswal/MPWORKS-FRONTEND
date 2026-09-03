import 'ux4g-web-components/styles.css';
import 'ux4g-web-components/design-system';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles.css';
const mapElement = document.querySelector('#mapCanvas');
window.L = L;
window.MPLAD_MAP = mapElement ? L.map(mapElement, { zoomControl: true, scrollWheelZoom: true, attributionControl: true }) : null;
await import('../app.js');
