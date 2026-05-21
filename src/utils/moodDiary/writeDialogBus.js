const listeners = new Set()

export function onOpenWriteDialog(handler) {
  listeners.add(handler)
  return () => listeners.delete(handler)
}

export function requestOpenWriteDialog() {
  listeners.forEach((handler) => handler())
}
