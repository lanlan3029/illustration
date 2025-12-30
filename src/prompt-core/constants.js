// 从 banks.js 导入数据
import { INITIAL_BANKS as BANKS_DATA, INITIAL_DEFAULTS as DEFAULTS_DATA, INITIAL_CATEGORIES as CATEGORIES_DATA } from './banks';

// 系统模板配置
export const INITIAL_TEMPLATES_CONFIG = [

  {
    id: 'character-detail',
    name: '详细描述',
    content: '{{role}}，{{body_type}}体型，{{pose}}，{{hair_style}}，{{hair_color}}发色，穿着{{clothing}}，{{accessories}}，表情{{expressions}}，{{character_traits}}，{{art_style}}',
    category: 'character'
  },
  {
    id: 'character-simple',
    name: '简单描述',
    content: '',
    category: 'character'
  },
  {
    id: 'complete-prompt',
    name: '完整提示词',
    // 按照：人物 -> 动作 -> 物品 -> 地点 -> 画面 -> 其他 的顺序组织
    content: '{{#role}}{{role}}{{/role}}{{#expressions}}，表情{{expressions}}{{/expressions}}{{#body_type}}，{{body_type}}体型{{/body_type}}{{#pose}}，{{pose}}{{/pose}}{{#hair_style}}，{{hair_style}}{{/hair_style}}{{#hair_color}}，{{hair_color}}发色{{/hair_color}}{{#character_traits}}，{{character_traits}}{{/character_traits}}{{#character_companion}}，与{{character_companion}}一起{{/character_companion}}{{#grid_pose}}，{{grid_pose}}{{/grid_pose}}{{#action_detail}}，正在{{action_detail}}{{/action_detail}}{{#action_pose}}，{{action_pose}}{{/action_pose}}{{#clothing}}，穿着{{clothing}}{{/clothing}}{{#clothing_male}}，穿着{{clothing_male}}{{/clothing_male}}{{#clothing_female}}，穿着{{clothing_female}}{{/clothing_female}}{{#accessories}}，佩戴{{accessories}}{{/accessories}}{{#bag_content}}，背着{{bag_content}}{{/bag_content}}{{#cosmetics}}，拿着{{cosmetics}}{{/cosmetics}}{{#private_items}}，带着{{private_items}}{{/private_items}}{{#toy_companion}}，抱着{{toy_companion}}{{/toy_companion}}{{#fashion_deconstruct}}，{{fashion_deconstruct}}{{/fashion_deconstruct}}{{#sticker_core}}，{{sticker_core}}{{/sticker_core}}{{#sticker_decor}}，{{sticker_decor}}{{/sticker_decor}}{{#classic_scene}}，在{{classic_scene}}{{/classic_scene}}{{#background_scene}}，在{{background_scene}}{{/background_scene}}{{#position}}，{{position}}{{/position}}{{#layout_focus}}，{{layout_focus}}{{/layout_focus}}{{#camera_angle}}，{{camera_angle}}{{/camera_angle}}{{#special_view}}，{{special_view}}{{/special_view}}{{#lens_param}}，{{lens_param}}{{/lens_param}}{{#art_style}}，{{art_style}}{{/art_style}}{{#background_style}}，{{background_style}}{{/background_style}}{{#render_style}}，{{render_style}}{{/render_style}}{{#lighting}}，{{lighting}}{{/lighting}}{{#texture_zoom}}，{{texture_zoom}}{{/texture_zoom}}{{#ratio}}，{{ratio}}{{/ratio}}{{#connectors}}，{{connectors}}{{/connectors}}',
    category: 'complete'
  }

];

