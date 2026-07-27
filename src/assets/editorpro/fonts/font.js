/*
 * 编辑器字体列表（与 font.css 中 @font-face 的 font-family 一致）
 * name = 下拉展示名；fontFamily = canvas/CSS 实际族名
 */
const customFonts = [
  { name: '汉体', fontFamily: '汉体' },
  { name: '华康金刚黑', fontFamily: '华康金刚黑' },
  { name: '阿里巴巴普惠体', fontFamily: '阿里巴巴普惠体' },
  { name: '阿里妈妈刀隶体', fontFamily: '阿里妈妈刀隶体' },
  { name: '阿里妈妈东方大楷', fontFamily: '阿里妈妈东方大楷' },
  { name: '阿里妈妈方圆体', fontFamily: '阿里妈妈方圆体' },
  { name: '阿里妈妈灵动体', fontFamily: '阿里妈妈灵动体' },
  { name: '阿里妈妈数黑体', fontFamily: '阿里妈妈数黑体' },
  { name: '得意黑', fontFamily: '得意黑' },
  { name: '钉钉进步体', fontFamily: '钉钉进步体' },
  { name: '寒蝉圆体', fontFamily: '寒蝉圆体' },
  { name: '苦累蛙圓體', fontFamily: '苦累蛙圓體' },
  { name: '思源黑体', fontFamily: '思源黑体' },
  { name: '小米MiSans', fontFamily: '小米MiSans' },
  { name: 'Avara', fontFamily: 'Avara' },
  { name: 'Caveat', fontFamily: 'Caveat' },
  { name: 'PublicSans', fontFamily: 'PublicSans' },
];

/** 本机系统字体（零下载，作补充） */
const systemFonts = [
  {
    name: '系统黑体',
    fontFamily: 'PingFang SC, Microsoft YaHei, Heiti SC, SimHei, sans-serif',
  },
  {
    name: '系统宋体',
    fontFamily: 'Songti SC, SimSun, STSong, serif',
  },
  {
    name: '系统楷体',
    fontFamily: 'Kaiti SC, KaiTi, STKaiti, serif',
  },
  {
    name: '系统仿宋',
    fontFamily: 'STFangsong, FangSong, FangSong_GB2312, serif',
  },
  {
    name: '系统圆体',
    fontFamily: 'Yuanti SC, YouYuan, STYuanti, sans-serif',
  },
  {
    name: 'Arial',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  {
    name: 'Georgia',
    fontFamily: 'Georgia, Times New Roman, serif',
  },
  {
    name: 'Times',
    fontFamily: 'Times New Roman, Times, serif',
  },
  {
    name: 'Courier',
    fontFamily: 'Courier New, Courier, monospace',
  },
];

export default [...customFonts, ...systemFonts];
