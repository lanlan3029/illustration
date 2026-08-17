/*
 * @Author: MOmo
 * @Date: 2024-07-12 15:10:02
 * @LastEditors: MOmo
 * @LastEditTime: 2024-07-12 15:15:45
 * @Description: 画布蒙层插件（仅无 / 浅色 / 深色，无彩色色调）
 */

import { fabric } from 'fabric';
import type { IEditor, IPluginTempl } from '@kuaitu-core/core';

export type WorkspaceMaskLevel = 'none' | 'light' | 'dark';

/** 仅灰度深浅，不要色调色 */
const MASK_FILL: Record<Exclude<WorkspaceMaskLevel, 'none'>, string> = {
  light: 'rgba(0, 0, 0, 0.22)',
  dark: 'rgba(0, 0, 0, 0.55)',
};

type IPlugin = Pick<
  MaskPlugin,
  | 'setCoverMask'
  | 'workspaceMaskToggle'
  | 'getworkspaceMaskStatus'
  | 'setWorkspaceMaskLevel'
  | 'getWorkspaceMaskLevel'
>;

declare module '@kuaitu-core/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

class MaskPlugin implements IPluginTempl {
  static pluginName = 'MaskPlugin';
  static apis = [
    'setCoverMask',
    'workspaceMaskToggle',
    'getworkspaceMaskStatus',
    'setWorkspaceMaskLevel',
    'getWorkspaceMaskLevel',
  ];
  coverMask: null | fabric.Rect = null;
  workspace: null | fabric.Rect = null;
  workspaceEl!: HTMLElement;
  hackFlag = false;
  private maskLevel: WorkspaceMaskLevel = 'none';

  constructor(public canvas: fabric.Canvas, public editor: IEditor) {
    this.init();
  }

  private init() {
    const workspaceEl = document.querySelector('#workspace') as HTMLElement;
    if (!workspaceEl) {
      throw new Error('element #workspace is missing, plz check!');
    }
    this.workspaceEl = workspaceEl;
  }

  getWorkspaceMaskLevel(): WorkspaceMaskLevel {
    if (!this.getWorkspaceMask()) return 'none';
    return this.maskLevel === 'none' ? 'dark' : this.maskLevel;
  }

  /**
   * 设置蒙版档位：none | light | dark（无彩色色调）
   */
  setWorkspaceMaskLevel(level: WorkspaceMaskLevel) {
    const next: WorkspaceMaskLevel =
      level === 'light' || level === 'dark' ? level : 'none';

    if (next === 'none') {
      this.clearMask();
      this.maskLevel = 'none';
      return;
    }

    this.maskLevel = next;
    const existing = this.getWorkspaceMask();
    if (!existing) {
      this.initMask();
    } else if (this.coverMask) {
      this.coverMask.set('fill', MASK_FILL[next]);
      this.canvas.requestRenderAll();
    }
  }

  /**
   * @desc 蒙版开关（兼容旧 API：在 none ↔ dark 间切换）
   */
  workspaceMaskToggle() {
    if (this.getWorkspaceMask()) {
      this.setWorkspaceMaskLevel('none');
    } else {
      this.setWorkspaceMaskLevel('dark');
    }
  }

  /**
   * @desc 获取蒙版开关
   */
  getworkspaceMaskStatus() {
    return this.coverMask !== null;
  }

  /**
   * @desc 获取蒙版
   */
  getWorkspaceMask() {
    return this.canvas.getObjects().find((item) => item.id === 'coverMask') as fabric.Rect;
  }

  // 返回workspace对象
  getWorkspase() {
    return this.canvas.getObjects().find((item) => item.id === 'workspace') as fabric.Rect;
  }

  private clearMask() {
    const workspaceMask = this.getWorkspaceMask();
    if (workspaceMask) {
      this.canvas.remove(workspaceMask);
    }
    this.workspace?.clone((cloned: fabric.Rect) => {
      this.canvas.clipPath = cloned;
      this.coverMask = null;
      this.canvas.requestRenderAll();
    });
    this.editor.off('loadJson', this.initMask);
  }

  setCoverMask(hack = false) {
    if (!this.coverMask || !this.workspace) {
      return;
    }
    const center = this.canvas.getCenter();
    const zoom = this.canvas.getZoom();
    let zoomToPointNumber = zoom;
    if (hack) {
      // 比较hack的方法，判断为fabric内部的数据更新问题
      zoomToPointNumber += 0.0000001 * (this.hackFlag ? 1 : -1);
      this.hackFlag = !this.hackFlag;
    }

    this.canvas.zoomToPoint(new fabric.Point(center.left, center.top), zoomToPointNumber);
    if (zoom) {
      const { workspaceEl } = this;
      const width = workspaceEl.offsetWidth;
      const height = workspaceEl.offsetHeight;
      const cWidth = width / zoom;
      const cHeight = height / zoom;
      this.coverMask.width = cWidth;
      this.coverMask.height = cHeight;
      this.coverMask.left = (this.workspace.left || 0) + (this.workspace.width! - cWidth) / 2;
      this.coverMask.top = (this.workspace.top || 0) + (this.workspace.height! - cHeight) / 2;
      this.workspace.clone((clone: fabric.Rect) => {
        clone.left = -clone.width! / 2;
        clone.top = -clone.height! / 2;
        clone.inverted = true;
        this.coverMask!.clipPath = clone;
        this.canvas.requestRenderAll();
      });
    }
  }

  initMask(needBindLoadJSON = true) {
    this.workspace = this.getWorkspase();
    if (!this.workspace) {
      throw new Error('MaskPlugin must be used after WorkspacePlugin!');
    }
    // 避免 loadJson 重复叠加
    const old = this.getWorkspaceMask();
    if (old) {
      this.canvas.remove(old);
      this.coverMask = null;
    }

    const level = this.maskLevel === 'light' || this.maskLevel === 'dark' ? this.maskLevel : 'dark';
    this.maskLevel = level;

    const coverMask = new fabric.Rect({
      fill: MASK_FILL[level],
      id: 'coverMask',
      strokeWidth: 0,
    });
    coverMask.set('selectable', false);
    coverMask.set('hasControls', false);
    coverMask.set('evented', false);
    coverMask.hoverCursor = 'default';
    this.canvas.on('object:added', () => {
      coverMask.bringToFront();
    });
    this.canvas.clipPath = undefined;
    this.canvas.add(coverMask);
    this.coverMask = coverMask;
    this.setCoverMask();
    // 适配模板和psd的loadjson，在加载完成后再入mask
    needBindLoadJSON && this.editor.on('loadJson', () => this.initMask(false));
  }

  destroy() {
    console.log('pluginDestroy');
  }
}

export default MaskPlugin;
