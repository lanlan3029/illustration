<template>
  <div class="maze-page">
    <div class="maze-card">
      <template v-if="!isPlaying">
        <el-tabs v-model="activeTab" class="maze-tabs" @tab-change="handleMazeTabChange">
          <el-tab-pane label="基础迷宫" name="svg"></el-tab-pane>
          <el-tab-pane label="创意迷宫" name="image"></el-tab-pane>
        </el-tabs>

        <template v-if="activeTab === 'svg'">
          <div class="maze-count">共 {{ mazeList.length }} 个迷宫</div>
          <div class="maze-grid" role="list">
            <button
              v-for="maze in mazeList"
              :key="maze.id"
              type="button"
              class="maze-list-card"
              :style="{ background: maze.bg }"
              @click="enterMaze(maze.id)"
            >
              <div class="maze-list-thumb">
                <img v-if="maze.previewUrl" :src="maze.previewUrl" :alt="maze.title" />
                <div v-else class="maze-list-thumb-fallback" :style="thumbStyle(maze)"></div>
              </div>
            </button>
          </div>
        </template>

        <template v-else>
          <div class="maze-count">共 {{ imageMazeList.length }} 张创意迷宫</div>
          <div v-if="creativeLoading" class="maze-empty">加载中...</div>
          <div v-else-if="!imageMazeList.length" class="maze-empty">暂无创意迷宫图片</div>
          <div class="maze-grid" role="list">
            <button
              v-for="maze in imageMazeList"
              :key="maze.id"
              type="button"
              class="maze-list-card image-maze-card"
              @click="enterImageMaze(maze.id)"
            >
              <div class="maze-list-thumb">
                <img :src="maze.src" :alt="maze.title" />
              </div>
            </button>
          </div>
        </template>
      </template>

      <template v-else-if="currentMaze">
        <div class="play-header">
          <el-button size="small" @click="backToList">返回列表</el-button>
          <div class="play-meta">
            <h2>{{ currentMaze ? currentMaze.title : '' }}</h2>
            <p>{{ currentMaze ? `${shapeLabel(currentMaze.shape)} · ${currentMaze.rows}x${currentMaze.cols}` : '' }}</p>
          </div>
        </div>

        <div class="maze-board-wrap" ref="boardWrap">
          <div class="maze-canvas-stack" :style="stackStyle">
            <canvas ref="mazeCanvas" class="maze-layer maze-bg"></canvas>
            <canvas
              ref="drawCanvas"
              class="maze-layer maze-draw"
              @pointerdown="onPointerDown"
              @pointermove="onPointerMove"
              @pointerup="onPointerUp"
              @pointerleave="onPointerUp"
              @pointercancel="onPointerUp"
            ></canvas>
          </div>
          <p class="maze-hint">沿浅色通道画线，避免穿过深色墙体（手机/鼠标均可）。</p>
          <div class="maze-actions">
            <el-button size="small" @click="clearPath">清除路线</el-button>
            <el-button size="small" type="primary" @click="restartCurrent">重新生成本关</el-button>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="play-header">
          <el-button size="small" @click="backToList">返回列表</el-button>
          <div class="play-meta">
            <h2>{{ currentImageMaze ? currentImageMaze.title : '' }}</h2>
            <p>图片迷宫 · 可直接手写标记路线</p>
          </div>
        </div>

        <div class="maze-board-wrap" ref="imageBoardWrap">
          <div class="maze-canvas-stack image-maze-stack" :style="imageStackStyle">
            <img
              v-if="currentImageMaze"
              ref="imageMazeImage"
              class="image-maze-preview"
              :src="currentImageMaze.src"
              :alt="currentImageMaze.title"
              @load="syncImageBoardSize"
            />
            <canvas
              ref="imageDrawCanvas"
              class="maze-layer maze-draw"
              @pointerdown="onPointerDown"
              @pointermove="onPointerMove"
              @pointerup="onPointerUp"
              @pointerleave="onPointerUp"
              @pointercancel="onPointerUp"
            ></canvas>
          </div>
          <p class="maze-hint">图片迷宫模式默认不做穿墙检测，可自由描线。</p>
          <div class="maze-actions">
            <el-button size="small" @click="clearPath">清除路线</el-button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
