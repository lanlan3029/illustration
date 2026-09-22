<template>
  <div
    class="focus-grid"
    :style="{ '--cols': columns, '--rows': rows }"
    role="region"
    :aria-label="ariaLabel"
  >
    <button
      v-for="cell in cells"
      :key="cell.slot"
      type="button"
      class="focus-grid__cell"
      :class="cellClass(cell)"
      :style="cellStyle(cell)"
      :disabled="!cell.item && !cell.isCenter"
      :aria-label="cell.item ? cell.item.caption : undefined"
      @click="onCellClick(cell)"
    >
      <div class="focus-grid__frame">
        <Transition name="focus-grid-fade" mode="out-in">
          <img
            v-if="cell.item?.imageUrl"
            :key="cell.item.id"
            class="focus-grid__img"
            :src="cell.item.imageUrl"
            :alt="cell.item.caption || ''"
            loading="lazy"
          />
          <span v-else :key="`empty-${cell.slot}`" class="focus-grid__placeholder" aria-hidden="true">
            <svg viewBox="0 0 40 40" class="focus-grid__shape">
              <path :d="placeholderPath(cell.slot)" fill="none" stroke="currentColor" stroke-width="1.5" />
            </svg>
          </span>
        </Transition>
      </div>
    </button>
  </div>
</template>

<script>
/** 5×5 网格中心槽位（行优先索引） */
const DEFAULT_COLS = 5
const DEFAULT_ROWS = 5

const PLACEHOLDER_SHAPES = [
  'M20 4 L36 36 L4 36 Z',
  'M8 8 H32 V32 H8 Z',
  'M20 6 A14 14 0 1 1 20 34 A14 14 0 1 1 20 6',
  'M6 20 H34',
  'M20 6 V34',
  'M10 10 L30 30 M30 10 L10 30',
  'M20 8 L32 32 L8 32 Z',
  'M12 12 H28 V28 H12 Z',
  'M20 10 A10 16 0 1 1 20 30 A10 16 0 1 1 20 10',
]

export default {
  name: 'ChildhoodFocusGrid',
  props: {
    items: {
      type: Array,
      default: () => [],
    },
    columns: {
      type: Number,
      default: DEFAULT_COLS,
    },
    rows: {
      type: Number,
      default: DEFAULT_ROWS,
    },
    modelValue: {
      type: Number,
      default: 0,
    },
    ariaLabel: {
      type: String,
      default: '童年插画网格',
    },
  },
  emits: ['update:modelValue', 'select', 'focus'],
  computed: {
    slotCount() {
      return this.columns * this.rows
    },
    centerSlot() {
      return Math.floor(this.slotCount / 2)
    },
    focusIndex: {
      get() {
        const max = Math.max(0, this.items.length - 1)
        return Math.min(Math.max(0, this.modelValue), max)
      },
      set(val) {
        const max = Math.max(0, this.items.length - 1)
        const next = Math.min(Math.max(0, val), max)
        this.$emit('update:modelValue', next)
        this.$emit('focus', this.items[next] || null)
      },
    },
    cells() {
      const list = []
      for (let slot = 0; slot < this.slotCount; slot += 1) {
        const row = Math.floor(slot / this.columns)
        const col = slot % this.columns
        const centerRow = Math.floor(this.rows / 2)
        const centerCol = Math.floor(this.columns / 2)
        const dist = Math.abs(row - centerRow) + Math.abs(col - centerCol)
        const dataIndex = this.focusIndex + (slot - this.centerSlot)
        const item = dataIndex >= 0 && dataIndex < this.items.length ? this.items[dataIndex] : null

        list.push({
          slot,
          row,
          col,
          dist,
          item,
          isCenter: slot === this.centerSlot,
          dataIndex,
        })
      }
      return list
    },
    centerItem() {
      return this.items[this.focusIndex] || null
    },
  },
  watch: {
    items: {
      handler(list) {
        if (this.focusIndex >= list.length) {
          this.focusIndex = Math.max(0, list.length - 1)
        }
      },
      immediate: true,
    },
  },
  mounted() {
    window.addEventListener('keydown', this.onKeydown)
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeydown)
  },
  methods: {
    placeholderPath(slot) {
      return PLACEHOLDER_SHAPES[slot % PLACEHOLDER_SHAPES.length]
    },

    cellClass(cell) {
      return {
        'focus-grid__cell--center': cell.isCenter,
        'focus-grid__cell--ring-1': cell.dist === 1,
        'focus-grid__cell--ring-2': cell.dist === 2,
        'focus-grid__cell--ring-3': cell.dist >= 3,
        'focus-grid__cell--empty': !cell.item,
        'focus-grid__cell--filled': !!cell.item,
      }
    },

    cellStyle(cell) {
      return {
        gridRow: cell.row + 1,
        gridColumn: cell.col + 1,
        '--ring': cell.dist,
        '--enter-delay': `${cell.dist * 40}ms`,
      }
    },

    onCellClick(cell) {
      if (!cell.item && cell.isCenter) return

      if (cell.isCenter && cell.item) {
        this.$emit('select', cell.item)
        return
      }

      if (cell.dataIndex >= 0 && cell.dataIndex < this.items.length) {
        this.focusIndex = cell.dataIndex
      }
    },

    onKeydown(e) {
      if (!this.items.length) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        this.focusIndex -= 1
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        this.focusIndex += 1
      } else if (e.key === 'Enter' && this.centerItem) {
        this.$emit('select', this.centerItem)
      }
    },

    step(delta) {
      this.focusIndex += delta
    },
  },
}
</script>

