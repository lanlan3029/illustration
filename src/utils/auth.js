/**
 * 解析本地 JWT payload（仅用于前端展示/路由；权限以服务端为准）
 * @returns {Record<string, unknown>|null}
 */
export function getAuthPayload() {
  const token = localStorage.getItem('token')
  if (!token || token === 'undefined') return null
  try {
    const segment = token.split('.')[1]
    if (!segment) return null
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

/** 当前登录用户是否为管理员（与后端 JWT isadmin 一致） */
export function isCurrentUserAdmin() {
  const payload = getAuthPayload()
  return !!(payload && payload.isadmin === true)
}
