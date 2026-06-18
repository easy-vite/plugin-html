import { readdir } from 'node:fs/promises'

export async function isDirEmpty(dir: string) {
  const files = await readdir(dir)
  return files.length === 0
}
