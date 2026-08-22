# [5.0.0] (2026-08-22)

### ⚠ BREAKING CHANGES

- `PageOption.injectOptions` 更名为 `PageOption.inject`，与顶层选项命名统一
- dev server history fallback 移除硬编码的 `/static` 透传前缀，改为可配置的 `staticPathPrefixes`（默认 `[]`）；模板位于 `static/` 目录的用户需显式声明 `staticPathPrefixes: ['/static']`
- 移除被意外导出的内部工具函数 `getHtmlInPages` / `getHtmlPath` / `readHtml`

### Features

- 新增 `UserOptions.staticPathPrefixes`：声明绕过 dev history fallback 的 URL 前缀，按路径边界匹配（`/static` 匹配 `/static` 与 `/static/…`，不再误吞 `/staticfoo`），命中时返回原始请求路径（原实现泄漏 base 剥离后的路径）
- 测试从 10 个扩展到 37 个：新增 `createInput`（含 v4.2.0 root undefined 回归）、`removeEntryScript`、`getPage`/`getPageConfig` 单测，以及基于 Vite build/dev API 的端到端测试（SPA entry 注入、非 `/` base、MPA 多页、子目录模板回移、staticPathPrefixes 透传对照）
- 新增 `playground/base` 演示非根 `base: '/app/'` 场景（dev 与 build 下 entry 注入均正确携带 base 前缀，由 Vite 管线处理）
- `package.json`：description 修正为 EJS（原文案误写 lodash.template）；`exports` 补充 `./package.json` 子路径；keywords 补充 `ejs`/`template`/`mpa`/`multi-page`

### Bug Fixes

- 页面匹配改用 `viteConfig.root` 解析（原为 `process.cwd()` 推导 URL 路径，root ≠ cwd 时 MPA 页面配置静默失配）
- MPA 回退页保留顶层 `inject` 配置（原静默丢失 EJS 数据与 tags）
- dev fallback 重写正则正确转义模板路径中的正则特殊字符，并修复量词错位（`^/<template>*` 的 `*` 只作用于最后一个字符）
- `removeEntryScript` 在文档不含 `script[type=module]` 时直接返回原文，不再经 parse → serialize 往返（避免 HTML 被重新规范化）
- `closeBundle` 在无子目录模板时（SPA 根目录场景）提前返回，跳过无谓的 glob 与目录清理

### Documentation

- README 中英双语：新增「升级到 v5」迁移指南；`staticPathPrefixes` / `verbose` 参数说明；env 注入安全提示（全量环境变量注入的风险）

### Chores

- 全仓版本同步至 5.0.0；CI 测试矩阵扩展至 Node 20 / 22 / 24

# [4.3.0] (2026-08-22)

### Dependencies

- 升级 `typescript` 5.9.3 → 6.0.3（major，dev 工具链；`tsc -p tsconfig.build.json` 类型声明生成验证无 breaking，产物大小与 4.2.2 一致）
- 升级 `vite` 8.2.0 → 8.2.2、`vitest` 4.1.10 → 4.1.11、`@types/node` 26.1.2 → 26.2.0
- 升级 `@commitlint/cli` 21.2.1 → 21.2.2、`@commitlint/config-conventional` 21.2.0 → 21.2.2
- 升级 `vue` 3.5.40 → 3.5.41、`lint-staged` 17.2.0 → 17.3.0
- 升级 `oxlint` 1.76.0 → 1.79.0、`oxfmt` 0.61.0 → 0.64.0

### Chores

- 全仓版本同步至 4.3.0

# [4.2.2] (2026-08-01)

### Dependencies

- 升级 `node-html-parser` 8.0.4 → 9.0.1（major，运行时，经全套测试与三个 playground 构建验证无 breaking）
- 升级 `vite` 8.1.3 → 8.2.0、`@types/node` 26.1.0 → 26.1.2、`@commitlint/cli` 21.2.0 → 21.2.1、`@vitejs/plugin-vue` 6.0.7 → 6.0.8、`vitest` 4.1.9 → 4.1.10
- 升级 `vue` 3.5.39 → 3.5.40、`vue-router` 5.1.0 → 5.2.0、`axios` 1.18.1 → 1.19.0
- 升级 `oxlint` 1.72.0 → 1.76.0、`oxfmt` 0.57.0 → 0.61.0、`lint-staged` 17.0.8 → 17.2.0
- `typescript` 保留 5.9.3

### Bug Fixes

