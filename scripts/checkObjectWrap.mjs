#!/usr/bin/env node
// 检查单行对象字面量 —— 规范要求一律展开（左括号后换行、每个成员独占一行）
// （见 .claude/rules/code-style.md 第 1 节）
//
// 为什么自建脚本而非 lint 规则：
// - oxlint 未实现 object-property-newline（已查证：oxc 仓库 rules.rs 与本地
//   oxlint 二进制均无此规则）
// - oxfmt 的 objectWrap 只有 preserve / collapse 两个值，没有「强制展开」
// 故这条约定只能靠 AST 检查兜住。
//
// 用法：node scripts/checkObjectWrap.mjs <file...>
// 由 lint-staged 在 pre-commit 时调用（只检查本次暂存的文件）；不带参数时扫全量 packages/。

import { readdirSync, readFileSync } from 'node:fs'
import ts from 'typescript'

/**
 * 提取 .vue 的 <script> 块内容
 *
 * 返回正文与其在原文中的起始行偏移 —— 解析的是 script 块，
 * 报错行号需换算回 .vue 文件的实际行号。
 */
function extractScript(source) {
  const match = /<script[^>]*>([\s\S]*?)<\/script>/.exec(source)
  if (!match) return null
  const head = source.slice(0, match.index) + match[0].slice(0, match[0].indexOf('>') + 1)
  return {
    content: match[1],
    lineOffset: head.split('\n').length - 1,
  }
}

/** 找出所有单行对象字面量的位置 */
function findViolations(filePath, source) {
  const script = filePath.endsWith('.vue')
    ? extractScript(source)
    : {
        content: source,
        lineOffset: 0,
      }
  if (!script) return []

  const sf = ts.createSourceFile(
    filePath,
    script.content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  const violations = []

  const visit = (node) => {
    // 空对象 `{}` 跳过 —— 展开成两行没有意义
    if (ts.isObjectLiteralExpression(node) && node.properties.length > 0) {
      // 「单行」= 对象源码文本不含换行。
      // 这正是 oxfmt objectWrap: preserve 的判定依据 —— 左括号后没换行就不会保持多行
      const text = script.content.slice(node.getStart(sf), node.getEnd())
      if (!text.includes('\n')) {
        const pos = sf.getLineAndCharacterOfPosition(node.getStart(sf))
        violations.push({
          line: pos.line + script.lineOffset + 1,
          column: pos.character + 1,
        })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return violations
}

/** 递归收集 packages/ 下的 .ts / .vue 文件（未传参数时的默认扫描范围） */
function collectDefaultFiles(dir = 'packages') {
  const result = []
  let entries
  try {
    entries = readdirSync(dir, {
      withFileTypes: true,
    })
  } catch {
    // 目录不存在时静默返回，交由调用方（lint-staged / CI）自行判断
    return result
  }
  for (const entry of entries) {
    const full = `${dir}/${entry.name}`
    if (entry.isDirectory()) {
      // 跳过依赖与构建产物
      if (entry.name === 'node_modules' || entry.name === 'dist') continue
      result.push(...collectDefaultFiles(full))
    } else if (/\.(ts|vue)$/.test(entry.name)) {
      result.push(full)
    }
  }
  return result
}

const files = process.argv.length > 2 ? process.argv.slice(2) : collectDefaultFiles()
let failed = false

for (const file of files) {
  let source
  try {
    source = readFileSync(file, 'utf-8')
  } catch {
    // 文件不存在（如已被删除）跳过，交给其他工具报错
    continue
  }
  for (const { line, column } of findViolations(file, source)) {
    console.error(`${file}:${line}:${column}  对象字面量需展开（左括号后换行、每个成员独占一行）`)
    failed = true
  }
}

if (failed) {
  console.error('\n规范见 .claude/rules/code-style.md 第 1 节')
  process.exit(1)
}
