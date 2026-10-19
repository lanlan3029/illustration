const states = new WeakMap()

function observeImage(el, url) {
  states.get(el)?.observer?.disconnect()
  const state = { url, observer: null }
  states.set(el, state)
  el.removeAttribute('src')
  if (!url) return

  const load = () => {
    if (states.get(el) !== state) return
    el.src = url
    state.observer?.disconnect()
  }
  if (typeof IntersectionObserver === 'undefined') {
    load()
    return
  }
  state.observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) load()
  }, {
    // The viewport root also respects clipping by nested scroll containers.
    root: el.closest('.style-list'),
    rootMargin: '160px',
  })
  state.observer.observe(el)
}

export default {
  mounted(el, { value }) {
    observeImage(el, value)
  },
  updated(el, { value, oldValue }) {
    if (value !== oldValue) observeImage(el, value)
  },
  beforeUnmount(el) {
    states.get(el)?.observer?.disconnect()
    states.delete(el)
  },
}
