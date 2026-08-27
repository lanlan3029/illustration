/*
 * @Author: 秦少卫
 * @Date: 2023-06-13 23:00:43
 * @LastEditors: 秦少卫
 * @LastEditTime: 2024-07-16 14:59:25
 * @Description: 控制条插件
 */
import { fabric } from 'fabric';
import verticalImg from '../assets/middlecontrol.svg?url';
import horizontalImg from '../assets/middlecontrolhoz.svg?url';
import edgeImg from '../assets/edgecontrol.svg?url';
import rotateImg from '../assets/rotateicon.svg?url';
import type { IEditor, IPluginTempl } from '@kuaitu-core/core';

/**
 * 实际场景: 在进行某个对象缩放的时候，由于fabricjs默认精度使用的是toFixed(2)。
 * 此处为了缩放的精度更准确一些，因此将NUM_FRACTION_DIGITS默认值改为4，即toFixed(4).
 */
fabric.Object.NUM_FRACTION_DIGITS = 4;

/** fabric 默认 true；改原型默认，避免新建 canvas 仍走等比 */
(fabric.Canvas.prototype as any).uniformScaling = false;

function drawImg(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  img: HTMLImageElement,
  wSize: number,
  hSize: number,
  angle: number | undefined
) {
  if (angle === undefined) return;
  ctx.save();
  ctx.translate(left, top);
  ctx.rotate(fabric.util.degreesToRadians(angle));
  ctx.drawImage(img, -wSize / 2, -hSize / 2, wSize, hSize);
  ctx.restore();
}

/**
 * 角点自由缩放：不依赖 canvas.uniformScaling（fabric 默认 true 时角点会强制等比）。
 * 仅按住 Shift 时等比。
 */
function createCornerFreeScaleHandler() {
  const { wrapWithFireEvent, wrapWithFixedAnchor, getLocalPoint } = fabric.controlsUtils as any;
  const opposite: Record<string, string> = {
    left: 'right',
    right: 'left',
    top: 'bottom',
    bottom: 'top',
    center: 'center',
  };

  const sign = (v: number) => (v >= 0 ? 1 : -1);

  function scaleObjectFree(eventData: MouseEvent, transform: any, x: number, y: number) {
    const target = transform.target;
    const lockScalingX = target.lockScalingX;
    const lockScalingY = target.lockScalingY;
    if (lockScalingX && lockScalingY) return false;

    const proportional = !!(eventData && eventData.shiftKey);
    const gestureScale = transform.gestureScale;
    let scaleX: number;
    let scaleY: number;

    if (gestureScale) {
      scaleX = transform.scaleX * gestureScale;
      scaleY = transform.scaleY * gestureScale;
    } else {
      const newPoint = getLocalPoint(transform, transform.originX, transform.originY, x, y);
      const signX = sign(newPoint.x);
      const signY = sign(newPoint.y);
      if (!transform.signX) transform.signX = signX;
      if (!transform.signY) transform.signY = signY;

      if (
        target.lockScalingFlip &&
        (transform.signX !== signX || transform.signY !== signY)
      ) {
        return false;
      }

      const dim = target._getTransformedDimensions();
      if (proportional) {
        const distance = Math.abs(newPoint.x) + Math.abs(newPoint.y);
        const original = transform.original;
        const originalDistance =
          Math.abs((dim.x * original.scaleX) / target.scaleX) +
          Math.abs((dim.y * original.scaleY) / target.scaleY);
        const scale = distance / (originalDistance || 1);
        scaleX = original.scaleX * scale;
        scaleY = original.scaleY * scale;
      } else {
        scaleX = Math.abs((newPoint.x * target.scaleX) / (dim.x || 1));
        scaleY = Math.abs((newPoint.y * target.scaleY) / (dim.y || 1));
      }

      if (transform.originX === 'center' && transform.originY === 'center') {
        scaleX *= 2;
        scaleY *= 2;
      }

      if (transform.signX !== signX) {
        transform.originX = opposite[transform.originX] || transform.originX;
        scaleX *= -1;
        transform.signX = signX;
      }
      if (transform.signY !== signY) {
        transform.originY = opposite[transform.originY] || transform.originY;
        scaleY *= -1;
        transform.signY = signY;
      }
    }

    const oldScaleX = target.scaleX;
    const oldScaleY = target.scaleY;
    if (!lockScalingX) target.set('scaleX', scaleX);
    if (!lockScalingY) target.set('scaleY', scaleY);
    return oldScaleX !== target.scaleX || oldScaleY !== target.scaleY;
  }

  return wrapWithFireEvent('scaling', wrapWithFixedAnchor(scaleObjectFree));
}

