# 创作角色后端实现指南

## 功能概述

后端需要实现一个完整的角色创作流程：
1. 接收用户上传的孩子照片
2. 对照片进行预处理（调整大小、格式转换等）
3. 调用图像分割模型，提取人物区域
4. 调用风格迁移模型，将人物转化为统一风格的角色形象
5. 返回生成的角色图片

---

## 方式一：Node.js/Express 实现

### 1. 安装依赖

```bash
npm install express multer sharp axios
# 如果使用Python模型服务
npm install child_process
# 如果使用OSS存储
npm install ali-oss
```

### 2. 完整实现代码

**文件：`routes/createCharacter.js`**

```javascript
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// 配置multer用于文件上传
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只支持 JPG、PNG 格式的图片'));
        }
    }
});

/**
 * 预处理图片：调整大小、格式转换
 */
async function preprocessImage(imageBuffer) {
    try {
        // 调整图片大小，最大尺寸1024px，保持宽高比
        const processedImage = await sharp(imageBuffer)
            .resize(1024, 1024, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 90 })
            .toBuffer();
        
        return processedImage;
    } catch (error) {
        throw new Error(`图片预处理失败: ${error.message}`);
    }
}

/**
 * 调用图像分割模型（示例：使用Python服务）
 */
async function segmentImage(imageBuffer) {
    try {
        // 方式1：调用本地Python服务
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        // 保存临时图片
        const tempInputPath = path.join(__dirname, '../temp', `input_${uuidv4()}.jpg`);
        const tempOutputPath = path.join(__dirname, '../temp', `segmented_${uuidv4()}.png`);
        
        await fs.mkdir(path.dirname(tempInputPath), { recursive: true });
        await fs.writeFile(tempInputPath, imageBuffer);
        
        // 调用Python分割脚本
        // 假设Python脚本路径：./models/image_segmentation.py
        const pythonScript = path.join(__dirname, '../models/image_segmentation.py');
        const command = `python3 ${pythonScript} --input "${tempInputPath}" --output "${tempOutputPath}"`;
        
        await execAsync(command);
        
        // 读取分割结果
        const segmentedImage = await fs.readFile(tempOutputPath);
        
        // 清理临时文件
        await fs.unlink(tempInputPath).catch(() => {});
        await fs.unlink(tempOutputPath).catch(() => {});
        
        return segmentedImage;
    } catch (error) {
        throw new Error(`图像分割失败: ${error.message}`);
    }
}

/**
 * 调用风格迁移模型
 */
async function styleTransfer(segmentedImage, stylePreset = 'default') {
    try {
        // 方式1：调用阿里云视觉开放平台API（推荐）
        const AlibabaCloud = require('@alicloud/imageenhan20190930');
        const { Config } = require('@alicloud/openapi-client');
        
        const config = new Config({
            accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
            accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
            endpoint: 'imageenhan.cn-shanghai.aliyuncs.com',
            regionId: 'cn-shanghai'
        });
        
        const client = new AlibabaCloud(config);
        
        // 先将分割后的图片上传到OSS
        const OSS = require('ali-oss');
        const ossClient = new OSS({
            region: process.env.OSS_REGION || 'oss-cn-shanghai',
            accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
            accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
            bucket: process.env.OSS_BUCKET
        });
        
        const ossKey = `character/segmented_${uuidv4()}.jpg`;
        await ossClient.put(ossKey, segmentedImage);
        const segmentedImageUrl = `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com/${ossKey}`;
        
        // 获取风格参考图URL（预设的风格图片）
        const styleImageUrl = getStyleImageUrl(stylePreset);
        
        // 调用风格迁移API
        const request = new AlibabaCloud.ExtendImageStyleRequest({
            majorUrl: segmentedImageUrl,
            styleUrl: styleImageUrl
        });
        
        const response = await client.extendImageStyle(request);
        const resultUrl = response.body.data.resultUrl;
        
        return {
            resultUrl: resultUrl,
            ossUrl: resultUrl
        };
        
    } catch (error) {
        // 如果阿里云API失败，可以降级到本地模型
        console.error('阿里云API调用失败，尝试本地模型:', error);
        return await styleTransferLocal(segmentedImage, stylePreset);
    }
}

/**
 * 本地风格迁移（备用方案）
 */
async function styleTransferLocal(segmentedImage, stylePreset) {
    try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        const tempInputPath = path.join(__dirname, '../temp', `input_${uuidv4()}.jpg`);
        const tempStylePath = path.join(__dirname, '../styles', `${stylePreset}.jpg`);
        const tempOutputPath = path.join(__dirname, '../temp', `result_${uuidv4()}.jpg`);
        
        await fs.mkdir(path.dirname(tempInputPath), { recursive: true });
        await fs.writeFile(tempInputPath, segmentedImage);
        
        // 调用本地风格迁移脚本
        const pythonScript = path.join(__dirname, '../models/style_transfer.py');
        const command = `python3 ${pythonScript} --content "${tempInputPath}" --style "${tempStylePath}" --output "${tempOutputPath}"`;
        
        await execAsync(command);
        
        const resultImage = await fs.readFile(tempOutputPath);
        
        // 清理临时文件
        await fs.unlink(tempInputPath).catch(() => {});
        await fs.unlink(tempOutputPath).catch(() => {});
        
        // 上传到OSS或返回base64
        if (process.env.USE_OSS === 'true') {
            const OSS = require('ali-oss');
            const ossClient = new OSS({
                region: process.env.OSS_REGION,
                accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
                accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
                bucket: process.env.OSS_BUCKET
            });
            
            const ossKey = `character/result_${uuidv4()}.jpg`;
            await ossClient.put(ossKey, resultImage);
            const ossUrl = `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com/${ossKey}`;
            
            return {
                resultUrl: ossUrl,
                ossUrl: ossUrl
            };
        } else {
            // 返回base64
            const base64 = resultImage.toString('base64');
            return {
                resultUrl: `data:image/jpeg;base64,${base64}`,
                base64: base64
            };
        }
    } catch (error) {
        throw new Error(`风格迁移失败: ${error.message}`);
    }
}

/**
 * 获取风格参考图URL
 */
function getStyleImageUrl(stylePreset) {
    const styleMap = {
        'default': process.env.STYLE_IMAGE_DEFAULT || 'https://your-cdn.com/styles/default.jpg',
        'cartoon': process.env.STYLE_IMAGE_CARTOON || 'https://your-cdn.com/styles/cartoon.jpg',
        'watercolor': process.env.STYLE_IMAGE_WATERCOLOR || 'https://your-cdn.com/styles/watercolor.jpg'
    };
    
    return styleMap[stylePreset] || styleMap['default'];
}

/**
 * 主接口：创建角色
 */
router.post('/', upload.single('photo'), async (req, res) => {
    try {
        // 1. 验证文件
        if (!req.file) {
            return res.status(400).json({
                code: 1,
                desc: 'error',
                message: '请上传照片'
            });
        }
        
        // 2. 预处理图片
        console.log('开始预处理图片...');
        const processedImage = await preprocessImage(req.file.buffer);
        
        // 3. 图像分割
        console.log('开始图像分割...');
        const segmentedImage = await segmentImage(processedImage);
        
        // 4. 风格迁移
        console.log('开始风格迁移...');
        const stylePreset = req.body.style_preset || 'default';
        const result = await styleTransfer(segmentedImage, stylePreset);
        
        // 5. 返回结果
        res.json({
            code: 0,
            desc: 'success',
            message: {
                character_image_oss_url: result.ossUrl,
                character_image_url: result.resultUrl,
                character_image_base64: result.base64 || undefined
            }
        });
        
    } catch (error) {
        console.error('创建角色失败:', error);
        res.status(500).json({
            code: -1,
            desc: 'Internal Server Error',
            message: error.message || '创建角色失败，请重试'
        });
    }
});

module.exports = router;
```

