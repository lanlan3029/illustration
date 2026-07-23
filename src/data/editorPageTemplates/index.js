import {
  buildTemplate,
  CANVAS_W,
  CANVAS_H,
  TEMPLATE_ASPECT_RATIO,
  SPREAD_W,
  SPREAD_H,
  SPREAD_ASPECT_RATIO,
  PAGE_W,
  PAGE_H,
  PAGE_ASPECT_RATIO,
  decorationRect,
  editableText,
  photoSlot,
} from './placeholder'
import { spreadTemplates } from './spreadTemplates'
import { singlePageTemplates } from './singlePageTemplates'
import { portraitCollageTemplates } from './portraitCollageTemplates'

export {
  CANVAS_W,
  CANVAS_H,
  TEMPLATE_ASPECT_RATIO,
  SPREAD_W,
  SPREAD_H,
  SPREAD_ASPECT_RATIO,
  PAGE_W,
  PAGE_H,
  PAGE_ASPECT_RATIO,
}

const portraitTemplates = [
  {
    id: 'single-photo-story',
    category: 'story',
    aspectRatio: TEMPLATE_ASPECT_RATIO,
    preview: '/editor-page-templates/single-photo-story.svg',
    json: buildTemplate([
      photoSlot({ left: 50, top: 72, width: 800, height: 560, label: '照片' }),
      editableText({
        left: 50,
        top: 680,
        width: 800,
        text: '标题',
        fontSize: 44,
      }),
      editableText({
        left: 80,
        top: 760,
        width: 740,
        text: '请输入文本…',
        fontSize: 26,
        textAlign: 'left',
      }),
      decorationRect({ left: 50, top: 1080, width: 120, height: 6, fill: '#e8c4a0' }),
    ]),
  },
  {
    id: 'dual-photo',
    category: 'story',
    aspectRatio: TEMPLATE_ASPECT_RATIO,
    preview: '/editor-page-templates/dual-photo.svg',
    json: buildTemplate([
      editableText({
        left: 50,
        top: 48,
        width: 800,
        text: '双图',
        fontSize: 40,
      }),
      photoSlot({ left: 50, top: 130, width: 390, height: 390, label: '照片 A' }),
      photoSlot({ left: 460, top: 130, width: 390, height: 390, label: '照片 B' }),
      editableText({
        left: 50,
        top: 560,
        width: 800,
        text: '请输入文本…',
        fontSize: 24,
        textAlign: 'left',
      }),
      decorationRect({ left: 0, top: 1150, width: CANVAS_W, height: 50, fill: '#f5f0fa' }),
    ]),
  },
  {
    id: 'grid-four',
    category: 'album',
    aspectRatio: TEMPLATE_ASPECT_RATIO,
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
        text: '请输入文本',
        fontSize: 28,
      }),
    ]),
  },
  {
    id: 'cover-page',
    category: 'cover',
    aspectRatio: TEMPLATE_ASPECT_RATIO,
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
    aspectRatio: TEMPLATE_ASPECT_RATIO,
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
        text: '标题',
        fontSize: 40,
        textAlign: 'left',
      }),
      photoSlot({ left: 60, top: 200, width: 780, height: 480, label: '照片' }),
      editableText({
        left: 60,
        top: 720,
        width: 780,
        text: '请输入文本',
        fontSize: 24,
        textAlign: 'left',
      }),
      decorationRect({ left: 60, top: 180, width: 4, height: 900, fill: '#e8c4a0' }),
    ]),
  },
  {
    id: 'dialogue-page',
    category: 'story',
    aspectRatio: TEMPLATE_ASPECT_RATIO,
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

const templates = [...portraitTemplates, ...portraitCollageTemplates, ...singlePageTemplates, ...spreadTemplates]

export const PAGE_TEMPLATE_CATEGORIES = [
  { id: 'story', nameKey: 'editorProLeft.pageTemplateCatStory' },
  { id: 'album', nameKey: 'editorProLeft.pageTemplateCatAlbum' },
  { id: 'collage', nameKey: 'editorProLeft.pageTemplateCatCollage' },
  { id: 'albumPage', nameKey: 'editorProLeft.pageTemplateCatAlbumPage' },
  { id: 'cover', nameKey: 'editorProLeft.pageTemplateCatCover' },
  { id: 'spread', nameKey: 'editorProLeft.pageTemplateCatSpread' },
]

const TEMPLATE_NAME_KEYS = {
  'single-photo-story': 'editorProLeft.pageTemplateSinglePhoto',
  'dual-photo': 'editorProLeft.pageTemplateDualPhoto',
  'grid-four': 'editorProLeft.pageTemplateGridFour',
  'cover-page': 'editorProLeft.pageTemplateCover',
  'diary-page': 'editorProLeft.pageTemplateDiary',
  'dialogue-page': 'editorProLeft.pageTemplateDialogue',
  'portrait-col-1': 'editorProLeft.pageTemplatePortraitCol1',
  'portrait-col-2': 'editorProLeft.pageTemplatePortraitCol2',
  'portrait-col-3': 'editorProLeft.pageTemplatePortraitCol3',
  'portrait-col-4': 'editorProLeft.pageTemplatePortraitCol4',
  'portrait-row-2': 'editorProLeft.pageTemplatePortraitRow2',
  'portrait-row-3': 'editorProLeft.pageTemplatePortraitRow3',
  'portrait-row-4': 'editorProLeft.pageTemplatePortraitRow4',
  'portrait-row-5': 'editorProLeft.pageTemplatePortraitRow5',
  'portrait-row-6': 'editorProLeft.pageTemplatePortraitRow6',
  'portrait-grid-2x3': 'editorProLeft.pageTemplatePortraitGrid2x3',
  'portrait-grid-4x6': 'editorProLeft.pageTemplatePortraitGrid4x6',
  'portrait-mosaic-1': 'editorProLeft.pageTemplatePortraitMosaic1',
  'portrait-mosaic-2': 'editorProLeft.pageTemplatePortraitMosaic2',
  'portrait-mosaic-3': 'editorProLeft.pageTemplatePortraitMosaic3',
  'portrait-mosaic-4': 'editorProLeft.pageTemplatePortraitMosaic4',
  'portrait-mosaic-5': 'editorProLeft.pageTemplatePortraitMosaic5',
  'portrait-mosaic-6': 'editorProLeft.pageTemplatePortraitMosaic6',
  'portrait-mosaic-7': 'editorProLeft.pageTemplatePortraitMosaic7',
  'portrait-mosaic-8': 'editorProLeft.pageTemplatePortraitMosaic8',
  'spread-single-right': 'editorProLeft.pageTemplateSpreadSingleRight',
  'spread-duo-square': 'editorProLeft.pageTemplateSpreadDuoSquare',
  'spread-large-grid': 'editorProLeft.pageTemplateSpreadLargeGrid',
  'spread-asymmetric': 'editorProLeft.pageTemplateSpreadAsymmetric',
  'spread-four-verticals': 'editorProLeft.pageTemplateSpreadFourVerticals',
  'spread-2x2-both': 'editorProLeft.pageTemplateSpread2x2Both',
  'spread-vertical-stack': 'editorProLeft.pageTemplateSpreadVerticalStack',
  'spread-three-column': 'editorProLeft.pageTemplateSpreadThreeColumn',
  'spread-twin-columns': 'editorProLeft.pageTemplateSpreadTwinColumns',
  'spread-grid-3x2': 'editorProLeft.pageTemplateSpreadGrid3x2',
  'spread-panorama': 'editorProLeft.pageTemplateSpreadPanorama',
  'page-single-center': 'editorProLeft.pageTemplatePageSingleCenter',
  'page-full-bleed': 'editorProLeft.pageTemplatePageFullBleed',
  'page-grid-2x2': 'editorProLeft.pageTemplatePageGrid2x2',
  'page-asymmetric': 'editorProLeft.pageTemplatePageAsymmetric',
  'page-duo-horizontal': 'editorProLeft.pageTemplatePageDuoHorizontal',
  'page-duo-vertical': 'editorProLeft.pageTemplatePageDuoVertical',
  'page-trio': 'editorProLeft.pageTemplatePageTrio',
  'page-one-two': 'editorProLeft.pageTemplatePageOneTwo',
  'page-three-rows': 'editorProLeft.pageTemplatePageThreeRows',
  'page-vertical-center': 'editorProLeft.pageTemplatePageVerticalCenter',
  'page-grid-3': 'editorProLeft.pageTemplatePageGrid3',
  'page-grid-2x3': 'editorProLeft.pageTemplatePageGrid2x3',
}

/** 按分类分组的本地页面模版（可按当前画布比例过滤） */
export function getLocalPageTemplateGroups(t, canvasSize = null) {
  const canvasW = canvasSize?.width
  const canvasH = canvasSize?.height

  return PAGE_TEMPLATE_CATEGORIES.map((cat) => ({
    id: cat.id,
    name: t(cat.nameKey),
    templates: templates
      .filter((item) => item.category === cat.id)
      .filter((item) => {
        if (!canvasW || !canvasH) return true
        const baseW = item.json?.kidstoryTemplateBase?.width || CANVAS_W
        const baseH = item.json?.kidstoryTemplateBase?.height || CANVAS_H
        const ratioA = baseW / baseH
        const ratioB = canvasW / canvasH
        return Math.abs(ratioA - ratioB) < 0.018
      })
      .map((item) => ({
        id: item.id,
        name: t(TEMPLATE_NAME_KEYS[item.id] || item.id),
        preview: item.preview,
        json: item.json,
        aspectRatio: item.aspectRatio || TEMPLATE_ASPECT_RATIO,
      })),
  })).filter((group) => group.templates.length > 0)
}

export function countMatchingTemplates(canvasSize) {
  return templates.filter((item) => {
    if (!canvasSize?.width || !canvasSize?.height) return true
    const baseW = item.json?.kidstoryTemplateBase?.width || CANVAS_W
    const baseH = item.json?.kidstoryTemplateBase?.height || CANVAS_H
    return Math.abs(baseW / baseH - canvasSize.width / canvasSize.height) < 0.018
  }).length
}

export default templates
