# 统一作业展示与交换格式（UAF）v1.0

## 1. 范围

UAF（Unified Assignment Format）定义一种面向作业展示与交换的文件格式。一个 UAF PDF 同时包含：

- **展示层**：一至多页人类可读的作业内容；
- **数据层**：嵌入 PDF 的 `uaf_payload.csv`，包含一项或多项作业记录。

不支持 UAF 数据层的 PDF 阅读器仍可按普通 PDF 显示页面。平台导入 UAF 数据时必须读取内嵌 CSV，不得以 OCR 结果替代 UAF 载荷。

UAF 还可包含 HTML 展示制品和工程整合包。正式跨平台交换文件是 PDF；HTML 与整合包均为可选制品。

## 2. 规范用语与文档层级

本文中的规范用语含义如下：

- **必须（MUST）／不得（MUST NOT）**：合规的绝对要求或禁止事项；
- **应（SHOULD）／不应（SHOULD NOT）**：存在合理例外时可不遵循，但实现者应理解并记录相应影响；
- **可（MAY）**：可选项。

下列文件共同构成 UAF v1.0 的规范：

1. 本文：制品类型、PDF、HTML、读取行为、版本与合规条件；
2. [csv-schema.md](./csv-schema.md)：逻辑数据模型与 CSV 编码；
3. [file-integration-standard.md](./file-integration-standard.md) 与 [uaf-artifact-manifest.schema.json](./uaf-artifact-manifest.schema.json)：可选工程整合包。

[visual-spec.md](./visual-spec.md) 和 [html-renderer-spec.md](./html-renderer-spec.md) 是**非规范性参考资料**。它们描述参考实现，不新增或修改合规要求。参考资料与本文冲突时，以本文为准。

## 3. 数据模型

一个 `UafDocument` 包含至少一项作业，记录顺序具有意义。每项作业恰好包含以下四个字段：

| 字段 | 含义 |
|------|------|
| `subject` | 作业科目 |
| `date` | 布置日期或日期时间 |
| `content` | 作业正文 |
| `tags` | 有序标签列表 |

字段约束、记录顺序、CSV 转义和长度限制全部由 [csv-schema.md](./csv-schema.md) 定义。展示层可以调整日期格式、分页和卡片布局，但不得改变数据层所表达的作业内容。

## 4. UAF PDF

### 4.1 文件与页面

合规的 UAF PDF 必须满足以下条件：

1. 是有效 PDF，扩展名为 `.pdf`；
2. 至少包含一页，可包含任意多页；
3. 以可阅读的展示层呈现全部作业记录；
4. 每页包含第 4.3 节规定的水印；
5. 按第 4.2 节嵌入唯一且合法的 `uaf_payload.csv`。

内容超出当前页时，生成器必须续卡或续页，不得以省略号、裁切、隐藏或仅保留于 CSV 的方式静默丢失正文或标签。纸张、方向、颜色、字体、卡片数量和列数不属于 UAF 合规条件。

PDF/A-3 不是 UAF v1.0 的合规要求。

### 4.2 内嵌载荷

PDF 必须通过以下对象路径提供载荷：

```text
Catalog → /Names → /EmbeddedFiles → 名称树
        → FileSpec（UF: uaf_payload.csv）→ /EF → 文件流
```

要求如下：

- 文件名固定为 `uaf_payload.csv`，大小写敏感；
- PDF 中必须恰好存在一个该名称的 UAF 载荷附件，同名重复附件视为非法；
- 文件流解码后必须是 **UTF-8、无 BOM** 的 CSV；
- CSV 必须符合 [csv-schema.md](./csv-schema.md)，且至少包含一项作业；
- MIME 类型应为 `text/csv`。

存在同名重复附件、载荷无法提取或 CSV 非法时，读取器不得将任何部分结果作为合法 UAF 数据导入。

### 4.3 水印

每个 PDF 页面必须清晰可见以下固定文本：

```text
本文件符合UAF标准规范
```

水印的位置、字号和颜色可由实现选择，但不得覆盖正文、标签、科目、日期等作业信息区域。水印仅用于标识文件所声明的格式，不提供数字签名、身份认证、防伪或溯源能力。

