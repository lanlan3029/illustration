import {
  buildTemplate,
  CANVAS_W,
  decorationRect,
  editableText,
  photoSlot,
} from './placeholder'

const templates = [
  {
    id: 'single-photo-story',
    category: 'story',
    preview: '/editor-page-templates/single-photo-story.svg',
    json: buildTemplate([
      decorationRect({ left: 0, top: 0, width: CANVAS_W, height: 8, fill: '#8167a9' }),
      photoSlot({ left: 50, top: 80, width: 800, height: 560, label: '照片' }),
      editableText({
        left: 50,
        top: 680,
        width: 800,
        text: '故事标题',
        fontSize: 44,
      }),
      editableText({
        left: 80,
        top: 760,
        width: 740,
        text: '在这里写下这一页的故事…',
        fontSize: 26,
        textAlign: 'left',
      }),
      decorationRect({ left: 50, top: 1080, width: 120, height: 6, fill: '#e8c4a0' }),
    ]),
  },
  {
    id: 'dual-photo',
    category: 'story',
    preview: '/editor-page-templates/dual-photo.svg',
    json: buildTemplate([
      editableText({
        left: 50,
        top: 48,
        width: 800,
        text: '对比与变化',
        fontSize: 40,
      }),
      photoSlot({ left: 50, top: 130, width: 390, height: 390, label: '照片 A' }),
      photoSlot({ left: 460, top: 130, width: 390, height: 390, label: '照片 B' }),
      editableText({
        left: 50,
        top: 560,
        width: 800,
        text: '说明文字：描述两张照片的关系或变化',
        fontSize: 24,
        textAlign: 'left',
      }),
      decorationRect({ left: 0, top: 1150, width: CANVAS_W, height: 50, fill: '#f5f0fa' }),
    ]),
  },
  {
    id: 'grid-four',
    category: 'album',
    preview: '/editor-page-templates/grid-four.svg',
    json: buildTemplate([
      editableText({
        left: 50,
        top: 40,
        width: 800,
        text: '2026 · 06',
        fontSize: 32,
      }),
      photoSlot({ left: 50, top: 110, width: 390, height: 390, label: '1' }),
      photoSlot({ left: 460, top: 110, width: 390, height: 390, label: '2' }),
      photoSlot({ left: 50, top: 520, width: 390, height: 390, label: '3' }),
      photoSlot({ left: 460, top: 520, width: 390, height: 390, label: '4' }),
      editableText({
        left: 50,
        top: 960,
        width: 800,
        text: '这一页的四张小回忆',
        fontSize: 28,
      }),
    ]),
  },
  {
    id: 'cover-page',
    category: 'cover',
    preview: '/editor-page-templates/cover-page.svg',
    json: buildTemplate([
      photoSlot({ left: 0, top: 0, width: CANVAS_W, height: 780, label: '封面照片' }),
      decorationRect({ left: 0, top: 780, width: CANVAS_W, height: 420, fill: '#faf8fc' }),
      editableText({
        left: 60,
        top: 840,
        width: 780,
        text: '我的绘本',
        fontSize: 56,
      }),
      editableText({
        left: 60,
        top: 940,
        width: 780,
        text: '作者 · 日期',
        fontSize: 28,
        textAlign: 'left',
      }),
      decorationRect({ left: 60, top: 1020, width: 80, height: 6, fill: '#8167a9' }),
    ]),
  },
  {
    id: 'diary-page',
    category: 'story',
    preview: '/editor-page-templates/diary-page.svg',
    json: buildTemplate([
      editableText({
        left: 60,
        top: 60,
        width: 200,
        text: '6月23日',
        fontSize: 28,
        textAlign: 'left',
      }),
      editableText({
        left: 60,
        top: 110,
        width: 780,
        text: '今天的心情',
        fontSize: 40,
        textAlign: 'left',
      }),
      photoSlot({ left: 60, top: 200, width: 780, height: 480, label: '照片' }),
      editableText({
        left: 60,
        top: 720,
        width: 780,
        text: '记录今天发生的一件小事，以及你的感受…',
        fontSize: 24,
        textAlign: 'left',
      }),
      decorationRect({ left: 60, top: 180, width: 4, height: 900, fill: '#e8c4a0' }),
    ]),
  },
  {
    id: 'dialogue-page',
    category: 'story',
    preview: '/editor-page-templates/dialogue-page.svg',
    json: buildTemplate([
      photoSlot({ left: 60, top: 80, width: 360, height: 360, label: '角色' }),
      decorationRect({ left: 460, top: 120, width: 380, height: 120, fill: '#f5f0fa' }),
      editableText({
        left: 480,
        top: 145,
        width: 340,
        text: '「对话内容写在这里」',
        fontSize: 26,
        textAlign: 'left',
      }),
      decorationRect({ left: 60, top: 520, width: 380, height: 120, fill: '#fff5eb' }),
      editableText({
        left: 80,
        top: 545,
        width: 340,
        text: '「另一段对话」',
        fontSize: 26,
        textAlign: 'left',
      }),
      photoSlot({ left: 480, top: 480, width: 360, height: 360, label: '场景' }),
      editableText({
        left: 60,
        top: 920,
        width: 780,
        text: '旁白或场景说明',
        fontSize: 22,
        textAlign: 'left',
      }),
    ]),
  },
]

export const PAGE_TEMPLATE_CATEGORIES = [
  { id: 'story', nameKey: 'editorProLeft.pageTemplateCatStory' },
  { id: 'album', nameKey: 'editorProLeft.pageTemplateCatAlbum' },
  { id: 'cover', nameKey: 'editorProLeft.pageTemplateCatCover' },
]

const TEMPLATE_NAME_KEYS = {
  'single-photo-story': 'editorProLeft.pageTemplateSinglePhoto',
  'dual-photo': 'editorProLeft.pageTemplateDualPhoto',
  'grid-four': 'editorProLeft.pageTemplateGridFour',
  'cover-page': 'editorProLeft.pageTemplateCover',
  'diary-page': 'editorProLeft.pageTemplateDiary',
  'dialogue-page': 'editorProLeft.pageTemplateDialogue',
}

/** 按分类分组的本地页面模版（不依赖后端 API） */
export function getLocalPageTemplateGroups(t) {
  return PAGE_TEMPLATE_CATEGORIES.map((cat) => ({
    id: cat.id,
    name: t(cat.nameKey),
    templates: templates
      .filter((item) => item.category === cat.id)
      .map((item) => ({
        id: item.id,
        name: t(TEMPLATE_NAME_KEYS[item.id] || item.id),
        preview: item.preview,
        json: item.json,
      })),
  })).filter((group) => group.templates.length > 0)
}

export default templates
