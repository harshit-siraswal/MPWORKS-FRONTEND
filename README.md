# MPLAD Intelligence frontend

This is the first static frontend slice for the MPLAD Fraud + Inefficiency Intelligence product. It currently prototypes the public discovery path: search, location filters, evidence-aware results, map/list parity, and a source-backed project detail drawer.

## Run locally

From this directory:

```powershell
python -m http.server 4173
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173).

The frontend reads catalog, facet, summary, and evidence data from the local backend API. It contains no fallback records: if the API is unavailable, the UI shows a clear unavailable state instead of inventing content.

The interface uses the official `ux4g-web-components` package for UX4G Design System 3.0-compatible styles and component classes, with a small project-specific layer for the evidence-first public works experience.

The `/developer.html` page documents the implemented backend API, shows integration examples, and includes safe live GET checks for the health, catalog, facets and metrics endpoints. It reads the same `VITE_MPLAD_API_BASE` value used by the rest of the frontend.