- 适配 `node-html-parser` 9.0 的类型收紧：`removeEntryScript` 中 `parentNode` 改用可选链调用（`parentNode?.removeChild`）

### Chores

- 全仓版本同步至 4.2.2

# [4.2.1] (2026-06-28)

### Dependencies

- 升级 `node-html-parser` 8.0.3 → 8.0.4（运行时 patch）
- 升级 `vite` 8.1.0 → 8.1.3、`@commitlint/cli` & `config-conventional` 21.1.0 → 21.2.0、`@types/node` 26.0.1 → 26.1.0、`oxlint` 1.71.0 → 1.72.0、`oxfmt` 0.56.0 → 0.57.0
- 移除已弃用的 `conventional-changelog-cli` 及 `pnpm log` 脚本（CHANGELOG 现为手动维护）
- `typescript` 保留 5.9.3

### Chores

- 全仓版本同步至 4.2.1

# [4.2.0] (2026-06-28)

### Dependencies

- 移除运行时依赖 `pathe`，改用 Node 内置 `node:path`
- 移除运行时依赖 `@rollup/pluginutils`，`htmlFilter` 改用 `endsWith('.html')` 实现

### Bug Fixes

- 修复 `createInput` 在 `config` hook 阶段 `viteConfig.root` 为 undefined 时崩溃的问题（`pathe`→`node:path` 后暴露：node:path 对 undefined 参数严格校验，现回退到 `process.cwd()`）
- `htmlFilter` 保留原 `createFilter` 的 dot:false 语义，排除以 `.` 开头的路径

### Chores

- 全仓版本同步至 4.2.0（monorepo 根包 3.2.1→4.2.0，playground 0.0.1→4.2.0）

# [4.1.0] (2026-06-27)

### Dependencies

- 升级 `node-html-parser` 7.1.0 → 8.0.3（major，经全套测试与三个 playground 构建验证无 breaking）
- 升级 `@types/node` 25.9.3 → 26.0.1（major）
- 升级 `vite` 8.0.16 → 8.1.0
- 升级 `oxlint` 1.70.0 → 1.71.0
- 升级 `oxfmt` 0.55.0 → 0.56.0
- 升级 `@commitlint/cli` 21.0.2 → 21.1.0
- 升级 `@commitlint/config-conventional` 21.0.2 → 21.1.0
- 升级 `axios` 1.18.0 → 1.18.1
- 升级 `lint-staged` 17.0.7 → 17.0.8
- 升级 `vue` 3.5.38 → 3.5.39
- `typescript` 保留 5.9.3（暂不升级至 6.0）

# [4.0.3] (2026-06-18)

### Bug Fixes

- 构建产物不再包含 sourcemap（`build.sourcemap: false`），减小 npm 包体积

### Documentation

- README 首屏重构：新增醒目标语、5 枚 badge（npm version / downloads / license / vite peer / node），「Features」段升级为「✨ 核心亮点」（核心能力 + 现代化工具链分组），中英双语同步

# [4.0.2] (2026-06-18)

### Continuous Integration

- GitHub Actions 升级至 Node 24 runtime（`actions/checkout@v7`、`actions/setup-node@v6`、`pnpm/action-setup@v6`）
- 启用 npm provenance（OIDC，`id-token: write`）

# [4.0.1] (2026-06-18)

### Bug Fixes

- 修复发布包缺少 `README.md` / `README.zh_CN.md` 的问题（`prepublishOnly` 自动同步根目录 README 到 core）

### Continuous Integration

- 改为 tag 触发自动发布（`v*`），使用 npm Automation Token 免 OTP 适配非交互式 CI

# [4.0.0] (2026-06-18)

### ⚠ BREAKING CHANGES

- 最低 Node 版本提升至 `>=20.19`，最低 Vite 版本提升至 `>=5.0.0`
- 插件包改为 ESM-first（`"type": "module"`），保留 CJS 双格式导出
- 构建工具从 unbuild 迁移至 Vite 库模式（`vite build` + `tsc` 生成类型声明）
- 移除自实现的 `loadEnv`，改用 Vite 内置 `loadEnv`（不再写入 `process.env.VITE_USER_NODE_ENV`）
- 运行时依赖瘦身：移除 `fs-extra`/`dotenv`/`dotenv-expand`/`colorette`/`fast-glob`，改用 Node/Vite 原生能力 + `picocolors`/`tinyglobby`
- 代码检查/格式化从 ESLint + Prettier 迁移至 oxlint + oxfmt
- `transformIndexHtml` 注入的 entry 改用绝对路径（修复 template 位于子目录时的解析问题）

