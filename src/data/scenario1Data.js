// 产品数据集合
export const scenarios = [
  {
    name: 'scenario1',
    label: 'AI榜单',
    intro: '精选适合儿童教育和家庭使用的AI工具，涵盖通用助理、创意设计、学习教育、多媒体生成等多个类别。',
    products: [
      {
        rank: 1,
        name: 'ChatGPT',
        url: 'https://chat.openai.com/',
        category: '通用助理',
        purpose: '故事创作：定制睡前故事、童谣或科学小故事。',
        logo: 'https://logo.clearbit.com/openai.com'
      },
      {
        rank: 2,
        name: 'Gemini',
        url: 'https://gemini.google.com/',
        category: '通用助理',
        purpose: '知识问答：帮助孩子以简单易懂的方式解答好奇的问题。',
        logo: 'https://logo.clearbit.com/google.com'
      },
      {
        rank: 3,
        name: 'Claude',
        url: 'https://claude.ai/',
        category: '通用助理',
        purpose: '内容生成/润色：辅助孩子进行写作或口头表达的润色。',
        logo: 'https://logo.clearbit.com/claude.ai'
      },
      {
        rank: 4,
        name: 'Copilot',
        url: 'https://copilot.microsoft.com/',
        category: '通用助理',
        purpose: '信息整理：快速整理孩子提出的复杂问题，并给出简洁答案。',
        logo: 'https://logo.clearbit.com/microsoft.com'
      },
      {
        rank: 5,
        name: '豆包',
        url: 'https://www.doubao.com/',
        category: '通用助理',
        purpose: '多语言交流：帮助孩子进行简单的语言对话练习。',
        logo: 'https://logo.clearbit.com/doubao.com'
      },
      {
        rank: 6,
        name: '百度AI助手',
        url: 'https://chat.baidu.com/search?extParams=%7B%22enter_type%22%3A%22home_operate%22%7D&isShowHello=1',
        category: '通用助理',
        purpose: '内容学习：辅助孩子理解百科知识或特定主题。',
        logo: 'https://logo.clearbit.com/baidu.com'
      },
      {
        rank: 7,
        name: 'Canva',
        url: 'https://www.canva.com/',
        category: '创意设计',
        purpose: '创意手工：一起设计海报、卡片、家庭日程表，或为绘本设计插图。',
        logo: 'https://logo.clearbit.com/canva.com'
      },
      {
        rank: 8,
        name: 'Perplexity',
        url: 'https://www.perplexity.ai/',
        category: '信息搜索',
        purpose: '研究探索：查找最新、复杂信息，并重视信息来源。',
        logo: 'https://logo.clearbit.com/perplexity.ai'
      },
      {
        rank: 9,
        name: '夸克',
        url: 'https://www.quark.cn/',
        category: '信息搜索',
        purpose: '知识获取：快速查找和理解孩子感兴趣的主题信息。',
        logo: 'https://logo.clearbit.com/quark.cn'
      },
      {
        rank: 10,
        name: 'Notion AI',
        url: 'https://www.notion.so/',
        category: '知识管理',
        purpose: '学习总结：帮助高年级孩子整理复杂的学习笔记或活动记录。',
        logo: 'https://logo.clearbit.com/notion.so'
      },
      {
        rank: 11,
        name: 'Google NotebookLM',
        url: 'https://notebooklm.google.com/?original_referer=https:%2F%2Fwww.google.com%23&pli=1',
        category: '知识管理',
        purpose: '学习助手：可上传文件、音频等，提炼重点信息，生成闪卡、思维导图、测验等。',
        logo: 'https://logo.clearbit.com/google.com'
      },
      {
        rank: 12,
        name: 'DeepL',
        url: 'https://www.deepl.com/translator',
        category: '语言翻译',
        purpose: '语言学习：帮助理解外语绘本或翻译中英双语故事。',
        logo: 'https://logo.clearbit.com/deepl.com'
      },
      {
        rank: 13,
        name: 'Quizlet',
        url: 'https://quizlet.com/',
        category: '学习教育',
        purpose: '作业辅导：利用其资源为孩子设计额外的练习题或复习卡片。',
        logo: 'https://logo.clearbit.com/quizlet.com'
      },
      {
        rank: 14,
        name: 'Khan Academy Khanmigo',
        url: 'https://www.khanacademy.org/',
        category: '学习教育',
        purpose: '教学辅助：提供个性化的学习指导和辅导。',
        logo: 'https://logo.clearbit.com/khanacademy.org'
      },
      {
        rank: 15,
        name: 'Gauth',
        url: 'https://www.gauthmath.com/',
        category: '学习教育',
        purpose: '数学解题：帮助孩子理解数学问题的解题思路（需监督使用）。',
        logo: 'https://logo.clearbit.com/gauthmath.com'
      },
      {
        rank: 16,
        name: 'CheggMate',
        url: 'https://www.chegg.com/',
        category: '学习教育',
        purpose: '学科辅导：提供多学科的学习资源和帮助。',
        logo: 'https://logo.clearbit.com/chegg.com'
      },
      {
        rank: 17,
        name: 'Brainly',
        url: 'https://brainly.com/',
        category: '学习教育',
        purpose: '问答社区：帮助孩子解决学习中遇到的具体问题。',
        logo: 'https://logo.clearbit.com/brainly.com'
      },
      {
        rank: 18,
        name: 'Suno AI',
        url: 'https://www.suno.ai/',
        category: '音乐生成',
        purpose: '音乐创作：输入提示词，让 AI 创作一首关于孩子或家庭的专属歌曲或儿歌。',
        logo: 'https://logo.clearbit.com/suno.ai'
      },
      {
        rank: 19,
        name: 'CapCut',
        url: 'https://www.capcut.com/',
        category: '视频编辑',
        purpose: '家庭视频创作：将家庭照片或表演片段制作成短视频。',
        logo: 'https://logo.clearbit.com/capcut.com'
      },
      {
        rank: 20,
        name: 'LiblibAI (哩布哩布AI)',
        url: 'https://www.liblib.art/',
        category: '图像生成',
        purpose: '整合图像、视频、3D、LoRA 训练等多模态能力；拥有庞大且细分的模型社区，覆盖完整 AI 工作流。',
        logo: 'https://logo.clearbit.com/liblib.art'
      },
      {
        rank: 21,
        name: '阿里云 / 通义万相',
        url: 'https://tongyi.aliyun.com/wan/explore',
        category: '图像生成',
        purpose: '提供文生图、文生视频（支持高清、长时长）、图生视频。强调画面质感、叙事能力和企业级服务。',
        logo: 'https://logo.clearbit.com/aliyun.com'
      },
      {
        rank: 22,
        name: '快手 / 可灵 AI (Kling AI)',
        url: 'https://app.klingai.com/global/',
        category: '图像生成',
        purpose: '自研视觉生成大模型，专注于视频生成领域，为内容创作者提供高效的视频制作工具。',
        logo: 'https://logo.clearbit.com/klingai.com'
      },
      {
        rank: 23,
        name: 'veed.io',
        url: 'https://www.veed.io/',
        category: '视频编辑',
        purpose: '内容美化：帮助孩子对拍摄的视频进行剪辑和美化。',
        logo: 'https://logo.clearbit.com/veed.io'
      },
      {
        rank: 24,
        name: 'Midjourney',
        url: 'https://www.midjourney.com/',
        category: '图像生成',
        purpose: '想象力可视化：根据孩子描述的想象，使用 AI 将其绘制出来。',
        logo: 'https://logo.clearbit.com/midjourney.com'
      },
      {
        rank: 25,
        name: 'Picsart',
        url: 'https://picsart.com/',
        category: '图像生成',
        purpose: '照片创作：引导孩子对照片进行创意编辑和特效处理。',
        logo: 'https://logo.clearbit.com/picsart.com'
      },
      {
        rank: 26,
        name: 'Tensor.Art',
        url: 'https://tensor.art/',
        category: '图像生成',
        purpose: '风格探索：尝试不同艺术风格的 AI 绘画。',
        logo: 'https://logo.clearbit.com/tensor.art'
      },
      {
        rank: 27,
        name: 'LeonardoAI',
        url: 'https://leonardo.ai/',
        category: '图像生成',
        purpose: '创意绘图：探索复杂的 AI 图像生成提示词，激发创造力。',
        logo: 'https://logo.clearbit.com/leonardo.ai'
      },
      {
        rank: 28,
        name: 'ElevenLabs',
        url: 'https://elevenlabs.io/',
        category: '音频生成',
        purpose: '有声故事制作：将孩子自己写的故事变成高质量的有声读物。',
        logo: 'https://logo.clearbit.com/elevenlabs.io'
      },
      {
        rank: 29,
        name: 'Clipchamp',
        url: 'https://www.clipchamp.com/',
        category: '音频生成',
        purpose: '语音合成：辅助制作简单的配音或旁白。',
        logo: 'https://logo.clearbit.com/clipchamp.com'
      },
      {
        rank: 30,
        name: 'Vocal Remover and Isolation',
        url: 'https://vocalremover.org/',
        category: '音频生成',
        purpose: '音乐分离：提取歌曲中的伴奏或人声，用于孩子的歌唱练习或表演。',
        logo: 'https://logo.clearbit.com/vocalremover.org'
      },
      {
        rank: 31,
        name: 'yeschat',
        url: 'https://www.yeschat.ai/',
        category: '通用助理',
        purpose: 'AI 聊天、AI 音乐生成、AI 视频生成和 AI 图像生成等多种创作功能。',
        logo: 'https://logo.clearbit.com/yeschat.ai'
      },
      {
        rank: 32,
        name: 'runwayml',
        url: 'https://app.runwayml.com/',
        category: '图像生成',
        purpose: 'AI 视频生成和 AI 图像生成。',
        logo: 'https://logo.clearbit.com/runwayml.com'
      }
    ]
  },
  {
    name: 'scenario2',
    label: '英语学习',
    intro: '辅助学科学习、提供知识解释、语言学习等。',
    products: [
      {
        rank: 1,
        name: '多邻国 (Duolingo)',
        url: 'https://www.duolingo.com/',
        category: '语言学习',
        purpose: '网站和App提供同步学习体验，可以在电脑浏览器上进行闯关学习。',
        logo: 'https://logo.clearbit.com/duolingo.com'
      },
      {
        rank: 2,
        name: 'LearnEnglish Kids (British Council)',
        url: 'https://learnenglishkids.britishcouncil.org/',
        category: '儿童英语资源',
        purpose: '英国文化协会的儿童英语资源，网站提供了大量免费的故事、儿歌和游戏。',
        logo: 'https://logo.clearbit.com/britishcouncil.org'
      },
        {
          rank: 3,
          name: 'Khan Academy',
          url: 'https://www.khanacademy.org/',
          category: '在线教育',
          purpose: '完整的课程、练习和视频都在网站上提供。',
          logo: 'https://logo.clearbit.com/khanacademy.org'
        }
      ]
  },
  {
    name: 'scenario3',
    label: '智能对话',
    intro: '提供知识问答、情景对话、角色扮演等互动体验。',
    products: [
      {
        rank: 1,
        name: 'DeepSeek',
        url: 'https://chat.deepseek.com',
        category: '聊天机器人',
        purpose: '顶级流量，可作为通用的知识问答、角色扮演（如扮演历史人物）。',
        logo: 'https://logo.clearbit.com/deepseek.com'
      },
      {
        rank: 2,
        name: '豆包',
        url: 'https://www.doubao.com',
        category: '聊天机器人',
        purpose: '流量大，可用于情景对话、模拟面试、故事接龙。',
        logo: 'https://logo.clearbit.com/doubao.com'
      },
      {
        rank: 77,
        name: '逗逗游戏伙伴',
        url: 'https://www.doudou.fun',
        category: '聊天机器人',
        purpose: '专注于"游戏伙伴"的定位，更容易与儿童互动。',
        logo: 'https://logo.clearbit.com/doudou.fun'
      },
      {
        rank: 75,
        name: 'Rubii',
        url: 'https://rubii.ai',
        category: 'AI角色生成',
        purpose: '专注于角色生成，可用于创建孩子感兴趣的 AI 学习伙伴。',
        logo: 'https://logo.clearbit.com/rubii.ai'
      }
    ]
  },
  {
    name: 'scenario4',
    label: '绘画与艺术',
    intro: '辅助家庭规划、信息记录、知识整理等。',
    products: [
      {
        rank: 1,
        name: 'freepik.AI',
        url: 'https://www.freepik.com/ai/image-generator#from_element=mainmenu',
        category: 'AI图像生成',
        purpose: '将文字转换为图像，选择不同的风格和格式，快速生成高质量的图像。每天生成20张免费图片，基础版9美元/月。',
        logo: 'https://logo.clearbit.com/freepik.com'
      },
      {
        rank: 2,
        name: 'Canva',
        url: 'https://www.canva.com/',
        category: '图形设计',
        purpose: '图形设计工具，提供大量模板和素材，让孩子练习颜色搭配、布局和创意设计（海报、邀请函等）。适合8岁以上使用。',
        logo: 'https://logo.clearbit.com/canva.com'
      },
      {
        rank: 3,
        name: 'Google Arts & Culture',
        url: 'https://artsandculture.google.com/',
        category: '虚拟艺术博物馆',
        purpose: '带孩子探索世界各地的名画、历史遗迹和文化，培养艺术鉴赏力。',
        logo: 'https://logo.clearbit.com/google.com'
      },
      {
        rank: 4,
        name: 'Chrome Music Lab',
        url: 'https://musiclab.chromeexperiments.com/Experiments',
        category: '音乐教育',
        purpose: '谷歌推出的音乐实验平台，利用视觉和动画效果来展示抽象的音乐概念（如声波、节拍和音高），将音乐理论转化为趣味性极强的动手操作体验。',
        logo: 'https://logo.clearbit.com/chromeexperiments.com'
      },
      {
        rank: 5,
        name: 'Tate Kids',
        url: 'https://www.tate.org.uk/kids',
        category: '儿童艺术教育',
        purpose: '英国泰特美术馆的儿童专区，有艺术创作课程、艺术创作游戏、艺术故事和有趣的艺术历史介绍。',
        logo: 'https://logo.clearbit.com/tate.org.uk'
      }
    ]
  },
  {
    name: 'scenario5',
    label: '编程启蒙',
    intro: '辅助编程学习、技术实验、代码开发等。',
    products: [
      {
        rank: 1,
        name: 'Scratch',
        url: 'https://scratch.mit.edu/',
        category: '图形化编程',
        purpose: '图形化编程的鼻祖。Scratch Jr. 适合低龄儿童，通过拖拽积木块来创作故事和游戏。',
        logo: 'https://logo.clearbit.com/scratch.mit.edu'
      },
      {
        rank: 2,
        name: 'Code.org',
        url: 'https://code.org/',
        category: '编程学习平台',
        purpose: '全球知名的编程学习平台，提供"编程一小时"活动和结构化的课程，课程设计像游戏。',
        logo: 'https://logo.clearbit.com/code.org'
      },
      {
        rank: 3,
        name: 'CodeMonkey',
        url: 'https://www.codemonkey.com/',
        category: '游戏化编程学习',
        purpose: '通过编写代码帮助一只猴子完成任务，学习实际的编程语言概念。',
        logo: 'https://logo.clearbit.com/codemonkey.com'
      }
    ]
  }
];

// 为保持兼容性，导出单独的产品集合
export const scenario1Products = scenarios[0].products;
export const scenario2Products = scenarios[1].products;
export const scenario3Products = scenarios[2].products;
export const scenario4Products = scenarios[3].products;
export const scenario5Products = scenarios[4].products;