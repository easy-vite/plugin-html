import type { PluginOption } from 'vite'
import type { UserOptions } from './typing'
import { createPlugin } from './htmlPlugin'
import { createMinifyHtmlPlugin } from './minifyHtml'

export function createHtmlPlugin(
  userOptions: UserOptions = {},
): PluginOption[] {
  return [createPlugin(userOptions), createMinifyHtmlPlugin(userOptions)]
}
