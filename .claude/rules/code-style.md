# 代码风格规范

> 本项目代码风格的唯一标准。Claude Code 生成或修改本项目代码时**必须**遵守。
>
> **适用范围**：`packages/**/src/**`、`packages/**/*.config.ts`、`scripts/**` 等一切手写源码。
> **不适用**：`**/dist/**`（构建产物）、`node_modules/**`（依赖）。
>
> 本规范迁移自 `fs-ft-open-voice-app-h5-agent` 项目，并按本项目的库 + monorepo 形态做了裁剪。

## 0. 执行载体（谁保证什么）

规则分三层，**冲突时按此优先级**：

| 层  | 工具          | 负责                                                | 命令              |
| --- | ------------- | --------------------------------------------------- | ----------------- |
| 1   | **oxfmt**     | 一切排版（缩进 / 引号 / 空格 / 换行 / 逗号 / 分号） | `pnpm format`     |
| 2   | **oxlint**    | 语义与正确性                                        | `pnpm lint`       |
| 3   | **人工 / AI** | 工具覆盖不到的：命名、结构、语言特性取舍            | 本文件            |
| —   | **自建脚本**  | oxlint 无对应规则的约定                             | `pnpm check:wrap` |

**关键原则：不要与工具对抗。** oxfmt 格式化后的结果就是标准——不要手写工具会改回去的格式，也不要在 review 里争论工具已经决定的事。提交前 Husky `pre-commit` 会自动跑 `lint-staged`（`oxlint --fix` → `oxfmt` → `checkObjectWrap`）。

## 1. 排版（oxfmt 强制，无需记忆）

`.oxfmtrc.json` 的当前取值即标准：

- 缩进 2 空格，行尾 LF，文件末尾一个空行，行尾不留空格
- **不加分号**（`semi: false`）——ASI 安全由 oxfmt 保证（行首为 `(`、`[`、`` ` ``、`+`、`-`、`/` 时它会自动补前置分号）。**不要手动判断哪里该加分号**
- 单引号（`singleQuote: true`）；需要变量插值时用模板字符串
- **多行结构才有尾随逗号**（`trailingComma: all`），单行不加
- **对象 / 解构 / import / 类型字面量的括号内侧留一个空格**（`bracketSpacing: true`）：`{ a: 1 }`、`const { a, b } = obj`、`import { ref } from 'vue'`。数组不受此项影响，恒为 `[1, 2]`
- 单行最长 **100 列**（`printWidth: 100`），超长由 oxfmt 换行；链式调用每个方法另起一行、以 `.` 开头
- 多行对象 / 数组：左括号后换行，右括号单独一行
- **对象单行还是多行，由「左括号到第一个属性之间有无换行」决定**（`objectWrap: "preserve"`，oxfmt 默认值）：有换行就**保持多行**（哪怕能放进一行也不压回），没有就压成单行。**故想让成员一行一个，唯一要做的就是左括号后立刻换行**；反之若把首属性写在左括号同一行，即使其余成员各自换行也会被整体压回单行
- **对象字面量一律展开**（左括号后换行、每个成员独占一行），**不论位置与成员个数**——`return { top: 0 }`、`createInput({ pages })`、`rm(dir, { recursive: true })`、`{ ...opts }` 都展开。成员多时用 `//` 注释分组
- **空对象 `{}` 例外**：展开成两行没有意义，保持单行
- **类型字面量不在此列**：`Record<string, string>`、`as { label?: unknown }`、`defineProps<{ a: string }>()` 是**类型**而非运行时对象，单行更易读。检查脚本只查 `ObjectLiteralExpression`，不会误报它们
- 上述由 `scripts/checkObjectWrap.mjs` 在 pre-commit 时检查（`pnpm check:wrap` 可手动跑全量）。oxlint 无对应规则，故自建脚本兜住，见第 14 节
- **批量迁移技巧**：`npx oxfmt -c <(echo '{"printWidth":1}') packages/ && npx oxfmt packages/`。极窄宽度先强制展开一切，再用项目配置回压——对象因 `objectWrap: preserve` 保留多行，数组 / 函数调用 / 模板属性自动还原。**注意它会连带展开类型字面量（`as {...}`、元组里的类型），需手工改回**，故只适合一次性迁移，不要常规使用
- 代码块（`if` / `for` / 函数体）首尾不留空行；类方法之间留一个空行；逻辑段落间最多连续 1 个空行
- `else` / `catch` 与 `}` 同行：`} else {`
- 关键字后一个空格（`if (x)`）；函数调用括号前不加空格（`fn()`）；一元运算符不空格（`!a`）；二元运算符两侧空格（`a + b`）
- `switch` 的 `case` 相对 `switch` 缩进一层，`default` 放最后，**禁止穿透**（确需时写注释说明）
- 注释 `//` 后至少一个空格

