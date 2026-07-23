/**
 * 8×8 相册跨页模版（2:1，参考 WHCC Press Printed Album 布局）
 */
import { buildTemplate, SPREAD_W, SPREAD_H, SPREAD_ASPECT_RATIO } from './placeholder'
import {
  ALBUM_MARGIN,
  spreadPageBounds,
  spreadSpine,
  centeredSquare,
  gridSlots,
  rectSlot,
  boundsSlot,
  asymmetricTopWideLayout,
  verticalWithStackLayout,
  largeLeftGridRightLayout,
  fourVerticalsAcross,
  grid3x2Across,
  threeColumnSpread,
  twinColumnPages,
} from './albumLayout'

const spreadOpts = { width: SPREAD_W, height: SPREAD_H, aspectRatio: SPREAD_ASPECT_RATIO }
const left = () => spreadPageBounds('left')
const right = () => spreadPageBounds('right')
const m = ALBUM_MARGIN
const fullBounds = { x: m, y: m, w: SPREAD_W - m * 2, h: SPREAD_H - m * 2 }

export const spreadTemplates = [
  {
    id: 'spread-single-right',
    category: 'spread',
    aspectRatio: SPREAD_ASPECT_RATIO,
    preview: '/editor-page-templates/spread-single-right.svg',
    json: buildTemplate(
      [spreadSpine(), centeredSquare(right(), Math.min(right().w, right().h), '右页')],
      spreadOpts
    ),
  },
  {
    id: 'spread-duo-square',
    category: 'spread',
    aspectRatio: SPREAD_ASPECT_RATIO,
    preview: '/editor-page-templates/spread-duo-square.svg',
    json: buildTemplate(
      [
        spreadSpine(),
        centeredSquare(left(), Math.min(left().w, left().h), '左页'),
        centeredSquare(right(), Math.min(right().w, right().h), '右页'),
      ],
      spreadOpts
    ),
  },
  {
    id: 'spread-large-grid',
    category: 'spread',
    aspectRatio: SPREAD_ASPECT_RATIO,
    preview: '/editor-page-templates/spread-large-grid.svg',
    json: buildTemplate([spreadSpine(), ...largeLeftGridRightLayout(left(), right())], spreadOpts),
  },
  {
    id: 'spread-asymmetric',
    category: 'spread',
    aspectRatio: SPREAD_ASPECT_RATIO,
    preview: '/editor-page-templates/spread-asymmetric.svg',
    json: buildTemplate(
      [
        spreadSpine(),
        ...asymmetricTopWideLayout(left()),
        rectSlot({
          x: right().x + (right().w - 720) / 2,
          y: right().y,
          w: 720,
          h: right().h,
          label: '4',
        }),
      ],
      spreadOpts
    ),
  },
  {
    id: 'spread-four-verticals',
    category: 'spread',
    aspectRatio: SPREAD_ASPECT_RATIO,
    preview: '/editor-page-templates/spread-four-verticals.svg',
    json: buildTemplate([spreadSpine(), ...fourVerticalsAcross()], spreadOpts),
  },
  {
    id: 'spread-2x2-both',
    category: 'spread',
    aspectRatio: SPREAD_ASPECT_RATIO,
    preview: '/editor-page-templates/spread-2x2-both.svg',
    json: buildTemplate(
      [spreadSpine(), ...gridSlots(left(), 2, 2), ...gridSlots(right(), 2, 2, 12, '')],
      spreadOpts
    ),
  },
  {
    id: 'spread-vertical-stack',
    category: 'spread',
    aspectRatio: SPREAD_ASPECT_RATIO,
    preview: '/editor-page-templates/spread-vertical-stack.svg',
    json: buildTemplate([spreadSpine(), ...verticalWithStackLayout(left(), right())], spreadOpts),
  },
  {
    id: 'spread-three-column',
    category: 'spread',
    aspectRatio: SPREAD_ASPECT_RATIO,
    preview: '/editor-page-templates/spread-three-column.svg',
    json: buildTemplate([spreadSpine(), ...threeColumnSpread(left(), right())], spreadOpts),
  },
  {
    id: 'spread-twin-columns',
    category: 'spread',
    aspectRatio: SPREAD_ASPECT_RATIO,
    preview: '/editor-page-templates/spread-twin-columns.svg',
    json: buildTemplate([spreadSpine(), ...twinColumnPages(left(), right())], spreadOpts),
  },
  {
    id: 'spread-grid-3x2',
    category: 'spread',
    aspectRatio: SPREAD_ASPECT_RATIO,
    preview: '/editor-page-templates/spread-grid-3x2.svg',
    json: buildTemplate([spreadSpine(), ...grid3x2Across()], spreadOpts),
  },
  {
    id: 'spread-panorama',
    category: 'spread',
    aspectRatio: SPREAD_ASPECT_RATIO,
    preview: '/editor-page-templates/spread-panorama.svg',
    json: buildTemplate([spreadSpine(), boundsSlot(fullBounds, '跨页')], spreadOpts),
  },
]

export default spreadTemplates
