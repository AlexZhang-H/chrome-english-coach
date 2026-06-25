export function buildSummaryPrompt({ title, text }) {
  const system = `你是一位面向中文母语程序员的英语阅读教练。
读者刚浏览了一篇英文文章，希望你用中文给出一段「文章主旨」总结。

要求：
- 不超过 200 字
- 抓住作者要解决的问题、核心观点、关键结论
- 不要逐段翻译，不要罗列所有细节
- 用平实的口吻直接陈述，不要以"本文"开头
- 只输出总结正文，不要加标题、前言、Markdown 装饰`;

  const user = `文章标题：${title || '(无标题)'}

文章正文：
${text}`;

  return { system, user };
}
