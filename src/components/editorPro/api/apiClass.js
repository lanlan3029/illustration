import axios from 'axios';
import qs from 'qs';
import _ from 'lodash-es';

const baseURL = process.env.VUE_APP_APP_APIHOST || process.env.VUE_APP_API_BASE_URL || '';
const tokenKey = 'token';

function getToken() {
  return localStorage.getItem(tokenKey);
}

function getValue(item) {
  const newData = { id: item.id };
  Object.keys(item.attributes || {}).forEach((key) => {
    const info = item.attributes[key];
    newData[key] = info;
    if (_.isObject(info)) {
      const itemId = _.get(info, 'data.id');
      const itemUrl = _.get(info, 'data.attributes.url');
      const itemImgFormats = _.get(info, 'data.attributes.formats');
      if (itemId) newData[key + 'Id'] = itemId;
      if (itemUrl) newData[key + 'Url'] = baseURL + itemUrl;
      if (itemImgFormats) {
        Object.keys(itemImgFormats).forEach((imgKey) => {
          const cap = imgKey.charAt(0).toUpperCase() + imgKey.slice(1);
          newData[key + 'Url' + cap] = baseURL + itemImgFormats[imgKey].url;
        });
      }
    }
  });
  return newData;
}

function mapValue(arr) {
  return (arr || []).map((item) => getValue(item));
}

export default class ServerApi {
  constructor(path, hasToken) {
    this.apiPath = path;
    this.instance = this._initInstance(hasToken);
  }

  _initInstance(hasToken) {
    const instance = axios.create({ baseURL });
    instance.interceptors.request.use((config) => {
      const token = getToken();
      if (token && hasToken) config.headers['Authorization'] = 'Bearer ' + token;
      return config;
    });
    instance.interceptors.response.use((response) => {
      if (!response.config.skipResponse) {
        if (response.data?.data?.attributes) {
          response.data.data = getValue(response.data.data);
        }
        if (response.data?.data?.length) {
          response.data.data = mapValue(response.data.data);
        }
        if (response.data?.meta?.pagination) {
          response.data.pagination = response.data.meta.pagination;
          delete response.data.meta;
        }
      }
      return response.data;
    });
    return instance;
  }

  get(id, data = {}) {
    return this.instance.get(this.apiPath + '/' + id + '?' + qs.stringify(data));
  }
  add(data = {}) {
    return this.instance.post(this.apiPath, data);
  }
  del(id) {
    return this.instance.delete(this.apiPath + '/' + id);
  }
  find(data = {}, pageSize) {
    if (pageSize) data.pagination = { page: 1, pageSize: 50 };
    return this.instance.get(this.apiPath + '/?' + qs.stringify(data));
  }
  update(id, data = {}) {
    return this.instance.put(this.apiPath + '/' + id, data);
  }
  IGet(data = {}, skip = true) {
    return this.instance.get(this.apiPath, { params: data, skipResponse: skip });
  }
  IPost(data = {}, skip = true) {
    return this.instance.post(this.apiPath, data, { skipResponse: skip });
  }
}
