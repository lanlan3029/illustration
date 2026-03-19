

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
    let fontFamilies: string[] = [];
    const skipFonts = ['arial'];
    if (object.objects) {
      fontFamilies = JSON.parse(str)
        .objects.filter((item: Font) => {
          const hasFontFile = this.cacheList.find((font) => font.name === item.fontFamily);
          return item.type.includes('text') && !skipFonts.includes(item.fontFamily) && hasFontFile;
        })
        .map((item: Font) => item.fontFamily);
    } else {
      fontFamilies = skipFonts.includes(object.fontFamily) ? [] : [object.fontFamily];
    }

    const fontFamiliesAll = fontFamilies.map((fontName) => {
      const font = new FontFaceObserver(fontName);
      return font.load(null, 150000);
    });
    return Promise.all(fontFamiliesAll);
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
    const font = new FontFaceObserver(fontName);
    return font.load(null, 150000).then(() => {
      const activeObject = this.canvas.getActiveObjects()[0];
      if (activeObject) {
        activeObject.set('fontFamily', fontName);
        this.canvas.renderAll();
      }
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
