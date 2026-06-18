# @easy-vite/plugin-html

**English** | [中文](./README.zh_CN.md)

[![npm][npm-img]][npm-url] [![node][node-img]][node-url]

## Features

- HTML compression capability
- EJS template capability
- Multi-page application support
- Support custom `entry`
- Support custom `template`

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
          injectOptions: {
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
          injectOptions: {
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

## Parameter Description

`createHtmlPlugin(options: UserOptions)`

### UserOptions

| Parameter | Types                    | Default       | Description                   |
| --------- | ------------------------ | ------------- | ----------------------------- |
| entry     | `string`                 | `src/main.ts` | entry file path               |
| template  | `string`                 | `index.html`  | relative path to the template |
| inject    | `InjectOptions`          | -             | Data injected into HTML       |
| minify    | `boolean｜MinifyOptions` | -             | whether to compress html      |
| pages     | `PageOption`             | -             | Multi-page configuration      |

### InjectOptions

| Parameter  | Types                 | Default | Description                                                               |
| ---------- | --------------------- | ------- | ------------------------------------------------------------------------- |
| data       | `Record<string, any>` | -       | injected data                                                             |
| ejsOptions | `EJSOptions`          | -       | ejs configuration Options[EJSOptions](https://github.com/mde/ejs#options) |
| tags       | `HtmlTagDescriptor`   | -       | List of tags to inject                                                    |

`data` can be accessed in `html` using the `ejs` template syntax

#### Env inject

By default, the contents of the `.env` file will be injected into index.html, similar to vite's `loadEnv` function

### PageOption

| Parameter     | Types           | Default       | Description                   |
| ------------- | --------------- | ------------- | ----------------------------- |
| filename      | `string`        | -             | html file name                |
| template      | `string`        | `index.html`  | relative path to the template |
| entry         | `string`        | `src/main.ts` | entry file path               |
| injectOptions | `InjectOptions` | -             | Data injected into HTML       |

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
```

## Development

```bash
pnpm install
pnpm build:core # build the plugin (vite lib + tsc type declarations)
pnpm test       # run unit tests (vitest)
pnpm lint       # lint with oxlint
pnpm format     # format with oxfmt
```

> Requires Node `>=20.19` and pnpm `>=10`. Linting is powered by [oxlint](https://oxc.rs/docs/learn-tutorial/about-linter/introduction.html) and formatting by [oxfmt](https://oxc.rs/docs/learn-tutorial/about-formatter/introduction.html).

## License

MIT

[npm-img]: https://img.shields.io/npm/v/@easy-vite/plugin-html.svg
[npm-url]: https://npmjs.com/package/@easy-vite/plugin-html
[node-img]: https://img.shields.io/node/v/@easy-vite/plugin-html.svg
[node-url]: https://nodejs.org/en/about/releases/