// 初始选项库 - 从 banks.js 导入并筛选角色相关的类目
// 角色相关类目：设定(role/subject)、衣着(clothing)、表情(expressions)、关键色调(art_style/background_style)
export const INITIAL_BANKS = {
  // 设定相关
  role: {
    name: BANKS_DATA.role?.label || '角色身份',
    category: 'character',
    options: BANKS_DATA.role?.options || []
  },
  subject: {
    name: BANKS_DATA.subject?.label || '主体对象',
    category: 'character',
    options: BANKS_DATA.subject?.options || []
  },
  // 衣着相关
  clothing: {
    name: BANKS_DATA.clothing?.label || '人物服饰',
    category: 'character',
    options: BANKS_DATA.clothing?.options || []
  },
  clothing_male: {
    name: BANKS_DATA.clothing_male?.label || '男性服饰',
    category: 'character',
    options: BANKS_DATA.clothing_male?.options || []
  },
  clothing_female: {
    name: BANKS_DATA.clothing_female?.label || '女性服饰',
    category: 'character',
    options: BANKS_DATA.clothing_female?.options || []
  },
  // 表情相关
  expressions: {
    name: BANKS_DATA.expressions?.label || '表情集',
    category: 'character',
    options: BANKS_DATA.expressions?.options || []
  },
  // 关键色调和风格相关
  art_style: {
    name: BANKS_DATA.art_style?.label || '画风',
    category: 'visual',
    options: BANKS_DATA.art_style?.options || []
  },
  // 体型和姿态
  body_type: {
    name: BANKS_DATA.body_type?.label || '体型',
    category: 'character',
    options: BANKS_DATA.body_type?.options || []
  },
  pose: {
    name: BANKS_DATA.pose?.label || '姿态',
    category: 'character',
    options: BANKS_DATA.pose?.options || []
  },
  // 发型和发色
  hair_style: {
    name: BANKS_DATA.hair_style?.label || '发型',
    category: 'character',
    options: BANKS_DATA.hair_style?.options || []
  },
  hair_color: {
    name: BANKS_DATA.hair_color?.label || '发色',
    category: 'character',
    options: BANKS_DATA.hair_color?.options || []
  },
  // 配饰
  accessories: {
    name: BANKS_DATA.accessories?.label || '配饰',
    category: 'character',
    options: BANKS_DATA.accessories?.options || []
  },
  // 角色特点
  character_traits: {
    name: BANKS_DATA.character_traits?.label || '角色特点',
    category: 'character',
    options: BANKS_DATA.character_traits?.options || []
  }
};

// 初始默认值 - 从 banks.js 导入
export const INITIAL_DEFAULTS = {
  role: DEFAULTS_DATA.role || '',
  subject: DEFAULTS_DATA.subject || '',
  clothing: DEFAULTS_DATA.clothing || '',
  clothing_male: DEFAULTS_DATA.clothing_male || '',
  clothing_female: DEFAULTS_DATA.clothing_female || '',
  expressions: DEFAULTS_DATA.expressions || '',
  art_style: DEFAULTS_DATA.art_style || '',
  body_type: DEFAULTS_DATA.body_type || '',
  pose: DEFAULTS_DATA.pose || '',
  hair_style: DEFAULTS_DATA.hair_style || '',
  hair_color: DEFAULTS_DATA.hair_color || '',
  accessories: DEFAULTS_DATA.accessories || '',
  character_traits: DEFAULTS_DATA.character_traits || ''
};

// 初始分类 - 从 banks.js 导入
export const INITIAL_CATEGORIES = {
  character: {
    name: CATEGORIES_DATA.character?.label || '角色',
    color: '#409eff'
  },
  visual: {
    name: CATEGORIES_DATA.visual?.label || '画面',
    color: '#67c23a'
  },
  item: {
    name: CATEGORIES_DATA.item?.label || '物品',
    color: '#e6a23c'
  },
  action: {
    name: CATEGORIES_DATA.action?.label || '动作',
    color: '#f56c6c'
  },
  location: {
    name: CATEGORIES_DATA.location?.label || '地点',
    color: '#67c23a'
  },
  other: {
    name: CATEGORIES_DATA.other?.label || '其他',
    color: '#909399'
  }
};
