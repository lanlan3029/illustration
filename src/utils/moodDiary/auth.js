export function getMoodDiaryToken() {
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem('token') || ''
}

export function isMoodDiaryLoggedIn() {
  const token = getMoodDiaryToken()
  return !!(token && token !== 'undefined')
}