### 3. 在主应用中注册路由

**文件：`app.js` 或 `server.js`**

```javascript
const express = require('express');
const createCharacterRouter = require('./routes/createCharacter');

const app = express();

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 注册路由
app.use('/create-character', createCharacterRouter);

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        code: -1,
        desc: 'Internal Server Error',
        message: err.message || '服务器内部错误'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});
```

### 4. 环境变量配置

**文件：`.env`**

```env
# 阿里云配置
ALIBABA_CLOUD_ACCESS_KEY_ID=your_access_key_id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_access_key_secret

# OSS配置
OSS_REGION=oss-cn-shanghai
OSS_BUCKET=your-bucket-name
USE_OSS=true

# 风格图片URL
STYLE_IMAGE_DEFAULT=https://your-cdn.com/styles/default.jpg
STYLE_IMAGE_CARTOON=https://your-cdn.com/styles/cartoon.jpg
STYLE_IMAGE_WATERCOLOR=https://your-cdn.com/styles/watercolor.jpg
```

---

## 方式二：Python/Flask 实现（推荐用于AI模型）

### 1. 安装依赖

```bash
pip install flask flask-cors pillow opencv-python numpy torch torchvision
# 如果使用阿里云API
pip install alibabacloud-imageenhan20190930
# 如果使用OSS
pip install oss2
```

