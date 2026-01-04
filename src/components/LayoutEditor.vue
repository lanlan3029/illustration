<template>
  <div class="layout-editor">
    <!-- 工具栏 -->
    <div class="layout-toolbar">
      <el-button-group>
        <el-button 
          size="small" 
          @click="addLayoutBox"
          icon="el-icon-plus">
          添加角色
        </el-button>
        <el-button 
          size="small" 
          @click="deleteSelectedBox"
          :disabled="!selectedBoxId"
          icon="el-icon-delete">
          删除选中
        </el-button>
        <el-button 
          size="small" 
          @click="toggleGrid"
          :type="showGrid ? 'primary' : ''"
          icon="el-icon-menu">
          网格
        </el-button>
      </el-button-group>
      
      <el-button-group style="margin-left: 12px;">
        <el-dropdown @command="applyPresetLayout">
          <el-button size="small" icon="el-icon-s-grid">
            预设布局 <i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="left-right">左右分布</el-dropdown-item>
              <el-dropdown-item command="top-bottom">上下分布</el-dropdown-item>
              <el-dropdown-item command="grid-3x3">九宫格</el-dropdown-item>
              <el-dropdown-item command="center-surround">中心+环绕</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-button-group>
      
      <!-- 宽高比选择器 -->
      <div class="aspect-ratio-selector">
        <span class="aspect-label">{{ $t('creation.canvasRatio') }}</span>
        <el-select 
          v-model="selectedAspectRatio" 
          @change="handleAspectRatioChange"
          size="small"
          style="width: 100px;">
          <el-option label="4:3" value="4:3"></el-option>
          <el-option label="1:1" value="1:1"></el-option>
          <el-option label="3:4" value="3:4"></el-option>
          <el-option label="9:16" value="9:16"></el-option>
          <el-option label="16:9" value="16:9"></el-option>
        </el-select>
      </div>
      
      <div class="toolbar-info">
        <span>已添加 {{ layoutBoxes.length }} 个角色</span>
      </div>
    </div>

    <!-- 画布区域 -->
    <div 
      class="layout-canvas-wrapper"
      @click="handleCanvasClick"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp">
      <div 
        class="layout-canvas"
        :style="canvasStyle"
        ref="canvasRef">
        
        <!-- 网格线 -->
        <div v-if="showGrid" class="grid-overlay">
          <div 
            v-for="i in 10" 
            :key="'v-' + i"
            class="grid-line vertical"
            :style="{ left: (i * 10) + '%' }">
          </div>
          <div 
            v-for="i in 10" 
            :key="'h-' + i"
            class="grid-line horizontal"
            :style="{ top: (i * 10) + '%' }">
          </div>
        </div>

        <!-- 布局框 -->
        <div
          v-for="box in layoutBoxes"
          :key="box.id"
          class="layout-box"
          :class="{ 
            'selected': selectedBoxId === box.id,
            'locked': box.locked
          }"
          :style="getBoxStyle(box)"
          @mousedown.stop="handleBoxMouseDown(box.id, $event)"
          @click.stop="selectBox(box.id)">
          
          <!-- 布局框标签 -->
          <div class="box-label">
            {{ box.label || `角色${box.id}` }}
          </div>
          
          <!-- 调整大小的控制点 -->
          <template v-if="selectedBoxId === box.id && !box.locked">
            <div 
              v-for="handle in resizeHandles"
              :key="handle"
              class="resize-handle"
              :class="'handle-' + handle"
              @mousedown.stop="handleResizeStart(box.id, handle, $event)">
            </div>
          </template>
          
          <!-- 锁定图标 -->
          <div v-if="box.locked" class="lock-icon">
            <i class="el-icon-lock"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- 属性面板 -->
  </div>
</template>

