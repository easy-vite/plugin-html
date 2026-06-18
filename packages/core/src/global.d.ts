declare module 'connect-history-api-fallback' {
  interface ParsedUrl {
    path: string
    [key: string]: unknown
  }
  interface Rewrite {
    from: RegExp
    to: string | ((context: { parsedUrl: ParsedUrl }) => string | void)
  }
  interface Options {
    disableDotRule?: boolean
    htmlAcceptHeaders?: string[]
    rewrites?: Rewrite[]
    [key: string]: unknown
  }
  type NextHandleFunction = (
    req: unknown,
    res: unknown,
    next: () => void,
  ) => void
  const history: (options?: Options) => NextHandleFunction
  export default history
}
