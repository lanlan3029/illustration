import { createRouter, createWebHashHistory } from 'vue-router'
import store from '../store'
import { applyRouteSeo } from '@/utils/seo'
import { isChunkLoadErrorMessage, reloadForStaleChunks } from '@/utils/chunkLoadRecovery'



const routes = [{
        path: '/',
        name: 'Home',
        component: () => import(/* webpackChunkName: "home" */ '../views/Home.vue')
    },
    {
        path: '/wechat/callback',
        name: 'WeChatCallback',
        component: () => import(/* webpackChunkName: "wechat-callback" */ '../views/WeChatCallback.vue')
    },
    {
        path: '/ai-picture',
        redirect: '/creation-studio/illustration/ai',
    },
    {
        path: '/AIbooks',
        redirect: '/creation-studio/book/ai',
    },
    {
        path: '/creation',
        name: 'creation',
        component: () =>
            import ( /* webpackChunkName: "mycreation" */ '../views/Creation.vue'),
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/books/',
        name: 'books',
        component: () =>
            import ( /* webpackChunkName: "original-books" */ '../views/OriginalBooks.vue'),
        meta: { seoTitle: '原创绘本' }
    },
    {
        path: '/search-books/',
        name: 'search-books',
        component: () =>
            import ( /* webpackChunkName: "search-books" */ '../views/SearchBooks.vue'),
        meta: { seoTitle: '搜索绘本' }
    },
    {
        path: '/illustration',
        name: 'illustration',
        component: () =>
            import ( /* webpackChunkName: "classic-books" */ '../views/OriginalIllustration.vue'),
        meta: { seoTitle: '原创插画' }
    },
    {
        path: '/books/:bookId',
        name: 'bookdetails',
        component: () =>
            import ( /* webpackChunkName: "book-details" */ '../views/OriginalBookdetails.vue'),
        props: true,
    },

    {
        path: '/illustration/:illId',
        name: 'illusdetails',
        component: () =>
            import ( /* webpackChunkName: "book-details" */ '../views/OriginalIllusdetails.vue'),
        props: true,
    },

    {
        path: '/connection',
        name: 'connection',
        component: () =>
            import ( /* webpackChunkName: "connection" */ '../views/Connection.vue'),
        meta: { seoTitle: '联系我们' }
    },
    {
        path: '/prompt-fill',
        name: 'prompt-fill',
        component: () =>
            import ( /* webpackChunkName: "prompt-fill" */ '../views/PromptFill.vue'),
        meta: { seoTitle: '提示词填充' }
    },

    {
        path: '/user',
        redirect: (to) => {
            const tab = to.query.tab;
            if (tab === '2' || tab === 2) return '/creation-studio/character';
            if (tab === '3' || tab === 3) return '/creation-studio/illustration/mine';
            if (tab === '4' || tab === 4) return '/creation-studio/book/mine';
            return '/user/profile';
        },
    },

    {
        path: '/user/profile',
        name: 'profile',
        component: () =>
            import ( /* webpackChunkName: "my-information" */ '../views/UserProfile.vue'),
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/user/upload',
        name: 'upload',
        component: () =>
            import ( /* webpackChunkName: "upload" */ '../views/Upload.vue'),
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/user/upload/submit-res',
        name: 'upload-production',
        component: () =>
            import ( /* webpackChunkName: "upload-production" */ '../views/SubmitRes.vue'),
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/user/upload/upload-illustration',
        name: 'upload-illustration',
        component: () =>
            import ( /* webpackChunkName: "upload-illustration" */ '../views/UploadIllustration.vue'),
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/user/upload/editionillus/:illId',
        name: 'edition-illus',
        component: () =>
            import ( /* webpackChunkName: "edition-illus" */ '../views/EditionIll.vue'),
        meta: {
            requiresAuth: true
        },
        props: true,
    },
    {
        path: '/user/upload/editionbook/:bookId',
        name: 'edition-book',
        component: () =>
            import ( /* webpackChunkName: "edition-book" */ '../views/EditionBook.vue'),
        meta: {
            requiresAuth: true
        },
        props: true,
    },
    {
        path: '/user/upload/edition-success',
        name: 'edition-success',
        component: () =>
            import ( /* webpackChunkName: "edition-success" */ '../views/EditionRes.vue'),
        meta: {
            requiresAuth: true
        },
        props: true,
    },
    {
        path: '/user/upload/upload-local-book',
        name: 'upload-local-book',
        component: () =>
            import ( /* webpackChunkName: "upload-local-book" */ '../views/UploadLocalBook.vue'),
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/user/upload/compose-illustration/topdf',
        redirect: '/creation-studio/book/topdf',
    },
    {
        path: '/user/upload/compose-illustration',
        redirect: '/creation-studio/book/compose',
    },
    {
        path: '/user/upload/upload-loacl-pdf',
        name: 'add-local-pdf',
        component: () =>
            import ( /* webpackChunkName: "add-local-pdf" */ '../views/UploadLocalPdf.vue'),
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/user/upload/upload-element',
        name: 'add-element',
        component: () =>
            import ( /* webpackChunkName: "add-element" */ '../views/UploadElement.vue'),
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/user/upload/style-transfer',
        name: 'style-transfer',
        component: () =>
            import ( /* webpackChunkName: "style-transfer" */ '../views/StyleTransfer.vue'),
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/creation-studio',
        component: () =>
            import(/* webpackChunkName: "creation-studio-layout" */ '../views/CreationStudioLayout.vue'),
        meta: {
            requiresAuth: true,
            seoTitle: '创作工作台',
        },
        redirect: '/creation-studio/character',
        children: [
            {
                path: 'character',
                name: 'character-studio',
                component: () =>
                    import(/* webpackChunkName: "character-studio" */ '../views/CharacterStudioDashboard.vue'),
                meta: { creationDomain: 'character', seoTitle: '我的角色' },
            },
            {
                path: 'character/generate/:characterId?',
                name: 'character-studio-workbench',
                component: () =>
                    import(/* webpackChunkName: "character-studio-workbench" */ '../views/CharacterStudioWorkbench.vue'),
                props: true,
                meta: { creationDomain: 'character', seoTitle: '生成角色' },
            },
            {
                path: 'character/groups',
                name: 'create-group-images',
                component: () =>
                    import(/* webpackChunkName: "create-group-images" */ '../views/CreateGroupImages.vue'),
                meta: { creationDomain: 'character', requiresAuth: true },
            },
            {
                path: 'illustration/ai',
                name: 'AIPicture',
                component: () =>
                    import(/* webpackChunkName: "ai-picture" */ '../views/AIpicture.vue'),
                meta: { creationDomain: 'illustration', requiresAuth: true },
            },
            {
                path: 'illustration/mine',
                name: 'my-illustrations',
                component: () =>
                    import(/* webpackChunkName: "my-illustrations-studio" */ '../views/MyIllustrationsStudio.vue'),
                meta: { creationDomain: 'illustration', requiresAuth: true, seoTitle: '我的插画' },
            },
            {
                path: 'book/ai',
                name: 'AIbooks',
                component: () =>
                    import(/* webpackChunkName: "ai-books" */ '../views/AIBooks.vue'),
                meta: { creationDomain: 'book', requiresAuth: true },
            },
            {
                path: 'book/compose',
                name: 'compose-illustration',
                component: () =>
                    import(/* webpackChunkName: "compose-illustration" */ '../views/ComposeIllustration.vue'),
                meta: { creationDomain: 'book', requiresAuth: true },
            },
            {
                path: 'book/topdf',
                name: 'topdf',
                component: () =>
                    import(/* webpackChunkName: "topdf" */ '../views/ToPdf.vue'),
                meta: { creationDomain: 'book', requiresAuth: true },
            },
            {
                path: 'book/print-layout',
                redirect: '/print-book-layout',
            },
            {
                path: 'book/mine',
                name: 'my-books',
                component: () =>
                    import(/* webpackChunkName: "my-books-studio" */ '../views/MyBooksStudio.vue'),
                meta: { creationDomain: 'book', requiresAuth: true, seoTitle: '我的绘本' },
            },
        ],
    },
    {
        path: '/character-studio',
        redirect: '/creation-studio/character',
    },
    {
        path: '/character-studio/workbench/:characterId?',
        redirect: (to) => ({
            path: `/creation-studio/character/generate/${to.params.characterId || 'new'}`,
        }),
    },
    {
        path: '/create-character',
        name: 'create-character',
        component: () =>
            import ( /* webpackChunkName: "create-character" */ '../views/CreateCharacter.vue'),
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/create-group-images',
        redirect: '/creation-studio/character/groups',
    },
    {
        path: '/character-group-images/:characterId',
        name: 'character-group-images',
        component: () =>
            import ( /* webpackChunkName: "character-group-images" */ '../views/CharacterGroupImages.vue'),
        meta: {
            requiresAuth: true
        },
        props: true
    },
    {
        path: '/create-layout-illustration',
        name: 'create-layout-illustration',
        component: () =>
            import(/* webpackChunkName: "create-layout-illustration" */ '../views/CreateLayoutIllustration.vue'),
        meta: {
            requiresAuth: true,
        },
    },
    {
        path: '/creation-studio/illustration/layout',
        redirect: '/create-layout-illustration',
    },
    {
        path: '/creation-studio/illustration/editor',
        redirect: '/editorpro',
    },
    {
        path: '/print-book-layout',
        name: 'print-book-layout',
        component: () =>
            import(/* webpackChunkName: "print-book-layout" */ '../views/PrintBookLayout.vue'),
        meta: {
            requiresAuth: true,
            seoTitle: '绘本打印排版',
        },
    },
    {
        path: '/editorpro',
        name: 'editorpro',
        component: () =>
            import(/* webpackChunkName: "editorpro" */ '../views/Editorpro.vue'),
        meta: {
            requiresAuth: false,
            seoTitle: '在线插画编辑',
        },
    },
    {
        path: '/lasso-crop',
        name: 'lasso-crop',
        component: () =>
            import ( /* webpackChunkName: "lasso-crop" */ '../views/LassoCropPage.vue'),
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/newyear',
        name: 'newyear',
        component: () =>
            import ( /* webpackChunkName: "newyear" */ '../views/NewYear.vue')
    },
    {
        path: '/newyear/gallery',
        name: 'newyear-gallery',
        component: () =>
            import ( /* webpackChunkName: "newyear-gallery" */ '../views/NewYearGallery.vue')
    },
    {
        path: '/mood-diary',
        component: () =>
            import ( /* webpackChunkName: "mood-diary-shell" */ '../views/mood-diary/MoodDiaryShell.vue'),
        meta: {
            requiresAuth: false
        },
        redirect: '/mood-diary/narrative',
        children: [
            {
                path: 'narrative',
                name: 'mood-diary-narrative',
                component: () =>
                    import ( /* webpackChunkName: "mood-diary-narrative" */ '../views/mood-diary/MoodDiaryNarrative.vue'),
                meta: { seoTitle: '心情日记' }
            },
            {
                path: 'write',
                redirect: (to) => ({
                    path: '/mood-diary/narrative',
                    query: { ...to.query, write: '1' }
                })
            },
            {
                path: 'generate',
                name: 'mood-diary-generate',
                component: () =>
                    import ( /* webpackChunkName: "mood-diary-generate" */ '../views/mood-diary/MoodDiaryGenerate.vue')
            },
            {
                path: 'book',
                name: 'mood-diary-book',
                component: () =>
                    import ( /* webpackChunkName: "mood-diary-book" */ '../views/mood-diary/MoodDiaryBook.vue')
            },
            {
                path: 'recap',
                name: 'mood-diary-recap',
                component: () =>
                    import ( /* webpackChunkName: "mood-diary-recap" */ '../views/mood-diary/MoodDiaryRecap.vue')
            },
            {
                path: 'share-poster',
                name: 'mood-diary-share-poster',
                component: () =>
                    import ( /* webpackChunkName: "mood-diary-share-poster" */ '../views/mood-diary/MoodDiarySharePoster.vue')
            }
        ]
    },
    {
        path: '/maze',
        name: 'maze',
        component: () =>
            import ( /* webpackChunkName: "maze" */ '../views/Maze.vue'),
        meta: {
            requiresAuth: false,
            seoTitle: '迷宫绘本'
        }
    },
    {
        path: '/member/recharge',
        name: 'member-recharge',
        component: () =>
            import ( /* webpackChunkName: "member-recharge" */ '../views/MemberRecharge.vue'),
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/member/recharge/success',
        name: 'member-recharge-success',
        component: () =>
            import ( /* webpackChunkName: "member-recharge-success" */ '../views/MemberRechargeSuccess.vue'),
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/user-g/:authorId',
        name: 'user-g',
        component: () =>
            import ( /* webpackChunkName: "user" */ '../views/UserG.vue'),
        props: true,
    },

    {
        path: '/user/savedraft',
        name: 'savedraft',
        component: () =>
            import ( /* webpackChunkName: "savedraft" */ '../views/SaveDraft.vue'),
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/user/book/:bookId',
        name: 'user-bookdetails',
        component: () =>
            import ( /* webpackChunkName: "mybook-details" */ '../views/MyBookDetails.vue'),
        meta: {
            requiresAuth: true
        },
        props: true,
    },
    {
        path: '/user/illustration/:illId',
        name: 'user-illusdetails',
        component: () =>
            import ( /* webpackChunkName: "myillus-details" */ '../views/MyIllusDetails.vue'),
        meta: {
            requiresAuth: true
        },
        props: true,
    },
    {
        path: '/user/collect-books/:bookId',
        name: 'collect-bookdetails',
        component: () =>
            import ( /* webpackChunkName: "book-details" */ '../views/MyCoBookDetails.vue'),
        props: true,
    },
    {
        path: '/forgot-password',
        name: 'ForgotPassword',
        component: () => import(/* webpackChunkName: "forgot-password" */ '../views/ForgotPassword.vue')
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () =>
            import ( /* webpackChunkName: "notFound" */ '../views/NotFound.vue'),
    },



]

const router = createRouter({
    history: createWebHashHistory(process.env.BASE_URL),
    routes
})

router.afterEach((to) => {
    applyRouteSeo(to)
})

router.beforeEach((to, from, next) => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
        const token = localStorage.getItem("token")
        const cango = (to.name == 'Home' || to.name == 'books' || to.name == 'illustration' || to.name == 'connection')
        if ((!token || token == "undefined") && (!cango)) {
            store.state.isMask = true
            next(false)
        } else {
            next()
        }
    } else {
        next()
    }
})

router.onError((error) => {
    const msg = error?.message || ''
    if (!isChunkLoadErrorMessage(msg)) return
    reloadForStaleChunks()
})

export default router