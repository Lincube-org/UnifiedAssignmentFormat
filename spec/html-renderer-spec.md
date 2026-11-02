# UAF HTML 渲染器参考说明 v1.0

> **非规范性参考**：本文描述 TypeScript `@uaf/html` 参考实现及其 HTML-to-PDF 流程。具体 DOM、CSS 和依赖不是第三方实现的合规条件；规范要求见 [uaf-v1.0.md](./uaf-v1.0.md) 与 [csv-schema.md](./csv-schema.md)。

## 1. 参考流程

`@uaf/html` 将 `UafDocument` 渲染为自包含 HTML，用于：

1. 浏览器预览；
2. 用户手动打印；
3. 通过 Puppeteer 或系统 Chrome/Edge 自动打印为 PDF；
4. 在 PDF 中嵌入 `uaf_payload.csv`。

浏览器负责文本测量、换行和分页。参考实现允许一至多页输出，不限制为单页。

## 2. HTML 结构

参考实现生成：

- HTML5 doctype 和内联 `<style>`；
- 包含全部卡片的 `<main class="document">`；
- 固定水印元素；
- `<template id="uaf-payload-csv" data-filename="uaf_payload.csv">`，其文本为 HTML 转义后的 CSV；
- 无脚本、外部资源或事件处理属性。

template 中的 CSV 是机器载荷。可见卡片由同一份 `UafDocument` 生成，长内容通过续卡展示，不使用省略号丢弃正文或标签。

当前 TypeScript `validateUafHtml()` 检查载荷提取、基础打印结构、水印和部分外部资源限制。它不是任意 HTML 可见内容与载荷一致性的通用证明；完整合规仍需满足总规范第 5 节。

## 3. 页面与打印 CSS

参考页面设置：

```css
@page {
  size: A4 portrait;
  margin: 0;
}

@media print {
  body {
    margin: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
```

页面高度为 297mm，内容超出时由浏览器分页。手动打印时建议启用背景图形并关闭浏览器附加页眉、页脚；这些设置影响参考视觉效果，不改变 UAF 数据层。

## 4. 默认布局与样式

参考实现采用双列 CSS Grid，而不是通栏单卡：

```css
.document {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14pt;
  align-items: start;
  padding: 40pt;
}
```

卡片设置 `break-inside: avoid` 和 `page-break-inside: avoid`，高度随内容变化。默认值如下：

| 区域 | 参考样式 |
|------|----------|
| 页面背景 | `#F8FAFC` |
| 卡片 | 白色背景、16pt 圆角、1pt `#E2E8F0` 边框 |
| 卡片内边距 | 24pt |
| 科目胶囊 | `#2563EB` 背景、白色文字、14pt |
| 日期胶囊 | `#F1F5F9` 背景、`#334155` 文字、12pt |
| 正文 | `#0F172A`、22pt、1.5 倍行高 |
| 标签 | `#E0E7FF` 背景、`#3730A3` 文字、11pt |
| 卡片及标签区间距 | 按 14pt、20pt、8pt 等默认值组织 |

正文中的换行渲染为 `<br>`。无标签时不生成空标签容器。

日期显示支持：

- `dateDisplay: "zh"`：默认，尽可能显示为 `YYYY年M月D日`；
- `dateDisplay: "iso"`：保留原始 `date` 字符串。

## 5. 字体与水印

参考 HTML 使用系统字体栈：

```css
font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei",
  "Hiragino Sans GB", "WenQuanYi Micro Hei", sans-serif;
```

HTML 不加载外部字体，但浏览器输出的 PDF 可以嵌入系统字体或其子集。

水印参考样式为右下角 40pt、10pt、`#94A3B8`、50% 透明度。实现使用 `position: fixed`，而不是仅相对整个文档定位一次的绝对定位，以便打印时每页重复显示。固定文本和每页要求由总规范定义。

## 6. 续卡行为

参考实现按内容长度和换行拆分正文：

- 后续正文卡在科目后添加 `（续）`；
- 非最后的正文卡显示 `正文下页继续`；
- 标签只出现在最后一个正文卡及其后的标签续卡；
- 标签过多时追加标签续卡，并显示 `标签下页继续`；
- 分段不改变 template 中的原始 CSV 载荷。

这些提示文案和分组阈值属于参考实现细节，不是跨实现交换协议。

## 7. HTML-to-PDF 自动化

`htmlToPdf()` 优先使用 Puppeteer；未安装 Puppeteer 时，可查找 `UAF_CHROMIUM_EXECUTABLE`、`PUPPETEER_EXECUTABLE_PATH`、`CHROME_PATH` 或常见系统 Chrome/Edge 路径。两者均不可用时，调用会失败并提示安装或配置浏览器。

主要参数默认值：

| 参数 | 默认值 |
|------|--------|
| `width` | `210mm` |
| `height` | `297mm` |
| `printBackground` | `true` |
| `waitUntil` | `networkidle0` |
| `launchOptions` | `{}` |
| `browserArgs` | `[]` |

`createUafPdfFromHtml(payload)` 的参考流程为：

1. 校验并序列化 `UafDocument`；
2. 渲染自包含 HTML；
3. 调用浏览器打印管线生成 PDF；
4. 用 `pdf-lib` 加载 PDF，要求页数至少为 1，接受多页；
5. 嵌入 `uaf_payload.csv`；
6. 保存并返回 PDF 字节。

## 8. 两条 PDF 生成路径

| 特性 | `@uaf/pdf` 原生路径 | `@uaf/html` 浏览器路径 |
|------|---------------------|------------------------|
| 排版 | 代码测量并绘制卡片 | 浏览器排版与分页 |
| 字体 | 显式加载并嵌入字体子集 | HTML 使用系统字体栈；PDF 是否嵌入由浏览器决定 |
| 文件体积 | 受字体子集和页数影响 | 受浏览器、字体和页数影响 |
| 主要依赖 | `pdf-lib`、fontkit 与字体资源 | `pdf-lib` 及可选 Puppeteer 或系统浏览器 |
| 离线条件 | 字体资源可用时可离线生成 | 已有可用浏览器时可离线生成 |

两种路径都必须生成符合总规范的 PDF；选择其中一条路径不构成不同的 UAF 版本。
