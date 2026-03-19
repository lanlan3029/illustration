
<template>
  <div class="box attr-item-box" v-if="isOne && selectType !== 'image' && selectType !== 'group'">
    <Divider plain orientation="left"><h4>颜色</h4></Divider>
    <!-- 通用属性 -->
    <div class="bg-item">
      <Tooltip placement="top" theme="light">
        <div class="color-bar" :style="{ background: baseAttr.fill }"></div>
        <template #content>
          <color-picker
            v-model:value="baseAttr.fill"
            :modes="['色卡', '渐变', '纯色']"
            :swatches="pictureBookSwatches"
            @change="colorChange"
            @nativePick="dropColor"
          ></color-picker>
        </template>
      </Tooltip>
    </div>
    <!-- <Divider plain></Divider> -->
  </div>
</template>

<script setup name="AttrBute">
import useSelect from '@/components/editorPro/hooks/select';
import colorPicker from './color-picker';
import { toRaw } from 'vue';
import { getCurrentInstance, onMounted, onBeforeUnmount,reactive} from 'vue';
const update = getCurrentInstance();
const { fabric, selectType, canvasEditor, isOne } = useSelect();
const angleKey = 'gradientAngle';

/** 绘本常用色卡（色卡 Tab 中小格点击即设为 fill） */
const pictureBookSwatches = [
  { label: '奶油白（纸张感）', hex: '#FFFDF5' },
  { label: '温暖灰', hex: '#E5E1DA' },
  { label: '深石灰', hex: '#4A4A4A' },
  { label: '炭黑', hex: '#2D2926' },
  { label: '蜜桃粉', hex: '#FFCAD4' },
  { label: '珊瑚橙', hex: '#F7A072' },
  { label: '明亮黄', hex: '#F9DC5C' },
  { label: '芥末黄', hex: '#D4A373' },
  { label: '砖红', hex: '#BC6C25' },
  { label: '浅陶土', hex: '#DDB892' },
  { label: '薄荷绿', hex: '#B7E4C7' },
  { label: '橄榄绿', hex: '#7B8F62' },
  { label: '天青蓝', hex: '#A2D2FF' },
  { label: '牛仔蓝', hex: '#4895EF' },
  { label: '雾霾蓝', hex: '#8E9AAF' },
  { label: '香芋紫', hex: '#BDB2FF' },
  { label: '森林深绿', hex: '#2D6A4F' },
  { label: '午夜蓝', hex: '#003049' },
  { label: '梅子色', hex: '#6D597A' },
  { label: '焦糖褐', hex: '#603808' },
];
// 属性值
const baseAttr = reactive({
  fill: '#ffffffff',
});

// 属性获取
const getObjectAttr = (e) => {
  const activeObject = canvasEditor.canvas.getActiveObject();
  // 不是当前obj，跳过
  if (e && e.target && e.target !== activeObject) return;
  if (activeObject && isOne) {
    const fill = activeObject.get('fill');
    if (typeof fill === 'string') {
      baseAttr.fill = fill;
    } else {
      baseAttr.fill = fabricGradientToCss(fill, activeObject);
    }
  }
};

const colorChange = (value) => {
  const activeObject = canvasEditor.canvas.getActiveObjects()[0];
  if (activeObject) {
    const color = String(value.color).replace('NaN', '');
    if (value.mode === '纯色' || value.mode === '色卡') {
      activeObject.set('fill', color);
    } else if (value.mode === '渐变') {
      const currentGradient = cssToFabricGradient(
        toRaw(value.stops),
        activeObject.width,
        activeObject.height,
        value.angle
      );
      activeObject.set('fill', currentGradient, value.angle);
      activeObject.set(angleKey, value.angle);
    }
    canvasEditor.canvas.renderAll();
  }
};

const dropColor = (value) => {
  colorChange(value);
};

const fabricGradientToCss = (val, activeObject) => {
  // 渐变类型
  if (!val) return;
  const angle = activeObject.get(angleKey, val.degree);
  const colorStops = val.colorStops.map((item) => {
    return item.color + ' ' + item.offset * 100 + '%';
  });
  return `linear-gradient(${angle}deg, ${colorStops})`;
};
// css转Fabric渐变
const cssToFabricGradient = (stops, width, height, angle) => {
  const gradAngleToCoords = (paramsAngle) => {
    const anglePI = -parseInt(paramsAngle, 10) * (Math.PI / 180);
    return {
      x1: Math.round(50 + Math.sin(anglePI) * 50) / 100,
      y1: Math.round(50 + Math.cos(anglePI) * 50) / 100,
      x2: Math.round(50 + Math.sin(anglePI + Math.PI) * 50) / 100,
      y2: Math.round(50 + Math.cos(anglePI + Math.PI) * 50) / 100,
    };
  };

  const angleCoords = gradAngleToCoords(angle);
  return new fabric.Gradient({
    type: 'linear',
    gradientUnits: 'pencentage', // pixels or pencentage 像素 或者 百分比
    coords: {
      x1: angleCoords.x1 * width,
      y1: angleCoords.y1 * height,
      x2: angleCoords.x2 * width,
      y2: angleCoords.y2 * height,
    },
    colorStops: [...stops],
  });
};

const selectCancel = () => {
  update?.proxy?.$forceUpdate();
};

onMounted(() => {
  // 获取字体数据
  getObjectAttr();
  canvasEditor.on('selectCancel', selectCancel);
  canvasEditor.on('selectOne', getObjectAttr);
  canvasEditor.canvas.on('object:modified', getObjectAttr);
});

onBeforeUnmount(() => {
  canvasEditor.off('selectCancel', selectCancel);
  canvasEditor.off('selectOne', getObjectAttr);
  canvasEditor.canvas.off('object:modified', getObjectAttr);
});
</script>

<style scoped>
.color-bar {
  width: 30px;
  height: 30px;
  cursor: pointer;
  border: 2px solid #f6f7f9;
}
:deep(.ivu-input-number) {
  display: block;
  width: 100%;
}

:deep(.ivu-tooltip) {
  display: flex;
}
.ivu-form-item {
  background: #f6f7f9;
  border-radius: 5px;
  padding: 0 5px;
  margin-bottom: 10px;
}

.ivu-row {
  margin-bottom: 10px;
}
</style>
