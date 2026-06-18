/**
 * 32 页绘本打印排版 — 5 列网格块（单页 1 列宽，跨页 1 格内左右两页）
 */

let blockIdCounter = 0;

function nextBlockId(prefix) {
  blockIdCounter += 1;
  return `${prefix}-${blockIdCounter}`;
}

function page(id, labelKey, pageNum = null, kind = 'blank') {
  return {
    id,
    labelKey,
    pageNum,
    kind,
    illustration: null,
  };
}

function spreadBlock(idPrefix, labelKey, pages, opts = {}) {
  return {
    id: nextBlockId(idPrefix),
    type: 'spread',
    deletable: opts.deletable ?? false,
    labelKey,
    spreadIndex: opts.spreadIndex,
    pages,
  };
}

function singleBlock(idPrefix, labelKey, pageDef, opts = {}) {
  return {
    id: nextBlockId(idPrefix),
    type: 'single',
    deletable: opts.deletable ?? false,
    labelKey,
    pages: [pageDef],
  };
}

/** @returns {Array} 按 5 列网格顺序排列的排版块 */
export function createDefaultPrintLayout() {
  blockIdCounter = 0;
  const blocks = [];

  blocks.push(
    singleBlock('cover', 'printBookLayout.pastedownFront', page('fp', 'printBookLayout.pastedownFront', null, 'pastedown'), { deletable: true })
  );
  blocks.push(
    spreadBlock('ep', 'printBookLayout.endpapers', [
      page('ep1-l', 'printBookLayout.endpaper', null, 'endpaper'),
      page('ep1-r', 'printBookLayout.endpaper', null, 'endpaper'),
    ], { deletable: true })
  );
  blocks.push(
    spreadBlock('title', 'printBookLayout.titleSpread', [
      page('ep2-l', 'printBookLayout.endpaper', null, 'endpaper'),
      page('title', 'printBookLayout.titlePage', 1, 'title'),
    ])
  );
  blocks.push(
    spreadBlock('fm', 'printBookLayout.frontMatter', [
      page('copyright', 'printBookLayout.copyright', 2, 'copyright'),
      page('dedication', 'printBookLayout.dedication', 3, 'dedication'),
    ])
  );

  for (let i = 1; i <= 14; i += 1) {
    const leftNum = 2 + i * 2;
    const rightNum = leftNum + 1;
    blocks.push(
      spreadBlock('story', 'printBookLayout.storySpread', [
        page(`story-${i}-l`, 'printBookLayout.storyPage', leftNum, 'story'),
        page(`story-${i}-r`, 'printBookLayout.storyPage', rightNum, 'story'),
      ], { deletable: true, spreadIndex: i })
    );
  }

  blocks.push(
    spreadBlock('close', 'printBookLayout.closingSpread', [
      page('final', 'printBookLayout.finalPage', 32, 'closing'),
      page('ep3-r', 'printBookLayout.endpaper', null, 'endpaper'),
    ], { deletable: true })
  );
  blocks.push(
    spreadBlock('ep', 'printBookLayout.endpapers', [
      page('ep4-l', 'printBookLayout.endpaper', null, 'endpaper'),
      page('ep4-r', 'printBookLayout.endpaper', null, 'endpaper'),
    ], { deletable: true })
  );
  blocks.push(
    singleBlock('cover', 'printBookLayout.pastedownBack', page('bp', 'printBookLayout.pastedownBack', null, 'pastedown'), { deletable: true })
  );

  return blocks;
}

export function getIllustrationUrl(item) {
  if (!item?.content) return '';
  const c = String(item.content).trim();
  if (c.startsWith('http://') || c.startsWith('https://') || c.startsWith('data:')) {
    return c;
  }
  return `https://static.kidstory.cc/${c}`;
}

export function getStoryPageSlots(blocks) {
  const slots = [];
  blocks.forEach((block) => {
    if (block.spreadIndex == null) return;
    block.pages.forEach((p) => {
      if (p.kind === 'story') slots.push(p);
    });
  });
  return slots;
}

export function assignIllustrationsInOrder(blocks, illustrations) {
  const slots = getStoryPageSlots(blocks);
  const list = Array.isArray(illustrations) ? illustrations : [];
  slots.forEach((slot, idx) => {
    const src = list[idx];
    slot.illustration = src
      ? { _id: src._id, content: src.content, title: src.title }
      : null;
  });
  return blocks;
}

/** 删除正文页插画后，后续插画依次前移填补空位 */
export function shiftStoryIllustrationForward(blocks, pageId) {
  const slots = getStoryPageSlots(blocks);
  const idx = slots.findIndex((s) => s.id === pageId);
  if (idx < 0) return blocks;
  for (let i = idx; i < slots.length - 1; i += 1) {
    const next = slots[i + 1].illustration;
    slots[i].illustration = next
      ? { _id: next._id, content: next.content, title: next.title }
      : null;
  }
  slots[slots.length - 1].illustration = null;
  return blocks;
}

export function isBlockEmpty(block) {
  return block.pages.every((p) => !p.illustration);
}

export function trimEmptyStorySpreads(blocks) {
  const next = [...blocks];
  for (let i = next.length - 1; i >= 0; i -= 1) {
    const block = next[i];
    if (block.spreadIndex == null) continue;
    if (!isBlockEmpty(block)) break;
    next.splice(i, 1);
  }
  return next;
}

export function countFilledStoryPages(blocks) {
  return getStoryPageSlots(blocks).filter((p) => p.illustration).length;
}

export function migrateRowsToBlocks(rows) {
  if (!Array.isArray(rows) || !rows.length) return null;
  if (rows[0]?.type && !rows[0].pages?.length && rows[0].pages !== undefined) return null;
  const flat = [];
  rows.forEach((row) => {
    flat.push({
      id: row.id,
      type: row.type === 'single' ? 'single' : 'spread',
      deletable: row.deletable,
      labelKey: row.labelKey,
      spreadIndex: row.spreadIndex,
      pages: row.pages || [],
    });
  });
  return flat.length ? flat : null;
}
