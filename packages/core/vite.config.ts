import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    minify: false,
    sourcemap: true,
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
        '@rollup/pluginutils',
        'connect-history-api-fallback',
        'pathe',
        'tinyglobby',
        'node:fs',
        'node:fs/promises',
      ],
    },
  },
})