## 2. 命名

| 对象        | 规则                     | 例                                          |
| ----------- | ------------------------ | ------------------------------------------- |
| 变量 / 函数 | camelCase                | `htmlFilter`、`createInput`                 |
| 模块级常量  | UPPER_SNAKE_CASE         | `DEFAULT_TEMPLATE`、`bodyInjectRE`          |
| 类型 / 接口 | PascalCase               | `UserOptions`、`PageOption`、`RewriteRule`  |
| 源文件      | camelCase                | `htmlPlugin.ts`、`minifyHtml.ts`            |
| 测试文件    | 与被测模块同名 + `.spec` | `htmlPlugin.spec.ts`、`createInput.spec.ts` |

无前导 / 后置下划线约定。禁止用 `undefined` 作变量名。

## 3. 变量与声明

- 优先 `const`，需要重新赋值才用 `let`。**禁用 `var`**
- 禁止同一作用域重复声明
- 未使用变量仅告警不阻断，但不要留死代码

## 4. 函数

- **优先箭头函数**（`const foo = () => {}`），单参数也加括号：`(x) => {}`
- **以下场景必须用 `function`**（箭头函数在语义上不可用）：
  - generator：`function* gen()`，星号紧贴 `function`
  - 需要变量提升（hoisting）
  - 需要作为构造函数
  - 需要与 `this` 绑定的场景
- 箭头函数体：仅单表达式且无副作用时可省略花括号与 `return`，如 `.map((x) => x.name)`
- 多行参数：所有参数（含首个）各占一行，带尾随逗号
- **默认值优先用默认参数或 `??`**（只兜 `null` / `undefined`）；**需要把 `''` / `0` / `false` 一并兜住时才用 `||`**
- 禁止使用 `arguments`，改用剩余参数 `...args`
- 禁止修改参数对象上的属性；对参数本身重新赋值需谨慎（影响调用方传入的引用语义）
- **避免 IIFE**（用模块作用域替代）；确需时写成 `(() => {})()`
- 数组方法回调必须有意义地返回值

## 5. 对象与数组

- 属性名仅在必要时加引号（含特殊字符时）
- 方法用简写：`{ foo() {} }`，不要 `{ foo: function () {} }`
- 属性访问优先 `.`，动态键才用 `[]`
- 禁止重复键名；禁止不必要的计算属性键（写 `{ a: 1 }` 而非 `{ ['a']: 1 }`）
- 元素存在性检查优先 `includes`
- getter / setter 必须成对相邻，**getter 在前**
- 解构过长时每个属性单独一行

## 6. 运算符与表达式

