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
export const DEFAULT_ACTION = 'Full body front view, standing and smiling';
export const DEFAULT_BACKGROUND = 'Plain white background';

export function buildCharacterStudioPrompt({
  description = '',
  action = '',
  styleInfo = '',
  withReferenceImage = false,
}) {
  const parts = [];
  const desc = (description || '').trim();
  const act = (action || '').trim();
  const bg = DEFAULT_BACKGROUND;

  if (desc) parts.push(desc);
  if (act) parts.push(`ACTION: ${act}`);
  parts.push(`BACKGROUND: ${bg}`);
  if (styleInfo) parts.push(`STYLE: ${styleInfo}`);
  if (withReferenceImage) {
    parts.push(
      '参考附图中的角色形象，保持面部特征、发型、服装与体型一致，仅根据 ACTION 改变姿势与表情，使用纯色白背景。'
    );
  }

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
