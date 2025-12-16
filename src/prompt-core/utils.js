import { INITIAL_TEMPLATES_CONFIG, INITIAL_BANKS, INITIAL_DEFAULTS } from './constants';

// 深拷贝
export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// 生成唯一键
export const makeUniqueKey = (base, existing, suffix = 'custom') => {
  let candidate = `${base}_${suffix}`;
  let i = 1;
  while (existing.has(candidate)) {
    candidate = `${base}_${suffix}${i++}`;
  }
  return candidate;
};

// 合并模板与系统模板
export const mergeTemplatesWithSystem = (current, { backupSuffix = ' (user backup)' } = {}) => {
  const systemMap = new Map(INITIAL_TEMPLATES_CONFIG.map(t => [t.id, deepClone(t)]));
  const merged = INITIAL_TEMPLATES_CONFIG.map(deepClone);
  const notes = [];
  const ids = new Set(merged.map(t => t.id));

  (current || []).forEach(t => {
    if (systemMap.has(t.id)) {
      const sys = systemMap.get(t.id);
      const diff = JSON.stringify({ ...t, id: undefined, name: undefined }) !== 
                   JSON.stringify({ ...sys, id: undefined, name: undefined });
      if (diff) {
        const backupId = makeUniqueKey(t.id, ids, 'user');
        ids.add(backupId);
        merged.push({ ...deepClone(t), id: backupId, name: `${t.name}${backupSuffix}` });
        notes.push(`template ${t.id} updated, backup -> ${backupId}`);
      }
    } else {
      let newId = t.id;
      if (ids.has(newId)) {
        newId = makeUniqueKey(newId, ids, 'custom');
        notes.push(`custom template ${t.id} renamed -> ${newId}`);
      }
      ids.add(newId);
      merged.push({ ...deepClone(t), id: newId });
    }
  });

  return { templates: merged, notes };
};

// 合并选项库与系统选项库
export const mergeBanksWithSystem = (currentBanks, currentDefaults) => {
  const mergedBanks = deepClone(INITIAL_BANKS);
  const mergedDefaults = { ...INITIAL_DEFAULTS };
  const notes = [];
  const keys = new Set(Object.keys(mergedBanks));

  Object.entries(currentBanks || {}).forEach(([k, bank]) => {
    if (INITIAL_BANKS[k]) {
      const diff = JSON.stringify(bank) !== JSON.stringify(INITIAL_BANKS[k]);
      if (diff) {
        const backupKey = makeUniqueKey(k, keys, 'user');
        keys.add(backupKey);
        mergedBanks[backupKey] = deepClone(bank);
        if (currentDefaults && k in currentDefaults) {
          mergedDefaults[backupKey] = currentDefaults[k];
        }
        notes.push(`bank ${k} updated, backup -> ${backupKey}`);
      }
    } else {
      let nk = k;
      if (keys.has(nk)) {
        nk = makeUniqueKey(nk, keys, 'custom');
        notes.push(`custom bank ${k} renamed -> ${nk}`);
      }
      keys.add(nk);
      mergedBanks[nk] = deepClone(bank);
      if (currentDefaults && k in currentDefaults) {
        mergedDefaults[nk] = currentDefaults[k];
      }
    }
  });

  Object.entries(currentDefaults || {}).forEach(([k, v]) => {
    if (!(k in mergedDefaults) && mergedBanks[k]) {
      mergedDefaults[k] = v;
    }
  });

  return { banks: mergedBanks, defaults: mergedDefaults, notes };
};
