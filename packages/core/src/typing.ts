import type { Options as EJSOptions } from 'ejs'
import type { Options as MinifyOptions } from 'html-minifier-terser'
import type { HtmlTagDescriptor } from 'vite'

export type Entry = string | Record<string, string>

export interface InjectOptions {
  /**
   * @description Data injected into the html template
   */
  data?: Record<string, unknown>

  tags?: HtmlTagDescriptor[]

  /**
   * @description ejs options configuration
   */
  ejsOptions?: EJSOptions
}

export interface PageOption {
  filename: string
  template: string
  entry?: string
  /**
   * @description Inject options for this page
   */
  inject?: InjectOptions
}

export type Pages = PageOption[]

export interface UserOptions {
  /**
   * @description Page options
   */
  pages?: Pages

  /**
   * @description Minimize options
   */
  minify?: MinifyOptions | boolean

  /**
   * page entry
   */
  entry?: string

  /**
   * template path
   */
  template?: string

  /**
   * @description Inject options, applied to every rendered page.
   * Page-level `inject` takes precedence over these keys.
   */
  inject?: InjectOptions

  /**
   * @description URL prefixes that bypass the dev-server history fallback.
   * Requests whose path equals a prefix or starts with `<prefix>/` are
   * passed through untouched instead of being rewritten to an HTML template.
   * @default []
   */
  staticPathPrefixes?: string[]

  /**
   * output warning log
   * @default false
   */
  verbose?: boolean
}
