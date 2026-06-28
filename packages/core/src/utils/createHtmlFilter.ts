export const htmlFilter = (fileName: string): boolean =>
  fileName.endsWith('.html') && !fileName.startsWith('.')
