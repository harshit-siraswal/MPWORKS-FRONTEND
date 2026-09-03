import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        dashboard: 'index.html',
        project: 'project.html',
      },
    },
  },
});
