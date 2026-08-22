import type {
  IndexHtmlTransformContext,
  PluginOption,
  ResolvedConfig,
} from 'vite'
import type { InjectOptions, PageOption, Pages, UserOptions } from './typing'
import ejs from 'ejs'
import { loadEnv, normalizePath } from 'vite'
import { parse } from 'node-html-parser'
import path from 'node:path'
import { glob } from 'tinyglobby'
import history from 'connect-history-api-fallback'
import { cp, rename, rm } from 'node:fs/promises'
import { isDirEmpty } from './utils'

const DEFAULT_TEMPLATE = 'index.html'
const ignoreDirs = ['.', '', '/']

const bodyInjectRE = /<\/body>/

interface MoveOptions {
  overwrite?: boolean
}

async function moveFile(src: string, dest: string, options: MoveOptions = {}) {
  try {
    await rename(src, dest)
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'ENOTEMPTY' && options.overwrite) {
      await rm(dest, { recursive: true, force: true })
      await rename(src, dest)
    } else if (code === 'EXDEV') {
      // cross-device rename fallback: copy then remove source
      await cp(src, dest, { recursive: true, force: options.overwrite })
      await rm(src, { recursive: true, force: true })
    } else {
      throw err
    }
  }
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Join a Vite base and a URL path: ('/app/', 'static/index.html') → '/app/static/index.html' */
function joinUrlPath(base: string, p: string): string {
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  return p.startsWith('/') ? `${b}${p}` : `${b}/${p}`
}

/** Strip the Vite base from a URL path: ('/app/static/a.js', '/app/') → '/static/a.js' */
function stripBase(pathname: string, base: string): string {
  if (base === '/' || base === '') {
    return pathname
  }
  if (pathname === base) {
    return '/'
  }
  return pathname.startsWith(base) ? pathname.slice(base.length - 1) : pathname
}

/** Match with a path boundary: prefix `/static` hits `/static` and `/static/…`, never `/staticfoo` */
function matchesPathPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((raw) => {
    const prefix = raw.startsWith('/') ? raw : `/${raw}`
    return pathname === prefix || pathname.startsWith(`${prefix}/`)
  })
}