- 强制 `===` / `!==`，禁止 `==` / `!=`
- **`>` `<` `>=` `<=` 只在同类型间比较**（字符串比字符串、数字比数字），不要依赖隐式转换
- **禁止全局 `isNaN()`**（会隐式转数字，`isNaN('abc') === true`），一律用 `Number.isNaN()`
- **混用 `&&` 与 `||` 时必须加括号**——`a && b || c` 的实际优先级是 `(a && b) || c`，极易误读
- 禁止在条件中赋值（额外套一层括号可接受：`while ((m = re.exec(s)))`）
- 禁止无意义的独立表达式
- 禁止 `eval`、`with`、`label`、`__proto__`
- **`void` 仅用于显式丢弃 Promise 结果**（`void promise.catch(handleError)`，见第 9 节），不得用于替代 `undefined`
- 禁止给原生对象（`window` / `document` / `Object` 等）或只读全局量（`undefined` / `Infinity` / `NaN`）赋值
- 禁止使用 `alert` / `prompt` / `confirm`
- **位运算仅限「取整」与「位掩码」场景**（`~~x`、`x | 0`、权限位、颜色 / 哈希计算）；其余场景用算术或逻辑运算表达
- 自增 / 自减：在 `for` 循环的更新表达式中使用；循环外优先 `i += 1`
- `Symbol` 必须提供描述
- 长表达式换行时运算符放行尾，续行缩进 2 空格；字符串拼接允许用 `+` 换行

## 7. 控制流与循环

- `continue` **允许使用**（不要为规避它而加深 `if` 嵌套）
- **遍历对象优先 `Object.keys` / `values` / `entries` + `for...of`**；确需 `for...in` 时必须用 `Object.hasOwn(obj, key)` 过滤原型链
- `for` 循环的更新表达式允许复杂逻辑
- 循环内**可以**创建函数（配合 `let` 捕获循环变量是正确写法）；真正的坑是 `var` + 闭包，已由禁用 `var` 覆盖
- 数组构造器允许特定场景，如 `new Array(10)` 预分配

## 8. 模块

- 导入排序：**内置（`node:*`）→ 第三方 → 本地**，组内按字母序，各组之间空行分隔
- 同一模块的导入合并为一条语句
- 具名导入过长时每个成员单独一行，带尾随逗号
- 类型导入用 `import type { X } from '...'`，与值导入分开
- 本项目为 pnpm monorepo，跨包引用用包名（`@easy-vite/plugin-html`），包内用相对路径
- `export` 随声明分散放置；允许默认导出与具名导出混用
- 测试文件放在被测模块旁的 `__tests__/` 目录

## 9. 异步

- 声明为 `async` 的函数体内**必须有 `await`**，否则用同步函数
- **`return await` 仅在 `try` / `catch` 内使用**（否则 `catch` 捕获不到）；其余场景直接 `return`
- **不允许静默的未处理 Promise**：不需要结果时显式标注，如 `void doSomething().catch(handleError)`
- `new Promise` 的 executor 内不要 `return` 值（会被忽略）
- `setTimeout` / `setInterval` 必须传函数，禁止传字符串
- 回调式 API 优先封装为 Promise

## 10. 其他

- 正则优先字面量；需要动态构造时用 `new RegExp()`
- `parseInt` **必须显式传基数**：`parseInt(x, 10)`
- **禁止 `debugger`**（oxlint 会报 `no-debugger`）
- **库代码不留 `console`**（`no-console` 为 warn；`packages/playground/**` 与 `scripts/**` 已放宽）
- `Function` 构造器禁止使用（等价于 `eval`）
- 允许行尾注释
- **不要求 JSDoc**——本项目约定用**注释**说明「为什么这么做」，而非罗列「做了什么」

## 11. 明确不设限

以下由开发者判断，规范不做要求：文件行数、函数嵌套深度、圈复杂度、参数个数、类成员顺序、注释密度。

## 12. TypeScript 补充

- 禁止 `any`（确需时用 `unknown` + 类型收窄）；`@ts-ignore` 需附原因注释，优先 `@ts-expect-error`
- 例外：`__tests__` 下构造 mock / 部分实现时可用 `as any`（`.oxlintrc.json` 已对测试放宽该规则）
- `interface` 用于对象结构，`type` 用于联合 / 交叉 / 工具类型
- 本项目对外 API 的类型定义集中在 `src/typing.ts`，新增选项同步更新该文件与 README 参数表