### Features

- 升级至 Vite 8（基于 Rolldown + Oxc），兼容 Vite 5/6/7/8
- 全部依赖升级至最新版本（Vue 3.5、Vue Router 5、Vitest 4.1、TypeScript 5.9、pnpm 11 等）
- 用 oxlint + oxfmt 替换 ESLint + Prettier

# [3.2.1](https://github.com/vbenjs/vite-plugin-html/compare/v3.0.6...v3.2.1) (2023-12-26)

### Features

- support vite5.0

# [3.2.0](https://github.com/vbenjs/vite-plugin-html/compare/v3.0.6...v3.2.0) (2022-03-15)

### Bug Fixes

- improve middleware logic ([36e143a](https://github.com/vbenjs/vite-plugin-html/commit/36e143a55b62710c7435ed0ca5ed4b035930c3af))

### Features

- support tags ([d07c9db](https://github.com/vbenjs/vite-plugin-html/commit/d07c9db4541432b94576e1fd4dce1b17098a60d0))

## [3.0.6](https://github.com/vbenjs/vite-plugin-html/compare/v3.0.0...v3.0.6) (2022-02-10)

### Bug Fixes

- fix base configuration causing local development errors ([6deeead](https://github.com/vbenjs/vite-plugin-html/commit/6deeead53f02007effd42b013d0eb03390f0a9a2))
- fs-extra no longer exports existsSync ([#25](https://github.com/vbenjs/vite-plugin-html/issues/25)) ([d6614da](https://github.com/vbenjs/vite-plugin-html/commit/d6614dae2ab5d2f53d54ec480e1212613819186b))
- history mode support ([20a7c69](https://github.com/vbenjs/vite-plugin-html/commit/20a7c69ed7f8f355bda923dd9f84717727276c67))
- make sure template defaults are correct ([697626c](https://github.com/vbenjs/vite-plugin-html/commit/697626cb62db42c1853788ac4019a834822b19e5))

## [3.0.5](https://github.com/vbenjs/vite-plugin-html/compare/v3.0.0...v3.0.5) (2022-02-09)

### Bug Fixes

- fix base configuration causing local development errors ([6deeead](https://github.com/vbenjs/vite-plugin-html/commit/6deeead53f02007effd42b013d0eb03390f0a9a2))
- fs-extra no longer exports existsSync ([#25](https://github.com/vbenjs/vite-plugin-html/issues/25)) ([d6614da](https://github.com/vbenjs/vite-plugin-html/commit/d6614dae2ab5d2f53d54ec480e1212613819186b))
- history mode support ([20a7c69](https://github.com/vbenjs/vite-plugin-html/commit/20a7c69ed7f8f355bda923dd9f84717727276c67))
- make sure template defaults are correct ([697626c](https://github.com/vbenjs/vite-plugin-html/commit/697626cb62db42c1853788ac4019a834822b19e5))

## [3.0.4](https://github.com/vbenjs/vite-plugin-html/compare/v3.0.0...v3.0.4) (2022-02-07)

### Bug Fixes

- fix base configuration causing local development errors ([6deeead](https://github.com/vbenjs/vite-plugin-html/commit/6deeead53f02007effd42b013d0eb03390f0a9a2))
- fs-extra no longer exports existsSync ([#25](https://github.com/vbenjs/vite-plugin-html/issues/25)) ([d6614da](https://github.com/vbenjs/vite-plugin-html/commit/d6614dae2ab5d2f53d54ec480e1212613819186b))
- history mode support ([4b0a54f](https://github.com/vbenjs/vite-plugin-html/commit/4b0a54fd08dd3e065b239ef0587dc683263db343))
- make sure template defaults are correct ([697626c](https://github.com/vbenjs/vite-plugin-html/commit/697626cb62db42c1853788ac4019a834822b19e5))

## [3.0.2](https://github.com/vbenjs/vite-plugin-html/compare/v3.0.0...v3.0.2) (2022-01-28)

### Bug Fixes

- fix base configuration causing local development errors ([6deeead](https://github.com/vbenjs/vite-plugin-html/commit/6deeead53f02007effd42b013d0eb03390f0a9a2))
- fs-extra no longer exports existsSync ([#25](https://github.com/vbenjs/vite-plugin-html/issues/25)) ([d6614da](https://github.com/vbenjs/vite-plugin-html/commit/d6614dae2ab5d2f53d54ec480e1212613819186b))
- make sure template defaults are correct ([697626c](https://github.com/vbenjs/vite-plugin-html/commit/697626cb62db42c1853788ac4019a834822b19e5))

## [3.0.2](https://github.com/vbenjs/vite-plugin-html/compare/v3.0.0...v3.0.2) (2022-01-27)

### Bug Fixes

- fs-extra no longer exports existsSync ([#25](https://github.com/vbenjs/vite-plugin-html/issues/25)) ([d6614da](https://github.com/vbenjs/vite-plugin-html/commit/d6614dae2ab5d2f53d54ec480e1212613819186b))
- make sure template defaults are correct ([697626c](https://github.com/vbenjs/vite-plugin-html/commit/697626cb62db42c1853788ac4019a834822b19e5))

## [3.0.1](https://github.com/vbenjs/vite-plugin-html/compare/v3.0.0...v3.0.1) (2022-01-27)

### Bug Fixes

- make sure template defaults are correct ([697626c](https://github.com/vbenjs/vite-plugin-html/commit/697626cb62db42c1853788ac4019a834822b19e5))

# [3.0.0-beta.1](https://github.com/vbenjs/vite-plugin-html/compare/v3.0.0...v3.0.0-beta.1) (2022-01-27)

### Bug Fixes

- make sure template defaults are correct ([697626c](https://github.com/vbenjs/vite-plugin-html/commit/697626cb62db42c1853788ac4019a834822b19e5))

## [2.1.2](https://github.com/vbenjs/vite-plugin-html/compare/v2.0.6...v2.1.2) (2021-12-27)

### Bug Fixes

- ssr error,close [#18](https://github.com/vbenjs/vite-plugin-html/issues/18) ([f799d98](https://github.com/vbenjs/vite-plugin-html/commit/f799d9821ec9b22bbbfd8b92ddcb4d25cc18219e))

### Features

- expose minifyFn ([c6409dc](https://github.com/vbenjs/vite-plugin-html/commit/c6409dc25e118b47adff250ab4dd0a239803258b))

## [2.1.1](https://github.com/vbenjs/vite-plugin-html/compare/v2.0.6...v2.1.1) (2021-09-27)

### Features

- expose minifyFn ([c6409dc](https://github.com/vbenjs/vite-plugin-html/commit/c6409dc25e118b47adff250ab4dd0a239803258b))

# [2.1.0](https://github.com/vbenjs/vite-plugin-html/compare/v2.0.6...v2.1.0) (2021-08-20)

### Features

- expose minifyFn ([c6409dc](https://github.com/vbenjs/vite-plugin-html/commit/c6409dc25e118b47adff250ab4dd0a239803258b))
- **inject:** inject the contents of the .env file into index.html ([5b52d7e](https://github.com/vbenjs/vite-plugin-html/commit/5b52d7e654c1056f6a368f4c7df0de8a63b61874))

## [2.0.7](https://github.com/vbenjs/vite-plugin-html/compare/v2.0.6...v2.0.7) (2021-04-16)

### Features

- expose minifyFn ([c6409dc](https://github.com/vbenjs/vite-plugin-html/commit/c6409dc25e118b47adff250ab4dd0a239803258b))

## [2.0.4](https://github.com/vbenjs/vite-plugin-html/compare/v2.0.2...v2.0.4) (2021-04-05)

## [2.0.3](https://github.com/vbenjs/vite-plugin-html/compare/v2.0.2...v2.0.3) (2021-03-02)

## [2.0.2](https://github.com/vbenjs/vite-plugin-html/compare/v2.0.1...v2.0.2) (2021-02-23)

### Features

- add gihub action ([3569c1c](https://github.com/vbenjs/vite-plugin-html/commit/3569c1c097be457fe91b5bb39c2bd56e61753fc9))

# [2.0.0-rc.1](https://github.com/vbenjs/vite-plugin-html/compare/v2.0.0-beta.2...v2.0.0-rc.1) (2021-01-29)

### Bug Fixes

- css build error ([12cd218](https://github.com/vbenjs/vite-plugin-html/commit/12cd218c3f02267022eed06eea18c8e67d4119ff))
- fix css compression failure [#1](https://github.com/vbenjs/vite-plugin-html/issues/1) ([b62e99c](https://github.com/vbenjs/vite-plugin-html/commit/b62e99cd809a0a581cbd1e1dae9260d0b35e9abb))

### Features

- inject title to viteHtmlPluginOptions ([3b34151](https://github.com/vbenjs/vite-plugin-html/commit/3b341516cc78c83619d672ab1c5316a4339a92ac))

# 2.0.0-beta.2 (2021-01-03)