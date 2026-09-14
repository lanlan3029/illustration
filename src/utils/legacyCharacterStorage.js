/** 清理经典「创作角色页」遗留的 localStorage 草稿 */
export function clearLegacyCharacterDrafts() {
  try {
    localStorage.removeItem('pendingCharacterData');
    localStorage.removeItem('createCharacter_data');
  } catch {
    /* ignore */
  }
}
