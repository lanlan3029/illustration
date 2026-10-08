// Legacy books were created by the upload flow before source was recorded.
export function getBookSource(book) {
  return book?.source === 'ai' ? 'ai' : 'upload'
}

export function getAiDraftStorageKey(ownerId) {
  return ownerId ? `aibooks_data:${ownerId}` : 'aibooks_data'
}

export function loadLocalAiDraft(storage, ownerId) {
  try {
    const draft = JSON.parse(storage.getItem(getAiDraftStorageKey(ownerId)) || storage.getItem('aibooks_data') || 'null')
    if (!draft || (draft.ownerId && draft.ownerId !== ownerId)) return null
    return draft
  } catch {
    return null
  }
}

export function readLocalAiBook(storage, ownerId) {
  try {
    const draft = loadLocalAiDraft(storage, ownerId)
    if (!draft) return null
    const story = draft.storyData || draft.bookData
    if (!story) return null
    const images = draft.bookData?.images || []
    const total = story.scenes?.length || story.scenes_detail?.length || images.length
    return {
      title: story.title || draft.bookData?.title || '',
      cover: images.find(image => typeof image === 'string' && image) || '',
      completed: images.filter(Boolean).length,
      total,
    }
  } catch {
    return null
  }
}
