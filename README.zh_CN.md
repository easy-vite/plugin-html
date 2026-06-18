# @easy-vite/plugin-html

> 现代化的 Vite HTML 处理插件 —— EJS 模板、HTML 压缩、多页应用（MPA）、自定义 entry/template 与 `.env` 注入。框架无关（Vue / React / Svelte 通用）。面向 Vite 8（Rolldown + Oxc）。

**中文** | [English](./README.md)

[![npm version][npm-img]][npm-url]
[![downloads][downloads-img]][downloads-url]
[![license][license-img]][license-url]
[![vite peer][vite-img]][vite-url]
[![node][node-img]][node-url]

## ✨ 核心亮点

基于 `vite-plugin-html` 为 **Vite 8** 时代重构 —— ESM 优先、**零冗余运行时依赖**，与 Vite 同款底层（Rolldown + Oxc）。

**核心能力**

- 🗜️ HTML 压缩 —— 基于 `html-minifier-terser`
- 📝 EJS 模板 —— 直接在 `index.html` 中使用变量、子模板与循环
- 📄 多页应用（MPA）—— 多入口与多模板，一等公民支持
- 🚪 自定义 `entry` / `template` —— 指向任意路径
- 🔐 `.env` 注入 —— 基于 Vite 原生 `loadEnv`
- 🏷️ 标签注入 —— 任意位置注入 `<script>` / `<link>` / 自定义标签
- 🧩 框架无关 —— Vue / React / Svelte / 原生 HTML

**现代化工具链**

- ⚡ Vite 8（Rolldown + Oxc）—— 向下兼容至 Vite 5
- 🪶 仅 **7 个运行时依赖**（原 12+）—— 移除 `fs-extra`、`dotenv`、`consola` 等
- 📦 ESM / CJS 双格式导出 + 完整 TypeScript 类型
- 🛠️ oxlint + oxfmt —— 替代 eslint / prettier

## 安装 (pnpm or yarn or npm)

**node version:** >=20.19

**vite version:** >=5.0.0

```bash
pnpm add @easy-vite/plugin-html -D
```

或

```bash
yarn add @easy-vite/plugin-html -D
```

或

```bash
npm i @easy-vite/plugin-html -D
```

## 使用

- 在 `index.html` 中增加 EJS 标签，例如

```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" href="/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><%- title %></title>
  <%- injectScript %>
</head>
```

- 在 `vite.config.ts` 中配置，该方式可以按需引入需要的功能即可

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
       * 在这里写entry后，你将不需要在`index.html`内添加 script 标签，原有标签需要删除
       * @default src/main.ts
       */
      entry: 'src/main.ts',
      /**
       * 如果你想将 `index.html`存放在指定文件夹，可以修改它，否则不需要配置
       * @default index.html
       */
      template: 'public/index.html',
      /**
       * 需要注入 index.html ejs 模版的数据
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

多页应用配置

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

## 参数说明

`createHtmlPlugin(options: UserOptions)`

### UserOptions

| 参数     | 类型                     | 默认值        | 说明             |
| -------- | ------------------------ | ------------- | ---------------- |
| entry    | `string`                 | `src/main.ts` | 入口文件         |
| template | `string`                 | `index.html`  | 模板的相对路径   |
| inject   | `InjectOptions`          | -             | 注入 HTML 的数据 |
| minify   | `boolean｜MinifyOptions` | -             | 是否压缩 html    |
| pages    | `PageOption`             | -             | 多页配置         |

### InjectOptions

| 参数       | 类型                  | 默认值 | 说明                                                       |
| ---------- | --------------------- | ------ | ---------------------------------------------------------- |
| data       | `Record<string, any>` | -      | 注入的数据                                                 |
| ejsOptions | `EJSOptions`          | -      | ejs 配置项[EJSOptions](https://github.com/mde/ejs#options) |
| tags       | `HtmlTagDescriptor`   | -      | 需要注入的标签列表                                         |

`data` 可以在 `html` 中使用 `ejs` 模版语法获取

#### env 注入

默认会向 index.html 注入 `.env` 文件的内容，类似 vite 的 `loadEnv`函数

### PageOption

| 参数          | 类型            | 默认值        | 说明             |
| ------------- | --------------- | ------------- | ---------------- |
| filename      | `string`        | -             | html 文件名      |
| template      | `string`        | `index.html`  | 模板的相对路径   |
| entry         | `string`        | `src/main.ts` | 入口文件         |
| injectOptions | `InjectOptions` | -             | 注入 HTML 的数据 |

### MinifyOptions

默认压缩配置

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

## 运行示例

```bash
pnpm install

# spa — 自动构建 core（watch）并启动 playground 开发服务器
pnpm dev:basic

# 多页
pnpm dev:mpa

# 自定义 entry / template
pnpm dev:entry
```

## 开发

```bash
pnpm install
pnpm build:core # 构建插件（vite lib + tsc 类型声明）
pnpm test       # 运行单元测试（vitest）
pnpm lint       # 使用 oxlint 检查代码
pnpm format     # 使用 oxfmt 格式化代码
```

> 需要 Node `>=20.19` 与 pnpm `>=10`。代码检查使用 [oxlint](https://oxc.rs/docs/learn-tutorial/about-linter/introduction.html)，格式化使用 [oxfmt](https://oxc.rs/docs/learn-tutorial/about-formatter/introduction.html)。

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