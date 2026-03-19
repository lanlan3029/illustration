declare module 'fabric' {
  export const fabric: any;
}

declare module 'fontfaceobserver' {
  const FontFaceObserver: any;
  export default FontFaceObserver;
}

// 本仓库的 kuaitu-core 使用了包名形式的类型引用，但实际实现来自 src/kuaitu-core/core
// 这里提供最小类型声明以避免 TS 报错（不影响运行时）。
declare module '@kuaitu-core/core' {
  export interface IEditor {
    [key: string]: any;
  }
  export interface IPluginTempl {
    [key: string]: any;
  }
}