### 2. 完整实现代码

**文件：`app.py`**

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import uuid
from PIL import Image
import io
import base64
from models.image_segmentation import segment_image
from models.style_transfer import transfer_style
import oss2

app = Flask(__name__)
CORS(app)

# 配置
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# 确保上传文件夹存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs('temp', exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess_image(image_path):
    """预处理图片：调整大小、格式转换"""
    try:
        img = Image.open(image_path)
        
        # 调整大小，最大尺寸1024px，保持宽高比
        max_size = 1024
        if img.width > max_size or img.height > max_size:
            img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        # 转换为RGB（如果是RGBA）
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # 保存处理后的图片
        output_path = f'temp/preprocessed_{uuid.uuid4()}.jpg'
        img.save(output_path, 'JPEG', quality=90)
        
        return output_path
    except Exception as e:
        raise Exception(f'图片预处理失败: {str(e)}')

def upload_to_oss(image_path, key):
    """上传图片到OSS"""
    try:
        access_key_id = os.environ.get('ALIBABA_CLOUD_ACCESS_KEY_ID')
        access_key_secret = os.environ.get('ALIBABA_CLOUD_ACCESS_KEY_SECRET')
        bucket_name = os.environ.get('OSS_BUCKET')
        endpoint = os.environ.get('OSS_ENDPOINT', f'oss-{os.environ.get("OSS_REGION", "cn-shanghai")}.aliyuncs.com')
        
        auth = oss2.Auth(access_key_id, access_key_secret)
        bucket = oss2.Bucket(auth, endpoint, bucket_name)
        
        with open(image_path, 'rb') as f:
            bucket.put_object(key, f)
        
        oss_url = f'https://{bucket_name}.{endpoint}/{key}'
        return oss_url
    except Exception as e:
        print(f'OSS上传失败: {str(e)}')
        return None

