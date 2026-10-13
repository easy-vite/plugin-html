import { createInput } from '../htmlPlugin'
import { describe, test, expect } from 'vitest'
import path from 'node:path'

describe('createInput test.', () => {
  test('SPA with root-level template returns undefined (Vite default).', () => {
    const input = createInput(
      {
        template: 'index.html',
      },
      {
        root: '/root',
      } as any,
    )
    expect(input).toBeUndefined()
  })

  test('SPA with template in a subdirectory maps to its input.', () => {
    const input = createInput(
      {
        template: 'public/index.html',
      },
      {
        root: '/root',
      } as any,
    )
    expect(input).toEqual({
      index: path.resolve('/root', 'public/index.html'),
    })
  })

  test('MPA pages map every template to an input key.', () => {
    const input = createInput(
      {
        pages: [
          {
            filename: 'index.html',
            template: 'index.html',
          },
          {
            filename: 'other.html',
            template: 'other.html',
          },
        ],
      },
      {
        root: '/root',
      } as any,
    )
    expect(input).toEqual({
      index: path.resolve('/root', 'index.html'),
      other: path.resolve('/root', 'other.html'),
    })
  })

  test('MPA templates in subdirectories are keyed by their directory.', () => {
    const input = createInput(
      {
        pages: [
          {
            filename: 'index.html',
            template: 'sub/pages/index.html',
          },
        ],
      },
      {
        root: '/root',
      } as any,
    )
    expect(input).toEqual({
      'sub-pages': path.resolve('/root', 'sub/pages/index.html'),
    })
  })

  test('MPA templates in public/ are keyed by their basename.', () => {
    const input = createInput(
      {
        pages: [
          {
            filename: 'index.html',
            template: 'public/index.html',
          },
        ],
      },
      {
        root: '/root',
      } as any,
    )
    expect(input).toEqual({
      index: path.resolve('/root', 'public/index.html'),
    })
  })

  // Regression for v4.2.0: the `config` hook runs before Vite assigns the
  // default root, so `viteConfig.root` is undefined there.
  test('undefined root falls back to process.cwd().', () => {
    const input = createInput(
      {
        template: 'public/index.html',
      },
      {} as any,
    )
    expect(input).toEqual({
      index: path.resolve(process.cwd(), 'public/index.html'),
    })
  })
})
