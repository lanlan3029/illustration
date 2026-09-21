import { getImageUrl } from '@/utils/characterStudioPrompt';
import {
  postCreateCharacter,
  isCreateCharacterResponseOk,
  resolveGenerationImageUrl,
} from '@/utils/createCharacterTask';
import { rembgFromImageSource } from '@/utils/imageSegmentation';

/** @typedef {'front'|'side'|'back'} CharacterViewType */

function resolveResultImageUrl(result, apiBaseUrl) {
  let imageUrl = resolveGenerationImageUrl(result, apiBaseUrl);
  if (!imageUrl && result?.character_image_url) imageUrl = result.character_image_url;
  if (!imageUrl && result?.image_base64) {
    let b = String(result.image_base64).trim();
    if (!b.startsWith('data:')) b = `data:image/jpeg;base64,${b.replace(/\s/g, '')}`;
    imageUrl = b;
  }
  return imageUrl || '';
}

/**
 * 调用 /create-character 生图，可选 rembg 抠图
 */
export async function generateCharacterImage(http, {
  apiBaseUrl = '',
  prompt = '',
  size = '1024x1024',
  referenceImage = '',
  characterIds = [],
  rembg = true,
} = {}) {
  const requestData = {
    prompt,
    size,
    watermark: false,
  };
  if (characterIds.length) {
    requestData.character_ids = characterIds;
  } else if (referenceImage) {
    requestData.image = referenceImage;
  }

  const responseData = await postCreateCharacter(http, requestData, {
    apiBaseUrl,
    source: 'character_studio',
  });
  if (!isCreateCharacterResponseOk(responseData) || !responseData.message) {
    throw new Error(responseData?.desc || responseData?.message?.error || 'generate failed');
  }

  const result = responseData.message;
  let imageUrl = resolveResultImageUrl(result, apiBaseUrl);
  if (!imageUrl) throw new Error('no image url');

  if (rembg) {
    try {
      const seg = await rembgFromImageSource(http, imageUrl, { apiBaseUrl });
      imageUrl = seg.imageURL;
    } catch (e) {
      console.warn('rembg failed, use original:', e);
    }
  }

  return { imageUrl, result };
}

/**
 * 收集角色某一视角到「我的角色」
 */
export async function saveCharacterView(http, {
  apiBaseUrl = '',
  characterId = '',
  viewType = 'front',
  imageUrl = '',
  characterName = '',
  description = '',
} = {}) {
  const token = localStorage.getItem('token');
  if (!token) return null;

  const apiUrl = apiBaseUrl ? `${apiBaseUrl}/character` : '/character';
  let payloadImage = imageUrl;
  if (payloadImage && !payloadImage.startsWith('data:') && !payloadImage.startsWith('http')) {
    payloadImage = getImageUrl(payloadImage);
  }

  const payload = {
    character_name: characterName,
    image_url: payloadImage,
    view_type: viewType,
    is_public: 1,
  };
  if (description) payload.description = description;
  if (characterId) payload.character_id = characterId;

  const res = await http.post(apiUrl, payload, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });

  if (res.data?.code === 0 || res.data?.code === '0') {
    const record = res.data.data || res.data.message || res.data;
    const id = String(record?.id || record?._id || characterId || '');
    return id ? { id, record } : null;
  }

  throw new Error(res.data?.message || 'save failed');
}
