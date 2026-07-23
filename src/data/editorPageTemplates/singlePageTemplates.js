/**
 * 8×8 相册单页模版（1:1，由跨页布局拆分出的单页排布）
 */
import { buildTemplate, PAGE_W, PAGE_H, PAGE_ASPECT_RATIO } from './placeholder'
import {
  singlePageBounds,
  centeredSquare,
  gridSlots,
  boundsSlot,
  asymmetricTopWideLayout,
  rectSlot,
} from './albumLayout'

const pageOpts = { width: PAGE_W, height: PAGE_H, aspectRatio: PAGE_ASPECT_RATIO }
const bounds = () => singlePageBounds()

export const singlePageTemplates = [
  {
    id: 'page-single-center',
    category: 'albumPage',
    aspectRatio: PAGE_ASPECT_RATIO,
    preview: '/editor-page-templates/page-single-center.svg',
    json: buildTemplate(
      [centeredSquare(bounds(), Math.min(bounds().w, bounds().h), '照片')],
      pageOpts
    ),
  },
  {
    id: 'page-full-bleed',
    category: 'albumPage',
    aspectRatio: PAGE_ASPECT_RATIO,
    preview: '/editor-page-templates/page-full-bleed.svg',
    json: buildTemplate([boundsSlot(bounds(), '满页')], pageOpts),
  },
  {
    id: 'page-grid-2x2',
    category: 'albumPage',
    aspectRatio: PAGE_ASPECT_RATIO,
    preview: '/editor-page-templates/page-grid-2x2.svg',
    json: buildTemplate(gridSlots(bounds(), 2, 2), pageOpts),
  },
  {
    id: 'page-asymmetric',
    category: 'albumPage',
    aspectRatio: PAGE_ASPECT_RATIO,
    preview: '/editor-page-templates/page-asymmetric.svg',
    json: buildTemplate(asymmetricTopWideLayout(bounds()), pageOpts),
  },
  {
    id: 'page-duo-horizontal',
    category: 'albumPage',
    aspectRatio: PAGE_ASPECT_RATIO,
    preview: '/editor-page-templates/page-duo-horizontal.svg',
    json: buildTemplate(
      (() => {
        const b = bounds()
        const gap = 12
        const halfW = (b.w - gap) / 2
        return [
          rectSlot({ x: b.x, y: b.y, w: halfW, h: b.h, label: '左' }),
          rectSlot({ x: b.x + halfW + gap, y: b.y, w: halfW, h: b.h, label: '右' }),
        ]
      })(),
      pageOpts
    ),
  },
  {
    id: 'page-duo-vertical',
    category: 'albumPage',
    aspectRatio: PAGE_ASPECT_RATIO,
    preview: '/editor-page-templates/page-duo-vertical.svg',
    json: buildTemplate(
      (() => {
        const b = bounds()
        const gap = 12
        const halfH = (b.h - gap) / 2
        return [
          rectSlot({ x: b.x, y: b.y, w: b.w, h: halfH, label: '上' }),
          rectSlot({ x: b.x, y: b.y + halfH + gap, w: b.w, h: halfH, label: '下' }),
        ]
      })(),
      pageOpts
    ),
  },
  {
    id: 'page-trio',
    category: 'albumPage',
    aspectRatio: PAGE_ASPECT_RATIO,
    preview: '/editor-page-templates/page-trio.svg',
    json: buildTemplate(
      (() => {
        const b = bounds()
        const gap = 12
        const topH = b.h * 0.55 - gap / 2
        const bottomH = b.h * 0.45 - gap / 2
        const halfW = (b.w - gap) / 2
        return [
          rectSlot({ x: b.x, y: b.y, w: b.w, h: topH, label: '1' }),
          rectSlot({ x: b.x, y: b.y + topH + gap, w: halfW, h: bottomH, label: '2' }),
          rectSlot({ x: b.x + halfW + gap, y: b.y + topH + gap, w: halfW, h: bottomH, label: '3' }),
        ]
      })(),
      pageOpts
    ),
  },
  {
    id: 'page-one-two',
    category: 'albumPage',
    aspectRatio: PAGE_ASPECT_RATIO,
    preview: '/editor-page-templates/page-one-two.svg',
    json: buildTemplate(
      (() => {
        const b = bounds()
        const gap = 12
        const leftW = (b.w - gap) * 0.58
        const rightW = b.w - leftW - gap
        const halfH = (b.h - gap) / 2
        return [
          rectSlot({ x: b.x, y: b.y, w: leftW, h: b.h, label: '主图' }),
          rectSlot({ x: b.x + leftW + gap, y: b.y, w: rightW, h: halfH, label: '2' }),
          rectSlot({ x: b.x + leftW + gap, y: b.y + halfH + gap, w: rightW, h: halfH, label: '3' }),
        ]
      })(),
      pageOpts
    ),
  },
  {
    id: 'page-three-rows',
    category: 'albumPage',
    aspectRatio: PAGE_ASPECT_RATIO,
    preview: '/editor-page-templates/page-three-rows.svg',
    json: buildTemplate(gridSlots(bounds(), 1, 3), pageOpts),
  },
  {
    id: 'page-vertical-center',
    category: 'albumPage',
    aspectRatio: PAGE_ASPECT_RATIO,
    preview: '/editor-page-templates/page-vertical-center.svg',
    json: buildTemplate(
      (() => {
        const b = bounds()
        const colW = b.w * 0.55
        return [
          rectSlot({
            x: b.x + (b.w - colW) / 2,
            y: b.y,
            w: colW,
            h: b.h,
            label: '竖图',
          }),
        ]
      })(),
      pageOpts
    ),
  },
  {
    id: 'page-grid-3',
    category: 'albumPage',
    aspectRatio: PAGE_ASPECT_RATIO,
    preview: '/editor-page-templates/page-grid-3.svg',
    json: buildTemplate(gridSlots(bounds(), 3, 1), pageOpts),
  },
  {
    id: 'page-grid-2x3',
    category: 'albumPage',
    aspectRatio: PAGE_ASPECT_RATIO,
    preview: '/editor-page-templates/page-grid-2x3.svg',
    json: buildTemplate(gridSlots(bounds(), 2, 3), pageOpts),
  },
]

export default singlePageTemplates
