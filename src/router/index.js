import { createRouter, createWebHashHistory } from 'vue-router'
import store from '../store'
import { applyRouteSeo } from '@/utils/seo'



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
        name: 'AIPicture',
        component: () => import(/* webpackChunkName: "ai-picture" */ '../views/AIpicture.vue'),
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/AIbooks',
        name: 'AIbooks',
        component: () =>
            import ( /* webpackChunkName: "ai-books" */ '../views/AIBooks.vue'),
        meta: {
            requiresAuth: true
        }
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
        path: '/utility-tools',
        name: 'utility-tools',
        component: () =>
            import ( /* webpackChunkName: "utility-tools" */ '../views/UtilityTools.vue'),
        meta: { seoTitle: '实用工具' }
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
        name: 'user',
        component: () =>
            import ( /* webpackChunkName: "user" */ '../views/MyHomePage.vue'),
        meta: {
            requiresAuth: true
        }
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
        name: 'topdf',
        component: () =>
            import ( /* webpackChunkName: "topdf" */ '../views/ToPdf.vue'),
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/user/upload/compose-illustration',
        name: 'compose-illustration',
        component: () =>
            import ( /* webpackChunkName: "compose-illustration" */ '../views/ComposeIllustration.vue'),
        meta: {
            requiresAuth: true
        }
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
        name: 'create-group-images',
        component: () =>
            import ( /* webpackChunkName: "create-group-images" */ '../views/CreateGroupImages.vue'),
        meta: {
            requiresAuth: true
        }
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
            import ( /* webpackChunkName: "create-layout-illustration" */ '../views/CreateLayoutIllustration.vue'),
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/editorpro',
        name: 'editorpro',
        component: () =>
            import ( /* webpackChunkName: "editorpro" */ '../views/Editorpro.vue'),
        meta: {
            requiresAuth: false,
            seoTitle: '在线插画编辑'
        }
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
        } else {
            next()
        }
    } else {
        next()
    }
})

// 发版后旧 tab 仍持有旧 app.js，懒加载 chunk 会 404（或被 SPA 回退成 HTML）→ 自动刷新拉取新资源
const CHUNK_RELOAD_KEY = 'chunk_reload_ts'
router.onError((error) => {
    const msg = error?.message || ''
    const isChunkError = /ChunkLoadError|Loading chunk [\d]+ failed/i.test(msg)
    if (!isChunkError) return

    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0)
    const now = Date.now()
    if (now - last < 10000) return

    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now))
    window.location.reload()
})

export default router