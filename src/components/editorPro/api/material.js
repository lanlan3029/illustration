/*
 * @Description: 素材/模板等 API（纯 JS）
 */

import qs from 'qs';
import axios from 'axios';
import ApiClass from './apiClass.js';

const baseURL = process.env.VUE_APP_APP_APIHOST || process.env.VUE_APP_API_BASE_URL || '';
const instance = axios.create({ baseURL });

// web 详情
export const getWebInfo = () => instance.get('/api/web-site?populate=*');

// 获取素材分类
export const getMaterialTypes = () => instance.get('/api/material-types');

// 获取素材列表
export const getMaterials = (data) => instance.get('/api/materials?' + data);

// 根据分类获取素材
export const getMaterialsByType = (data) =>
  instance.get('/api/materials?' + qs.stringify(data));

// 获取字体分类
export const getFontStyleTypes = () => instance.get('/api/font-style-types');

// 获取字体素材列表
export const getFontStyles = (data) => instance.get('/api/font-styles?' + data);

// 根据分类获取字体样式列表
export const getFontStyleListByType = (data) =>
  instance.get('/api/font-styles?' + qs.stringify(data));

// 获取模板分类
export const getTmplTypes = () => instance.get('/api/templ-types');

// 获取模板列表
export const getTmplList = (data) => instance.get('/api/templs?' + data);

// 新版 API
export const templsApi = new ApiClass('/api/templs');
export const customDynamicsApi = new ApiClass('/api/custom/dynamics');
export const customRenderApi = new ApiClass('/api/custom/render');
export const commonMaterialsApi = new ApiClass('/api/materials');
export const commonMaterialsTypeApi = new ApiClass('/api/material-types');
export const commonTmplTypeApi = new ApiClass('/api/templ-types');
export const commonTmplApi = new ApiClass('/api/templs');
export const commonFontGroupTypeApi = new ApiClass('/api/font-style-types');
export const commonFontGroupApi = new ApiClass('/api/font-styles');
export const commonFontApi = new ApiClass('/api/fonts');
export const commonFontStyleApi = new ApiClass('/api/fontborders');
export const commonBannerApi = new ApiClass('/api/banners');