const cornerFreeScaleHandler = createCornerFreeScaleHandler();

// 中间横杠
function intervalControl() {
  const verticalImgIcon = document.createElement('img');
  verticalImgIcon.src = verticalImg;

  const horizontalImgIcon = document.createElement('img');
  horizontalImgIcon.src = horizontalImg;

  function renderIcon(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    styleOverride: any,
    fabricObject: fabric.Object
  ) {
    drawImg(ctx, left, top, verticalImgIcon, 20, 25, fabricObject.angle);
  }

  function renderIconHoz(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    styleOverride: any,
    fabricObject: fabric.Object
  ) {
    drawImg(ctx, left, top, horizontalImgIcon, 25, 20, fabricObject.angle);
  }

  // 边控：纯单轴缩放；加大热区，避免被角点抢走
  const edgeHit = { sizeX: 24, sizeY: 24, touchSizeX: 32, touchSizeY: 32 };

  fabric.Object.prototype.controls.ml = new fabric.Control({
    x: -0.5,
    y: 0,
    offsetX: -1,
    ...edgeHit,
    cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
    actionHandler: fabric.controlsUtils.scalingX,
    actionName: 'scaling',
    render: renderIcon,
  });

  fabric.Object.prototype.controls.mr = new fabric.Control({
    x: 0.5,
    y: 0,
    offsetX: 1,
    ...edgeHit,
    cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
    actionHandler: fabric.controlsUtils.scalingX,
    actionName: 'scaling',
    render: renderIcon,
  });

  fabric.Object.prototype.controls.mb = new fabric.Control({
    x: 0,
    y: 0.5,
    offsetY: 1,
    ...edgeHit,
    cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
    actionHandler: fabric.controlsUtils.scalingY,
    actionName: 'scaling',
    render: renderIconHoz,
  });

  fabric.Object.prototype.controls.mt = new fabric.Control({
    x: 0,
    y: -0.5,
    offsetY: -1,
    ...edgeHit,
    cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
    actionHandler: fabric.controlsUtils.scalingY,
    actionName: 'scaling',
    render: renderIconHoz,
  });
}

// 顶点
function peakControl() {
  const img = document.createElement('img');
  img.src = edgeImg;

  function renderIconEdge(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    styleOverride: any,
    fabricObject: fabric.Object
  ) {
    drawImg(ctx, left, top, img, 25, 25, fabricObject.angle);
  }

  const cornerHit = { sizeX: 22, sizeY: 22, touchSizeX: 28, touchSizeY: 28 };

  fabric.Object.prototype.controls.tl = new fabric.Control({
    x: -0.5,
    y: -0.5,
    ...cornerHit,
    cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
    actionHandler: cornerFreeScaleHandler,
    actionName: 'scaling',
    render: renderIconEdge,
  });
  fabric.Object.prototype.controls.bl = new fabric.Control({
    x: -0.5,
    y: 0.5,
    ...cornerHit,
    cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
    actionHandler: cornerFreeScaleHandler,
    actionName: 'scaling',
    render: renderIconEdge,
  });
  fabric.Object.prototype.controls.tr = new fabric.Control({
    x: 0.5,
    y: -0.5,
    ...cornerHit,
    cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
    actionHandler: cornerFreeScaleHandler,
    actionName: 'scaling',
    render: renderIconEdge,
  });
  fabric.Object.prototype.controls.br = new fabric.Control({
    x: 0.5,
    y: 0.5,
    ...cornerHit,
    cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
    actionHandler: cornerFreeScaleHandler,
    actionName: 'scaling',
    render: renderIconEdge,
  });
}

