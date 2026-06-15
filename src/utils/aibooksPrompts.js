/**
 * AI 绘本：故事分镜与逐页生图的提示词拼装、角色设定卡解析。
 */

/** 追加到 /generate-story 的 JSON 结构说明（前端兜底，后端可另行读取 storyGuide） */
export const STORY_JSON_SCHEMA_GUIDE = `【绘本 JSON 输出要求】
必须返回合法 JSON，包含以下字段：
1. title：书名
2. summary：故事摘要（1-2 句）
3. character_profiles：主角与重要配角数组，每项包含：
   - name：角色名
   - appearance：固定外貌（发型发色、脸型、眼睛、服装颜色与款式、体型、配饰等，至少 80 字，全书不可变）
   - personality：性格简述（可选）
4. scenes：每页故事文案数组
5. scenes_detail：每页画面描述数组，与 scenes 等长；每页只描述本页实际出场的角色与场景，不要写入本页未出场的角色；建议在每页开头注明「出场角色：角色A、角色B」（仅列本页会出现的角色）

分镜 4-8 页；scenes 与 scenes_detail 数量必须一致。`;

export const REFERENCE_IMAGE_PROMPT_SUFFIX =
  '参考附图中的主角形象，保持面部特征、发型、服装颜色与款式、体型与附图完全一致，仅根据本页描述改变姿势、表情与场景背景。';

export const CHARACTER_CONSISTENCY_SUFFIX =
  '严格要求：仅绘制本页列出的出场角色，其发型、服装、体型、配色与设定卡一致；不要绘制本页未列出的其他角色。';

/**
 * 从分镜文案中解析「出场角色：A、B」等显式标注。
 */
export function extractExplicitSceneCharacterNames(text) {
  const combined = String(text || '');
  const names = new Set();
  const patterns = [
    /出场角色[：:]\s*([^\n。；;]+)/,
    /本页角色[：:]\s*([^\n。；;]+)/,
    /登场角色[：:]\s*([^\n。；;]+)/,
  ];

  patterns.forEach((re) => {
    const match = combined.match(re);
    if (!match?.[1]) return;
    match[1].split(/[、,，/|+\s]+/).forEach((part) => {
      const name = part.trim().replace(/^和$/, '');
      if (name && name.length >= 1) names.add(name);
    });
  });

  return [...names];
}

/**
 * 根据当页文案，筛选本页应注入的角色设定（避免全员注入导致无关角色出镜）。
 */
export function pickProfilesForPage({ scenePrompt, sceneText, profiles }) {
  if (!profiles?.length) return [];

  const combined = `${sceneText || ''}\n${scenePrompt || ''}`.trim();
  if (!combined) return [];

  const explicitNames = extractExplicitSceneCharacterNames(combined);
  if (explicitNames.length > 0) {
    const matched = profiles.filter((p) => {
      const name = (p.name || '').trim();
      if (!name) return false;
      return explicitNames.includes(name) || explicitNames.some((n) => n.includes(name) || name.includes(n));
    });
    if (matched.length > 0) return matched;
  }

  const sorted = [...profiles].sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));
  const matched = sorted.filter((p) => {
    const name = (p.name || '').trim();
    if (!name || name.length < 2) return false;
    return combined.includes(name);
  });

  return matched;
}

/**
 * 拼装当页角色设定卡（仅含本页出场角色）。
 */
export function buildPageCharacterCard({ scenePrompt, sceneText, profiles }) {
  const pageProfiles = pickProfilesForPage({ scenePrompt, sceneText, profiles });
  return {
    profiles: pageProfiles,
    card: formatCharacterCard(pageProfiles),
    names: pageProfiles.map((p) => p.name).filter(Boolean),
  };
}

/**
 * 为故事生成请求追加角色设定卡输出要求。
 */
export function appendStorySchemaGuide(prompt) {
  const base = (prompt || '').trim();
  if (!base) return STORY_JSON_SCHEMA_GUIDE;
  if (base.includes('character_profiles')) return base;
  return `${base}\n\n${STORY_JSON_SCHEMA_GUIDE}`;
}

/**
 * 从故事 JSON 中提取角色设定列表。
 */
