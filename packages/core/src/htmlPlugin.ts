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
import { cp, readFile, rename, rm } from 'node:fs/promises'
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
    const url = ctx.filename
    const base = viteConfig.base
    const excludeBaseUrl = url.replace(base, '/')
    const htmlName = path.relative(process.cwd(), excludeBaseUrl)

    const page = getPage(userOptions, htmlName, viteConfig)
    const { injectOptions = {} } = page
    const _html = await renderHtml(html, {
      injectOptions,
      viteConfig,
      env,
      entry: page.entry || entry,
      verbose,
    })
    const { tags = [] } = injectOptions
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
      const keys = Object.keys(proxy)

      let indexPage: any = null
      for (const page of _pages) {
        if (page.filename !== 'index.html') {
          rewrites.push(createRewire(page.template, page, baseUrl, keys))
        } else {
          indexPage = page
        }
      }

      // ensure order
      if (indexPage) {
        rewrites.push(createRewire('', indexPage, baseUrl, keys))
      }

      server.middlewares.use(
        history({
          disableDotRule: undefined,
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
    injectOptions: InjectOptions
    viteConfig: ResolvedConfig
    env: Record<string, any>
    entry?: string
    verbose?: boolean
  },
) {
  const { injectOptions, viteConfig, env, entry, verbose } = config
  const { data, ejsOptions } = injectOptions

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
  name: string,
  viteConfig: ResolvedConfig,
) {
  let page: PageOption
  if (isMpa(viteConfig) || pages?.length) {
    page = getPageConfig(name, pages, DEFAULT_TEMPLATE)
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
  const removedNode: string[] = []
  scriptNodes.forEach((item) => {
    removedNode.push(item.toString())
    item.parentNode.removeChild(item)
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
    injectOptions: inject,
  }
}

export function getPageConfig(
  htmlName: string,
  pages: Pages,
  defaultPage: string,
): PageOption {
  const defaultPageOption: PageOption = {
    filename: defaultPage,
    template: `./${defaultPage}`,
  }

  const page = pages.filter((page) => {
    return path.resolve('/' + page.template) === path.resolve('/' + htmlName)
  })?.[0]
  return page ?? defaultPageOption ?? undefined
}

export function getHtmlInPages(page: PageOption, root: string) {
  const htmlPath = getHtmlPath(page, root)

  return readHtml(htmlPath)
}

export function getHtmlPath(page: PageOption, root: string) {
  const { template } = page
  const templatePath = template.startsWith('.') ? template : `./${template}`
  return path.resolve(root, templatePath)
}

export async function readHtml(path: string) {
  try {
    return await readFile(path, 'utf8')
  } catch {
    throw new Error(`html is not exist in ${path}`)
  }
}

function createRewire(
  reg: string,
  page: any,
  baseUrl: string,
  proxyUrlKeys: string[],
) {
  return {
    from: new RegExp(`^/${reg}*`),
    to({ parsedUrl }: any) {
      const pathname: string = parsedUrl.path

      const excludeBaseUrl = pathname.replace(baseUrl, '/')

      const template = path.resolve(baseUrl, page.template)

      if (excludeBaseUrl.startsWith('/static')) {
        return excludeBaseUrl
      }

      if (excludeBaseUrl === '/') {
        return template
      }
      const isApiUrl = proxyUrlKeys.some((item) =>
        pathname.startsWith(path.resolve(baseUrl, item)),
      )
      return isApiUrl ? parsedUrl.path : template
    },
  }
}
