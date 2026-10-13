# @easy-vite/plugin-html

> A modern Vite plugin for HTML — EJS templating, minification, MPA support, custom entry/template & `.env` injection. Framework-agnostic (Vue / React / Svelte). Built for Vite 8 (Rolldown + Oxc).

**English** | [中文](./README.zh_CN.md)

[![npm version][npm-img]][npm-url]
[![downloads][downloads-img]][downloads-url]
[![license][license-img]][license-url]
[![vite peer][vite-img]][vite-url]
[![node][node-img]][node-url]

## ✨ Highlights

Rebuilt from `vite-plugin-html` for the **Vite 8** era — ESM-first, **zero-clutter runtime deps**, powered by the same stack Vite itself uses (Rolldown + Oxc).

**Core capabilities**

- 🗜️ HTML minification — powered by `html-minifier-terser`
- 📝 EJS templating — variables, partials & loops directly in `index.html`
- 📄 Multi-page apps (MPA) — multiple entries & templates, first-class
- 🚪 Custom `entry` / `template` — point to any path
- 🔐 `.env` injection — via Vite-native `loadEnv`
- 🏷️ Tag injection — inject `<script>` / `<link>` / custom tags anywhere
- 🧩 Framework-agnostic — Vue / React / Svelte / plain HTML

**Built on a modern toolchain**

- ⚡ Vite 8 (Rolldown + Oxc) — backward compatible to Vite 5
- 🪶 Only **5 runtime deps** (was 12+) — dropped `fs-extra`, `dotenv`, `consola`, `pathe`, etc.
- 📦 Dual ESM / CJS export + full TypeScript types
- 🛠️ oxlint + oxfmt replacing eslint / prettier

## Install (pnpm or yarn or npm)

**node version:** >=20.19

**vite version:** >=5.0.0

```bash
pnpm add @easy-vite/plugin-html -D
```

or

```bash
yarn add @easy-vite/plugin-html -D
```

or

```bash
npm i @easy-vite/plugin-html -D
```

## Usage

- Add EJS tags to `index.html`, e.g.

```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" href="/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><%- title %></title>
  <%- injectScript %>
</head>
```

- Configure in `vite.config.ts`, this method can introduce the required functions as needed

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createHtmlPlugin } from '@easy-vite/plugin-html'

export default defineConfig({
  plugins: [
    vue(),
    createHtmlPlugin({
      minify: true,
      /**
       * After writing entry here, you will not need to add script tags in `index.html`, the original tags need to be deleted
       * @default src/main.ts
       */
      entry: 'src/main.ts',
      /**
       * If you want to store `index.html` in the specified folder, you can modify it, otherwise no configuration is required
       * @default index.html
       */
      template: 'public/index.html',
      /**
       * Data that needs to be injected into the index.html ejs template
       */
      inject: {
        data: {
          title: 'index',
          injectScript: `<script src="./inject.js"></script>`,
        },
        tags: [
          {
            injectTo: 'body-prepend',
            tag: 'div',
            attrs: { id: 'tag' },
          },
        ],
      },
    }),
  ],
})
```

Multi-page application configuration

```ts
import { defineConfig } from 'vite'
import { createHtmlPlugin } from '@easy-vite/plugin-html'

