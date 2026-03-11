/**
 * 用户收藏/喜欢/关注/粉丝数据 - 按需在具体页面调用，不在 TopBar 全局请求
 */

function getUserId() {
  return localStorage.getItem('id')
}

function getToken() {
  return localStorage.getItem('token') || ''
}

export function getCollectionBook($http, store) {
  const userId = getUserId()
  if (!userId) return Promise.resolve()
  return $http
    .get(`/user/list/collect`, {
      params: { category: 'book', id: userId },
      headers: { Authorization: 'Bearer ' + getToken() },
      timeout: 10000
    })
    .then((response) => {
      if (response.data.desc === 'success') {
        const arr = response.data.message || []
        const tool = arr.map((item) => item.collectid)
        store.commit('setCollectBookArr', tool)
      }
    })
    .catch((error) => {
      if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_NETWORK' && !error.message?.includes('timeout')) {
        console.log('获取收藏绘本失败:', error)
      }
    })
}

export function getLikeBook($http, store) {
  const userId = getUserId()
  if (!userId) return Promise.resolve()
  return $http
    .get(`/user/list/like`, {
      params: { category: 'book', id: userId },
      headers: { Authorization: 'Bearer ' + getToken() },
      timeout: 10000
    })
    .then((response) => {
      if (response.data.desc === 'success') {
        const arr = response.data.message || []
        const tool = arr.map((item) => item.likeid)
        store.commit('setLikeBookArr', tool)
      }
    })
    .catch((error) => {
      if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_NETWORK' && !error.message?.includes('timeout')) {
        console.log('获取喜欢绘本失败:', error)
      }
    })
}

export function getCollectionIllus($http, store) {
  const userId = getUserId()
  if (!userId) return Promise.resolve()
  return $http
    .get(`/user/list/collect`, {
      params: { category: 'illustration', id: userId },
      headers: { Authorization: 'Bearer ' + getToken() },
      timeout: 10000
    })
    .then((response) => {
      if (response.data.desc === 'success') {
        const arr = response.data.message || []
        const tool = arr.map((item) => item.collectid)
        store.commit('setCollectIllusArr', tool)
      }
    })
    .catch((error) => {
      if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_NETWORK' && !error.message?.includes('timeout')) {
        console.log('获取收藏插画失败:', error)
      }
    })
}

export function getLikeIllus($http, store) {
  const userId = getUserId()
  if (!userId) return Promise.resolve()
  return $http
    .get(`/user/list/like`, {
      params: { category: 'illustration', id: userId },
      headers: { Authorization: 'Bearer ' + getToken() },
      timeout: 10000
    })
    .then((response) => {
      if (response.data.desc === 'success') {
        const arr = response.data.message || []
        const tool = arr.map((item) => item.likeid)
        store.commit('setLikeIllusArr', tool)
      }
    })
    .catch((error) => {
      if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_NETWORK' && !error.message?.includes('timeout')) {
        console.log('获取喜欢插画失败:', error)
      }
    })
}

export function getAttention($http, store) {
  const userId = getUserId()
  if (!userId) return Promise.resolve()
  return $http
    .get(`/user/list/fllow`, {
      params: { id: userId },
      headers: { Authorization: 'Bearer ' + getToken() },
      timeout: 10000
    })
    .then((response) => {
      if (response.data.desc === 'success') {
        const arr = response.data.message || []
        const tool = arr.map((item) => item.fllowid)
        store.commit('setAttentionArr', tool)
      }
    })
    .catch((error) => {
      if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_NETWORK' && !error.message?.includes('timeout')) {
        console.log('获取关注列表失败:', error)
      }
    })
}

export function getFans($http, store) {
  const userId = getUserId()
  if (!userId) return Promise.resolve()
  return $http
    .get(`/user/list/fllow`, {
      params: { id: userId, sign: 'item' },
      headers: { Authorization: 'Bearer ' + getToken() },
      timeout: 10000
    })
    .then((response) => {
      if (response.data.desc === 'success') {
        const arr = response.data.message || []
        const tool = arr.map((item) => item.fllowid)
        store.commit('setFansArr', tool)
      }
    })
    .catch((error) => {
      if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_NETWORK' && !error.message?.includes('timeout')) {
        console.log('获取粉丝列表失败:', error)
      }
    })
}
