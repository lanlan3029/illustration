/**
 * Standard 32-page picture book print layout (reference grid).
 * Each row is a spread or single page block shown in the layout editor.
 */

let rowIdCounter = 0;

function nextRowId(prefix) {
  rowIdCounter += 1;
  return `${prefix}-${rowIdCounter}`;
}

function page(id, labelKey, pageNum = null, kind = 'blank') {
  return {
    id,
    labelKey,
    pageNum,
    kind,
    illustration: null, // { _id, content, title }
  };
}

/** @returns {Array<{ id: string, type: 'single'|'spread', deletable: boolean, labelKey?: string, spreadIndex?: number, pages: object[] }>} */
export function createDefaultPrintLayout() {
  rowIdCounter = 0;
  const rows = [];

  rows.push({
    id: nextRowId('row'),
    type: 'single',
    deletable: true,
    labelKey: 'printBookLayout.pastedownFront',
    pages: [page('fp', 'printBookLayout.pastedownFront', null, 'pastedown')],
  });

  rows.push({
    id: nextRowId('row'),
    type: 'spread',
    deletable: true,
    labelKey: 'printBookLayout.endpapers',
    pages: [
      page('ep1-l', 'printBookLayout.endpaper', null, 'endpaper'),
      page('ep1-r', 'printBookLayout.endpaper', null, 'endpaper'),
    ],
  });

  rows.push({
    id: nextRowId('row'),
    type: 'spread',
    deletable: false,
    labelKey: 'printBookLayout.titleSpread',
    pages: [
      page('ep2-l', 'printBookLayout.endpaper', null, 'endpaper'),
      page('title', 'printBookLayout.titlePage', 1, 'title'),
    ],
  });

  rows.push({
    id: nextRowId('row'),
    type: 'spread',
    deletable: false,
    labelKey: 'printBookLayout.frontMatter',
    pages: [
      page('copyright', 'printBookLayout.copyright', 2, 'copyright'),
      page('dedication', 'printBookLayout.dedication', 3, 'dedication'),
    ],
  });

  for (let i = 1; i <= 14; i += 1) {
    const leftNum = 2 + i * 2;
    const rightNum = leftNum + 1;
    rows.push({
      id: nextRowId('story'),
      type: 'spread',
      deletable: true,
      labelKey: 'printBookLayout.storySpread',
      spreadIndex: i,
      pages: [
        page(`story-${i}-l`, 'printBookLayout.storyPage', leftNum, 'story'),
        page(`story-${i}-r`, 'printBookLayout.storyPage', rightNum, 'story'),
      ],
    });
  }

  rows.push({
    id: nextRowId('row'),
    type: 'spread',
    deletable: true,
    labelKey: 'printBookLayout.closingSpread',
    pages: [
      page('final', 'printBookLayout.finalPage', 32, 'closing'),
      page('ep3-r', 'printBookLayout.endpaper', null, 'endpaper'),
    ],
  });

  rows.push({
    id: nextRowId('row'),
    type: 'spread',
    deletable: true,
    labelKey: 'printBookLayout.endpapers',
    pages: [
      page('ep4-l', 'printBookLayout.endpaper', null, 'endpaper'),
      page('ep4-r', 'printBookLayout.endpaper', null, 'endpaper'),
    ],
  });

  rows.push({
    id: nextRowId('row'),
    type: 'single',
    deletable: true,
    labelKey: 'printBookLayout.pastedownBack',
    pages: [page('bp', 'printBookLayout.pastedownBack', null, 'pastedown')],
  });

  return rows;
}

export function getIllustrationUrl(item) {
  if (!item?.content) return '';
  const c = String(item.content).trim();
  if (c.startsWith('http://') || c.startsWith('https://') || c.startsWith('data:')) {
    return c;
  }
  return `https://static.kidstory.cc/${c}`;
}

/** Story pages only — interior pages 4–31 */
export function getStoryPageSlots(rows) {
  const slots = [];
  rows.forEach((row) => {
    if (row.spreadIndex == null) return;
    row.pages.forEach((p) => {
      if (p.kind === 'story') slots.push(p);
    });
  });
  return slots;
}

export function assignIllustrationsInOrder(rows, illustrations) {
  const slots = getStoryPageSlots(rows);
  const list = Array.isArray(illustrations) ? illustrations : [];
  slots.forEach((slot, idx) => {
    slot.illustration = list[idx] || null;
  });
  return rows;
}

export function isRowEmpty(row) {
  return row.pages.every((p) => !p.illustration);
}

/** Remove trailing empty story spreads; optionally trim other empty deletable rows from end */
export function trimEmptyStorySpreads(rows) {
  const next = [...rows];
  for (let i = next.length - 1; i >= 0; i -= 1) {
    const row = next[i];
    if (row.spreadIndex == null) continue;
    if (!isRowEmpty(row)) break;
    next.splice(i, 1);
  }
  return next;
}

export function countFilledStoryPages(rows) {
  return getStoryPageSlots(rows).filter((p) => p.illustration).length;
}

export function cloneLayoutRows(rows) {
  return JSON.parse(JSON.stringify(rows));
}