const SHAPES = ['rect', 'circle', 'diamond', 'hex', 'capsule', 'cross', 'star']
const PALETTE = [
  { bg: '#faf8ff', wall: '#2d2640', path: '#8167a9' },
  { bg: '#f4faf4', wall: '#3d5c4a', path: '#6b8a7a' },
  { bg: '#fff8f4', wall: '#5c4033', path: '#c17f59' },
  { bg: '#f2f8ff', wall: '#1a4d6d', path: '#4a90c8' },
  { bg: '#fdfbff', wall: '#4a3a5c', path: '#9b7ec8' },
  { bg: '#fffef8', wall: '#3d3d3d', path: '#c4a35a' }
]

function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a += 0x6d2b79f5
    let t = Math.imul(a ^ (a >>> 15), a | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildMazeCatalog(count = 100) {
  const list = []
  for (let i = 0; i < count; i++) {
    const seed = 12041 + i * 7919
    const shape = SHAPES[i % SHAPES.length]
    const palette = PALETTE[i % PALETTE.length]
    const rows = 10 + (i % 8)
    const cols = 10 + ((i * 3) % 10)
    list.push({
      id: `maze-${i + 1}`,
      title: `迷宫 ${i + 1}`,
      shape,
      seed,
      rows,
      cols,
      bg: palette.bg,
      wall: palette.wall,
      path: palette.path
    })
  }
  return list
}

function shapeInside(shape, row, col, rows, cols) {
  const x = ((col + 0.5) / cols) * 2 - 1
  const y = ((row + 0.5) / rows) * 2 - 1
  const ax = Math.abs(x)
  const ay = Math.abs(y)

  switch (shape) {
    case 'circle':
      return x * x + y * y <= 0.95 * 0.95
    case 'diamond':
      return ax + ay <= 1.18
    case 'hex':
      return ax <= 0.95 && ay <= 0.95 && ax * 0.65 + ay <= 1.05
    case 'capsule':
      return ay <= 0.7 || ((x + 0.6) ** 2 + y ** 2 <= 0.32) || ((x - 0.6) ** 2 + y ** 2 <= 0.32)
    case 'cross':
      return (ax <= 0.3 && ay <= 0.95) || (ay <= 0.3 && ax <= 0.95)
    case 'star':
      return (ax + ay <= 1.05) || (ax <= 0.28 && ay <= 0.95) || (ay <= 0.28 && ax <= 0.95)
    default:
      return true
  }
}

function nearestActive(grid, rows, cols, fromStart = true) {
  if (fromStart) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].active) return { r, c }
      }
    }
  } else {
    for (let r = rows - 1; r >= 0; r--) {
      for (let c = cols - 1; c >= 0; c--) {
        if (grid[r][c].active) return { r, c }
      }
    }
  }
  return { r: 0, c: 0 }
}

function generateMaskedMaze(rows, cols, seed, shape) {
  const rand = mulberry32(seed)
  const grid = []
  for (let r = 0; r < rows; r++) {
    grid[r] = []
    for (let c = 0; c < cols; c++) {
      grid[r][c] = {
        active: shapeInside(shape, r, c, rows, cols),
        visited: false,
        walls: { N: true, E: true, S: true, W: true }
      }
    }
  }

  const start = nearestActive(grid, rows, cols, true)
  const end = nearestActive(grid, rows, cols, false)

  const dirs = [
    { dr: -1, dc: 0, wall: 'N', opp: 'S' },
    { dr: 0, dc: 1, wall: 'E', opp: 'W' },
    { dr: 1, dc: 0, wall: 'S', opp: 'N' },
    { dr: 0, dc: -1, wall: 'W', opp: 'E' }
  ]

  const stack = [start]
  grid[start.r][start.c].visited = true

  while (stack.length) {
    const cur = stack[stack.length - 1]
    const opts = []
    for (const d of dirs) {
      const nr = cur.r + d.dr
      const nc = cur.c + d.dc
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
      if (!grid[nr][nc].active || grid[nr][nc].visited) continue
      opts.push({ ...d, nr, nc })
    }

    if (!opts.length) {
      stack.pop()
      continue
    }

    const pick = opts[Math.floor(rand() * opts.length)]
    grid[cur.r][cur.c].walls[pick.wall] = false
    grid[pick.nr][pick.nc].walls[pick.opp] = false
    grid[pick.nr][pick.nc].visited = true
    stack.push({ r: pick.nr, c: pick.nc })
  }

  if (grid[start.r][start.c].active) grid[start.r][start.c].walls.N = false
  if (grid[end.r][end.c].active) grid[end.r][end.c].walls.S = false

  return { grid, start, end }
}

