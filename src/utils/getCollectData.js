//获取收藏的绘本数组
let userId = localStorage.getItem("id")
import store from "../store";

export function getCollectBook() {
    this.$http.get(`/user/list/like`, { id: userId, category: "book" }, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        })
        .then((response) => {
            if (response.data.desc === "success") {
                let arr = response.data.message
                store.state.collectBookArr.push(arr)

            }
        })
        .catch((error) => console.log(error));
}

export function getCollectIllus() {
    this.$http
        .get(`/user/list/like`, { id: userId, category: "illustration" }, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        })
        .then((response) => {
            if (response.data.desc === "success") {
                let arr = response.data.message
                return arr;

            }
        })
        .catch((error) => console.log(error));
}

//获取喜欢的绘本数组
export function getLikeBook() {
    this.$http
        .get(`/user/list/like`, { id: userId, category: "book" }, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        })
        .then((response) => {
            if (response.data.desc === "success") {
                let arr = response.data.message
                store.state.likeBookArr.push(arr)

            }
        })
        .catch((error) => console.log(error));
}

export function getLikeIllus() {
    this.$http
        .get(`/user/list/like`, { id: userId, category: "illustration" }, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        })
        .then((response) => {
            if (response.data.desc === "success") {
                let arr = response.data.message
                store.state.likeIllusArr.push(arr)

            }
        })
        .catch((error) => console.log(error));

}