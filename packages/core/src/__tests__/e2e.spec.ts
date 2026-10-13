import { build, createServer } from 'vite'
import type { ViteDevServer } from 'vite'
import { createHtmlPlugin } from '../index'
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, test } from 'vitest'

const fixtureRoots: string[] = []
const devServers: ViteDevServer[] = []

afterAll(async () => {
  await Promise.all(devServers.map((s) => s.close().catch(() => {})))
  await Promise.all(
    fixtureRoots.map((root) =>
      rm(root, {
        recursive: true,
        force: true,
      }),
    ),
  )
})

async function makeFixture(files: Record<string, string>) {
  const root = await mkdtemp(path.join(tmpdir(), 'plugin-html-e2e-'))
  fixtureRoots.push(root)
  for (const [file, content] of Object.entries(files)) {
    const abs = path.join(root, file)
    await mkdir(path.dirname(abs), {
      recursive: true,
    })
    await writeFile(abs, content)
  }
  return root
}

const EJS_HTML = `<!DOCTYPE html>
<html>
  <head><title><%= title %></title></head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`

const SPA_HTML = `<!DOCTYPE html>
<html>
  <head><title>app</title></head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`

const MAIN_TS = `document.getElementById('app').textContent = 'ok'`

describe('e2e: build', () => {
  test('renders EJS, strips the template entry and injects the hashed asset', async () => {
    const root = await makeFixture({
      'index.html': EJS_HTML,
      'src/main.ts': MAIN_TS,
    })
    await build({
      root,
      logLevel: 'error',
      plugins: [
        createHtmlPlugin({
          entry: 'src/main.ts',
          inject: {
            data: {
              title: 'e2e-title',
            },
          },
        }),
      ],
      build: {
        outDir: 'dist',
      },
    })
    const html = await readFile(path.join(root, 'dist/index.html'), 'utf8')
    expect(html).toContain('<title>e2e-title</title>')
    // the template's own module script is replaced by the injected entry
    expect(html).not.toContain('/src/main.ts')
    expect(html).toMatch(/<script type="module"[^>]*src="\/assets\/index-[\w-]+\.js"/)
  }, 30_000)

  test('prefixes the injected entry with a non-root base', async () => {
    const root = await makeFixture({
      'index.html': SPA_HTML,
      'src/main.ts': MAIN_TS,
    })
    await build({
      root,
      base: '/app/',
      logLevel: 'error',
      plugins: [
        createHtmlPlugin({
          entry: 'src/main.ts',
        }),
      ],
      build: {
        outDir: 'dist',
      },
    })
    const html = await readFile(path.join(root, 'dist/index.html'), 'utf8')
    expect(html).toMatch(/<script type="module"[^>]*src="\/app\/assets\/index-[\w-]+\.js"/)
  }, 30_000)

  test('outputs every MPA page at the bundle root', async () => {
    const root = await makeFixture({
      'index.html': '<html><body>home <%= page %></body></html>',
      'other.html': '<html><body>other</body></html>',
    })
    await build({
      root,
      logLevel: 'error',
      plugins: [
        createHtmlPlugin({
          pages: [
            {
              filename: 'index.html',
              template: 'index.html',
              inject: {
                data: {
                  page: 'home-data',
                },
              },
            },
            {
              filename: 'other.html',
              template: 'other.html',
            },
          ],
        }),
      ],
      build: {
        outDir: 'dist',
      },
    })
    const index = await readFile(path.join(root, 'dist/index.html'), 'utf8')
    const other = await readFile(path.join(root, 'dist/other.html'), 'utf8')
    expect(index).toContain('home-data')
    expect(other).toContain('other')
  }, 30_000)

  test('moves a subdirectory template back to the bundle root', async () => {
    const root = await makeFixture({
      'static/index.html': SPA_HTML,
      'src/main.ts': MAIN_TS,
    })
    await build({
      root,
      logLevel: 'error',
      plugins: [
        createHtmlPlugin({
          entry: 'src/main.ts',
          template: 'static/index.html',
        }),
      ],
      build: {
        outDir: 'dist',
      },
    })
    const html = await readFile(path.join(root, 'dist/index.html'), 'utf8')
    expect(html).toContain('<title>app</title>')
    expect(html).toMatch(/src="\/assets\/index-[\w-]+\.js"/)
    // the intermediate `static/` directory is cleaned up after the move
    await expect(readFile(path.join(root, 'dist/static/index.html'), 'utf8')).rejects.toThrow()
  }, 30_000)
})

