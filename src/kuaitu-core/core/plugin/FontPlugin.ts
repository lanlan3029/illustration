

// const repoSrc = 'http://localhost:1337';
import { fabric } from 'fabric';
import FontFaceObserver from 'fontfaceobserver';
import axios from 'axios';
import { downFile } from '../utils/utils';
import type { IEditor, IPluginTempl } from '@kuaitu-core/core';

type IPlugin = Pick<FontPlugin, 'getFontList' | 'loadFont' | 'getFontJson' | 'downFontByJSON'>;

declare module '@kuaitu-core/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

interface Font {
  type: string;
  fontFamily: string;
}

interface FontSource {
  name: string;
  type: string;
  file: string;
  img: string;
  fontFamily?: string;
}

interface LocalFont {
  name: string;
  fontFamily?: string;
  img?: string;
}

class FontPlugin implements IPluginTempl {
  private tempPromise: Promise<FontSource[]> | null;
  static pluginName = 'FontPlugin';
  static apis = ['getFontList', 'loadFont', 'getFontJson', 'downFontByJSON'];
  repoSrc: string;
  cacheList: FontSource[];
  localFonts: LocalFont[];
  constructor(public canvas: any, public editor: IEditor, config: { repoSrc: string }) {
    this.repoSrc = config.repoSrc;
    this.cacheList = [];
    this.tempPromise = null;
    this.localFonts = (config as any)?.localFonts || [];
  }

  hookImportBefore(json: string) {
    return this.downFontByJSON(json);
  }
  getFontList() {
    // 返回暂存字体
    if (this.cacheList.length) {
      return Promise.resolve(this.cacheList);
    }
    if (this.tempPromise) return this.tempPromise;

    const fallbackLocal = () => {
      const list: FontSource[] = (this.localFonts || []).map((f) => ({
        name: f.name || f.fontFamily || '',
        type: 'local',
        file: '',
        img: f.img || '',
        // 供下拉预览 / 画布应用；系统字体可能是带回退的 CSS 栈
        fontFamily: (f as LocalFont).fontFamily || f.name || '',
      })).filter((f) => !!f.name);
      this.cacheList = list;
      return list;
    };

    // repoSrc 为空时直接回退本地字体
    if (!this.repoSrc) {
      this.tempPromise = Promise.resolve(fallbackLocal());
      return this.tempPromise;
    }

    this.tempPromise = axios
      .get(`${this.repoSrc}/api/fonts?populate=*&pagination[pageSize]=100`)
      .then((res) => {
        const list: FontSource[] = (res?.data?.data || []).map((item: any) => {
          return {
            name: item.attributes.name,
            type: item.attributes.type,
            file: this.repoSrc + item.attributes.file.data.attributes.url,
            img: this.repoSrc + item.attributes.img.data.attributes.url,
          };
        });
        // 后端返回空时回退本地字体（本地 font.css 已注册 @font-face，不需要 createFontCSS）
        if (!list.length) return fallbackLocal();

        this.cacheList = list;
        this.createFontCSS(list);
        return list;
      })
      .catch(() => fallbackLocal());
    return this.tempPromise;
  }

  downFontByJSON(str: string) {
    const object = JSON.parse(str);
    const skipFonts = new Set([
      'arial',
      'helvetica',
      'sans-serif',
      'serif',
      'monospace',
      'times',
      'times new roman',
      'courier',
      'courier new',
      'georgia',
      'system-ui',
    ]);

    const primaryFamily = (raw: unknown) =>
      String(raw || '')
        .split(',')[0]
        .replace(/['"]/g, '')
        .trim();

    const shouldSkipFamily = (raw: unknown) => {
      const name = primaryFamily(raw).toLowerCase();
      if (!name) return true;
      if (skipFonts.has(name)) return true;
      // 系统字体 CSS 栈或未配置 file 的本地字体，无需 FontFaceObserver
      return false;
    };

    /** 仅对带真实字体文件的项做预加载；系统/本地空 file 会卡死 Spin */
    const needsWebFontLoad = (family: string) => {
      if (shouldSkipFamily(family)) return false;
      const hit = this.cacheList.find(
        (font) =>
          font.name === family ||
          font.fontFamily === family ||
          primaryFamily(font.fontFamily) === primaryFamily(family)
      );
      return Boolean(hit?.file);
    };

    let fontFamilies: string[] = [];
    if (object.objects) {
      fontFamilies = object.objects
        .filter((item: Font) => {
          const type = String((item as any)?.type || '');
          return type.includes('text') && needsWebFontLoad(item.fontFamily);
        })
        .map((item: Font) => primaryFamily(item.fontFamily))
        .filter(Boolean);
    } else if (object.fontFamily && needsWebFontLoad(object.fontFamily)) {
      fontFamilies = [primaryFamily(object.fontFamily)];
    }

    // 去重；任一字体失败也不阻断模版导入（避免全屏 Spin 白屏）
    const unique = [...new Set(fontFamilies)];
    if (!unique.length) return Promise.resolve([]);

    return Promise.all(
      unique.map((fontName) => {
        const font = new FontFaceObserver(fontName);
        return font.load('汉字Aa', 8000).catch(() => null);
      })
    );
  }

  // 获取字体数据 新增字体样式使用
  getFontJson() {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject) {
      const json = activeObject.toJSON(['id', 'gradientAngle', 'selectable', 'hasControls']);
      const fileStr = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(json, null, '\t')
      )}`;
      const dataUrl = activeObject.toDataURL({});
      downFile(fileStr, 'font.json');
      downFile(dataUrl, 'font.png');
    }
  }

  loadFont(fontName: string) {
    const apply = () => {
      const activeObject = this.canvas.getActiveObjects()[0];
      if (activeObject) {
        activeObject.set('fontFamily', fontName);
        this.canvas.requestRenderAll();
      }
    };

    if (!fontName) return Promise.resolve();

    // 系统字体 CSS 栈（含逗号）无需等待 webfont
    if (fontName.includes(',')) {
      apply();
      return Promise.resolve();
    }

    // 等自定义字体真正可用后再应用，避免先闪系统字体
    const primary = fontName.replace(/['"]/g, '').trim();
    const font = new FontFaceObserver(primary);
    return font
      .load('汉字Aa', 20000)
      .then(() => {
        apply();
      })
      .catch(() => {
        apply();
      });
  }

  createFontCSS(arr: any[]) {
    let code = '';
    arr.forEach((item) => {
      code =
        code +
        `
    @font-face {
      font-family: ${item.name};
      src: url('${item.file}');
    }
    `;
    });
    const style = document.createElement('style');
    try {
      style.appendChild(document.createTextNode(code));
    } catch (error) {
      // style.styleSheet.cssText = code;
    }
    const head = document.getElementsByTagName('head')[0];
    head.appendChild(style);
  }

  destroy() {
    console.log('pluginDestroy');
  }
}

export default FontPlugin;
