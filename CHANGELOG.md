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
