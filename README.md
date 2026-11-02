# 统一作业展示与交换格式（UAF）

UAF v1.0 将一组作业编码为一至多页 PDF，并在 PDF 中嵌入包含全部记录的 `uaf_payload.csv`。PDF 页面供人阅读，内嵌 CSV 供平台在不使用 OCR 的情况下恢复结构化数据。

本仓库包含规范、共享样例和多语言实现。规范与样例位于根目录，各语言 SDK/CLI 位于 [`implementations/`](./implementations/)。

## 规范文档

规范性文档：

- [UAF v1.0 总规范](./spec/uaf-v1.0.md)
- [CSV 数据规范](./spec/csv-schema.md)
- [工程整合包规范](./spec/file-integration-standard.md)
- [Artifact Manifest JSON Schema](./spec/uaf-artifact-manifest.schema.json)

非规范性参考：

- [视觉参考](./spec/visual-spec.md)
- [HTML 渲染器参考](./spec/html-renderer-spec.md)

## 共享样例

- [examples/uaf_payload.sample.csv](./examples/uaf_payload.sample.csv)
- [examples/sample-homework.html](./examples/sample-homework.html)
- [examples/sample-homework.pdf](./examples/sample-homework.pdf)
- [examples/sample-homework.uaf/](./examples/sample-homework.uaf/)

## 语言实现

| 语言 | 目录 | 说明 |
|------|------|------|
| TypeScript / Node | [implementations/typescript/](./implementations/typescript/) | `@uaf/core`、`@uaf/html`、`@uaf/pdf`、`uaf` CLI |
| C# | [implementations/csharp/](./implementations/csharp/) | .NET CSV、HTML、PDF 与整合包实现 |
| Flutter / Dart | [implementations/flutter/](./implementations/flutter/) | Flutter/Dart CSV、HTML、PDF 与整合包实现 |

详见 [implementations/README.md](./implementations/README.md)。

## 快速开始（TypeScript）

```bash
cd implementations/typescript
pnpm install
pnpm build
pnpm exec uaf render-html -o homework.html --from ../../examples/uaf_payload.sample.csv
pnpm exec uaf create -o homework.pdf --from ../../examples/uaf_payload.sample.csv
pnpm run generate:sample
pnpm run package:sample
pnpm run read:sample-package
```

安装、CLI、SDK 接入与发布说明见 [implementations/typescript/README.md](./implementations/typescript/README.md)。

## 快速开始（Flutter / Dart）

```powershell
cd implementations/flutter
dart pub get
dart analyze
dart test
dart run example/unified_assignment_format_example.dart
```

接入说明见 [implementations/flutter/README.md](./implementations/flutter/README.md)。

## 平台读取流程

1. 用户上传 `.pdf`；
2. 解析器从 PDF Catalog 的 `/EmbeddedFiles` 提取 `uaf_payload.csv`；
3. 按 [CSV 数据规范](./spec/csv-schema.md) 解析四字段，保持记录与标签顺序；
4. 校验成功后再导入完整作业集合；普通 PDF 展示与 UAF 数据导入分开处理。

## 许可证

GPL-3.0-or-later，见 [LICENSE](./LICENSE)。
