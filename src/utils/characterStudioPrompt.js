import { getStyleInfoText } from '@/utils/aibooksPrompts';

export const ASPECT_RATIO_OPTIONS = [
  { value: '1024x1024', labelKey: 'characterStudio.ratioSquare' },
  { value: '960x1280', labelKey: 'characterStudio.ratioPortrait' },
  { value: '1280x960', labelKey: 'characterStudio.ratioLandscape' },
];

export const INSPIRE_PROMPTS = [
  '7-year-old girl with pigtails, yellow raincoat, red boots, curious smile',
  'Friendly orange fox in a cowboy hat, denim vest, standing full body',
  'Elderly grandfather with round glasses, cardigan sweater, kind eyes',
  'Small robot with big round eyes, teal body, antenna on head',
  'Fluffy white rabbit wearing a blue scarf, holding a carrot',
  'Young astronaut in a white suit, helmet under arm, cheerful expression',
];
export const DEFAULT_ACTION = '';
export const DEFAULT_BACKGROUND = 'Plain white background';

/** 正面参考图默认站姿：与用户描述中的动作/姿势分离，避免「托腮坐着」等描述污染三视图 */
export const DEFAULT_FRONT_ACTION =
  '完整全身正面立绘，自然站立，面向镜头，双臂自然垂于身体两侧，双脚并拢，完整呈现从头顶到鞋底，无裁切。';

export const FRONT_APPEARANCE_INSTRUCTION =
  '说明：仅从 APPEARANCE 中提取外貌特征（年龄、性别、发型、脸型、五官、服装、鞋子、配饰与配色），忽略其中的动作、姿势、表情互动或场景描述。人物姿势必须严格按 ACTION 执行。';

export const DEFAULT_VIEW_PROMPTS = {
  side: '同一角色，完整全身侧面立绘，侧向站立，纯色白背景，保持发型、服装、体型与正面一致。',
  back: '同一角色，完整全身背面立绘，背对镜头站立，纯色白背景，保持发型、服装、体型与正面一致。',
};

export function buildCharacterStudioPrompt({
  description = '',
  action = '',
  styleInfo = '',
  withReferenceImage = false,
  /** 角色工作台正面参考图：外貌与站姿分离，强制默认站立正面 */
  referenceFrontSheet = false,
}) {
  const parts = [];
  const desc = (description || '').trim();
  const act = (
    action || (referenceFrontSheet ? DEFAULT_FRONT_ACTION : DEFAULT_ACTION)
  ).trim();
  const bg = DEFAULT_BACKGROUND;

  if (referenceFrontSheet && desc) {
    parts.push(`APPEARANCE: ${desc}`);
    parts.push(FRONT_APPEARANCE_INSTRUCTION);
  } else if (desc) {
    parts.push(desc);
  }

  if (act) parts.push(`ACTION: ${act}`);
  parts.push(`BACKGROUND: ${bg}`);
  if (styleInfo) parts.push(`STYLE: ${styleInfo}`);
  if (withReferenceImage) {
    parts.push(
      referenceFrontSheet
        ? '参考附图中的角色外貌，保持面部特征、发型、服装与体型一致；忽略附图或描述中的非站立姿势，按 ACTION 生成站立正面参考图，使用纯色白背景。'
        : '参考附图中的角色形象，保持面部特征、发型、服装与体型一致，仅根据 ACTION 改变姿势与表情，使用纯色白背景。'
    );
  }

  return parts.join('\n\n');
}

/** 侧面 / 背面：以正面为参考，只改视角相关描述 */
export function buildViewPrompt({ view = 'side', customPrompt = '', styleInfo = '' } = {}) {
  const base = String(customPrompt || DEFAULT_VIEW_PROMPTS[view] || '').trim();
  const parts = [base];
  parts.push(`BACKGROUND: ${DEFAULT_BACKGROUND}`);
  if (styleInfo) parts.push(`STYLE: ${styleInfo}`);
  parts.push(
    '参考附图中的角色正面形象，严格保持同一角色的面部特征、发型、服装与体型，仅改变为所需视角，完整全身无裁切。'
  );
  return parts.join('\n\n');
}

export function resolveStyleInfo(styles, styleKey) {
  return getStyleInfoText(styles, styleKey);
}

export function getImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return `https://static.kidstory.cc/${url}`;
}
