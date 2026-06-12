import { dataUrlToBlob } from '@/utils/lassoCrop';

/** 上传裁剪结果为图元 */
export async function uploadPictureElement(http, dataUrl, { title, type, desc = '', is_public = 1 }) {
  const blob = dataUrlToBlob(dataUrl);
  const formdata = new FormData();
  formdata.append('picture', blob, `${title || 'element'}.png`);
  formdata.append('title', title);
  formdata.append('description', desc || '');
  formdata.append('type', type);
  formdata.append('is_public', is_public);

  const token = localStorage.getItem('token') || '';
  const response = await http.post('/picture/', formdata, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.data?.desc !== 'success') {
    throw new Error(response.data?.message || '图元上传失败');
  }
  return response.data;
}

/** 保存裁剪结果为「我的角色」 */
export async function saveCroppedCharacter(http, dataUrl, { character_name, character_type, description = '', is_public = 1 }) {
  const token = localStorage.getItem('token') || '';
  let base64Data = dataUrl;
  if (dataUrl.includes(',')) {
    base64Data = dataUrl.split(',')[1];
  }

  const createData = {
    character_name,
    image_url: dataUrl,
    character_type,
    description: description || undefined,
    is_public,
  };
  Object.keys(createData).forEach((key) => {
    if (createData[key] === undefined) delete createData[key];
  });

  const createResponse = await http.post('/character', createData, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!(createResponse.data && (createResponse.data.code === 0 || createResponse.data.code === '0'))) {
    throw new Error(createResponse.data?.message || '创建角色失败');
  }

  const characterData = createResponse.data.data || createResponse.data.message || createResponse.data;
  const characterId = characterData.id || characterData._id || createResponse.data.id;

  if (characterId) {
    try {
      await http.post(
        '/image-segmentation/general',
        {
          image_base64: base64Data,
          character_id: characterId,
          character_name,
          character_type,
          description: description || undefined,
          is_public,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          timeout: 120000,
        }
      );
    } catch (e) {
      console.warn('角色已创建，抠图更新失败:', e);
    }
  }

  return { characterId, response: createResponse.data };
}

export const ELEMENT_CATEGORIES = [
  { label: '场景', value: 'scene' },
  { label: '人物', value: 'people' },
  { label: '动物', value: 'animal' },
  { label: '植物', value: 'plant' },
  { label: '食物', value: 'food' },
  { label: '玩具', value: 'toy' },
  { label: '交通工具', value: 'vehicle' },
  { label: '装饰', value: 'decoration' },
  { label: '家居', value: 'furniture' },
  { label: '其它', value: 'others' },
];

export const CHARACTER_CATEGORIES = [
  { label: '人物', value: 'people' },
  { label: '动物', value: 'animal' },
  { label: '植物', value: 'plant' },
  { label: '食物', value: 'food' },
  { label: '玩具', value: 'toy' },
  { label: '交通工具', value: 'vehicle' },
  { label: '装饰', value: 'decoration' },
  { label: '家居', value: 'furniture' },
  { label: '其它', value: 'others' },
];