export function createPlugin(userOptions: UserOptions = {}): PluginOption {
  const {
    entry,
    template = DEFAULT_TEMPLATE,
    pages = [],
    verbose = false,
  } = userOptions

  let viteConfig: ResolvedConfig
  let env: Record<string, any> = {}
  const transformIndexHtmlHandler = async (
    html: string,
    ctx: IndexHtmlTransformContext,
  ) => {
    // `ctx.filename` is the absolute path of the html file on disk — the only
    // reliable page matcher regardless of base, root, and cwd (v5: was
    // derived from the URL via `process.cwd()`, which broke when root ≠ cwd).
    const page = getPage(userOptions, ctx.filename, viteConfig)
    const { inject = {} } = page
    const _html = await renderHtml(html, {
      inject,
      viteConfig,
      env,
      entry: page.entry || entry,
      verbose,
    })
    const { tags = [] } = inject
    return {
      html: _html,
      tags: tags,
    }
  }

  return {
    name: 'vite:html',
    enforce: 'pre',
    configResolved(resolvedConfig) {
      viteConfig = resolvedConfig
      env = loadEnv(viteConfig.mode, viteConfig.root, '')
    },
    config(conf) {
      const input = createInput(userOptions, conf as unknown as ResolvedConfig)

      if (input) {
        return {
          build: {
            rollupOptions: {
              input,
            },
          },
        }
      }
    },

    configureServer(server) {
      let _pages: { filename: string; template: string }[] = []
      const rewrites: { from: RegExp; to: any }[] = []
      if (!isMpa(viteConfig)) {
        const template = userOptions.template || DEFAULT_TEMPLATE
        const filename = DEFAULT_TEMPLATE
        _pages.push({
          filename,
          template,
        })
      } else {
        _pages = pages.map((page) => {
          return {
            filename: page.filename || DEFAULT_TEMPLATE,
            template: page.template || DEFAULT_TEMPLATE,
          }
        })
      }
      const proxy = viteConfig.server?.proxy ?? {}
      const baseUrl = viteConfig.base ?? '/'
      const proxyUrlKeys = Object.keys(proxy)
      const staticPathPrefixes = userOptions.staticPathPrefixes ?? []

      let indexPage: any = null
      for (const page of _pages) {
        if (page.filename !== 'index.html') {
          rewrites.push(
            createRewire(
              page.template,
              page,
              baseUrl,
              proxyUrlKeys,
              staticPathPrefixes,
            ),
          )
        } else {
          indexPage = page
        }
      }

      // ensure order
      if (indexPage) {
        rewrites.push(
          createRewire(
            '',
            indexPage,
            baseUrl,
            proxyUrlKeys,
            staticPathPrefixes,
          ),
        )
      }

      server.middlewares.use(
        history({
          htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
          rewrites: rewrites,
        }),
      )
    },

    transformIndexHtml: {
      order: 'pre',
      handler: transformIndexHtmlHandler,
    },
    async closeBundle() {
      const dirs: string[] = []

      if (isMpa(viteConfig) || pages.length) {
        for (const page of pages) {
          const dir = path.dirname(page.template)
          if (!ignoreDirs.includes(dir)) {
            dirs.push(dir)
          }
        }
      } else {
        const dir = path.dirname(template)
        if (!ignoreDirs.includes(dir)) {
          dirs.push(dir)
        }
      }
      const outputDirs = [...new Set(dirs)]

      // SPA with a root-level template — nothing to move, skip early (v5)
      if (!outputDirs.length) {
        return
      }

      const cwd = path.resolve(viteConfig.root, viteConfig.build.outDir)
      const htmlFiles = await glob(
        outputDirs.map((dir) => `${dir}/*.html`),
        { cwd, absolute: true },
      )

      // move sequentially, dedup by dest to avoid concurrent rename races
      // when multiple pages share the same output basename
      const moves = new Map<string, string>()
      for (const file of htmlFiles) {
        const dest = path.resolve(cwd, path.basename(file))
        if (!moves.has(dest)) {
          moves.set(dest, file)
        }
      }
      for (const [dest, src] of moves) {
        await moveFile(src, dest, { overwrite: true })
      }

      // clean empty dirs deepest-first so a parent is only removed after
      // its children (ENOTEMPTY already handled by moveFile above)
      const absDirs = outputDirs
        .map((dir) => path.resolve(cwd, dir))
        .sort((a, b) => b.length - a.length)
      for (const absDir of absDirs) {
        try {
          if (await isDirEmpty(absDir)) {
            await rm(absDir, { recursive: true, force: true })
          }
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
        }
      }
    },
  }
}

