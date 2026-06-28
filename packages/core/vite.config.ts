import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    minify: false,
    sourcemap: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rolldownOptions: {
      external: [
        'vite',
        'ejs',
        'html-minifier-terser',
        'node-html-parser',
        'connect-history-api-fallback',
        'tinyglobby',
        'node:fs',
        'node:fs/promises',
        'node:path',
      ],
    },
  },
})
