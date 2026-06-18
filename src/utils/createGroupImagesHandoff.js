/** 生成角色 / 我的角色 → 创作组图：一次性带入参考图（内存优先） */
const SESSION_REF_KEY = 'createGroupImages_reference';
const LOCAL_CHAR_IMAGE_KEY = 'characterImage';
const MAX_STORAGE_URL_LEN = 400000;

let memoryPending = null;

function canPersistUrl(url) {
  return url && (!url.startsWith('data:') || url.length < MAX_STORAGE_URL_LEN);
}

export function setCreateGroupImagesReference(url, meta = {}) {
  if (!url) return;
  memoryPending = { url, meta: meta || {} };

  try {
    if (canPersistUrl(url)) {
      sessionStorage.setItem(SESSION_REF_KEY, url);
      localStorage.setItem(LOCAL_CHAR_IMAGE_KEY, url);
    } else {
      sessionStorage.removeItem(SESSION_REF_KEY);
      localStorage.removeItem(LOCAL_CHAR_IMAGE_KEY);
    }
  } catch (e) {
    /* 大图仅存内存 */
  }

  if (meta.characterId) {
    localStorage.setItem('lastCharacterId', String(meta.characterId));
  }
  if (meta.characterName) {
    localStorage.setItem('lastCharacterName', meta.characterName);
  }
}

export function takeCreateGroupImagesReference() {
  if (memoryPending?.url) {
    const { url, meta } = memoryPending;
    memoryPending = null;
    try {
      sessionStorage.removeItem(SESSION_REF_KEY);
    } catch (e) {
      /* ignore */
    }
    if (meta?.characterId) {
      localStorage.setItem('lastCharacterId', String(meta.characterId));
    }
    if (meta?.characterName) {
      localStorage.setItem('lastCharacterName', meta.characterName);
    }
    return url;
  }

  const url = sessionStorage.getItem(SESSION_REF_KEY) || '';
  if (url) {
    sessionStorage.removeItem(SESSION_REF_KEY);
  }
  return url;
}