export default defineConfig({
  plugins: [
    createHtmlPlugin({
      minify: true,
      pages: [
        {
          entry: 'src/main.ts',
          filename: 'index.html',
          template: 'public/index.html',
          inject: {
            data: {
              title: 'index',
              injectScript: `<script src="./inject.js"></script>`,
            },
            tags: [
              {
                injectTo: 'body-prepend',
                tag: 'div',
                attrs: { id: 'tag1' },
              },
            ],
          },
        },
        {
          entry: 'src/other-main.ts',
          filename: 'other.html',
          template: 'public/other.html',
          inject: {
            data: {
              title: 'other page',
              injectScript: `<script src="./inject.js"></script>`,
            },
            tags: [
              {
                injectTo: 'body-prepend',
                tag: 'div',
                attrs: { id: 'tag2' },
              },
            ],
          },
        },
      ],
    }),
  ],
})
```

## Migrating to v5

v5 is a modernization release. It cleans up hidden behaviors and inconsistent naming, and ships a large test-suite expansion (10 → 38 tests, including end-to-end build/dev coverage).

**Breaking changes**

1. `PageOption.injectOptions` was renamed to `PageOption.inject` — the same name as the top-level option, so page-level and global configuration read alike:

   ```diff
   pages: [
     {
       filename: 'index.html',
       template: 'index.html',
   -   injectOptions: { data: { title: 'index' } },
   +   inject: { data: { title: 'index' } },
     },
   ]
   ```

2. The dev-server history fallback no longer hardcodes `/static` as a pass-through prefix. If your templates live under `static/` (or you rely on any other prefix bypassing the fallback), list it explicitly:

   ```diff
   createHtmlPlugin({
     template: 'static/index.html',
   + staticPathPrefixes: ['/static'],
   })
   ```

3. `getHtmlInPages` / `getHtmlPath` / `readHtml` (unused internal helpers that were accidentally exported) were removed from the public surface.

**Bug fixes shipped in v5** (see [CHANGELOG](./CHANGELOG.md) for the full list): page matching now uses the vite `root` instead of `process.cwd()`; the MPA fallback page keeps the global `inject`; pass-through prefixes match with a path boundary (`/static` no longer swallows `/staticfoo`) and return the original request path; the fallback rewrite regex is properly escaped; html documents without module scripts are no longer re-serialized when an entry is configured.

## Parameter Description

`createHtmlPlugin(options: UserOptions)`

### UserOptions

| Parameter          | Types                    | Default       | Description                                                       |
| ------------------ | ------------------------ | ------------- | ----------------------------------------------------------------- |
| entry              | `string`                 | `src/main.ts` | entry file path                                                   |
| template           | `string`                 | `index.html`  | relative path to the template                                     |
| inject             | `InjectOptions`          | -             | Data injected into HTML                                           |
| minify             | `boolean｜MinifyOptions` | -             | whether to compress html                                          |
| pages              | `PageOption`             | -             | Multi-page configuration                                          |
| staticPathPrefixes | `string[]`               | `[]`          | URL prefixes that bypass the dev-server history fallback          |
| verbose            | `boolean`                | `false`       | output warning log (e.g. when template entry scripts are removed) |

### InjectOptions

| Parameter  | Types                 | Default | Description                                                               |
| ---------- | --------------------- | ------- | ------------------------------------------------------------------------- |
| data       | `Record<string, any>` | -       | injected data                                                             |
| ejsOptions | `EJSOptions`          | -       | ejs configuration Options[EJSOptions](https://github.com/mde/ejs#options) |
| tags       | `HtmlTagDescriptor`   | -       | List of tags to inject                                                    |

`data` can be accessed in `html` using the `ejs` template syntax

#### Env inject

By default, the contents of the `.env` file will be injected into index.html, similar to vite's `loadEnv` function

> [!WARNING]
> Every environment variable is injected (not only `VITE_*`-prefixed ones). Be careful not to render secrets into your HTML with `<%- %>` — treat `inject.data` as the safer, explicit channel.

### PageOption

| Parameter | Types           | Default       | Description                   |
| --------- | --------------- | ------------- | ----------------------------- |
| filename  | `string`        | -             | html file name                |
| template  | `string`        | `index.html`  | relative path to the template |
| entry     | `string`        | `src/main.ts` | entry file path               |
| inject    | `InjectOptions` | -             | Data injected into HTML       |

### MinifyOptions

Default compression configuration

```ts
collapseWhitespace: true,
keepClosingSlash: true,
removeComments: true,
removeRedundantAttributes: true,
removeScriptTypeAttributes: true,
removeStyleLinkTypeAttributes: true,
useShortDoctype: true,
minifyCSS: true,
```

## Run the playground

```bash
pnpm install

# SPA — auto build core (watch) and start the playground dev server
pnpm dev:basic

# MPA
pnpm dev:mpa

# Custom entry / template
pnpm dev:entry

# Non-root base (served under /app/)
pnpm dev:base
```

## Development

```bash
pnpm install
pnpm build:core # build the plugin (vite lib + tsc type declarations)
pnpm test       # run unit tests (vitest)
pnpm lint       # lint with oxlint
pnpm format     # format with oxfmt
```

> Development requires Node `>=22.13` and pnpm `>=11` (the published plugin itself supports Node `>=20.19`). Linting is powered by [oxlint](https://oxc.rs/docs/learn-tutorial/about-linter/introduction.html) and formatting by [oxfmt](https://oxc.rs/docs/learn-tutorial/about-formatter/introduction.html).

## License

MIT

[npm-img]: https://img.shields.io/npm/v/@easy-vite/plugin-html.svg?style=flat-square
[npm-url]: https://npmjs.com/package/@easy-vite/plugin-html
[downloads-img]: https://img.shields.io/npm/dm/@easy-vite/plugin-html.svg?style=flat-square&color=42b883
[downloads-url]: https://npmjs.com/package/@easy-vite/plugin-html
[license-img]: https://img.shields.io/npm/l/@easy-vite/plugin-html.svg?style=flat-square
[license-url]: ./LICENSE
[vite-img]: https://img.shields.io/badge/vite-%3E%3D5.0.0-646cff?style=flat-square
[vite-url]: https://vite.dev
[node-img]: https://img.shields.io/node/v/@easy-vite/plugin-html.svg?style=flat-square
[node-url]: https://nodejs.org/en/about/releases/