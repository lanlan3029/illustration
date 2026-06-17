/** 生成角色 / 我的角色 → 创作组图：一次性带入参考图 */
const SESSION_REF_KEY = 'createGroupImages_reference';
const LOCAL_CHAR_IMAGE_KEY = 'characterImage';

export function setCreateGroupImagesReference(url, meta = {}) {
  if (!url) return;
  sessionStorage.setItem(SESSION_REF_KEY, url);
  localStorage.setItem(LOCAL_CHAR_IMAGE_KEY, url);
  if (meta.characterId) {
    localStorage.setItem('lastCharacterId', String(meta.characterId));
  }
  if (meta.characterName) {
    localStorage.setItem('lastCharacterName', meta.characterName);
  }
}

export function takeCreateGroupImagesReference() {
  const url = sessionStorage.getItem(SESSION_REF_KEY) || '';
  if (url) {
    sessionStorage.removeItem(SESSION_REF_KEY);
  }
  return url;
}
