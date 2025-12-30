// 词库与分类配置，供 App 按需引入

export const INITIAL_CATEGORIES = {
  character: { id: "character", label: "人物 (CHARACTER)", color: "blue" },
  item: { id: "item", label: "物品 (ITEM)", color: "amber" },
  action: { id: "action", label: "动作 (ACTION)", color: "rose" },
  location: { id: "location", label: "地点 (LOCATION)", color: "emerald" },
  visual: { id: "visual", label: "画面 (VISUALS)", color: "violet" },
  other: { id: "other", label: "其他 (OTHER)", color: "slate" }
};

// --- 初始数据配置 (Updated with new banks for examples) ---
export const INITIAL_BANKS = {

  role: {
    label: "主体对象",
    category: "character",
    options: ["小男孩", "小女孩", "小动物", "小精灵", "小公主", "男人","女人","老年女性","老年男性","王子", "小魔法师", "小骑士"]
  },
  character_companion: {
    label: "合影角色",
    category: "character",
    options: ["小兔子", "小熊", "小猫咪", "小狗狗", "小企鹅", "小熊猫", "小狐狸", "小松鼠", "小鹿", "小象"]
  },
  layout_focus: {
    label: "构图重心",
    category: "visual",
    options: ["全身立绘", "半身肖像", "玩耍姿势", "奔跑姿势", "坐着姿势", "站立姿势"]
  },
  grid_pose: { 
    label: "九宫格动作", 
    category: "action", 
    options: [
      "开心地挥手", "双手比V字", "双手托腮", "双手举高", 
      "侧身微笑", "正面大笑", "歪头看镜头", "坐着看镜头", 
      "闭眼微笑", "用手遮挡阳光", "回眸一笑", "吹泡泡糖",
      "正面直视镜头，表情开心，眼神明亮", "凝视镜头，嘴角上扬，展现纯真笑容", 
      "专注地看着镜头，表情可爱，眼神温和", "侧身回望，眼神温柔，嘴角上扬", 
      "转身回眸，笑容灿烂", "手轻抚脸颊，表情可爱", 
      "单手支撑下巴，表情天真，眼神专注", "双手放在胸前，表情乖巧", 
      "正在吹泡泡糖，表情可爱，眼神专注", "侧面特写，突出可爱面部"
    ] 
  },
  
  camera_angle: {
    label: "拍摄角度",
    category: "visual",
    options: ["正面特写", "侧面特写", "半身照", "全身照", "俯视角度", "仰视角度", "平视角度"]
  },
  connectors: {
    label: "视觉引导",
    category: "visual",
    options: ["手绘箭头或引导线", "虚线连接", "彩色光束", "星星连线", "爱心连线"]
  },
  clothing: {
    label: "人物服饰",
    category: "item",
    options: ["彩色T恤", "背带裤", "连衣裙", "校服", "运动服", "小裙子", "短裤", "长裤"]
  },
  clothing_male: {
    label: "男性服饰",
    category: "item",
    options: ["蓝色T恤", "背带裤", "短裤", "运动服", "校服", "小马甲", "格子衬衫", "牛仔裤"]
  },
  clothing_female: {
    label: "女性服饰",
    category: "item",
    options: ["粉色连衣裙", "小裙子", "背带裤", "T恤", "校服", "公主裙", "花边衬衫", "短裤"]
  },
  expressions: {
    label: "表情",
    category: "character",
    options: ["开心大笑", "微笑", "害羞", "惊讶", "专注", "调皮", "好奇", "兴奋", "安静", "温柔"]
  },
  // 体型和姿态
  body_type: {
    label: "体型",
    category: "character",
    options: ["高挑", "健壮", "娇小", "纤细", "圆润", "瘦弱", "匀称", "丰满"]
  },
  pose: {
    label: "姿态",
    category: "character",
    options: ["坐着", "奔跑", "侧身站立", "双手抱胸", "做出手势", "跳跃", "走路", "蹲着", "躺着", "挥手", "举手", "叉腰"]
  },
  // 发型和发色
  hair_style: {
    label: "发型",
    category: "character",
    options: ["长直发", "波浪卷发", "短发", "马尾辫", "刘海", "双马尾", "丸子头", "齐肩发", "卷发", "寸头", "平头", "中分", "偏分"]
  },
  hair_color: {
    label: "发色",
    category: "character",
    options: ["黑色", "金色", "棕色", "银色", "粉色", "蓝色", "紫色", "红色", "白色", "灰色", "粉色挑染", "蓝色挑染", "渐变色"]
  },
  // 配饰
  accessories: {
    label: "配饰",
    category: "character",
    options: ["眼镜", "项链", "耳环", "帽子", "围巾", "手套", "纹身", "发卡", "发带", "手链", "手表", "背包", "腰带", "领带", "蝴蝶结"]
  },
  // 角色特点
  character_traits: {
    label: "角色特点",
    category: "character",
    options: ["伤疤", "翅膀", "动物耳朵", "机械臂", "魔法光环", "尾巴", "角", "特殊眼睛", "胎记", "雀斑", "酒窝", "小虎牙", "长睫毛", "大眼睛"]
  },
  texture_zoom: {
    label: "材质特写",
    category: "visual",
    options: ["柔软的布料", "光滑的皮肤", "毛茸茸的质感", "亮晶晶的装饰", "彩色的图案"]
  },
  action_detail: {
    label: "动作细节",
    category: "action",
    options: ["奔跑", "跳跃", "挥手", "拥抱", "玩耍", "读书", "画画", "唱歌", "跳舞", "做游戏"]
  },
  special_view: {
    label: "特殊视角",
    category: "visual",
    options: ["从上方俯视", "从下方仰视", "侧面视角", "正面视角", "45度角视角"]
  },
  bag_content: {
    label: "随身包袋",
    category: "item",
    options: ["小书包", "可爱的毛绒背包", "卡通图案背包", "小挎包", "小提包"]
  },
  cosmetics: {
    label: "随身物品",
    category: "item",
    options: ["彩色铅笔", "小水壶", "小玩具", "小零食", "小本子", "小贴纸", "小发卡", "小帽子"]
  },
  private_items: {
    label: "个人物品",
    category: "item",
    options: ["小玩具", "小玩偶", "小积木", "小绘本", "小画笔", "小橡皮", "小尺子", "小文具盒"]
  },
  art_style: {
    label: "画风",
    category: "visual",
    options: ["卡通插画风格", "水彩手绘风格", "温馨可爱风格", "儿童绘本风格", "简笔画风格", "彩色铅笔风格"]
  },
  background_style: {
    label: "背景风格",
    category: "visual",
    options: ["纯色背景", "渐变背景", "手绘背景", "自然背景", "室内场景", "户外场景", "天空背景", "草地背景"]
  },
  classic_scene: {
    label: "经典场景",
    category: "location",
    options: [
      "幼儿园",
      "游乐场",
      "公园",
      "学校",
      "家里",
      "图书馆",
      "海边",
      "森林",
      "花园",
      "城堡",
      "童话小镇",
      "彩虹桥"
    ]
  },
  position: {
    label: "文字位置",
    category: "location",
    options: ["顶部中央", "底部中央", "左上角偏中", "右上角偏中", "画面中上方悬浮"]
  },
  render_style: {
    label: "渲染风格",
    category: "visual",
    options: [
      "Octane Render 和 Cinema 4D",
      "乐高积木风格",
      "Unreal Engine 5 写实光追",
      "Pixar 卡通渲染",
      "黏土动画质感",
      "手办级实体渲染",
      "3D像素风格"
    ]
  },

  ratio: {
    label: "画幅比例",
    category: "visual",
    options: [
      "3:4竖构图",
      "9:16竖构图",
      "1:1",
      "4:3横构图",
      "16:9横构图"
    ]
  },
  // Fashion Template additions
  fashion_deconstruct: {
    label: "穿搭解构",
    category: "item",
    options: ["整齐折叠的衣服", "散落的玩具", "悬挂的小书包", "堆叠的彩色积木", "摆放整齐的鞋子"]
  },
  toy_companion: {
    label: "互动公仔",
    category: "item",
    options: ["泰迪熊", "小兔子玩偶", "小猫咪玩偶", "小狗狗玩偶", "小熊猫玩偶", "小企鹅玩偶", "小恐龙", "小机器人"]
  },
  
  // Old ones preserved for compatibility or other templates
  lens_param: {
    label: "九宫格镜头",
    category: "visual",
    options: ["85mm, f/1.8", "85mm, f/2.0", "50mm, f/2.2", "50mm, f/2.5", "50mm, f/3.2", "35mm, f/4.5", "85mm, f/1.9", "50mm, f/1.8", "85mm, f/2.2", "50mm, f/2.0"]
  },
  lighting: {
    label: "灯光布置",
    category: "visual",
    options: ["自然光", "温暖阳光", "柔和灯光", "明亮灯光", "温馨灯光"]
  },
  sticker_core: {
    label: "核心贴纸",
    category: "item",
    options: ["小朋友的照片", "可爱的卡通形象", "小动物贴纸", "花朵贴纸"]
  },
  sticker_decor: {
    label: "装饰元素",
    category: "item",
    options: ["手绘爱心", "星星、月亮", "彩虹", "花朵", "蝴蝶", "小云朵", "小太阳", "彩色圆点"]
  },
  action_pose: {
    label: "互动姿势",
    category: "action",
    options: ["手拉手", "互相拥抱", "一起玩耍", "一起做游戏", "一起读书", "一起画画", "一起唱歌", "一起跳舞"]
  },
  background_scene: {
    label: "背景场景",
    category: "location",
    options: ["幼儿园教室", "游乐场", "公园", "家里", "图书馆", "海边", "森林", "花园", "学校操场"]
  }
};

export const INITIAL_DEFAULTS = {
  role: "",
  subject: "",
  character_companion: "",
  layout_focus: "",
  camera_angle: "",
  connectors: "",
  clothing: "",
  clothing_male: "",
  clothing_female: "",
  expressions: "",
  texture_zoom: "",
  action_detail: "",
  special_view: "",
  bag_content: "",
  cosmetics: "",
  private_items: "",
  art_style: "",
  background_style: "",
  fashion_deconstruct: "",
  toy_companion: "",
  classic_scene: "",
  render_style: "",
  position: "",
  company: "",
  ratio: "",
  
  // 体型和姿态
  body_type: "",
  pose: "",
  
  // 发型和发色
  hair_style: "",
  hair_color: "",
  
  // 配饰
  accessories: "",
  
  // 角色特点
  character_traits: "",
  
  // Grid defaults
  grid_pose: "",
  
  // Legacy defaults
  lens_param: "",
  lighting: "",
  sticker_core: "",
  sticker_decor: "",
  action_pose: "",
  background_scene: ""
};

