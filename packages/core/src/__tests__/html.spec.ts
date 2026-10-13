import { createPlugin, createSpaPage, renderHtml } from '../htmlPlugin'
import { describe, test, expect } from 'vitest'

const createVitePlugin = () => {
  const { name } = createPlugin()
  return {
    name,
  }
}

describe('html plugin test.', () => {
  test('make sure name.', async () => {
    const { name } = await createVitePlugin()
    expect(name).toEqual('vite:html')
  })
})

describe('function test.', () => {
  test('createSpaPage function test.', async () => {
    const page = createSpaPage('main.ts', 'public/index.html', {
      data: {
        a: '1',
      },
      ejsOptions: {},
    })
    expect(page).toEqual({
      filename: 'index.html',
      template: 'public/index.html',
      entry: 'main.ts',
      inject: {
        data: {
          a: '1',
        },
        ejsOptions: {},
      },
    })
  })

  test('createSpaPage defaults inject to {}.', () => {
    const page = createSpaPage(undefined, 'index.html')
    expect(page.inject).toEqual({})
  })

  test('renderHtml function test.', async () => {
    const content = await renderHtml(
      `
<!DOCTYPE html>
<html>
  <head>
    <title><%- title %></title>
    <title><%- ENV_TITLE %></title>
  </head>
</html>
`,
      {
        inject: {
          data: {
            title: 'test-title',
          },
        },
        viteConfig: {} as any,
        env: {
          ENV_TITLE: 'env-title',
        },
      },
    )
    expect(content).toEqual(`
<!DOCTYPE html>
<html>
  <head>
    <title>test-title</title>
    <title>env-title</title>
  </head>
</html>
`)
  })

  test('renderHtml injects entry script before </body>.', async () => {
    const content = await renderHtml(
      `<!DOCTYPE html>
<html>
  <body>
    <div id="app"></div>
  </body>
</html>`,
      {
        inject: {},
        viteConfig: {} as any,
        env: {},
        entry: 'src/main.ts',
      },
    )
    expect(content).toContain('<script type="module" src="/src/main.ts"></script>\n</body>')
  })

  test('renderHtml strips leading ./ from entry.', async () => {
    const content = await renderHtml('<html><body></body></html>', {
      inject: {},
      viteConfig: {} as any,
      env: {},
      entry: './src/main.ts',
    })
    expect(content).toContain('src="/src/main.ts"')
  })

  test('renderHtml keeps an absolute entry path as-is.', async () => {
    const content = await renderHtml('<html><body></body></html>', {
      inject: {},
      viteConfig: {} as any,
      env: {},
      entry: '/abs/main.ts',
    })
    expect(content).toContain('src="/abs/main.ts"')
  })

  test('page-level data takes precedence over env.', async () => {
    const content = await renderHtml('<%- title %>', {
      inject: {
        data: {
          title: 'page',
        },
      },
      viteConfig: {} as any,
      env: {
        title: 'env',
      },
    })
    expect(content).toEqual('page')
  })
})
