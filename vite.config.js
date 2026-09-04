import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    reportCompressedSize: false,
    rollupOptions: {
      input: {
        dashboard: 'index.html',
        project: 'project.html',
        district: 'district.html',
        works: 'works.html',
        mps: 'mps.html',
        mp: 'mp.html',
        developer: 'developer.html',
      },
    },
  },
});
