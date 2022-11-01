import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

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
    },
    {
        path: '/original-books',
        name: 'original-books',
        component: () =>
            import ( /* webpackChunkName: "original-books" */ '../views/OriginalBooks.vue'),
    },
    {
        path: '/original-illustration',
        name: 'original-illustration',
        component: () =>
            import ( /* webpackChunkName: "classic-books" */ '../views/OriginalIllustration.vue'),
    },
    {
        path: '/original-books/original-bookdetails',
        name: 'original-bookdetails',
        component: () =>
            import ( /* webpackChunkName: "book-details" */ '../views/OriginalBookdetails.vue'),
    },
    {
        path: '/original-illustration/original-illusdetails',
        name: 'original-illusdetails',
        component: () =>
            import ( /* webpackChunkName: "book-details" */ '../views/OriginalIllusdetails.vue'),
    },

    {
        path: '/connection',
        name: 'connection',
        component: () =>
            import ( /* webpackChunkName: "connection" */ '../views/Connection.vue'),
    },

    {
        path: '/user',
        name: 'user',
        component: () =>
            import ( /* webpackChunkName: "user" */ '../views/MyHomePage.vue'),
    },

    {
        path: '/user/profile',
        name: 'profile',
        component: () =>
            import ( /* webpackChunkName: "my-information" */ '../views/UserProfile.vue'),
    },
    {
        path: '/user/upload',
        name: 'upload',
        component: () =>
            import ( /* webpackChunkName: "upload" */ '../views/Upload.vue'),
    },
    {
        path: '/user/upload/compose-illustration/submit-res',
        name: 'upload-production',
        component: () =>
            import ( /* webpackChunkName: "upload-production" */ '../views/SubmitRes.vue'),
    },
    {
        path: '/user/upload/upload-illustration',
        name: 'upload-illustration',
        component: () =>
            import ( /* webpackChunkName: "upload-illustration" */ '../views/UploadIllustration.vue'),
    },
    {
        path: '/user/upload/edition',
        name: 'edition',
        component: () =>
            import ( /* webpackChunkName: "upload-illustration" */ '../views/EditionWork.vue'),
    },
    {
        path: '/user/upload/upload-local-illustration',
        name: 'upload-local-illustration',
        component: () =>
            import ( /* webpackChunkName: "upload-illustration" */ '../views/UploadLocalIllu.vue'),
    },
    {
        path: '/user/upload/compose-illustration/topdf',
        name: 'topdf',
        component: () =>
            import ( /* webpackChunkName: "topdf" */ '../views/ToPdf.vue'),
    },
    {
        path: '/user/upload/compose-illustration',
        name: 'compose-illustration',
        component: () =>
            import ( /* webpackChunkName: "compose-illustration" */ '../views/ComposeIllustration.vue'),
    },
    {
        path: '/user/upload/upload-loacl-pdf',
        name: 'add-local-pdf',
        component: () =>
            import ( /* webpackChunkName: "add-local-pdf" */ '../views/UploadLocalPdf.vue'),
    },
    {
        path: '/user-g',
        name: 'user-g',
        component: () =>
            import ( /* webpackChunkName: "user" */ '../views/User.vue'),
    },
    {
        path: '/user/savedraft',
        name: 'savedraft',
        component: () =>
            import ( /* webpackChunkName: "savedraft" */ '../views/SaveDraft.vue'),
    },



]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
})

export default router