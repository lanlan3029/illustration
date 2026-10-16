// Observe the scroll container so offscreen templates do no canvas work.
export function createThumbnailDirective(render) {
  const entries = new Map(), queue = new Set()
  let observer, raf = 0
  function schedule() {
    if (!raf && queue.size) raf = requestAnimationFrame(flush)
  }
  function flush() {
    raf = 0
    let count = 0
    for (const el of queue) {
      queue.delete(el)
      const entry = entries.get(el)
      if (!entry?.visible || !entry.dirty) continue
      render(el, entry.item, entry.settings)
      entry.dirty = false
      if (++count === 6) break
    }
    schedule()
  }
  function update(el, value) {
    const { item, ...settings } = value
    const key = JSON.stringify(settings)
    const old = entries.get(el)
    if (old && old.item === item && old.key === key) return
    const entry = { item, settings, key, dirty: true, visible: old?.visible || false }
    entries.set(el, entry)
    if (entry.visible) { queue.add(el); schedule() }
  }
  return {
    mounted(el, binding) {
      update(el, binding.value)
      if (typeof IntersectionObserver === 'undefined') {
        entries.get(el).visible = true
        queue.add(el); schedule()
        return
      }
      if (!observer) observer = new IntersectionObserver(changes => {
        for (const change of changes) {
          const entry = entries.get(change.target)
          if (!entry) continue
          entry.visible = change.isIntersecting
          if (entry.visible && entry.dirty) queue.add(change.target)
          else queue.delete(change.target)
        }
        schedule()
      }, { root: el.closest('.template-grid'), rootMargin: '100px' })
      observer.observe(el)
    },
    updated(el, binding) { update(el, binding.value) },
    unmounted(el) {
      observer?.unobserve(el)
      entries.delete(el); queue.delete(el)
      if (!entries.size) {
        observer?.disconnect(); observer = undefined
        cancelAnimationFrame(raf); raf = 0
      }
    },
  }
}