export default {
  name: 'MazePage',
  data() {
    return {
      mazeList: buildMazeCatalog(100).map((item) => ({ ...item, previewUrl: '' })),
      imageMazeList: [],
      creativeLoading: false,
      activeTab: 'svg',
      selectedMazeId: null,
      selectedImageMazeId: null,
      boardWidth: 320,
      boardHeight: 400,
      imageBoardWidth: 320,
      imageBoardHeight: 400,
      padding: 10,
      drawing: false,
      lastPoint: null,
      resizeObserver: null,
      wallImageData: null,
      wallDataWidth: 0,
      dpr: 1,
      mazeData: null,
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || ''
    }
  },
  computed: {
    isPlaying() {
      return !!this.currentMaze || !!this.currentImageMaze
    },
    currentMaze() {
      return this.mazeList.find((m) => m.id === this.selectedMazeId) || null
    },
    currentImageMaze() {
      return this.imageMazeList.find((m) => m.id === this.selectedImageMazeId) || null
    },
    stackStyle() {
      return {
        width: `${this.boardWidth}px`,
        height: `${this.boardHeight}px`
      }
    },
    imageStackStyle() {
      return {
        width: `${this.imageBoardWidth}px`,
        height: `${this.imageBoardHeight}px`
      }
    }
  },
  mounted() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.buildCardPreviews()
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.currentMaze) return
      this.$nextTick(() => {
        this.measureBoard()
        this.redrawAll()
      })
    })
    window.addEventListener('resize', this.onWindowResize)
  },
  beforeUnmount() {
    if (this.resizeObserver && this.$refs.boardWrap) {
      this.resizeObserver.unobserve(this.$refs.boardWrap)
    }
    this.resizeObserver = null
    window.removeEventListener('resize', this.onWindowResize)
  },
  methods: {
    async handleMazeTabChange(name) {
      if (name === 'image' && !this.imageMazeList.length) {
        await this.fetchCreativeMazes()
      }
    },
    async fetchCreativeMazes() {
      if (!this.$http) return
      this.creativeLoading = true
      try {
        const response = await this.$http.get('/ill/', {
          params: {
            type: 'maze',
            sort_param: 'createdAt',
            sort_num: 'desc',
            page: 1
          }
        })
        const data = response && response.data ? response.data : {}
        const message = data.message || data.data || data.result || []
        const list = Array.isArray(message)
          ? message
          : (message && (message.list || message.items || message.docs)) || []

        this.imageMazeList = list
          .map((item, index) => {
            const src = this.resolveCreativeImageSrc(item)
            if (!src) return null
            return {
              id: item._id || item.id || `remote-maze-${index}`,
              title: item.title || item.name || `创意迷宫 ${index + 1}`,
              src
            }
          })
          .filter(Boolean)
      } catch (_) {
        this.imageMazeList = []
      } finally {
        this.creativeLoading = false
      }
    },
    resolveCreativeImageSrc(item) {
      const raw =
        item.image_url ||
        item.character_image_url ||
        item.image ||
        item.picture ||
        item.cover ||
        item.url ||
        ''
      if (!raw) return ''
      if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) return raw
      if (raw.startsWith('/')) return this.apiBaseUrl ? `${this.apiBaseUrl}${raw}` : raw
      return raw
    },
    shapeLabel(shape) {
      const map = {
        rect: '矩形',
        circle: '圆形',
        diamond: '菱形',
        hex: '六边形',
        capsule: '胶囊形',
        cross: '十字形',
        star: '星形'
      }
      return map[shape] || shape
    },
    thumbStyle(maze) {
      const clipMap = {
        rect: 'none',
        circle: 'circle(46% at 50% 50%)',
        diamond: 'polygon(50% 5%, 95% 50%, 50% 95%, 5% 50%)',
        hex: 'polygon(25% 6%, 75% 6%, 96% 50%, 75% 94%, 25% 94%, 4% 50%)',
        capsule: 'inset(16% 6% 16% 6% round 22px)',
        cross: 'polygon(38% 4%, 62% 4%, 62% 38%, 96% 38%, 96% 62%, 62% 62%, 62% 96%, 38% 96%, 38% 62%, 4% 62%, 4% 38%, 38% 38%)',
        star: 'polygon(50% 3%, 60% 35%, 95% 35%, 67% 55%, 78% 92%, 50% 69%, 22% 92%, 33% 55%, 5% 35%, 40% 35%)'
      }
      return {
        background: `linear-gradient(145deg, ${maze.path}, ${maze.wall})`,
        clipPath: clipMap[maze.shape] || 'none'
      }
    },
    buildCardPreviews() {
      this.mazeList = this.mazeList.map((maze) => ({
        ...maze,
        previewUrl: this.renderPreviewDataUrl(maze)
      }))
    },
    renderPreviewDataUrl(maze) {
      const canvas = document.createElement('canvas')
      const width = 220
      const height = 110
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return ''

      ctx.fillStyle = maze.bg
      ctx.fillRect(0, 0, width, height)

      const padding = 8
      const cellW = (width - 2 * padding) / maze.cols
      const cellH = (height - 2 * padding) / maze.rows
      const cell = Math.max(3, Math.min(cellW, cellH))
      const drawW = maze.cols * cell
      const drawH = maze.rows * cell
      const xOffset = (width - drawW) / 2
      const yOffset = (height - drawH) / 2
      const lineW = Math.max(1, cell * 0.12)

      ctx.strokeStyle = maze.wall
      ctx.lineWidth = lineW
      ctx.lineCap = 'round'

      const drawLine = (x1, y1, x2, y2) => {
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      const { grid, start, end } = generateMaskedMaze(maze.rows, maze.cols, maze.seed, maze.shape)
      for (let r = 0; r < maze.rows; r++) {
        for (let c = 0; c < maze.cols; c++) {
          const cellData = grid[r][c]
          if (!cellData.active) continue
          const x = xOffset + c * cell
          const y = yOffset + r * cell

          const nActive = r > 0 && grid[r - 1][c].active
          const wActive = c > 0 && grid[r][c - 1].active
          const sActive = r < maze.rows - 1 && grid[r + 1][c].active
          const eActive = c < maze.cols - 1 && grid[r][c + 1].active

          if (!nActive || cellData.walls.N) drawLine(x, y, x + cell, y)
          if (!wActive || cellData.walls.W) drawLine(x, y, x, y + cell)
          if (!sActive || cellData.walls.S) drawLine(x, y + cell, x + cell, y + cell)
          if (!eActive || cellData.walls.E) drawLine(x + cell, y, x + cell, y + cell)
        }
      }

      const startCx = xOffset + (start.c + 0.5) * cell
      const startCy = yOffset + (start.r + 0.5) * cell
      const endCx = xOffset + (end.c + 0.5) * cell
      const endCy = yOffset + (end.r + 0.5) * cell
      ctx.fillStyle = '#67c23a'
      ctx.beginPath()
      ctx.arc(startCx, startCy, Math.max(2, cell * 0.16), 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#f56c6c'
      ctx.beginPath()
      ctx.arc(endCx, endCy, Math.max(2, cell * 0.16), 0, Math.PI * 2)
      ctx.fill()

      return canvas.toDataURL('image/png')
    },
    enterMaze(id) {
      this.selectedImageMazeId = null
      this.selectedMazeId = id
      this.$nextTick(() => {
        if (this.$refs.boardWrap && this.resizeObserver) {
          this.resizeObserver.observe(this.$refs.boardWrap)
        }
        this.measureBoard()
        this.redrawAll()
      })
    },
    enterImageMaze(id) {
      this.selectedMazeId = null
      this.selectedImageMazeId = id
      this.$nextTick(() => {
        this.syncImageBoardSize()
      })
    },
    backToList() {
      if (this.resizeObserver && this.$refs.boardWrap) {
        this.resizeObserver.unobserve(this.$refs.boardWrap)
      }
      this.selectedMazeId = null
      this.selectedImageMazeId = null
      this.drawing = false
      this.lastPoint = null
      this.mazeData = null
      this.wallImageData = null
    },
    syncImageBoardSize() {
      const wrap = this.$refs.imageBoardWrap
      const img = this.$refs.imageMazeImage
      const canvas = this.$refs.imageDrawCanvas
      if (!wrap || !img || !canvas) return

      const maxW = Math.min(560, Math.max(280, wrap.clientWidth || 320))
      const naturalW = img.naturalWidth || 4
      const naturalH = img.naturalHeight || 3
      const ratio = naturalW / naturalH
      this.imageBoardWidth = Math.floor(maxW)
      this.imageBoardHeight = Math.floor(this.imageBoardWidth / ratio)

      const dpr = this.dpr
      canvas.width = Math.round(this.imageBoardWidth * dpr)
      canvas.height = Math.round(this.imageBoardHeight * dpr)
      canvas.style.width = `${this.imageBoardWidth}px`
      canvas.style.height = `${this.imageBoardHeight}px`

      const dctx = canvas.getContext('2d')
      dctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      dctx.clearRect(0, 0, this.imageBoardWidth, this.imageBoardHeight)
      this.lastPoint = null
    },
    restartCurrent() {
      if (!this.currentMaze) return
      this.clearPath()
      this.redrawAll(true)
    },
    onWindowResize() {
      if (!this.currentMaze) return
      this.$nextTick(() => {
        this.measureBoard()
        this.redrawAll()
      })
    },
    measureBoard() {
      const wrap = this.$refs.boardWrap
      if (!wrap || !this.currentMaze) return
      const p = this.currentMaze
      const maxW = Math.min(560, Math.max(280, wrap.clientWidth || 320))
      const pad = this.padding
      let cs = Math.floor((maxW - 2 * pad) / p.cols)
      cs = Math.max(6, cs)
      this.boardWidth = 2 * pad + p.cols * cs
      this.boardHeight = 2 * pad + p.rows * cs
    },
    cellSizeFor(pattern) {
      const pad = this.padding
      const cw = (this.boardWidth - 2 * pad) / pattern.cols
      const ch = (this.boardHeight - 2 * pad) / pattern.rows
      return Math.max(6, Math.min(cw, ch))
    },
    redrawAll(forceNew = false) {
      const mazeEl = this.$refs.mazeCanvas
      const drawEl = this.$refs.drawCanvas
      const pattern = this.currentMaze
      if (!mazeEl || !drawEl || !pattern) return

      this.measureBoard()
      if (!this.mazeData || forceNew) {
        this.mazeData = generateMaskedMaze(pattern.rows, pattern.cols, pattern.seed + (forceNew ? Date.now() % 9973 : 0), pattern.shape)
      }

      const cs = this.cellSizeFor(pattern)
      const pad = this.padding
      const dpr = this.dpr
      const wPx = Math.round(this.boardWidth * dpr)
      const hPx = Math.round(this.boardHeight * dpr)

      mazeEl.width = wPx
      mazeEl.height = hPx
      drawEl.width = wPx
      drawEl.height = hPx
      mazeEl.style.width = `${this.boardWidth}px`
      mazeEl.style.height = `${this.boardHeight}px`
      drawEl.style.width = `${this.boardWidth}px`
      drawEl.style.height = `${this.boardHeight}px`

      const mctx = mazeEl.getContext('2d', { willReadFrequently: true })
      mctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      mctx.fillStyle = pattern.bg
      mctx.fillRect(0, 0, this.boardWidth, this.boardHeight)

      const lineW = Math.max(2, cs * 0.11)
      mctx.strokeStyle = pattern.wall
      mctx.lineWidth = lineW
      mctx.lineCap = 'round'

      const drawLine = (x1, y1, x2, y2) => {
        mctx.beginPath()
        mctx.moveTo(x1, y1)
        mctx.lineTo(x2, y2)
        mctx.stroke()
      }

      const { grid, start, end } = this.mazeData

      for (let r = 0; r < pattern.rows; r++) {
        for (let c = 0; c < pattern.cols; c++) {
          const cell = grid[r][c]
          if (!cell.active) continue
          const x = pad + c * cs
          const y = pad + r * cs

          const nActive = r > 0 && grid[r - 1][c].active
          const wActive = c > 0 && grid[r][c - 1].active
          const sActive = r < pattern.rows - 1 && grid[r + 1][c].active
          const eActive = c < pattern.cols - 1 && grid[r][c + 1].active

          const isStartCell = r === start.r && c === start.c
          const isEndCell = r === end.r && c === end.c

          if ((!nActive || cell.walls.N) && !(isStartCell && !cell.walls.N)) drawLine(x, y, x + cs, y)
          if (!wActive || cell.walls.W) drawLine(x, y, x, y + cs)
          if ((!sActive || cell.walls.S) && !(isEndCell && !cell.walls.S)) drawLine(x, y + cs, x + cs, y + cs)
          if (!eActive || cell.walls.E) drawLine(x + cs, y, x + cs, y + cs)
        }
      }

      const startCx = pad + (start.c + 0.5) * cs
      const startCy = pad + (start.r + 0.5) * cs
      const endCx = pad + (end.c + 0.5) * cs
      const endCy = pad + (end.r + 0.5) * cs

      mctx.fillStyle = '#67c23a'
      mctx.beginPath()
      mctx.arc(startCx, startCy, Math.max(3, cs * 0.18), 0, Math.PI * 2)
      mctx.fill()

      mctx.fillStyle = '#f56c6c'
      mctx.beginPath()
      mctx.arc(endCx, endCy, Math.max(3, cs * 0.18), 0, Math.PI * 2)
      mctx.fill()

      this.wallImageData = mctx.getImageData(0, 0, wPx, hPx)
      this.wallDataWidth = wPx

      const dctx = drawEl.getContext('2d')
      dctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      dctx.clearRect(0, 0, this.boardWidth, this.boardHeight)
      this.lastPoint = null
    },
    clearPath() {
      const drawEl = this.currentImageMaze ? this.$refs.imageDrawCanvas : this.$refs.drawCanvas
      if (!drawEl) return
      const dpr = this.dpr
      const dctx = drawEl.getContext('2d')
      dctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const w = this.currentImageMaze ? this.imageBoardWidth : this.boardWidth
      const h = this.currentImageMaze ? this.imageBoardHeight : this.boardHeight
      dctx.clearRect(0, 0, w, h)
      this.lastPoint = null
    },
    canvasPoint(e) {
      const canvas = this.currentImageMaze ? this.$refs.imageDrawCanvas : this.$refs.drawCanvas
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null
      return { x, y }
    },
    canWalk(x0, y0, x1, y1) {
      if (this.currentImageMaze) return true
      const data = this.wallImageData
      if (!data) return true
      const dpr = this.dpr
      const w = this.wallDataWidth
      const steps = 12
      const threshold = 95

      for (let s = 0; s <= steps; s++) {
        const t = s / steps
        const x = x0 + (x1 - x0) * t
        const y = y0 + (y1 - y0) * t
        const ix = Math.floor(x * dpr)
        const iy = Math.floor(y * dpr)
        if (ix < 0 || iy < 0 || ix >= w) return false
        const idx = (iy * w + ix) * 4
        const r = data.data[idx]
        const g = data.data[idx + 1]
        const b = data.data[idx + 2]
        const avg = (r + g + b) / 3
        if (avg < threshold) return false
      }
      return true
    },
    onPointerDown(e) {
      const canvas = this.currentImageMaze ? this.$refs.imageDrawCanvas : this.$refs.drawCanvas
      if (!canvas) return
      e.preventDefault()
      canvas.setPointerCapture(e.pointerId)
      this.drawing = true
      this.lastPoint = this.canvasPoint(e)
    },
    onPointerMove(e) {
      if (!this.drawing || !this.lastPoint || !this.currentMaze) return
      e.preventDefault()
      const p = this.canvasPoint(e)
      if (!p) return
      if (!this.canWalk(this.lastPoint.x, this.lastPoint.y, p.x, p.y)) return

      const drawEl = this.currentImageMaze ? this.$refs.imageDrawCanvas : this.$refs.drawCanvas
      const dctx = drawEl.getContext('2d')
      const dpr = this.dpr
      dctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      dctx.strokeStyle = this.currentMaze ? this.currentMaze.path : '#ff6b8a'
      dctx.lineWidth = this.currentMaze ? Math.max(3, this.cellSizeFor(this.currentMaze) * 0.2) : 4
      dctx.lineCap = 'round'
      dctx.lineJoin = 'round'
      dctx.beginPath()
      dctx.moveTo(this.lastPoint.x, this.lastPoint.y)
      dctx.lineTo(p.x, p.y)
      dctx.stroke()
      this.lastPoint = p
    },
    onPointerUp(e) {
      const canvas = this.currentImageMaze ? this.$refs.imageDrawCanvas : this.$refs.drawCanvas
      if (canvas && e.pointerId != null) {
        try {
          canvas.releasePointerCapture(e.pointerId)
        } catch (_) {
          // noop
        }
      }
      this.drawing = false
      this.lastPoint = null
    }
  }
}
</script>