<style scoped>
.focus-grid {
  --cols: 5;
  --rows: 5;
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --cell-gap: clamp(6px, 1.2vw, 10px);
  --frame-border: #1a1a1a;

  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  grid-template-rows: repeat(var(--rows), 1fr);
  gap: var(--cell-gap);
  width: 100%;
  max-width: min(720px, 100%);
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  padding: clamp(12px, 2.4vw, 20px);
  box-sizing: border-box;
  background: linear-gradient(160deg, #e8c96a 0%, #d4a84a 100%);
  border-radius: 0;
}

.focus-grid__cell {
  position: relative;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  transform: scale(0.88);
  opacity: 0.42;
  filter: saturate(0.75);
  transition:
    transform 0.48s var(--ease) var(--enter-delay, 0ms),
    opacity 0.4s ease var(--enter-delay, 0ms),
    filter 0.4s ease;
  will-change: transform, opacity;
}

.focus-grid__cell--filled {
  opacity: 0.58;
}

.focus-grid__cell--ring-1.focus-grid__cell--filled {
  opacity: 0.72;
  transform: scale(0.94);
}

.focus-grid__cell--ring-2.focus-grid__cell--filled {
  opacity: 0.58;
  transform: scale(0.9);
}

.focus-grid__cell--center {
  z-index: 3;
  opacity: 1;
  transform: scale(1.06);
  filter: saturate(1);
  cursor: zoom-in;
}

.focus-grid__cell--center.focus-grid__cell--empty {
  cursor: default;
  transform: scale(1);
  opacity: 0.35;
}

.focus-grid__cell:not(.focus-grid__cell--center):hover.focus-grid__cell--filled {
  opacity: 0.92;
  transform: scale(0.98);
  filter: saturate(0.95);
}

.focus-grid__frame {
  width: 100%;
  height: 100%;
  border: 1.5px solid var(--frame-border);
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
  box-sizing: border-box;
}

.focus-grid__cell--center .focus-grid__frame {
  border-width: 2px;
  box-shadow:
    0 0 0 2px rgba(255, 236, 160, 0.35),
    0 12px 32px rgba(0, 0, 0, 0.28);
}

.focus-grid__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.focus-grid__placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: rgba(255, 236, 160, 0.55);
}

.focus-grid__shape {
  width: 55%;
  height: 55%;
}

.focus-grid-fade-enter-active,
.focus-grid-fade-leave-active {
  transition: opacity 0.32s var(--ease), transform 0.38s var(--ease);
}

.focus-grid-fade-enter-from {
  opacity: 0;
  transform: scale(0.92);
}

.focus-grid-fade-leave-to {
  opacity: 0;
  transform: scale(1.04);
}

@media (prefers-reduced-motion: reduce) {
  .focus-grid__cell {
    transition: none;
  }

  .focus-grid-fade-enter-active,
  .focus-grid-fade-leave-active {
    transition: none;
  }
}
</style>
