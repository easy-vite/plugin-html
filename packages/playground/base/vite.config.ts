import { defineConfig } from 'vite'
import { createHtmlPlugin } from '@easy-vite/plugin-html'

export default defineConfig({
  // Served under http://localhost:5173/app/ — verifies that the injected
  // entry script survives a non-root base in both dev and build.
  base: '/app/',
  plugins: [
    createHtmlPlugin({
      minify: true,
      entry: 'src/main.ts',
      inject: {
        data: {
          title: 'base-playground',
        },
      },
    }),
  ],
})