/** Textbox 在 fabric 初始化时拷贝了旧 control 引用，需重新挂上新 handler */
function syncTextboxControls() {
  const oc = fabric.Object.prototype.controls;
  const tc = fabric.Textbox.prototype.controls;
  if (!tc) return;
  tc.tl = oc.tl;
  tc.tr = oc.tr;
  tc.bl = oc.bl;
  tc.br = oc.br;
  tc.mt = oc.mt;
  tc.mb = oc.mb;
  // ml / mr 保持 changeWidth（改文本框宽度）
}

// 旋转
function rotationControl() {
  const img = document.createElement('img');
  img.src = rotateImg;
  function renderIconRotate(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    styleOverride: any,
    fabricObject: fabric.Object
  ) {
    drawImg(ctx, left, top, img, 40, 40, fabricObject.angle);
  }
  fabric.Object.prototype.controls.mtr = new fabric.Control({
    x: 0,
    y: 0.5,
    cursorStyleHandler: fabric.controlsUtils.rotationStyleHandler,
    actionHandler: fabric.controlsUtils.rotationWithSnapping,
    offsetY: 30,
    actionName: 'rotate',
    render: renderIconRotate,
  });
}

function isPhotoOrDecorationLocked(obj: fabric.Object) {
  const role = (obj as any).kidstoryRole;
  if (role === 'photoSlot' || role === 'decoration') return true;
  // 整体锁定 / 无控制点
  if (obj.hasControls === false && obj.lockScalingX && obj.lockScalingY) return true;
  return false;
}

class ControlsPlugin implements IPluginTempl {
  static pluginName = 'ControlsPlugin';
  constructor(public canvas: fabric.Canvas, public editor: IEditor) {
    this.init();
  }

  /** 强制默认自由缩放；Shift 仍可通过自定义角点 handler 等比 */
  private lockUniformScalingOff() {
    try {
      Object.defineProperty(this.canvas, 'uniformScaling', {
        configurable: true,
        enumerable: true,
        get: () => false,
        set: () => {
          /* 忽略外部再设回 true */
        },
      });
    } catch {
      this.canvas.uniformScaling = false;
    }
  }

  /** 选中时确保边/角可控，并清掉误设的缩放锁 */
  private ensureFreeScale(obj?: fabric.Object | null) {
    this.canvas.uniformScaling = false;
    if (!obj || (obj as any).id === 'workspace' || (obj as any).name === 'workspace') return;
    if (isPhotoOrDecorationLocked(obj)) return;

    // LockPlugin 锁定：lockMovementX 等全开，不动
    if (obj.lockMovementX && obj.lockMovementY && obj.lockScalingX && obj.lockScalingY) return;

    if (obj.hasControls !== false && obj.selectable !== false) {
      if (obj.lockScalingX || obj.lockScalingY) {
        obj.set({ lockScalingX: false, lockScalingY: false });
      }
      obj.setControlsVisibility?.({
        mt: true,
        mb: true,
        ml: true,
        mr: true,
        tl: true,
        tr: true,
        bl: true,
        br: true,
      });
    }

    if (obj.type === 'activeSelection' && typeof (obj as any).getObjects === 'function') {
      (obj as fabric.ActiveSelection).getObjects().forEach((child) => this.ensureFreeScale(child));
    }
  }

  init() {
    peakControl();
    intervalControl();
    rotationControl();
    syncTextboxControls();

    this.lockUniformScalingOff();

    fabric.Object.prototype.lockSkewingX = true;
    fabric.Object.prototype.lockSkewingY = true;

    fabric.Object.prototype.set({
      transparentCorners: false,
      borderColor: '#51B9F9',
      cornerColor: '#FFF',
      borderScaleFactor: 2.5,
      cornerStyle: 'circle',
      cornerStrokeColor: '#0E98FC',
      borderOpacityWhenMoving: 1,
    });

    this.canvas.on('mouse:down', () => {
      this.canvas.uniformScaling = false;
    });
    this.canvas.on('selection:created', () => {
      this.ensureFreeScale(this.canvas.getActiveObject());
    });
    this.canvas.on('selection:updated', () => {
      this.ensureFreeScale(this.canvas.getActiveObject());
    });
    this.canvas.on('object:added', (e) => {
      this.ensureFreeScale(e?.target);
    });
  }

  destroy() {
    console.log('pluginDestroy');
  }
}

export default ControlsPlugin;