## 5. 可选 UAF HTML

UAF HTML 是用于预览、打印和 HTML-to-PDF 转换的展示制品。合规的 UAF HTML 必须：

1. 是完整的 HTML5 文档，包含 `<!DOCTYPE html>`；
2. 自包含，CSS 内联，不依赖外部样式、图像或字体文件；
3. 不包含脚本、事件处理属性、自动跳转、`iframe/object/embed` 或其他活动或外部加载内容；
4. 恰好包含一个 `<template id="uaf-payload-csv" data-filename="uaf_payload.csv">`；
5. 在 template 文本中携带 HTML 转义后的合法 CSV，HTML 解码后能够恢复与展示层一致的 `UafDocument`；
6. 展示全部作业内容，不静默截断或隐藏正文、标签；
7. 包含第 4.3 节的固定水印文本，并在打印输出时使每个页面显示该水印。

HTML 的具体 DOM 结构和 CSS 不属于合规条件。参考模板见 [html-renderer-spec.md](./html-renderer-spec.md)。

## 6. 可选工程整合包

工程整合包用于在 CSV、HTML 和 PDF 必须共同交付时进行完整性校验。它可以是 `.uaf` 目录或 `.uaf.zip` 压缩包，入口为 `uaf-manifest.json`。

整合包不是 PDF 的替代交换格式。其目录结构、manifest、哈希校验和三份制品的一致性规则见 [file-integration-standard.md](./file-integration-standard.md)。

## 7. 读取与错误处理

读取器导入 UAF PDF 时必须依次：

1. 解析 PDF 并确认至少有一页；
2. 从 `/EmbeddedFiles` 名称树提取唯一的 `uaf_payload.csv`；
3. 严格按 UTF-8、无 BOM 解码，再按 CSV 规范解析和校验；
4. 仅在全部校验成功后导入完整的 `UafDocument`，保持记录与标签顺序。

读取器还应验证每页固定水印。仅验证数据结构而未验证水印的实现，不得声称已经完成全部 UAF PDF 合规校验。

| 情况 | UAF 判定与处理 |
|------|----------------|
| PDF 无法解析或页数为零 | 非合规 UAF；不得导入 |
| 缺少 `/EmbeddedFiles` 或载荷附件 | 不是带数据层的 UAF PDF；可按普通 PDF 展示 |
| 载荷重名、无法解码或 CSV 非法 | UAF 数据损坏；不得导入 |
| 水印缺失 | 非合规 UAF；不得声明完整合规 |
| HTML 缺少载荷 template | 不是带数据层的 UAF HTML；可按普通 HTML 展示 |
| HTML 载荷与可见内容不一致 | 非合规 UAF HTML；不得导入或用于生成合规整合包 |

普通 PDF 或 HTML 的降级展示不属于 UAF 数据导入，读取器不得将降级展示误报为成功恢复 UAF 数据。

## 8. 版本与兼容

- 本文件定义的版本为 **1.0**。
- v1.0 CSV 没有版本列，表头和四列结构固定；额外列、缺失列或不同表头均不是 v1.0 载荷。
- v1.0 PDF 不另设版本字段。整合包通过 `uafVersion` 声明版本，但该字段只描述整合包，不改变 PDF 载荷规则。
- 仅支持 v1.0 的读取器不得把未知结构猜测为 v1.0，也不得静默忽略额外列。
- 未来版本的发现、升级和兼容规则由相应版本另行定义；v1.0 不承诺前向兼容。

## 9. 合规对象

实现应明确声明其合规对象：

- **UAF PDF 生成器**：生成满足第 4 节的 PDF；
- **UAF PDF 读取器**：按第 7 节提取并校验数据；
- **UAF HTML 生成器／读取器**：分别满足第 5 节的生成或校验要求；
- **UAF 整合包生成器／读取器**：满足整合包规范；
- **UAF 校验器**：报告其检查的制品类型与检查项，不得以局部检查冒充完整合规证明。

## 10. 参考实现与许可证

语言实现位于 [`implementations/`](../implementations/)，共享样例位于 [`examples/`](../examples/)。这些材料用于说明和测试，不替代规范文本。

许可证：GPL-3.0-or-later。
