<p align="center">
  <img src="./assets/logo-badge.svg" alt="UAF logo" width="96">
</p>

# UAF · 统一作业展示与交换格式

**一份 PDF，人能直接阅读，程序也能原样读回数据。**

UAF（Unified Assignment Format）把一组作业编码为一至多页 PDF，并在 PDF 内嵌一份 `uaf_payload.csv`。页面负责展示，CSV 负责交换——平台无需 OCR 即可恢复结构化作业数据。

```csv
subject,date,content,tags
数学,2026-05-19,完成课本第45页第1、2题，请拍照上传。,必做;几何;重难点
语文,2026-05-19,背诵《静夜思》，完成第二段仿写。,背诵
```

每项作业只有四个字段：`subject`（科目）、`date`（日期）、`content`（正文）、`tags`（标签）。就这么多。

## 为什么这样设计

| 场景 | 做法 |
|------|------|
| 老师、家长查看 | 打开 PDF 直接读，和普通作业单没区别 |
| 平台导入数据 | 从 PDF 附件里取 `uaf_payload.csv`，按规范解析，不走 OCR |
| 老式阅读器 | 不识别附件也能当普通 PDF 打开，内容不丢 |

三种制品按需选择：PDF 是正式交换格式；自包含 HTML 用于预览与打印；`.uaf` 工程整合包用于多制品一起交付时做完整性校验。

## 快速上手

**TypeScript / Node**

```bash
cd implementations/typescript
pnpm install && pnpm build

# 从样例 CSV 生成 PDF 和 HTML
pnpm exec uaf create -o homework.pdf --from ../../examples/uaf_payload.sample.csv
pnpm exec uaf render-html -o homework.html --from ../../examples/uaf_payload.sample.csv

# 反向校验与提取
pnpm exec uaf validate homework.pdf
pnpm exec uaf extract homework.pdf -o payload.csv
```

**Flutter / Dart**

```bash
cd implementations/flutter
dart pub get && dart test
dart run example/unified_assignment_format_example.dart
```

更多 SDK 用法与发布说明见 [implementations/](./implementations/)。

## 文档

**规范（规范性）**

- [UAF v1.0 总规范](./spec/uaf-v1.0.md) — 制品类型、PDF、读取行为、合规条件
- [CSV 数据规范](./spec/csv-schema.md) — 四字段模型与编码细节
- [工程整合包规范](./spec/file-integration-standard.md) — `.uaf` 目录与 manifest

**参考（非规范性）**

- [视觉参考](./spec/visual-spec.md)、[HTML 渲染器参考](./spec/html-renderer-spec.md)

## 仓库结构

```text
spec/             UAF v1.0 规范
examples/         共享样例（CSV / HTML / PDF / .uaf）
implementations/  各语言 SDK 与 CLI
  ├── typescript/   @uaf/core · @uaf/html · @uaf/pdf · uaf CLI
  ├── csharp/       .NET 实现
  └── flutter/      Flutter / Dart 实现
```

## 平台读取流程

1. 用户上传 `.pdf`
2. 从 PDF 的 `/EmbeddedFiles` 提取 `uaf_payload.csv`
3. 按 [CSV 数据规范](./spec/csv-schema.md) 解析四字段，保持记录与标签顺序
4. 校验全部通过才导入；识别不了附件时按普通 PDF 展示，不算导入失败

## 许可证

GPL-3.0-or-later，见 [LICENSE](./LICENSE)。
