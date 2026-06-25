# AI English Coach

一款给软件工程师用的 Chrome 扩展：边读英文技术博客边学英语。

## 功能

- 在侧边栏 (Side Panel) 中分析当前页 / 任意 URL 的英文技术文章
- 划词右键 → 即刻获取词组与语境分析
- 导出双语对照 + 思维导图 + 词组卡片的 PDF（开发中）

## 开发

```bash
npm install
npm run build        # 构建到 dist/
npm run dev          # 监听模式
```

加载到 Chrome：
1. 打开 `chrome://extensions`
2. 启用右上角"开发者模式"
3. 点"加载已解压的扩展程序"，选择本仓库的 `dist/` 文件夹

## 设置

加载扩展后，右键扩展图标 → "选项"（或在 `chrome://extensions` 详情页打开），填入 Anthropic 或 OpenAI 的 API Key。

## 技术栈

- Manifest V3
- Vanilla JS + Vite
- Anthropic Messages API / OpenAI Chat Completions API
- html2pdf.js（PDF 导出）
