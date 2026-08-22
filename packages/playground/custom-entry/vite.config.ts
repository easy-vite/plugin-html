import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createHtmlPlugin } from '@easy-vite/plugin-html'

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  plugins: [
    vue(),
    createHtmlPlugin({
      minify: true,
      entry: 'src/main.ts',
      /**
       * @default index.html
       */
      template: 'static/index.html',
      /**
       * Since v5 the dev-server fallback no longer hardcodes '/static'.
       * List the prefixes that should pass through untouched here.
       */
      staticPathPrefixes: ['/static'],
      inject: {
        data: {
          title: 'index',
          injectScript: `<script src="./inject.js"></script>`,
        },
      },
    }),
  ],
})