describe('e2e: dev server', () => {
  test('serves the injected entry under a non-root base', async () => {
    const root = await makeFixture({
      'index.html': SPA_HTML,
      'src/main.ts': MAIN_TS,
    })
    const server = await createServer({
      root,
      base: '/app/',
      logLevel: 'error',
      plugins: [
        createHtmlPlugin({
          entry: 'src/main.ts',
        }),
      ],
    })
    devServers.push(server)
    await server.listen(0)
    const port = server.httpServer.address().port

    const res = await fetch(`http://localhost:${port}/app/`, {
      headers: {
        accept: 'text/html',
      },
    })
    expect(res.status).toEqual(200)
    const html = await res.text()
    expect(html).toContain('id="app"')

    // Vite rewrites the injected root-absolute src to the base prefix
    const m = html.match(/<script type="module"[^>]*src="([^"]+)"/g) ?? []
    const entrySrc = m.find((s) => s.includes('src/main.ts'))
    expect(entrySrc).toContain('/app/src/main.ts')

    // …and the rewritten src actually resolves
    const srcRes = await fetch(`http://localhost:${port}/app/src/main.ts`)
    expect(srcRes.status).toEqual(200)
  }, 20_000)

  test('serves the right MPA page at its short filename URL (issue #1)', async () => {
    const root = await makeFixture({
      'index.html': '<html><head><title>home</title></head><body>home</body></html>',
      'other.html': '<html><head><title>other</title></head><body>other</body></html>',
    })
    const server = await createServer({
      root,
      logLevel: 'error',
      plugins: [
        createHtmlPlugin({
          pages: [
            {
              filename: 'index.html',
              template: 'index.html',
            },
            {
              filename: 'other.html',
              template: 'other.html',
            },
          ],
        }),
      ],
    })
    devServers.push(server)
    await server.listen(0)
    const port = server.httpServer.address().port

    // the short filename URL must reach its own page, not fall back to the
    // index page's catch-all rule (v5.0.0 matched the template path only,
    // so `/other.html` served the index template's content)
    const home = await fetch(`http://localhost:${port}/`, {
      headers: {
        accept: 'text/html',
      },
    })
    expect(await home.text()).toContain('home')

    const other = await fetch(`http://localhost:${port}/other.html`, {
      headers: {
        accept: 'text/html',
      },
    })
    expect(await other.text()).toContain('other')
  }, 20_000)

  test('staticPathPrefixes pass real files through instead of falling back', async () => {
    const root = await makeFixture({
      'index.html': SPA_HTML,
      'src/main.ts': MAIN_TS,
      'public/static/data.txt': 'raw-static-content',
    })
    const server = await createServer({
      root,
      logLevel: 'error',
      plugins: [
        createHtmlPlugin({
          entry: 'src/main.ts',
          staticPathPrefixes: ['/static'],
        }),
      ],
    })
    devServers.push(server)
    await server.listen(0)
    const port = server.httpServer.address().port

    // a navigation request for a static prefix path returns the file…
    const escaped = await fetch(`http://localhost:${port}/static/data.txt`, {
      headers: {
        accept: 'text/html',
      },
    })
    expect(await escaped.text()).toContain('raw-static-content')

    // …while an unlisted prefix still falls back to the html template
    const fellBack = await fetch(`http://localhost:${port}/assets/data.txt`, {
      headers: {
        accept: 'text/html',
      },
    })
    expect(await fellBack.text()).toContain('id="app"')
  }, 20_000)
})
