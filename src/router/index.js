import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import store from '../store'


Vue.use(VueRouter)



const routes = [{
        path: '/',
        name: 'Home',
        component: Home
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
    },
    {
        path: '/search-books/',
        name: 'search-books',
        component: () =>
            import ( /* webpackChunkName: "search-books" */ '../views/SearchBooks.vue'),
    },
    {
        path: '/illustration',
        name: 'illustration',
        component: () =>
            import ( /* webpackChunkName: "classic-books" */ '../views/OriginalIllustration.vue'),
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

    },
    {
        path: '/utility-tools',
        name: 'utility-tools',
        component: () =>
            import ( /* webpackChunkName: "utility-tools" */ '../views/UtilityTools.vue'),
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
        name: 'upload-local-illustration',
        component: () =>
            import ( /* webpackChunkName: "upload-illustration" */ '../views/UploadLocalBook.vue'),
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
        path: "*",
        name: 'NotFound',
        component: () =>
            import ( /* webpackChunkName: "notFound" */ '../views/NotFound.vue'),
    },



]

const router = new VueRouter({
    mode: 'hash',
    base: process.env.BASE_URL,
    routes
})
const originalPush = VueRouter.prototype.push;

VueRouter.prototype.push = function push(location) {
    return originalPush.call(this, location).catch(err => err)
}
router.beforeEach((to, from, next) => {

    if (window._hmt) {
        if (to.path) {
            window._hmt.push(['_trackPageview', '/#' + to.fullPath])
        }
    }
    

    if (to.matched.some(record => record.meta.requiresAuth)) {
        const token = localStorage.getItem("token")
        const cango = (to.name == 'Home' || to.name == 'books' || to.name == 'illustration' || to.name == 'connection')
        if ((!token || token == "undefined") && (!cango)) {
            store.state.isMask = true
        } else {
            next();
        }
    } else {
        next();
    }
 

})

export default router