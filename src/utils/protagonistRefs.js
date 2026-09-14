/** 双主角参考图（与 create-character 最多 2 张 reference 对齐） */

export function emptyProtagonistRefs() {
  return {
    1: { characterId: '', preview: '', base64: '' },
    2: { characterId: '', preview: '', base64: '' },
  };
}

export function hasProtagonistReference(refs) {
  return Boolean(refs?.[1]?.characterId || refs?.[2]?.characterId);
}

/** 提交 create-character 时使用 character_ids（Phase A） */
export function getCharacterIdsForApi(refs) {
  return [1, 2]
    .map((slot) => String(refs?.[slot]?.characterId || '').trim())
    .filter(Boolean);
}

/** @deprecated 仅兼容旧客户端或本地锚点页 base64；主角参考请用 getCharacterIdsForApi */
export function getReferenceImagesForApi(refs) {
  const list = [1, 2]
    .map((slot) => refs?.[slot]?.base64)
    .filter(Boolean);
  if (!list.length) return '';
  if (list.length === 1) return list[0];
  return list;
}

export function clearProtagonistSlot(refs, slot) {
  if (!refs?.[slot]) return refs;
  refs[slot].characterId = '';
  refs[slot].preview = '';
  refs[slot].base64 = '';
  return refs;
}

export function clearProtagonistRefs(refs) {
  clearProtagonistSlot(refs, 1);
  clearProtagonistSlot(refs, 2);
  return refs;
}
