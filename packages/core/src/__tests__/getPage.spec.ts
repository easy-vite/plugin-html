import { getPage, getPageConfig } from '../htmlPlugin'
import { describe, test, expect } from 'vitest'
import path from 'node:path'

const makeConfig = (input: Record<string, string>, root = '/root') =>
  ({
    root,
    build: {
      rollupOptions: {
        input,
      },
    },
  }) as any

describe('getPage test.', () => {
  test('SPA returns a page wired to the global inject.', () => {
    const page = getPage(
      {
        entry: 'src/main.ts',
        template: 'index.html',
        inject: {
          data: {
            a: 1,
          },
        },
      },
      '/root/index.html',
      makeConfig({
        index: '/root/index.html',
      }),
    )
    expect(page).toEqual({
      entry: 'src/main.ts',
      filename: 'index.html',
      template: 'index.html',
      inject: {
        data: {
          a: 1,
        },
      },
    })
  })
})

describe('getPageConfig test.', () => {
  const pages = [
    {
      filename: 'index.html',
      template: 'index.html',
      inject: {
        data: {
          page: 'home',
        },
      },
    },
    {
      filename: 'other.html',
      template: 'sub/other.html',
    },
  ]

  test('matches a page by resolving its template against the vite root.', () => {
    const page = getPageConfig(
      path.join('/root', 'sub/other.html'),
      pages,
      'index.html',
      makeConfig({
        index: '/root/index.html',
        other: '/root/sub/other.html',
      }),
    )
    expect(page.template).toEqual('sub/other.html')
  })

  // v5: pages used to be matched against a path derived from process.cwd(),
  // which broke whenever the vite root was not the cwd.
  test('matching works when the vite root differs from cwd.', () => {
    const page = getPageConfig(
      path.join('/elsewhere', 'sub/other.html'),
      [
        {
          filename: 'other.html',
          template: 'sub/other.html',
          inject: {
            data: {
              page: 'other',
            },
          },
        },
      ],
      'index.html',
      makeConfig(
        {
          other: '/elsewhere/sub/other.html',
        },
        '/elsewhere',
      ),
    )
    expect(page.inject).toEqual({
      data: {
        page: 'other',
      },
    })
  })

  test('unmatched filename falls back to the default template with the global inject.', () => {
    const page = getPageConfig(
      '/root/unknown.html',
      pages,
      'index.html',
      makeConfig({
        index: '/root/index.html',
      }),
      {
        data: {
          global: true,
        },
        tags: [
          {
            tag: 'meta',
          },
        ],
      },
    )
    // v5: the fallback used to drop the global inject entirely.
    expect(page).toEqual({
      filename: 'index.html',
      template: './index.html',
      inject: {
        data: {
          global: true,
        },
        tags: [
          {
            tag: 'meta',
          },
        ],
      },
    })
  })

  test('matched page keeps its own inject untouched.', () => {
    const page = getPageConfig(
      path.join('/root', 'index.html'),
      pages,
      'index.html',
      makeConfig({
        index: '/root/index.html',
      }),
      {
        data: {
          global: true,
        },
      },
    )
    expect(page.inject).toEqual({
      data: {
        page: 'home',
      },
    })
  })
})
