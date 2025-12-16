// Vue 3 事件总线实现
class EventBus {
  constructor() {
    this.events = {}
  }

  // 监听事件
  $on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  // 触发事件
  $emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        callback(...args)
      })
    }
  }

  // 移除事件监听
  $off(event, callback) {
    if (this.events[event]) {
      if (callback) {
        this.events[event] = this.events[event].filter(cb => cb !== callback)
      } else {
        delete this.events[event]
      }
    }
  }

  // 一次性监听事件
  $once(event, callback) {
    const onceCallback = (...args) => {
      callback(...args)
      this.$off(event, onceCallback)
    }
    this.$on(event, onceCallback)
  }
}

// 用于监听，触发事件
export default new EventBus()