<script>
export default {
  name: 'LayoutEditor',
  props: {
    canvasWidth: {
      type: Number,
      default: null // 如果为 null，则使用内部计算的尺寸
    },
    canvasHeight: {
      type: Number,
      default: null // 如果为 null，则使用内部计算的尺寸
    },
    value: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      layoutBoxes: [],
      selectedBoxId: null,
      showGrid: false,
      isDragging: false,
      isResizing: false,
      dragStartPos: { x: 0, y: 0 },
      resizeStartSize: { width: 0, height: 0 },
      resizeHandle: null,
      nextBoxId: 1,
      resizeHandles: ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'],
      selectedAspectRatio: '3:4' // 默认 3:4 (竖屏，适合插画)
    };
  },
  computed: {
    // 计算画布尺寸
    internalCanvasWidth() {
      if (this.canvasWidth !== null) {
        return this.canvasWidth;
      }
      return this.calculateCanvasSize().width;
    },
    internalCanvasHeight() {
      if (this.canvasHeight !== null) {
        return this.canvasHeight;
      }
      return this.calculateCanvasSize().height;
    },
    canvasStyle() {
      return {
        width: this.internalCanvasWidth + 'px',
        height: this.internalCanvasHeight + 'px',
        maxWidth: '100%',
        maxHeight: '100%',
        position: 'relative',
        background: '#f5f5f5',
        border: '1px solid #ddd',
        margin: '0 auto'
      };
    },
    selectedBox() {
      return this.layoutBoxes.find(box => box.id === this.selectedBoxId);
    }
  },
  watch: {
    value: {
      handler(newVal) {
        if (newVal && newVal.length > 0) {
          this.layoutBoxes = JSON.parse(JSON.stringify(newVal));
          this.nextBoxId = Math.max(...this.layoutBoxes.map(b => b.id), 0) + 1;
        }
      },
      immediate: true
    },
    layoutBoxes: {
      handler(newVal) {
        this.$emit('input', newVal);
        this.$emit('change', newVal);
      },
      deep: true
    }
  },
  methods: {
    // 计算画布尺寸
    calculateCanvasSize() {
      // 固定一个基准尺寸，然后根据宽高比计算另一个
      // 减小基准尺寸，避免出现滚动条
      const baseSize = 500; // 使用高度作为基准
      let width, height;
      
      switch(this.selectedAspectRatio) {
        case '4:3':
          // 4:3 表示宽:高 = 4:3，所以 width = height * 4/3
          height = baseSize;
          width = Math.round(height * 4 / 3);
          break;
        case '1:1':
          // 1:1 表示宽:高 = 1:1，所以 width = height
          height = baseSize;
          width = height;
          break;
        case '3:4':
          // 3:4 表示宽:高 = 3:4，所以 width = height * 3/4
          height = baseSize;
          width = Math.round(height * 3 / 4);
          break;
        case '9:16':
          // 9:16 表示宽:高 = 9:16，所以 width = height * 9/16
          height = baseSize;
          width = Math.round(height * 9 / 16);
          break;
        case '16:9':
          // 16:9 表示宽:高 = 16:9，所以 width = height * 16/9
          height = baseSize;
          width = Math.round(height * 16 / 9);
          break;
        default:
          height = baseSize;
          width = Math.round(height * 3 / 4);
      }
      
      return { width, height };
    },
    
    // 处理宽高比变化
    handleAspectRatioChange() {
      // 当宽高比改变时，画布尺寸会自动更新（通过 computed）
      // 布局框的位置和大小是基于百分比的，所以不需要手动调整
      // 组件会自动根据新的 canvas 尺寸重新计算像素值
      this.$nextTick(() => {
        // 通知父组件尺寸变化
        this.$emit('canvas-size-change', {
          width: this.internalCanvasWidth,
          height: this.internalCanvasHeight
        });
      });
    },
    
    // 添加布局框
    addLayoutBox() {
      const newBox = this.createLayoutBox({
        xPercent: 40,
        yPercent: 40
      });
      this.layoutBoxes.push(newBox);
      this.selectBox(newBox.id);
    },
    
    // 创建布局框（可被外部调用）
    createLayoutBox(options = {}) {
      // 如果没有指定 id，使用 nextBoxId
      let boxId = options.id;
      if (!boxId) {
        boxId = this.nextBoxId++;
      } else {
        // 如果指定了 id，确保 nextBoxId 大于它
        if (boxId >= this.nextBoxId) {
          this.nextBoxId = boxId + 1;
        }
      }
      
      const {
        label = `角色${boxId}`,
        xPercent = 40,
        yPercent = 40,
        widthPercent = 20,
        heightPercent = 20,
        prompt = '',
        characterId = null,
        characterImageUrl = null,
        ...otherProps
      } = options;
      
      const newBox = {
        id: boxId,
        label,
        position: {
          x: (xPercent / 100) * this.internalCanvasWidth,
          y: (yPercent / 100) * this.internalCanvasHeight,
          xPercent: Math.max(0, Math.min(100, xPercent)),
          yPercent: Math.max(0, Math.min(100, yPercent))
        },
        size: {
          width: (widthPercent / 100) * this.internalCanvasWidth,
          height: (heightPercent / 100) * this.internalCanvasHeight,
          widthPercent: Math.max(5, Math.min(100, widthPercent)),
          heightPercent: Math.max(5, Math.min(100, heightPercent))
        },
        prompt,
        zIndex: this.layoutBoxes.length + 1,
        locked: false,
        ...otherProps
      };
      
      // 如果有角色相关数据，添加到布局框
      if (characterId) {
        newBox.characterId = characterId;
      }
      if (characterImageUrl) {
        newBox.characterImageUrl = characterImageUrl;
      }
      
      return newBox;
    },
    
    // 从外部添加布局框（公共方法）
    addLayoutBoxFromExternal(options) {
      const newBox = this.createLayoutBox(options);
      this.layoutBoxes.push(newBox);
      this.selectBox(newBox.id);
      return newBox;
    },

    // 删除选中的布局框
    deleteSelectedBox() {
      if (this.selectedBoxId) {
        const index = this.layoutBoxes.findIndex(box => box.id === this.selectedBoxId);
        if (index > -1) {
          this.layoutBoxes.splice(index, 1);
          this.selectedBoxId = null;
        }
      }
    },

    // 选择布局框
    selectBox(boxId) {
      this.selectedBoxId = boxId;
      // 通知父组件选中状态改变
      this.$emit('box-selected', boxId);
    },

    // 获取布局框样式
    getBoxStyle(box) {
      return {
        left: box.position.xPercent + '%',
        top: box.position.yPercent + '%',
        width: box.size.widthPercent + '%',
        height: box.size.heightPercent + '%',
        zIndex: box.zIndex
      };
    },

    // 布局框鼠标按下（开始拖拽）
    handleBoxMouseDown(boxId, event) {
      const box = this.layoutBoxes.find(b => b.id === boxId);
      if (!box || box.locked) return;

      this.isDragging = true;
      this.selectedBoxId = boxId;
      
      const canvasRect = this.$refs.canvasRef.getBoundingClientRect();
      this.dragStartPos = {
        x: event.clientX - canvasRect.left - (box.position.xPercent / 100 * this.internalCanvasWidth),
        y: event.clientY - canvasRect.top - (box.position.yPercent / 100 * this.internalCanvasHeight)
      };

      document.addEventListener('mousemove', this.handleDragMove);
      document.addEventListener('mouseup', this.handleDragEnd);
    },

    // 拖拽移动
    handleDragMove(event) {
      if (!this.isDragging || !this.selectedBoxId) return;

      const box = this.layoutBoxes.find(b => b.id === this.selectedBoxId);
      if (!box || box.locked) return;

      const canvasRect = this.$refs.canvasRef.getBoundingClientRect();
      const newX = event.clientX - canvasRect.left - this.dragStartPos.x;
      const newY = event.clientY - canvasRect.top - this.dragStartPos.y;

      // 转换为百分比
      box.position.xPercent = Math.max(0, Math.min(100 - box.size.widthPercent, (newX / this.internalCanvasWidth) * 100));
      box.position.yPercent = Math.max(0, Math.min(100 - box.size.heightPercent, (newY / this.internalCanvasHeight) * 100));
      
      // 更新像素值
      box.position.x = (box.position.xPercent / 100) * this.internalCanvasWidth;
      box.position.y = (box.position.yPercent / 100) * this.internalCanvasHeight;
    },

    // 拖拽结束
    handleDragEnd() {
      this.isDragging = false;
      document.removeEventListener('mousemove', this.handleDragMove);
      document.removeEventListener('mouseup', this.handleDragEnd);
    },

    // 开始调整大小
    handleResizeStart(boxId, handle, event) {
      const box = this.layoutBoxes.find(b => b.id === boxId);
      if (!box || box.locked) return;

      this.isResizing = true;
      this.resizeHandle = handle;
      this.resizeStartSize = {
        width: box.size.widthPercent,
        height: box.size.heightPercent,
        x: box.position.xPercent,
        y: box.position.yPercent
      };

      this.dragStartPos = {
        x: event.clientX,
        y: event.clientY
      };

      document.addEventListener('mousemove', this.handleResizeMove);
      document.addEventListener('mouseup', this.handleResizeEnd);
    },

    // 调整大小移动
    handleResizeMove(event) {
      if (!this.isResizing || !this.selectedBoxId) return;

      const box = this.layoutBoxes.find(b => b.id === this.selectedBoxId);
      if (!box || box.locked) return;

      const deltaX = (event.clientX - this.dragStartPos.x) / this.internalCanvasWidth * 100;
      const deltaY = (event.clientY - this.dragStartPos.y) / this.internalCanvasHeight * 100;

      // 根据控制点位置调整
      if (this.resizeHandle.includes('w')) {
        box.position.xPercent = Math.max(0, this.resizeStartSize.x + deltaX);
        box.size.widthPercent = Math.max(5, this.resizeStartSize.width - deltaX);
      }
      if (this.resizeHandle.includes('e')) {
        box.size.widthPercent = Math.max(5, this.resizeStartSize.width + deltaX);
      }
      if (this.resizeHandle.includes('n')) {
        box.position.yPercent = Math.max(0, this.resizeStartSize.y + deltaY);
        box.size.heightPercent = Math.max(5, this.resizeStartSize.height - deltaY);
      }
      if (this.resizeHandle.includes('s')) {
        box.size.heightPercent = Math.max(5, this.resizeStartSize.height + deltaY);
      }

      // 确保不超出边界
      if (box.position.xPercent + box.size.widthPercent > 100) {
        box.size.widthPercent = 100 - box.position.xPercent;
      }
      if (box.position.yPercent + box.size.heightPercent > 100) {
        box.size.heightPercent = 100 - box.position.yPercent;
      }

      // 更新像素值
      box.position.x = (box.position.xPercent / 100) * this.internalCanvasWidth;
      box.position.y = (box.position.yPercent / 100) * this.internalCanvasHeight;
      box.size.width = (box.size.widthPercent / 100) * this.internalCanvasWidth;
      box.size.height = (box.size.heightPercent / 100) * this.internalCanvasHeight;
    },

    // 调整大小结束
    handleResizeEnd() {
      this.isResizing = false;
      this.resizeHandle = null;
      document.removeEventListener('mousemove', this.handleResizeMove);
      document.removeEventListener('mouseup', this.handleResizeEnd);
    },

    // 更新位置
    updateBoxPosition(boxId) {
      const box = this.layoutBoxes.find(b => b.id === boxId);
      if (box) {
        box.position.x = (box.position.xPercent / 100) * this.internalCanvasWidth;
        box.position.y = (box.position.yPercent / 100) * this.internalCanvasHeight;
      }
    },

    // 更新大小
    updateBoxSize(boxId) {
      const box = this.layoutBoxes.find(b => b.id === boxId);
      if (box) {
        box.size.width = (box.size.widthPercent / 100) * this.internalCanvasWidth;
        box.size.height = (box.size.heightPercent / 100) * this.internalCanvasHeight;
      }
    },

    // 更新 Prompt
    updateBoxPrompt() {
      // Prompt 更新会自动通过 v-model 同步
    },

    // 切换锁定
    toggleLock(boxId) {
      const box = this.layoutBoxes.find(b => b.id === boxId);
      if (box) {
        box.locked = !box.locked;
      }
    },

    // 切换网格
    toggleGrid() {
      this.showGrid = !this.showGrid;
    },

    // 应用预设布局
    applyPresetLayout(command) {
      this.layoutBoxes = [];
      
      switch (command) {
        case 'left-right':
          // 左右分布（2个角色）
          this.layoutBoxes = [
            {
              id: 1,
              label: '角色1',
              position: { x: this.internalCanvasWidth * 0.1, y: this.internalCanvasHeight * 0.3, xPercent: 10, yPercent: 30 },
              size: { width: this.internalCanvasWidth * 0.35, height: this.internalCanvasHeight * 0.4, widthPercent: 35, heightPercent: 40 },
              prompt: '',
              zIndex: 1,
              locked: false
            },
            {
              id: 2,
              label: '角色2',
              position: { x: this.internalCanvasWidth * 0.55, y: this.internalCanvasHeight * 0.3, xPercent: 55, yPercent: 30 },
              size: { width: this.internalCanvasWidth * 0.35, height: this.internalCanvasHeight * 0.4, widthPercent: 35, heightPercent: 40 },
              prompt: '',
              zIndex: 2,
              locked: false
            }
          ];
          break;
          
        case 'top-bottom':
          // 上下分布（2个角色）
          this.layoutBoxes = [
            {
              id: 1,
              label: '角色1',
              position: { x: this.internalCanvasWidth * 0.3, y: this.internalCanvasHeight * 0.1, xPercent: 30, yPercent: 10 },
              size: { width: this.internalCanvasWidth * 0.4, height: this.internalCanvasHeight * 0.35, widthPercent: 40, heightPercent: 35 },
              prompt: '',
              zIndex: 1,
              locked: false
            },
            {
              id: 2,
              label: '角色2',
              position: { x: this.internalCanvasWidth * 0.3, y: this.internalCanvasHeight * 0.55, xPercent: 30, yPercent: 55 },
              size: { width: this.internalCanvasWidth * 0.4, height: this.internalCanvasHeight * 0.35, widthPercent: 40, heightPercent: 35 },
              prompt: '',
              zIndex: 2,
              locked: false
            }
          ];
          break;
          
        case 'grid-3x3': {
          // 九宫格（9个角色）
          const gridSize = 3;
          const boxWidth = 28;
          const boxHeight = 28;
          for (let i = 0; i < 9; i++) {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            this.layoutBoxes.push({
              id: i + 1,
              label: `角色${i + 1}`,
              position: {
                x: this.internalCanvasWidth * (0.05 + col * 0.3),
                y: this.internalCanvasHeight * (0.05 + row * 0.3),
                xPercent: 5 + col * 30,
                yPercent: 5 + row * 30
              },
              size: {
                width: this.internalCanvasWidth * boxWidth / 100,
                height: this.internalCanvasHeight * boxHeight / 100,
                widthPercent: boxWidth,
                heightPercent: boxHeight
              },
              prompt: '',
              zIndex: i + 1,
              locked: false
            });
          }
          break;
        }
          
        case 'center-surround':
          // 中心+环绕（3个角色）
          this.layoutBoxes = [
            {
              id: 1,
              label: '角色1',
              position: { x: this.internalCanvasWidth * 0.1, y: this.internalCanvasHeight * 0.3, xPercent: 10, yPercent: 30 },
              size: { width: this.internalCanvasWidth * 0.25, height: this.internalCanvasHeight * 0.35, widthPercent: 25, heightPercent: 35 },
              prompt: '',
              zIndex: 1,
              locked: false
            },
            {
              id: 2,
              label: '角色2（主）',
              position: { x: this.internalCanvasWidth * 0.375, y: this.internalCanvasHeight * 0.25, xPercent: 37.5, yPercent: 25 },
              size: { width: this.internalCanvasWidth * 0.35, height: this.internalCanvasHeight * 0.5, widthPercent: 35, heightPercent: 50 },
              prompt: '',
              zIndex: 2,
              locked: false
            },
            {
              id: 3,
              label: '角色3',
              position: { x: this.internalCanvasWidth * 0.65, y: this.internalCanvasHeight * 0.3, xPercent: 65, yPercent: 30 },
              size: { width: this.internalCanvasWidth * 0.25, height: this.internalCanvasHeight * 0.35, widthPercent: 25, heightPercent: 35 },
              prompt: '',
              zIndex: 3,
              locked: false
            }
          ];
          break;
      }
      
      this.nextBoxId = Math.max(...this.layoutBoxes.map(b => b.id), 0) + 1;
    },

    // 画布点击
    handleCanvasClick(event) {
      if (event.target === this.$refs.canvasRef || event.target.classList.contains('grid-overlay')) {
        this.selectedBoxId = null;
        // 通知父组件取消选中
        this.$emit('box-selected', null);
      }
    },

    // 鼠标移动（用于显示对齐线等）
    handleMouseMove() {
      // 可以在这里实现对齐线显示逻辑
    },

    // 鼠标释放
    handleMouseUp() {
      // 处理鼠标释放
    },

    // 获取布局数据（用于发送给后端）
    getLayoutData() {
      return {
        canvasSize: {
          width: this.internalCanvasWidth,
          height: this.internalCanvasHeight
        },
        layoutBoxes: this.layoutBoxes.map(box => ({
          id: box.id,
          label: box.label,
          position: box.position,
          size: box.size,
          prompt: box.prompt,
          zIndex: box.zIndex
        }))
      };
    },

    // 转换为 InstanceAssemble 格式
    toInstanceAssembleFormat() {
      return {
        objects: this.layoutBoxes.map(box => ({
          label: 'character',
          bbox: [
            box.position.x,
            box.position.y,
            box.size.width,
            box.size.height
          ],
          prompt: box.prompt
        }))
      };
    }
  }
};
</script>