## 13. Vue SFC 补充（仅 playground）

`packages/playground/**` 下的演示应用遵循：

- 一律 `<script setup lang="ts">` + Composition API
- 顺序：`<script setup>` → `<template>` → `<style>`
- 组件 props / emits 用泛型写法：`defineProps<T>()`、`defineEmits<{ event: [] }>()`

核心库（`packages/core`）不依赖 Vue，规范第 13 节不适用于它。

## 14. 自动检查覆盖情况

`.oxlintrc.json` 与本节一一对应。**第 1 节排版全部由 oxfmt 强制**，其余各节的覆盖情况如下。

**由 oxlint 强制（违反即阻断提交）**：

| 规范条目                                 | oxlint 规则                                |
| ---------------------------------------- | ------------------------------------------ |
| 禁用 `var` / 优先 `const` / 禁止重复声明 | `no-var`、`prefer-const`、`no-redeclare`   |
| 禁用 `arguments`                         | `prefer-rest-params`                       |
| 禁止修改参数属性                         | `no-param-reassign`                        |
| 数组回调必须返回值                       | `array-callback-return`                    |
| 禁止重复键名 / 多余计算属性键            | `no-dupe-keys`、`no-useless-computed-key`  |
| 方法简写                                 | `object-shorthand`                         |
| getter / setter 配对且 getter 在前       | `accessor-pairs`、`grouped-accessor-pairs` |
| 强制 `===` / `!==`                       | `eqeqeq`                                   |
| 禁止条件中赋值                           | `no-cond-assign`                           |
| 禁止无意义的独立表达式                   | `no-unused-expressions`                    |
| 禁止 `eval` / `label` / `__proto__`      | `no-eval`、`no-labels`、`no-proto`         |
| 禁止给原生对象 / 只读全局量赋值          | `no-extend-native`、`no-global-assign`     |
| 禁止 `alert` / `prompt` / `confirm`      | `no-alert`                                 |
| `Symbol` 必须提供描述                    | `symbol-description`                       |
| `for...in` 必须过滤原型链                | `guard-for-in`                             |
| 禁止空 `new Array()`                     | `no-array-constructor`                     |
| `async` 函数必须含 `await`               | `require-await`                            |
| executor 不得 `return` 值                | `no-promise-executor-return`               |
| 禁止字符串形式 `setTimeout`              | `no-implied-eval`                          |
| `parseInt` 必须传基数                    | `radix`                                    |
| 禁止 `debugger`                          | `no-debugger`                              |
| 禁止 `Function` 构造器                   | `no-new-func`                              |
| 正则优先字面量                           | `prefer-regex-literals`                    |
| 禁止 `any`（测试除外）                   | `typescript/no-explicit-any`               |

**由自建脚本强制（违反即阻断提交）**：

| 规范条目                          | 脚本                  | 命令              |
| --------------------------------- | --------------------- | ----------------- |
| **对象字面量一律展开**（第 1 节） | `checkObjectWrap.mjs` | `pnpm check:wrap` |

之所以自建：oxlint 未实现 `object-property-newline`，而 oxfmt 的 `objectWrap` 只有 `preserve` / `collapse`、无法强制展开。

**无法自动检查（靠人 / AI 自觉，review 时留意）**：

- **混用 `&&` 与 `||` 必须加括号** —— oxlint 未实现 `no-mixed-operators`
- **`return await` 仅限 `try` / `catch` 内** —— oxlint 未实现 `no-return-await`
- **禁止全局 `isNaN()`** —— oxlint 的 `use-isnan` 管的是 `x === NaN` 这种**比较**
- 第 2 节命名规范、第 8 节导入排序、第 4 节 `??` 与 `||` 的取舍、第 6 / 7 节位运算与 `continue` 的放宽边界

**刻意未启用的规则**（与规范的放宽项对应，勿添加）：

`no-continue`、`no-bitwise`、`no-plusplus`、`no-void`（`void` 在本规范中有合法用途，见第 6 节）。