export function createInput(
  { pages = [], template = DEFAULT_TEMPLATE }: UserOptions,
  viteConfig: ResolvedConfig,
) {
  // The `config` hook runs before Vite assigns the default root, so
  // viteConfig.root may be undefined here — fall back to cwd (Vite's default).
  const root = viteConfig.root || process.cwd()
  const input: Record<string, string> = {}
  if (isMpa(viteConfig) || pages?.length) {
    const templates = pages.map((page) => page.template)
    templates.forEach((temp) => {
      let dirName = path.dirname(temp)
      const file = path.basename(temp)

      dirName = dirName.replace(/\s+/g, '').replace(/\//g, '-')

      const key =
        dirName === '.' || dirName === 'public' || !dirName
          ? file.replace(/\.html/, '')
          : dirName
      input[key] = path.resolve(root, temp)
    })

    return input
  } else {
    const dir = path.dirname(template)
    if (ignoreDirs.includes(dir)) {
      return undefined
    } else {
      const file = path.basename(template)
      const key = file.replace(/\.html/, '')
      return {
        [key]: path.resolve(root, template),
      }
    }
  }
}

export async function renderHtml(
  html: string,
  config: {
    inject: InjectOptions
    viteConfig: ResolvedConfig
    env: Record<string, any>
    entry?: string
    verbose?: boolean
  },
) {
  const { inject, viteConfig, env, entry, verbose } = config
  const { data, ejsOptions } = inject

  const ejsData: Record<string, any> = {
    ...viteConfig?.env,
    ...viteConfig?.define,
    ...env,
    ...data,
  }
  let result = await ejs.render(html, ejsData, ejsOptions)

  if (entry) {
    result = removeEntryScript(result, verbose)
    const entrySrc = entry.startsWith('/')
      ? entry
      : `/${entry.replace(/^\.?\//, '')}`
    result = result.replace(
      bodyInjectRE,
      `<script type="module" src="${normalizePath(
        entrySrc,
      )}"></script>\n</body>`,
    )
  }
  return result
}

export function getPage(
  { pages = [], entry, template = DEFAULT_TEMPLATE, inject = {} }: UserOptions,
  filename: string,
  viteConfig: ResolvedConfig,
) {
  let page: PageOption
  if (isMpa(viteConfig) || pages?.length) {
    page = getPageConfig(filename, pages, DEFAULT_TEMPLATE, viteConfig, inject)
  } else {
    page = createSpaPage(entry, template, inject)
  }
  return page
}

function isMpa(viteConfig: ResolvedConfig) {
  const input = viteConfig?.build?.rollupOptions?.input ?? undefined
  return typeof input !== 'string' && Object.keys(input || {}).length > 1
}

export function removeEntryScript(html: string, verbose = false) {
  if (!html) {
    return html
  }

  const root = parse(html)
  const scriptNodes = root.querySelectorAll('script[type=module]') || []
  // Nothing to strip — return the original bytes untouched so the parser
  // never gets a chance to re-serialize (and normalize) the document (v5).
  if (!scriptNodes.length) {
    return html
  }
  const removedNode: string[] = []
  scriptNodes.forEach((item) => {
    removedNode.push(item.toString())
    // node-html-parser 9.0 tightened `parentNode` to `HTMLElement | null`
    item.parentNode?.removeChild(item)
  })
  if (verbose && removedNode.length) {
    // oxlint-disable-next-line no-console -- intentional user-facing notice in verbose mode
    console.warn(
      `@easy-vite/plugin-html: Since you have already configured entry, ${removedNode.toString()} is deleted. You may also delete it from the index.html.`,
    )
  }
  return root.toString()
}

export function createSpaPage(
  entry: string | undefined,
  template: string,
  inject: InjectOptions = {},
): PageOption {
  return {
    entry,
    filename: 'index.html',
    template: template,
    inject,
  }
}

export function getPageConfig(
  filename: string,
  pages: Pages,
  defaultPage: string,
  viteConfig: ResolvedConfig,
  globalInject: InjectOptions = {},
): PageOption {
  const root = viteConfig.root || process.cwd()
  const normalizedFilename = normalizePath(filename)

  const page = pages.find((page) => {
    const templatePath = normalizePath(
      path.resolve(root, page.template || DEFAULT_TEMPLATE),
    )
    return templatePath === normalizedFilename
  })

  if (page) {
    return page
  }

  // Unknown page — fall back to the default template but keep the global
  // inject so shared EJS data / tags still apply (v5: was silently dropped).
  return {
    filename: defaultPage,
    template: `./${defaultPage}`,
    inject: globalInject,
  }
}

function createRewire(
  template: string,
  page: any,
  baseUrl: string,
  proxyUrlKeys: string[],
  staticPathPrefixes: string[],
) {
  return {
    // Navigations that start with `/<template>` (respecting a path boundary)
    // fall back to this page. An empty template matches every path — the
    // catch-all rule registered for the index page (v5: the raw template
    // string was interpolated unescaped and the `*` quantifier bound only
    // to its last character, e.g. `^/index.html*`).
    from: template ? new RegExp(`^/${escapeRegExp(template)}(/|$)`) : /^/,
    to({ parsedUrl }: any) {
      const pathname: string = parsedUrl.path || '/'

      // Configurable pass-through prefixes: return the original path, not
      // the base-stripped one (v5: was a hardcoded '/static' check that
      // leaked the stripped path and matched '/staticfoo').
      if (matchesPathPrefix(stripBase(pathname, baseUrl), staticPathPrefixes)) {
        return pathname
      }

      if (pathname === baseUrl || stripBase(pathname, baseUrl) === '/') {
        return joinUrlPath(baseUrl, page.template)
      }

      const isProxyUrl = proxyUrlKeys.some((item) =>
        pathname.startsWith(joinUrlPath(baseUrl, item)),
      )
      return isProxyUrl ? pathname : joinUrlPath(baseUrl, page.template)
    },
  }
}
