import { removeEntryScript } from '../htmlPlugin'
import { describe, test, expect, vi } from 'vitest'

describe('removeEntryScript test.', () => {
  test('removes module scripts and keeps non-module ones.', () => {
    const html = `<!DOCTYPE html>
<html>
  <body>
    <script type="module" src="/src/main.ts"></script>
    <script src="/legacy.js"></script>
  </body>
</html>`
    const result = removeEntryScript(html)
    expect(result).not.toContain('/src/main.ts')
    expect(result).toContain('/legacy.js')
  })

  test('empty html is returned untouched.', () => {
    expect(removeEntryScript('')).toEqual('')
  })

  // v5: without any module script to strip, the document must be returned
  // as the exact same string — no parse → re-serialize round-trip.
  test('html without module scripts is returned by reference.', () => {
    const html = '<!DOCTYPE html>\n<html data-keep="1">\n<body>x</body>\n</html>'
    expect(removeEntryScript(html)).toBe(html)
  })

  test('verbose warns about the removed scripts.', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    removeEntryScript('<body><script type="module" src="/a.ts"></script></body>', true)
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0][0]).toContain('/a.ts')
    warn.mockRestore()
  })

  test('verbose stays silent when nothing was removed.', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    removeEntryScript('<body><script src="/a.js"></script></body>', true)
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})