<style scoped>
.maze-page {
  min-height: calc(100vh - 56px);
  padding: 72px 16px 32px;
  box-sizing: border-box;
  background: linear-gradient(180deg, #f6f4fb 0%, #eef1f8 100%);
}

.maze-card {
  max-width: 980px;
  margin: 0 auto;
  padding: 20px 18px 24px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 28px rgba(45, 38, 64, 0.08);
  border: 1px solid #ebeef5;
}

.maze-count {
  margin-bottom: 12px;
  font-size: 12px;
  color: #606266;
}

.maze-empty {
  border: 1px dashed #dcdfe6;
  border-radius: 10px;
  color: #909399;
  text-align: center;
  font-size: 13px;
  padding: 18px 12px;
  margin-bottom: 12px;
}

.maze-tabs {
  margin-bottom: 14px;
}

.maze-tabs :deep(.el-tabs__header) {
  margin-bottom: 10px;
}

.maze-tabs :deep(.el-tabs__item.is-active) {
  color: #8167a9;
}

.maze-tabs :deep(.el-tabs__active-bar) {
  background-color: #8167a9;
}

.maze-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 12px;
  max-height: calc(100vh - 240px);
  overflow-y: auto;
  padding-right: 4px;
}

.maze-list-card {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 10px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.maze-list-card:hover {
  transform: translateY(-1px);
  border-color: #8167a9;
  box-shadow: 0 0 0 2px rgba(129, 103, 169, 0.12);
}

.maze-list-thumb {
  height: 74px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5);
}

.maze-list-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-maze-card {
  background: #fff !important;
}

.maze-list-thumb-fallback {
  width: 100%;
  height: 100%;
}

.maze-list-body {
  margin-top: 8px;
}

.maze-list-body h3 {
  margin: 0;
  font-size: 14px;
  color: #303133;
}

.maze-list-body p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #606266;
}

.play-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.play-meta h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.play-meta p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #909399;
}

.maze-board-wrap {
  margin-top: 6px;
}

.maze-canvas-stack {
  position: relative;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px #e4e7ed;
  background: #fff;
  touch-action: none;
}

.maze-layer {
  display: block;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

.maze-draw {
  cursor: crosshair;
  touch-action: none;
}

.maze-hint {
  margin: 10px 0 6px;
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.maze-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.image-maze-stack {
  background: #f7f7f9;
}

.image-maze-preview {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

@media (max-width: 767px) {
  .maze-page {
    padding: 62px 10px 24px;
  }

  .maze-card {
    padding: 14px 12px 18px;
    border-radius: 12px;
  }

  .maze-tabs {
    margin-bottom: 10px;
  }

  .maze-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    max-height: calc(100vh - 210px);
  }

  .maze-list-thumb {
    height: 62px;
  }
}
</style>
