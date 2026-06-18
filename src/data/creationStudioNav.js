/** 创作工作台：第一栏域 + 第二栏子导航配置 */

/** 与首页 showcase 一致的域图标 */
export const CREATION_DOMAIN_ICONS = {
  character: require('@/assets/lefticon/user set-line.svg'),
  illustration: require('@/assets/lefticon/picture.svg'),
  book: require('@/assets/lefticon/books.svg'),
};

export const CREATION_DOMAINS = [
  {
    key: 'character',
    labelKey: 'creationStudio.domainCharacter',
    defaultRoute: 'character-studio',
    iconSrc: CREATION_DOMAIN_ICONS.character,
  },
  {
    key: 'illustration',
    labelKey: 'creationStudio.domainIllustration',
    defaultRoute: 'AIPicture',
    iconSrc: CREATION_DOMAIN_ICONS.illustration,
  },
  {
    key: 'book',
    labelKey: 'creationStudio.domainBook',
    defaultRoute: 'AIbooks',
    iconSrc: CREATION_DOMAIN_ICONS.book,
  },
];

export const CREATION_SUB_NAV = {
  character: [
    {
      routeName: 'character-studio',
      labelKey: 'creationStudio.myCharacters',
    },
    {
      routeName: 'character-studio-workbench',
      routeParams: { characterId: 'new' },
      labelKey: 'creationStudio.generateCharacter',
    },
    {
      routeName: 'create-group-images',
      labelKey: 'creationStudio.characterGroups',
    },
  ],
  illustration: [
    {
      routeName: 'AIPicture',
      labelKey: 'nav.aiIllustration',
    },
    {
      routeName: 'my-illustrations',
      labelKey: 'creationStudio.myIllustrations',
    },
    {
      routeName: 'editorpro',
      labelKey: 'nav.createIllustration',
      external: true,
      externalPath: '/editorpro',
    },
    {
      routeName: 'create-layout-illustration',
      labelKey: 'nav.createLayoutIllustration',
      external: true,
      externalPath: '/create-layout-illustration',
    },
  ],
  book: [
    {
      routeName: 'AIbooks',
      labelKey: 'nav.aiBooks',
    },
    {
      routeName: 'my-books',
      labelKey: 'creationStudio.myBooks',
    },
    {
      routeName: 'compose-illustration',
      labelKey: 'nav.composeBook',
    },
    {
      routeName: 'print-book-layout',
      labelKey: 'nav.printBookLayout',
    },
  ],
};

/** 路由 name → 所属域 */
export const ROUTE_DOMAIN_MAP = {
  'character-studio': 'character',
  'character-studio-workbench': 'character',
  'create-group-images': 'character',
  AIPicture: 'illustration',
  'my-illustrations': 'illustration',
  editorpro: 'illustration',
  'create-layout-illustration': 'illustration',
  AIbooks: 'book',
  'my-books': 'book',
  'compose-illustration': 'book',
  'print-book-layout': 'book',
};

export function resolveCreationDomain(route) {
  if (route.meta?.creationDomain) return route.meta.creationDomain;
  const name = route.name;
  if (name && ROUTE_DOMAIN_MAP[name]) return ROUTE_DOMAIN_MAP[name];
  const matched = route.matched || [];
  for (let i = matched.length - 1; i >= 0; i -= 1) {
    const d = matched[i].meta?.creationDomain;
    if (d) return d;
  }
  if (route.path.startsWith('/creation-studio/character')) return 'character';
  if (route.path.startsWith('/creation-studio/illustration')) return 'illustration';
  if (route.path.startsWith('/creation-studio/book')) return 'book';
  return 'character';
}

export function isSubNavActive(route, item) {
  return route.name === item.routeName;
}
