const STORAGE_KEY = 'kidstory_sticker_lab_v1';
const DB_NAME = 'kidstory_sticker_lab_db';
const DB_STORE = 'stickers';
const DB_VERSION = 1;
const MAX_STICKERS = 24;

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function readLegacy() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeLegacy(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

function compressThumb(dataUrl, maxSide = 220) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function loadLocalStickers() {
  try {
    const db = await openDb();
    const rows = await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
    rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (rows.length) return rows.slice(0, MAX_STICKERS);

    const legacy = readLegacy();
    if (legacy.length) {
      await saveLocalStickers(legacy.slice(0, MAX_STICKERS));
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      return legacy.slice(0, MAX_STICKERS);
    }
    return [];
  } catch {
    return readLegacy().slice(0, MAX_STICKERS);
  }
}

export async function saveLocalStickers(list) {
  const trimmed = list.slice(0, MAX_STICKERS);
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      const store = tx.objectStore(DB_STORE);
      store.clear();
      trimmed.forEach((item) => store.put(item));
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
    return true;
  } catch {
    return writeLegacy(trimmed);
  }
}

export async function addLocalSticker(dataUrl, meta = {}) {
  const thumb = await compressThumb(dataUrl);
  const item = {
    id: `s_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    dataUrl,
    thumb,
    style: meta.style || 'sticker',
    borderColor: meta.borderColor || '#ffffff',
    mode: meta.mode || 'lasso',
    createdAt: Date.now(),
  };
  const list = await loadLocalStickers();
  list.unshift(item);
  await saveLocalStickers(list);
  return item;
}

export async function removeLocalSticker(id) {
  const list = (await loadLocalStickers()).filter((s) => s.id !== id);
  await saveLocalStickers(list);
  return list;
}
