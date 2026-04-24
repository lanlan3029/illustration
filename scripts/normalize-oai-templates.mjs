/**
 * One-off: inline source — run to regenerate src/data/oaiImageTemplates.json
 * (items copied from OpenAI/ChatGPT app style templates; prompt_text -> prompt, image_url -> image)
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const out = path.join(__dirname, '../src/data/oaiImageTemplates.json')

// eslint-disable-next-line no-unused-vars
const sourceItems = [
    {
        id: 'headshot',
        title: '影棚形象照',
        description: '把自拍变成形象照',
        prompt_text: '把这张照片转换成高级时尚风的影棚肖像。选择能衬托主体肤色的背景色。保持紧凑的头肩构图，让主体居中，正对镜头，带着乐观的表情。使用定向打光并保留细微阴影。在保留自然肤色的同时，让画面精致、极简、富有编辑感——像杂志写真一样。',
        image_url: 'https://persistent.oaistatic.com/images-app/headshot-sheet.webp'
    },
    {
        id: 'blueprint',
        title: '蓝图海报',
        description: '制作蓝图海报',
        prompt_text: '只使用上传图片中的主要主体，制作一张单主体蓝图海报。将其呈现为深钴蓝色蓝图背景上的干净白色技术线描，并带有细微网格。使用扁平化 2D 示意线稿、正投影轮廓、构造线、测量刻度、箭头和极简技术标注。构图中也可加入 2-3 个较小的嵌入式细节图或其他视图。保持版式简洁均衡，不要阴影、不要 3D、不要光照、不要额外物体。',
        image_url: 'https://persistent.oaistatic.com/images-app/blueprint-sheet.webp'
    },
    {
        id: 'flash',
        title: '夜拍闪光',
        description: '打造时髦夜拍曝光感',
        prompt_text: '把这张照片变成夜间时髦直闪摄影风格。使用强烈的机顶直闪，让主体有明显高光、深阴影，并略微过曝。场景设在夜晚，背景昏暗、有氛围感，同时保持真实的色彩和纹理。加入抓拍般的杂志大片感、略带瑕疵的构图、运动感和自然流露的表情。突出高对比、皮肤的光泽高光和细微胶片颗粒，呈现生猛的时尚夜生活美学。',
        image_url: 'https://persistent.oaistatic.com/images-app/flash-sheet.webp'
    },
    {
        id: 'anime',
        title: '动漫风',
        description: '看看动漫里的自己',
        prompt_text: '根据上传的主体，创作一张当下流行的动漫艺术风格图像。使用自信有力、略有变化的线条，以及用平面阴影块呈现的少量赛璐璐阴影。使用明亮、高饱和的色彩和干净的图形化打光。风格应以夸张、卡通化的人物比例为特征，搭配极富表现力的简洁面部特征，展现极大的情绪幅度，并配合高度变化、拉伸感强的身体结构。将环境转化为略微扭曲的空间，加入俏皮的透视畸变和简化的物体。构图和整体基调应充满活力、生动且诙谐，呈现一个完全风格化、非写实的世界。',
        image_url: 'https://persistent.oaistatic.com/images-app/anime-sheet.webp'
    },
    {
        id: 'comic',
        title: '漫画',
        description: '创作连环漫画',
        prompt_text: '用上传图片中的主体创作一则漫画。把它做成大胆的周日报纸彩色连环漫画风格，带有粗线条、网点纹理和明亮的 1980 年代色彩。从照片中挑一个清晰、夸张的视觉元素，围绕它展开故事，并导向一个好笑或出人意料的包袱。对话要简短、自然、易读，确保笑点让人一眼就懂，不要显得随机或让人困惑。',
        image_url: 'https://persistent.oaistatic.com/images-app/comic-sheet.webp'
    },
    {
        id: 'icon',
        title: '标识设计',
        description: '用照片生成 Logo',
        prompt_text: '把这张图片转成一组极简 Logo 网格，以主体作为核心图标。将主要元素抽象并简化为多个独特的矢量风格标志图形。每个版本都要以不同方式重新诠释同一主体（几何、线稿、负空间、徽记、徽章、字母组合）。在浅色背景上均匀排布 16–20 个 Logo。设计保持干净、现代、间距均衡。在保持一致性的同时，探索原始主体的创意变化，形成一套连贯的品牌 Logo 系列。',
        image_url: 'https://persistent.oaistatic.com/images-app/icon-sheet.webp'
    },
    {
        id: 'fantasy-newspaper',
        title: '奇幻报纸',
        description: '登上奇幻报纸',
        prompt_text: '将上传照片中的人物变成一张异想天开的黑白复古报纸头版。将其作为居中的主肖像，风格仿若老式雕版照片。四周配上粗大胆张的标题、狭窄的报纸栏和俏皮的小标题。使用纯白背景上的高对比黑色油墨、细微纸张纹理和经典衬线字体。加入古怪、魔幻或幽默的标题，营造迷人而略带超现实的氛围。保持版面密集、富有编辑感，并让人想起旧时的奇幻报纸。确保主体面部仍清晰可辨，同时经过风格化处理，以契合印刷报纸美学。',
        image_url: 'https://persistent.oaistatic.com/images-app/fantasy-newspaper-sheet.webp'
    },
    {
        id: 'infographic-poster',
        title: '信息图海报',
        description: '制作信息图海报',
        prompt_text: '创作一张复古植物学插画海报，仅依据可见细节，将主体重新诠释成仿佛在19世纪科学图谱中被研究的对象。使用精细墨线、细腻排线，以及写实但理想化的插画风格。在白色背景上采用上传图像中的明亮色彩。版式以中央主插图为核心，辅以较小的局部研究图、引导线和图解标注，并用注释文字分析形态与结构。加入低调的标签和标记。注释文字应使用简明、易读的英文。',
        image_url: 'https://persistent.oaistatic.com/images-app/infographic-poster-sheet.webp'
    },
    {
        id: 'film-strip',
        title: '胶片条',
        description: '制作电影感胶片条',
        prompt_text: '把上传的图片转成电影感的三联连续剧照（横向画幅纵向堆叠），全出血铺满边缘。每一帧都呈现同一场景中的不同时刻，并有清晰推进。通过变化构图、机位和景别来营造运动感与叙事感。采用电影感、偏冷调、高对比、黑位深邃的胶片质感，并保持自然调色。加入细微胶片颗粒、轻微动态模糊和自然瑕疵，模拟胶片摄影。保持抓拍式、情绪真实的构图，带有运动感和安静叙事。整体美学：电影感、怀旧、自然，像未经修饰的原始胶片剧照。',
        image_url: 'https://persistent.oaistatic.com/images-app/film-strip-sheet.webp'
    },
    {
        id: 'tarot',
        title: '塔罗牌',
        description: '获取你的专属塔罗牌',
        prompt_text: '根据你对我的了解，以经典 Rider-Waite 风格创作一张塔罗牌。把我画成手绘人物，使用粗重但不完美、带有抖动和变化的黑色墨线，平涂上色，不要阴影。人物周围叠加细微的塔罗视觉元素。加入纸张纹理和印刷质感。',
        image_url: 'https://persistent.oaistatic.com/images-app/tarot-sheet.webp'
    },
    {
        id: 'enhance',
        title: '增强照片',
        description: '提升照片画质',
        prompt_text: '提升我的照片画质，让它更清晰。',
        image_url: 'https://persistent.oaistatic.com/images-app/enhance-sheet.webp'
    },
    {
        id: 'mid-century',
        title: '室内设计',
        description: '改造任何房间',
        prompt_text: '把这张图变成一个逼真的中世纪现代风室内空间：线条利落，材质温暖天然，家具富有雕塑感，并用明亮、自然、富有电影感的光线突出房间肌理。保持空间为照片级写实效果，像一张高端编辑风室内摄影作品。',
        image_url: 'https://persistent.oaistatic.com/images-app/mid-century-sheet.webp'
    },
    {
        id: 'spring',
        title: '春日繁花',
        description: '生成春日花卉照片',
        prompt_text: '把我的照片变成一张超广角、贴地仰拍的人像，画面里只有我，并移除所有原始背景。用贴近镜头、距离只有几英寸的 oversized spring flowers 构图，让花朵与画面边缘交叠，并向我延伸，营造纵深感。让我位于镜头上方，在明亮日光下与前景轻微互动，画面色彩鲜艳、阴影强烈。把我的穿搭改成时髦现代的春季服装。保留我的相貌特征，营造大胆、沉浸式的时尚编辑大片感。',
        image_url: 'https://persistent.oaistatic.com/images-app/spring-sheet.webp'
    },
    {
        id: '3d-avatar',
        title: '3D 头像',
        description: '打造你的 3D 头像',
        prompt_text: '使用上传的图片作为唯一参考，为主体生成高级光泽感 3D “designer toy” 渲染图。每人仅渲染一个悬浮头部（不要重复），在下颌下方干净裁切，露出颈部，并让整个头部完整、舒适地入镜。风格：高品质 vinyl figure，造型极致光滑、简化，体积圆润，面部关键区域带有强烈的 glossy reflections。头发应有 sculpted 的雕塑感、光泽感和风格化处理，并嵌入俏皮配饰。加入夸张的复古包覆式太阳镜，镜框与镜片颜色鲜艳且相配。使用强烈的棚拍灯光，打造明显高光。背景：有柔和云朵的蓝天。',
        image_url: 'https://persistent.oaistatic.com/images-app/3d-avatar-sheet.webp'
    },
    {
        id: 'universal-lighting',
        title: '优化光线',
        description: '修正照片光线',
        prompt_text: '在保持其他一切完全不变的前提下改善光线。不要改变人物、姿势、表情、背景或构图。修复逆光、阴影过重、曝光不足或光线不均等问题。将原始光线调整为从略高于视线、正对主体打来的柔和、自然、衬托人物的光线，使面部受光均匀、肤色真实。保持结果具备照片级真实感，并与原始场景一致。',
        image_url: 'https://persistent.oaistatic.com/images-app/universal-lighting-sheet.webp'
    },
    {
        id: 'drawing',
        title: '绘画',
        description: '让画作活起来',
        prompt_text: '把这张简单、稚拙的画或照片变成照片级真实场景。把它当作精确蓝图；所有比例、形状和独特小细节都保持原样。把它转化为真实的材质、纹理和光照。将它置于可信的环境中，加入纵深感和阴影，让它像这幅画被带入现实后拍成的真实照片。',
        image_url: 'https://persistent.oaistatic.com/images-app/drawing-sheet.webp'
    },
    {
        id: 'hyper-real',
        title: '超写实壁纸',
        description: '生成超写实壁纸',
        prompt_text: '创建一张自然户外场景的微距自然图像，具有真实纹理、浅景深和奶油般的 bokeh。画面要有模拟质感、不完美感、wabi sabi 和 35mm film 般的气质——带颗粒、自然的色彩还原和柔和的对比曲线。超写实细节，macro photography，9:16 aspect ratio。生成图像前，先问我一个后续问题，用编号列出几个出人意料的主体选项，然后再渲染图像。',
        image_url: 'https://persistent.oaistatic.com/images-app/hyper-real-sheet.webp'
    },
    {
        id: '8-bit',
        title: '8-bit 游戏',
        description: '置身 8-bit 游戏场景',
        prompt_text: '以已上传图片中的主体为灵感，创作一张来自叙事驱动的 2D 横版卷轴像素艺术游戏的单帧画面。将图片的主题、色彩或主体转化到游戏世界中。场景应以非暴力、振奋或幽默的方式呈现一个高潮式的胜利时刻。风格应为细节丰富的复古像素画（16 位），具有清晰的剪影和统一的配色。图像应为竖版，并展示完整游戏画面。顶部加入经典 HUD，并配上一个受图片启发、风趣原创的游戏标题。该帧应让人感觉游戏正在进行中，包含角色、环境，以及明确的动作或目标感。所有元素都必须包含在游戏画面内。',
        image_url: 'https://persistent.oaistatic.com/images-app/8-bit-sheet.webp'
    }
]

const items = sourceItems.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    prompt: r.prompt_text,
    image: r.image_url
}))

const payload = {
    source: 'https://persistent.oaistatic.com (ChatGPT / app-style reference templates; mostly image+prompt)',
    items
}

fs.writeFileSync(out, JSON.stringify(payload, null, 2), 'utf8')
console.log('Wrote', out, 'count:', items.length)
