# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm install` — install all workspace dependencies (pnpm is enforced via preinstall hook)
- `pnpm build:core` — build the plugin: Vite library mode (ESM + CJS) then `tsc -p tsconfig.build.json` for type declarations
- `pnpm test` — run unit tests via Vitest (single run, no watch)
- `pnpm test --run --reporter=verbose packages/core/src/__tests__/html.spec.ts` — run a single test file
- `pnpm lint` / `pnpm lint:fix` — lint with oxlint (not eslint)
- `pnpm format` / `pnpm format:check` — format with oxfmt (not prettier)
- `pnpm check:wrap` — verify object literals are expanded (see `.claude/rules/code-style.md`)
- `pnpm dev:basic` / `pnpm dev:mpa` / `pnpm dev:entry` / `pnpm dev:base` — build core in watch mode + start a playground dev server

## Architecture

This is a **pnpm monorepo** (`pnpm-workspace.yaml`) for the `@easy-vite/plugin-html` Vite plugin, which provides HTML minification, EJS templating, custom entry/template paths, and MPA (multi-page app) support.

```
packages/
  core/                     # The plugin itself — published to npm
    src/
      index.ts              # Public entry: createHtmlPlugin() returns [plugin, minifyPlugin]
      htmlPlugin.ts         # `vite:html` plugin (enforce: pre) — EJS render, entry injection, MPA routing, closeBundle HTML move
      minifyHtml.ts         # `vite:minify-html` plugin (enforce: post) — html-minifier-terser in generateBundle
      typing.ts             # UserOptions, InjectOptions, PageOption interfaces
      utils/                # isDirEmpty, htmlFilter (createFilter wrapper)
      __tests__/            # Vitest specs (.spec.ts)
    vite.config.ts          # Library build: ESM (.mjs) + CJS (.cjs), all deps externalized
    tsconfig.build.json     # emitDeclarationOnly → dist/*.d.ts
  playground/
    basic/                  # SPA playground (Vue + vue-router)
    mpa/                    # Multi-page app playground
    custom-entry/           # Custom entry/template playground (staticPathPrefixes demo)
    base/                   # Non-root base ('/app/') playground (vanilla)
```

### Plugin design

`createHtmlPlugin(options)` returns **two Vite plugins** as an array:

1. **`vite:html`** (enforce: `pre`)
   - `config` — builds `rollupOptions.input` from `pages` or single `template`
   - `configResolved` — captures resolved config and `loadEnv()` result
   - `configureServer` — installs `connect-history-api-fallback` middleware with rewrites for each page (MPA routing)
   - `transformIndexHtml` — EJS-renders the HTML with `inject.data` + env + define, then swaps the entry `<script type="module">` tag
   - `closeBundle` — moves HTML files from subdirectories (e.g. `public/index.html` output) back to the bundle root and cleans empty dirs

2. **`vite:minify-html`** (enforce: `post`)
   - `generateBundle` — minifies every `.html` asset in the output bundle via `html-minifier-terser`

### Build output

`packages/core/dist/` contains: `index.mjs` (ESM), `index.cjs` (CJS), `index.d.ts` + per-module `.d.ts` files. All runtime deps are externalized in the lib build (see `vite.config.ts` → `rolldownOptions.external`).

## Code style

**The single source of truth is [`.claude/rules/code-style.md`](.claude/rules/code-style.md)** — read it before writing or modifying code.

Enforced in three layers: **oxfmt** (all layout) → **oxlint** (semantics/correctness, config in `.oxlintrc.json`) → **human/AI** (naming, structure), plus a self-built `scripts/checkObjectWrap.mjs` for the one rule oxlint cannot express.

Key oxfmt rules (`.oxfmtrc.json`): no semicolons, single quotes, trailing commas, **100-char print width**, 2-space indentation. Object literals are always expanded (opening brace followed by a newline, one member per line) — `pnpm check:wrap` enforces this.

`lint-staged` runs `oxlint --fix` → `oxfmt` → `node scripts/checkObjectWrap.mjs` on `.ts/.tsx/.vue/.js/.mjs/.cjs`, and `oxfmt` on `.json/.css/.scss/.md`, via the Husky pre-commit hook.

## Constraints

- Node `>=20.19`, pnpm `>=11`
- Vite peer dependency `>=5.0.0`; built and tested against Vite 8 (Rolldown + Oxc)
- CI (`.github/workflows/test.yml`) runs: lint → format check → test → build core → ESM/CJS smoke tests → build all three playgrounds. All must pass.