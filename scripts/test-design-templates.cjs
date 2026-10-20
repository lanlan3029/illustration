const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { convertFotorTemplate } = require('./lib/convertFotorTemplate.cjs');
const root = path.resolve(__dirname, '..');
const templates = require('../src/data/editorPageTemplates/designTemplates.json');
const { opaquePaperColor, repairLegacyDesignTemplateBackground } = require('../src/utils/editorPro/designTemplateCompatibility.cjs');

test('paper backgrounds composite alpha over white instead of dropping alpha', () => {
  assert.equal(opaquePaperColor('#d4915738'), '#f6e7da');
  assert.equal(opaquePaperColor('rgba(212, 145, 87, 0.2196078431372549)'), '#f6e7da');
  assert.equal(opaquePaperColor('#0000'), '#ffffff');
  assert.equal(opaquePaperColor('#1234'), '#c0c4c9');
  assert.equal(opaquePaperColor('#ffffff'), '#ffffff');
  const converted = convertFotorTemplate({ objects: [{ type: 'background', backgroundColor: '#d4915738' }] },
    { id: 'test', width: 1080, height: 1080 });
  assert.equal(converted.objects[0].fill, '#f6e7da');
});

test('legacy warm collage repair preserves filled photos, crop, text and user color choices', () => {
  const photo = { id: 'warm-love-square-photo-1', type: 'image', src: 'data:image/png;base64,user-photo',
    originSrc: 'data:image/png;base64,user-photo', cropX: 20, clipPath: { type: 'rect', width: 100 }, kidstoryPhotoFilled: true };
  const draft = { objects: [{ id: 'workspace', fill: '#d4915738' }, photo, { type: 'textbox', text: 'My title' }] };
  const before = JSON.stringify(draft.objects.slice(1));
  repairLegacyDesignTemplateBackground(draft);
  assert.equal(draft.objects[0].fill, '#f6e7da');
  assert.equal(JSON.stringify(draft.objects.slice(1)), before);
  draft.objects[0].fill = '#d49157';
  repairLegacyDesignTemplateBackground(draft);
  assert.equal(draft.objects[0].fill, '#d49157');
  const unrelated = { objects: [{ id: 'workspace', fill: '#d4915738' }, { id: 'other-photo' }] };
  repairLegacyDesignTemplateBackground(unrelated);
  assert.equal(unrelated.objects[0].fill, '#d4915738');
});

test('photo crop is replaced by an empty frame with the same displayed bounds', () => {
  const input = { objects: [{ type: 'background', backgroundColor: '#fafafa' }, {
    type: 'imageContainer', left: 300, top: 250, originX: 'center', originY: 'center',
    width: 200, height: 100, scaleX: 2, scaleY: 2,
    src: 'https://example.invalid/private-photo.jpg', cropX: 80,
    clipPath: { type: 'rect', width: 200, height: 100, left: 0, top: 0 },
  }] };
  const converted = convertFotorTemplate(input, { id: 'test', width: 900, height: 1200 });
  const slot = converted.objects[1];
  assert.deepEqual([slot.left, slot.top, slot.kidstorySlotW, slot.kidstorySlotH], [100, 150, 400, 200]);
  assert.equal(slot.width * slot.scaleX, 400);
  assert.equal(slot.height * slot.scaleY, 200);
  assert.equal(slot.kidstoryPhotoFilled, false);
  assert.ok(slot.src.startsWith('data:image/svg+xml,'));
  assert.ok(!JSON.stringify(converted).includes('example.invalid'));
  assert.equal(input.objects[1].cropX, 80);
});

test('unsupported masks, transforms and resources fail instead of being flattened', () => {
  const meta = { id: 'test', width: 900, height: 1200 };
  for (const extra of [{ angle: 12 }, { flipX: true }, { clipPath: { type: 'path' } },
    { clipSvgUrl: 'https://example.invalid/heart.svg' },
    { clipPath: { type: 'rect', width: 50, height: 100 } }]) {
    assert.throws(() => convertFotorTemplate({ objects: [{ type: 'imageContainer', width: 100, height: 100, ...extra }] }, meta));
  }
  assert.throws(() => convertFotorTemplate({ objects: [{ type: 'svg' }] }, meta));
  assert.throws(() => convertFotorTemplate({ objects: [{ type: 'background', src: 'https://example.invalid/bg.png' }] }, meta));
});

test('all 660 designs use local Fabric assets, empty masked photo slots and WebP previews', () => {
  assert.equal(templates.length, 660);
  assert.equal(new Set(templates.map(t => t.id)).size, 660);
  assert.deepEqual(Object.fromEntries(['1:1', '4:3', '9:16'].map(r => [r, templates.filter(t => t.aspectRatio === r).length])),
    { '1:1': 265, '4:3': 195, '9:16': 200 });
  let rotated = 0, shaped = 0;
  const checkAssets = object => {
    if (!object || typeof object !== 'object') return;
    if (object.src) {
      assert.ok(object.src.startsWith('/editor-design-templates/') || object.src.startsWith('data:image/svg+xml,'), object.src.slice(0, 100));
      if (object.src.startsWith('/')) assert.ok(fs.existsSync(path.join(root, 'public', object.src)));
    }
    for (const value of Object.values(object)) {
      if (value && typeof value === 'object') checkAssets(value);
    }
  };
  for (const item of templates) {
    const raw = fs.readFileSync(path.join(root, 'public', item.jsonUrl), 'utf8');
    const json = JSON.parse(raw);
    assert.equal(json.version, '5.3.0');
    assert.ok(!raw.includes('fotor.com'));
    const workspace = json.objects.find(o => o.id === 'workspace');
    assert.deepEqual([workspace.width, workspace.height], [item.width, item.height]);
    assert.equal(workspace.opacity, 1);
    assert.equal(opaquePaperColor(workspace.fill), workspace.fill);
    if (item.id === 'warm-love-square') assert.equal(workspace.fill, '#f6e7da');
    const slots = json.objects.filter(o => o.kidstoryRole === 'photoSlot');
    assert.equal(slots.length, item.photoCount);
    assert.ok(slots.length > 0, item.id);
    for (const slot of slots) {
      assert.equal(slot.type, 'image');
      assert.equal(slot.kidstoryPhotoFilled, false);
      assert.ok(slot.src.startsWith('data:image/svg+xml,'));
      const frame = slot.kidstoryDesignFrame;
      assert.equal(frame.schema, 1);
      assert.equal(frame.matrix.length, 6);
      assert.ok(frame.matrix.every(Number.isFinite));
      assert.ok(frame.width > 0 && frame.height > 0);
      assert.ok(Math.abs(frame.matrix[0] * frame.matrix[3] - frame.matrix[1] * frame.matrix[2]) > 1e-10);
      assert.equal(slot.clipPath.absolutePositioned, true);
      if (Math.abs(slot.angle) > .01) rotated++;
      if (slot.clipPath.type !== 'rect') shaped++;
    }
    checkAssets(json);
    const webp = fs.readFileSync(path.join(root, 'public', item.preview));
    assert.equal(webp.subarray(0, 4).toString(), 'RIFF');
    assert.equal(webp.subarray(8, 12).toString(), 'WEBP');
  }
  assert.ok(rotated > 100);
  assert.ok(shaped > 100);
});