@app.route('/create-character', methods=['POST'])
def create_character():
    try:
        # 1. 验证文件
        if 'photo' not in request.files:
            return jsonify({
                'code': 1,
                'desc': 'error',
                'message': '请上传照片'
            }), 400
        
        file = request.files['photo']
        
        if file.filename == '':
            return jsonify({
                'code': 1,
                'desc': 'error',
                'message': '请选择文件'
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'code': 1,
                'desc': 'error',
                'message': '只支持 JPG、PNG 格式的图片'
            }), 400
        
        # 2. 保存上传的文件
        filename = secure_filename(file.filename)
        unique_filename = f'{uuid.uuid4()}_{filename}'
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)
        
        try:
            # 3. 预处理图片
            print('开始预处理图片...')
            processed_path = preprocess_image(filepath)
            
            # 4. 图像分割
            print('开始图像分割...')
            segmented_path = segment_image(processed_path)
            
            # 5. 风格迁移
            print('开始风格迁移...')
            style_preset = request.form.get('style_preset', 'default')
            result_path = transfer_style(segmented_path, style_preset)
            
            # 6. 上传结果到OSS或返回base64
            use_oss = os.environ.get('USE_OSS', 'true').lower() == 'true'
            
            if use_oss:
                # 上传到OSS
                oss_key = f'character/result_{uuid.uuid4()}.jpg'
                oss_url = upload_to_oss(result_path, oss_key)
                
                if oss_url:
                    return jsonify({
                        'code': 0,
                        'desc': 'success',
                        'message': {
                            'character_image_oss_url': oss_url,
                            'character_image_url': oss_url
                        }
                    })
            
            # 如果OSS上传失败或未启用，返回base64
            with open(result_path, 'rb') as f:
                image_data = f.read()
                base64_data = base64.b64encode(image_data).decode('utf-8')
            
            return jsonify({
                'code': 0,
                'desc': 'success',
                'message': {
                    'character_image_base64': f'data:image/jpeg;base64,{base64_data}',
                    'character_image_url': f'data:image/jpeg;base64,{base64_data}'
                }
            })
            
        finally:
            # 清理临时文件
            try:
                if os.path.exists(filepath):
                    os.remove(filepath)
                if 'processed_path' in locals() and os.path.exists(processed_path):
                    os.remove(processed_path)
                if 'segmented_path' in locals() and os.path.exists(segmented_path):
                    os.remove(segmented_path)
                if 'result_path' in locals() and os.path.exists(result_path):
                    os.remove(result_path)
            except Exception as e:
                print(f'清理临时文件失败: {str(e)}')
                
    except Exception as e:
        print(f'创建角色失败: {str(e)}')
        return jsonify({
            'code': -1,
            'desc': 'Internal Server Error',
            'message': str(e) or '创建角色失败，请重试'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

### 3. 图像分割模型

**文件：`models/image_segmentation.py`**

```python
import cv2
import numpy as np
from PIL import Image
import os

def segment_image(image_path):
    """
    图像分割：提取人物区域
    这里使用示例代码，实际应该调用训练好的分割模型
    """
    try:
        # 读取图片
        img = cv2.imread(image_path)
        
        # 方式1：使用预训练的分割模型（如DeepLab、U-Net等）
        # 这里使用简单的背景分割作为示例
        # 实际项目中应该加载训练好的模型
        
        # 示例：使用GrabCut算法进行前景提取
        mask = np.zeros(img.shape[:2], np.uint8)
        bgdModel = np.zeros((1, 65), np.float64)
        fgdModel = np.zeros((1, 65), np.float64)
        
        # 定义矩形区域（可以根据实际需求调整）
        rect = (50, 50, img.shape[1]-100, img.shape[0]-100)
        cv2.grabCut(img, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)
        
        mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')
        segmented = img * mask2[:, :, np.newaxis]
        
        # 保存分割结果
        output_path = f'temp/segmented_{os.path.basename(image_path)}'
        cv2.imwrite(output_path, segmented)
        
        return output_path
        
    except Exception as e:
        raise Exception(f'图像分割失败: {str(e)}')
```

### 4. 风格迁移模型

**文件：`models/style_transfer.py`**

```python
import torch
import torch.nn as nn
from PIL import Image
import torchvision.transforms as transforms
import os

def transfer_style(content_path, style_preset='default'):
    """
    风格迁移：将分割后的人物转化为统一风格
    这里使用示例代码，实际应该调用训练好的风格迁移模型
    """
    try:
        # 方式1：使用阿里云视觉开放平台API（推荐）
        from alibabacloud_imageenhan20190930.client import Client
        from alibabacloud_imageenhan20190930.models import ExtendImageStyleRequest
        from alibabacloud_tea_openapi.models import Config
        import oss2
        
        # 配置
        config = Config(
            access_key_id=os.environ.get('ALIBABA_CLOUD_ACCESS_KEY_ID'),
            access_key_secret=os.environ.get('ALIBABA_CLOUD_ACCESS_KEY_SECRET'),
            endpoint='imageenhan.cn-shanghai.aliyuncs.com',
            region_id='cn-shanghai'
        )
        
        client = Client(config)
        
        # 上传内容图片到OSS
        content_url = upload_to_oss_for_style_transfer(content_path)
        
        # 获取风格参考图URL
        style_url = get_style_image_url(style_preset)
        
        # 调用风格迁移API
        request = ExtendImageStyleRequest(
            major_url=content_url,
            style_url=style_url
        )
        
        response = client.extend_image_style(request)
        result_url = response.body.data.result_url
        
        # 下载结果图片
        import requests
        result_response = requests.get(result_url)
        output_path = f'temp/result_{os.path.basename(content_path)}'
        with open(output_path, 'wb') as f:
            f.write(result_response.content)
        
        return output_path
        
    except Exception as e:
        # 如果API调用失败，使用本地模型
        print(f'API调用失败，使用本地模型: {str(e)}')
        return transfer_style_local(content_path, style_preset)

def transfer_style_local(content_path, style_preset):
    """本地风格迁移模型（备用方案）"""
    try:
        # 这里应该加载训练好的风格迁移模型
        # 示例使用简单的图像处理
        from PIL import Image, ImageFilter
        
        content_img = Image.open(content_path)
        
        # 应用风格化滤镜（实际应该使用神经网络模型）
        # 这里只是示例，实际应该使用训练好的模型
        styled_img = content_img.filter(ImageFilter.EDGE_ENHANCE_MORE)
        
        output_path = f'temp/result_{os.path.basename(content_path)}'
        styled_img.save(output_path, 'JPEG', quality=90)
        
        return output_path
        
    except Exception as e:
        raise Exception(f'风格迁移失败: {str(e)}')

def upload_to_oss_for_style_transfer(image_path):
    """上传图片到OSS用于风格迁移"""
    import oss2
    import uuid
    
    access_key_id = os.environ.get('ALIBABA_CLOUD_ACCESS_KEY_ID')
    access_key_secret = os.environ.get('ALIBABA_CLOUD_ACCESS_KEY_SECRET')
    bucket_name = os.environ.get('OSS_BUCKET')
    endpoint = os.environ.get('OSS_ENDPOINT', f'oss-{os.environ.get("OSS_REGION", "cn-shanghai")}.aliyuncs.com')
    
    auth = oss2.Auth(access_key_id, access_key_secret)
    bucket = oss2.Bucket(auth, endpoint, bucket_name)
    
    key = f'character/temp_{uuid.uuid4()}.jpg'
    with open(image_path, 'rb') as f:
        bucket.put_object(key, f)
    
    return f'https://{bucket_name}.{endpoint}/{key}'

def get_style_image_url(style_preset):
    """获取风格参考图URL"""
    style_map = {
        'default': os.environ.get('STYLE_IMAGE_DEFAULT', 'https://your-cdn.com/styles/default.jpg'),
        'cartoon': os.environ.get('STYLE_IMAGE_CARTOON', 'https://your-cdn.com/styles/cartoon.jpg'),
        'watercolor': os.environ.get('STYLE_IMAGE_WATERCOLOR', 'https://your-cdn.com/styles/watercolor.jpg')
    }
    
    return style_map.get(style_preset, style_map['default'])
```

### 5. 环境变量配置

**文件：`.env`**

```env
# 阿里云配置
ALIBABA_CLOUD_ACCESS_KEY_ID=your_access_key_id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_access_key_secret

# OSS配置
OSS_REGION=cn-shanghai
OSS_BUCKET=your-bucket-name
OSS_ENDPOINT=oss-cn-shanghai.aliyuncs.com
USE_OSS=true

# 风格图片URL
STYLE_IMAGE_DEFAULT=https://your-cdn.com/styles/default.jpg
STYLE_IMAGE_CARTOON=https://your-cdn.com/styles/cartoon.jpg
STYLE_IMAGE_WATERCOLOR=https://your-cdn.com/styles/watercolor.jpg
```

---

## 部署说明

### 1. Node.js 部署

```bash
# 安装依赖
npm install

# 设置环境变量
export ALIBABA_CLOUD_ACCESS_KEY_ID=your_key
export ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_secret

# 启动服务
node server.js
```

### 2. Python 部署

```bash
# 安装依赖
pip install -r requirements.txt

# 设置环境变量
export ALIBABA_CLOUD_ACCESS_KEY_ID=your_key
export ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_secret

# 启动服务
python app.py
```

### 3. 使用Docker部署

**Dockerfile (Python)**

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
```

---

## 注意事项

1. **图像分割模型**：需要根据实际需求训练或使用预训练模型（如DeepLab、U-Net、Mask R-CNN等）
2. **风格迁移模型**：可以使用阿里云API或训练自己的模型（如CycleGAN、StarGAN等）
3. **性能优化**：考虑使用GPU加速、模型量化、缓存等优化手段
4. **错误处理**：完善各种异常情况的处理
5. **安全性**：添加文件类型验证、大小限制、用户认证等安全措施

---

## API 文档

### 请求

- **URL**: `/create-character`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`

**参数**:
- `photo` (file, required): 孩子照片，JPG/PNG格式，最大5MB
- `style_preset` (string, optional): 风格预设，可选值：`default`, `cartoon`, `watercolor`

### 响应

**成功响应** (200):
```json
{
  "code": 0,
  "desc": "success",
  "message": {
    "character_image_oss_url": "https://bucket.oss-cn-shanghai.aliyuncs.com/character/result_xxx.jpg",
    "character_image_url": "https://bucket.oss-cn-shanghai.aliyuncs.com/character/result_xxx.jpg",
    "character_image_base64": "data:image/jpeg;base64,..." // 如果未使用OSS
  }
}
```

**错误响应** (400/500):
```json
{
  "code": 1,
  "desc": "error",
  "message": "错误信息"
}
```

