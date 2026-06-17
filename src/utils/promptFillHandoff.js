/** 提示词填空器 → 创作工作台：一次性带回生成的提示词 */
const PENDING_KEY = 'prompt_fill_pending';

export function setPromptFillPending(prompt) {
  if (!prompt || !String(prompt).trim()) return;
  sessionStorage.setItem(PENDING_KEY, String(prompt).trim());
}

export function takePromptFillPending() {
  const text = sessionStorage.getItem(PENDING_KEY) || '';
  sessionStorage.removeItem(PENDING_KEY);
  return text;
}

export function resolvePromptFillReturnPath(queryReturn) {
  if (typeof queryReturn !== 'string') return '';
  const path = queryReturn.trim();
  if (!path.startsWith('/') || path.startsWith('//')) return '';
  return path;
}
