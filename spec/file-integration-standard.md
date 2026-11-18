# UAF 工程整合包规范 v1.0

## 1. 范围与形式

本文件定义可选的 UAF 工程整合包，用于在构建、校验、归档和跨语言测试中共同交付载荷 CSV、展示 HTML 与交换 PDF。规范用语遵循 [uaf-v1.0.md](./uaf-v1.0.md)。

整合包可以采用两种形式：

- 名称以 `.uaf` 结尾的目录；
- 名称以 `.uaf.zip` 结尾的 ZIP 压缩包。

正式跨平台交换文件仍是包内的 `document.pdf`，整合包本身不替代 UAF PDF。

## 2. 文件布局

两种形式必须具有相同的相对布局，并至少包含：

```text
uaf-manifest.json
uaf_payload.csv
display.html
document.pdf
```

可以包含额外支持文件，但每个支持文件都必须在 manifest 的 `artifacts` 中登记，并使用 `supporting` 角色。除 `uaf-manifest.json` 外，包内不得存在未登记文件。

`uaf-manifest.json` 本身不列入 `artifacts`，因此不需要、也不可能记录自身最终字节的 SHA-256。

## 3. Manifest

程序必须先读取包根的 `uaf-manifest.json`。它必须是 UTF-8 JSON，并符合 [uaf-artifact-manifest.schema.json](./uaf-artifact-manifest.schema.json)。

manifest 包含：

- `schemaVersion`：manifest schema 版本，v1.0 固定为 `1.0`；
- `packageKind`：固定为 `uaf-artifact-set`；
- `uafVersion`：UAF 数据与制品规范版本，v1.0 固定为 `1.0`；
- `createdAt`：符合 JSON Schema `date-time` 语义的 RFC 3339 日期时间；
- `entrypoints`：三份必需制品的固定相对路径；
- `artifacts`：除 manifest 自身外每个打包文件的完整性记录；
- `pipeline`：展示层和 PDF 的生成方式。

### 3.1 必需入口与角色

| `entrypoints` 成员 | 固定路径 | 必需角色 | 媒体类型 |
|--------------------|----------|----------|----------|
| `payload` | `uaf_payload.csv` | `payload.csv` | `text/csv; charset=utf-8` |
| `display` | `display.html` | `display.html` | `text/html; charset=utf-8` |
| `exchange` | `document.pdf` | `exchange.pdf` | `application/pdf` |

每个必需角色必须恰好出现一次，其 `path` 必须与对应入口一致。支持文件只能使用 `supporting` 角色。

每个 artifact 记录包含：

- `role`：制品角色；
- `path`：相对包根的路径；
- `mediaType`：媒体类型；
- `bytes`：文件字节数；
- `sha256`：文件内容的 64 位小写十六进制 SHA-256。

### 3.2 路径与唯一性

所有路径必须：

- 相对于包根，并使用 `/` 分隔；
- 不是绝对路径、URL 或带驱动器前缀的路径；
- 不包含 `..`、`.`、空路径段或反斜杠；
- 解析后仍位于包根内。

路径和必需角色不得重复。读取器还应拒绝在当前文件系统上会发生大小写或 Unicode 归一化碰撞的路径，防止一个 manifest 条目指向不唯一的文件。

## 4. 读取算法

读取整合包的程序必须：

1. 打开目录，或安全读取 ZIP 条目，确保任何条目都不会解析到包根之外；
2. 读取并解析 `uaf-manifest.json`；
3. 校验 JSON Schema，并执行本文件规定的版本、角色、入口、媒体和路径语义校验；
4. 确认除 manifest 外不存在未登记文件，且每个登记文件都存在；
5. 对每个 artifact 比较实际字节数和 SHA-256；
6. 按 [csv-schema.md](./csv-schema.md) 解析 `entrypoints.payload`；
7. 按总规范校验 `entrypoints.display` 和 `entrypoints.exchange`；
8. 分别从 CSV、HTML template（`id` 为 `uaf-payload-csv`，见总规范第 5 节）和 PDF 附件恢复 `UafDocument`；
9. 比较三份逻辑载荷，确认记录数量、记录顺序、四个字段及标签顺序逐项一致。

任一步骤失败时，整个整合包无效。消费者仍可将 PDF 作为普通文件展示，但不得把包内任何部分载荷导入系统记录，也不得把逻辑载荷一致替代哈希或制品合规检查。

三份载荷的比较是**逻辑数据比较**，不是 CSV 字节比较；CSV 引号风格或记录分隔符不同不会自行造成逻辑载荷不一致。

## 5. 生成算法

整合包生成器应：

1. 创建或校验非空 `UafDocument`；
2. 按记录顺序生成 `uaf_payload.csv`；
3. 生成合规的自包含 `display.html`；
4. 将展示内容生成一至多页 `document.pdf`，并嵌入同一逻辑载荷；
5. 确认三份制品分别合规，且恢复的 `UafDocument` 一致；
6. 将三份制品和可选支持文件写入干净的 `.uaf` 目录；
7. 计算除 manifest 外每个文件的字节数和 SHA-256；
8. 最后写入 `uaf-manifest.json`；
9. 如需 ZIP，保持相同相对路径，不额外包裹一层目录。

HTML-to-PDF 路径可使用以下 pipeline 描述：

```json
{
  "pipeline": {
    "renderer": "html-to-pdf",
    "printEngine": "browser-print",
    "payloadAttachment": "uaf_payload.csv"
  }
}
```

原生 PDF 生成器可使用 schema 允许的其他引擎，例如 C# 的 `dotnet-native` 或 Flutter/Dart 的 `dart-native`。

## 6. JSON Schema 与语义校验的关系

[uaf-artifact-manifest.schema.json](./uaf-artifact-manifest.schema.json) 定义 JSON 结构、字段类型、枚举和路径字符约束。它不单独证明整合包合规。

固定入口与角色对应关系、角色和路径唯一性、文件集合完整性、实际字节数、SHA-256、三份制品合规及逻辑载荷一致性，必须按本文件另行校验。仅通过 JSON Schema 校验的 manifest 不得被报告为已通过完整整合包验证。

## 7. TypeScript 示例

TypeScript 参考实现提供以下脚本：

```bash
cd implementations/typescript
pnpm build
pnpm run generate:sample
pnpm run package:sample
pnpm run read:sample-package
```

- `package:sample` 生成 `examples/sample-homework.uaf/`；
- `read:sample-package` 读取 manifest、校验哈希与三份制品，并比较恢复后的逻辑载荷。