<style scoped>
.layout-editor {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.layout-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.toolbar-info {
  margin-left: auto;
  color: #606266;
  font-size: 14px;
}

.aspect-ratio-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
}

.aspect-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.layout-canvas-wrapper {
  position: relative;
  overflow: auto;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  width: 100%;
}

.layout-canvas {
  position: relative;
  background: #fafafa;
  border: 2px dashed #dcdfe6;
  box-sizing: border-box;
  min-width: 200px;
  min-height: 200px;
}

.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.grid-line {
  position: absolute;
  background: rgba(64, 158, 255, 0.1);
}

.grid-line.vertical {
  width: 1px;
  height: 100%;
}

.grid-line.horizontal {
  height: 1px;
  width: 100%;
}

.layout-box {
  position: absolute;
  border: 2px solid #409eff;
  background: rgba(64, 158, 255, 0.1);
  cursor: move;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.layout-box.selected {
  border-color: #67c23a;
  border-width: 3px;
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
}

.layout-box.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.box-label {
  position: absolute;
  top: -24px;
  left: 0;
  background: #409eff;
  color: #fff;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 4px 4px 0 0;
  white-space: nowrap;
}

.layout-box.selected .box-label {
  background: #67c23a;
}

.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #67c23a;
  border: 2px solid #fff;
  border-radius: 50%;
  cursor: nwse-resize;
}

.handle-nw { top: -4px; left: -4px; cursor: nw-resize; }
.handle-ne { top: -4px; right: -4px; cursor: ne-resize; }
.handle-sw { bottom: -4px; left: -4px; cursor: sw-resize; }
.handle-se { bottom: -4px; right: -4px; cursor: se-resize; }
.handle-n { top: -4px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
.handle-s { bottom: -4px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
.handle-w { top: 50%; left: -4px; transform: translateY(-50%); cursor: w-resize; }
.handle-e { top: 50%; right: -4px; transform: translateY(-50%); cursor: e-resize; }

.lock-icon {
  position: absolute;
  top: 4px;
  right: 4px;
  color: #909399;
  font-size: 16px;
}

.layout-properties {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
}

.properties-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 600;
  color: #303133;
}

.properties-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.property-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.property-group label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.property-row {
  display: flex;
  gap: 8px;
}
</style>

