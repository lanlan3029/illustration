// 解析模板，提取占位符
export function parseTemplate(md) {
  const re = /\{\{([^}]+)\}\}/g;
  const tokens = [];
  const counters = {};
  let last = 0;
  let m;

  while ((m = re.exec(md))) {
    if (m.index > last) {
      tokens.push({ type: 'text', value: md.slice(last, m.index) });
    }
    const name = m[1].trim();
    counters[name] = counters[name] || 0;
    const idx = counters[name]++;
    tokens.push({ type: 'var', name, key: `${name}-${idx}` });
    last = m.index + m[0].length;
  }

  if (last < md.length) {
    tokens.push({ type: 'text', value: md.slice(last) });
  }

  return tokens;
}

// 渲染模板，将占位符替换为实际值
export function renderTemplate(template, selections) {
  if (!template) return '';
  
  let result = template;
  
  // 处理条件块 {{#variable}}...{{/variable}}
  // 需要递归处理嵌套的条件块
  let maxIterations = 10; // 防止无限循环
  let iteration = 0;
  
  while (result.includes('{{#') && iteration < maxIterations) {
    result = result.replace(/\{\{#(\w+)\}\}(.*?)\{\{\/\1\}\}/gs, (match, key, content) => {
      const value = selections[key];
      if (value && value.trim()) {
        // 如果变量有值，渲染内容块（先处理内容块中的变量）
        let renderedContent = content;
        // 处理内容块中的变量替换
        renderedContent = renderedContent.replace(/\{\{(\w+)\}\}/g, (m, varKey) => {
          return selections[varKey] || '';
        });
        return renderedContent;
      }
      return ''; // 如果变量为空，返回空字符串
    });
    iteration++;
  }
  
  // 处理剩余的简单变量替换 {{variable}}
  result = result.replace(/\{\{([^}]+)\}\}/g, (match, name) => {
    const key = name.trim();
    return selections[key] || '';
  });
  
  // 清理多余的标点符号和空格，使输出更连贯
  // 1. 合并多个连续的逗号
  result = result.replace(/，+/g, '，');
  // 2. 去除逗号前后的多余空格，但保留逗号后的一个空格（如果需要）
  result = result.replace(/\s*，\s*/g, '，');
  // 3. 去除连续的逗号（可能由条件块产生）
  result = result.replace(/，+/g, '，');
  // 4. 去除首尾的逗号和空格
  result = result.replace(/^[，,\s]+|[，,\s]+$/g, '');
  // 5. 合并多个空格为一个
  result = result.replace(/\s{2,}/g, ' ');
  // 6. 去除首尾空格
  result = result.trim();
  
  return result;
}
