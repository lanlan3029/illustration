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
  return template.replace(/\{\{([^}]+)\}\}/g, (match, name) => {
    const key = name.trim();
    return selections[key] || match;
  });
}