export function extractCharacterProfiles(storyJson) {
  if (!storyJson || typeof storyJson !== 'object') return [];

  const raw = storyJson.character_profiles;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .map((item, index) => normalizeProfile(item, index))
      .filter((p) => p.appearance || p.name);
  }

  if (typeof storyJson.character_card === 'string' && storyJson.character_card.trim()) {
    return [
      {
        name: '主角',
        appearance: storyJson.character_card.trim(),
        personality: '',
      },
    ];
  }

  if (typeof storyJson.character_guide === 'string' && storyJson.character_guide.trim()) {
    return [
      {
        name: '主角',
        appearance: storyJson.character_guide.trim(),
        personality: '',
      },
    ];
  }

  return [];
}

function normalizeProfile(item, index) {
  if (typeof item === 'string') {
    return { name: `角色${index + 1}`, appearance: item.trim(), personality: '' };
  }
  if (!item || typeof item !== 'object') {
    return { name: '', appearance: '', personality: '' };
  }
  return {
    name: String(item.name || item.character_name || `角色${index + 1}`).trim(),
    appearance: String(item.appearance || item.description || item.look || '').trim(),
    personality: String(item.personality || item.character || '').trim(),
  };
}

/**
 * 将角色列表格式化为「角色设定卡」文本（可编辑）。
 */
export function formatCharacterCard(profiles) {
  if (!profiles?.length) return '';
  return profiles
    .map((p) => {
      const lines = [`【${p.name || '角色'}】`];
      if (p.appearance) lines.push(`外貌：${p.appearance}`);
      if (p.personality) lines.push(`性格：${p.personality}`);
      return lines.join('\n');
    })
    .join('\n\n');
}

/**
 * 从用户编辑的设定卡文本解析回 profiles（简易）。
 */
export function parseCharacterCardText(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return [];

  const blocks = trimmed.split(/\n\s*\n/).filter(Boolean);
  if (blocks.length <= 1 && !trimmed.includes('【')) {
    return [{ name: '主角', appearance: trimmed, personality: '' }];
  }

  return blocks.map((block, index) => {
    const nameMatch = block.match(/^【([^】]+)】/);
    const name = nameMatch ? nameMatch[1].trim() : `角色${index + 1}`;
    const appearanceMatch = block.match(/外貌[：:]\s*([\s\S]*?)(?=\n性格[：:]|$)/);
    const personalityMatch = block.match(/性格[：:]\s*([\s\S]*)/);
    let appearance = appearanceMatch ? appearanceMatch[1].trim() : block.replace(/^【[^】]+】\s*/, '').trim();
    if (!appearanceMatch && personalityMatch) {
      appearance = block.replace(/^【[^】]+】\s*/, '').replace(/性格[：:][\s\S]*/, '').trim();
    }
    return {
      name,
      appearance,
      personality: personalityMatch ? personalityMatch[1].trim() : '',
    };
  });
}

/**
 * 拼装单页生图 prompt。
 */
export function buildPageImagePrompt({
  scenePrompt,
  characterCard,
  characterNames = [],
  styleInfo,
  withReferenceImage = false,
}) {
  const parts = [];
  const card = (characterCard || '').trim();
  const scene = (scenePrompt || '').trim();

  if (card) {
    const namesHint = characterNames.length ? `（${characterNames.join('、')}）` : '';
    parts.push(`【本页出场角色·设定卡】${namesHint}\n${card}`);
    parts.push(CHARACTER_CONSISTENCY_SUFFIX);
  }
  if (scene) parts.push(scene);
  if (styleInfo) parts.push(`画风：${styleInfo}`);
  if (withReferenceImage) parts.push(REFERENCE_IMAGE_PROMPT_SUFFIX);

  return parts.join('\n\n');
}

/**
 * 处理 scenes_detail → 可编辑的分镜 prompt 列表。
 */
export function scenesDetailToImagePrompts(scenesDetail) {
  if (!Array.isArray(scenesDetail)) return [];
  const prompts = scenesDetail.map((detail) => {
    const text = String(detail || '');
    return text.replace(/^图片\d+[：:]\s*/, '').trim();
  });

  if (prompts.length > 0) {
    const last = prompts.length - 1;
    prompts[last] =
      `${prompts[last]}\n\n最后，为故事书创作一个封面。再检查所有图片，去除图片中的文字`;
  }

  return prompts;
}

/**
 * 获取当前选中风格的 styleInfo 文本。
 */
export function getStyleInfoText(styles, artStyleKey) {
  if (!artStyleKey || !styles?.length) return '';
  const selected = styles.find((s) => s.key === artStyleKey);
  if (!selected) return '';
  const name = selected.artStyle || '';
  const details = selected.elementDetails || '';
  if (name && details) return `${name}。${details}`;
  return name || details;
}
