<template>
    <div class="container">
        <div class="main-layout">
            <!-- 左侧：角色信息 -->
            <div class="left-panel">
                <el-card class="panel-card" shadow="hover">
                    <div slot="header" class="card-header">
                        <span>角色信息</span>
                    </div>
                    <div class="panel-content">
                        <div v-if="loading" class="loading-state">
                            <i class="el-icon-loading"></i>
                            <p>加载中...</p>
                        </div>
                        <div v-else-if="character" class="character-info">
                            <div class="character-image">
                                <el-image 
                                    :src="`https://static.kidstory.cc/` + character.image_url" 
                                    fit="contain"
                                    class="character-img"
                                    :preview-src-list="[character.image_url]">
                                </el-image>
                            </div>
                            <el-descriptions :column="1" :colon="false" class="character-details">
                                <el-descriptions-item label="角色名称">{{ character.character_name || '未命名角色' }}</el-descriptions-item>
                                <el-descriptions-item label="角色类型">{{ character.character_type || '通用' }}</el-descriptions-item>
                                <el-descriptions-item label="描述">{{ character.description || '暂无描述' }}</el-descriptions-item>
                                <el-descriptions-item label="创建时间">{{ character.created_at || character.createdAt || '未知' }}</el-descriptions-item>
                            </el-descriptions>
                        </div>
                        <div v-else class="empty-state">
                            <p>角色不存在</p>
                        </div>
                    </div>
                </el-card>
            </div>

            <!-- 右侧：组图列表 -->
            <div class="right-panel">
                <el-card class="result-card" shadow="hover">
                    <div slot="header" class="card-header">
                        <span>组图列表</span>
                    </div>
                    <div class="result-content">
                        <div v-if="loading" class="result-loading">
                            <i class="el-icon-loading"></i>
                            <p>加载中...</p>
                        </div>
                        <div v-else-if="groupImages.length === 0" class="result-placeholder">
                            <i class="el-icon-picture-outline"></i>
                            <p>该角色还没有组图</p>
                            <el-link type="primary" @click="goCreateGroupImages">创建组图</el-link>
                        </div>
                        <div v-else class="group-images-list">
                            <div 
                                v-for="(group, groupIndex) in groupImages" 
                                :key="groupIndex"
                                class="group-image-item">
                                <div class="group-header">
                                    <h3>{{ group.title || `组图 ${groupIndex + 1}` }}</h3>
                                    <div class="group-meta">
                                        <span>创建时间：{{ group.created_at || group.createdAt || '未知' }}</span>
                                    </div>
                                </div>
                                <div class="group-images-grid">
                                    <el-card 
                                        v-for="(image, imgIndex) in group.image_urls" 
                                        :key="imgIndex"
                                        class="content-card"
                                        shadow="hover">
                                        <div class="card-image">
                                            <el-image 
                                                :src="getImageUrl(image)" 
                                                fit="cover"
                                                class="cover-image"
                                                :preview-src-list="group.image_urls.map(img => getImageUrl(img))">
                                                <div slot="error" class="image-slot">
                                                    <i class="el-icon-picture-outline"></i>
                                                </div>
                                            </el-image>
                                        </div>
                                        <div class="card-content">
                                            <h3 class="card-title">第 {{ imgIndex + 1 }} 张</h3>
                                            <div class="card-actions">
                                                <el-button 
                                                    type="danger" 
                                                    size="small" 
                                                    @click="handleDeleteGroupImage(group, imgIndex)">
                                                    删除
                                                </el-button>
                                            </div>
                                        </div>
                                    </el-card>
                                </div>
                            </div>
                        </div>
                    </div>
                </el-card>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'CharacterGroupImages',
    props: {
        characterId: {
            type: String,
            default: null
        }
    },
    data() {
        return {
            character: null,
            groupImages: [],
            loading: false,
            apiBaseUrl: process.env.VUE_APP_API_BASE_URL || ''
        };
    },
    mounted() {
        this.loadData();
    },
    watch: {
        characterId() {
            this.loadData();
        },
        '$route'(to) {
            if (to.params.characterId) {
                this.loadData();
            }
        }
    },
    methods: {
        // 跳转到创作组图页面
        goCreateGroupImages() {
            // 获取当前角色ID
            const characterId = this.characterId || this.$route.params.characterId || localStorage.getItem('viewCharacterId');
            if (!characterId) {
                this.$message.warning('未找到角色ID');
                return;
            }
            
            // 如果有角色信息，保存到localStorage
            if (this.character) {
                const characterData = {
                    id: characterId,
                    image_url: this.character.image_url,
                    character_name: this.character.character_name,
                    character_type: this.character.character_type,
                    description: this.character.description
                };
                localStorage.setItem('selectedCharacterForGroupImages', JSON.stringify(characterData));
            }
            
            // 保存角色ID到localStorage，供创作组图页面使用
            localStorage.setItem('lastCharacterId', String(characterId));
            localStorage.setItem('viewCharacterId', String(characterId));
            
            // 跳转到创作组图页面
            this.$router.push('/create-group-images');
        },
        
        async loadData() {
            const characterId = this.characterId || this.$route.params.characterId || localStorage.getItem('viewCharacterId');
            if (!characterId) {
                this.$message.error('缺少角色ID');
                return;
            }
            
            this.loading = true;
            try {
                await Promise.all([
                    this.getCharacter(characterId),
                    this.getGroupImages(characterId)
                ]);
            } catch (error) {
                console.error('加载数据失败:', error);
            } finally {
                this.loading = false;
            }
        },
        
        // 获取角色信息
        async getCharacter(characterId) {
            try {
                const apiUrl = this.apiBaseUrl 
                    ? `${this.apiBaseUrl}/character/${characterId}`
                    : `/character/${characterId}`;
                
                const response = await this.$http.get(apiUrl, {
                    headers: {
                        'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                    }
                });
                
                if (response.data && (response.data.code === 0 || response.data.code === '0' || response.data.desc === 'success')) {
                    this.character = response.data.data || response.data.message || response.data;
                }
            } catch (error) {
                console.error('获取角色信息失败:', error);
                this.$message.error('获取角色信息失败');
            }
        },
        
        // 获取组图列表（通过 characterGroupImage 模型的 character_id 字段查询）
        async getGroupImages(characterId) {
            try {
                // 使用角色组图接口，后端会通过 characterGroupImage 模型的 character_id 字段查询
                const apiUrl = this.apiBaseUrl 
                    ? `${this.apiBaseUrl}/character/${characterId}/group-images`
                    : `/character/${characterId}/group-images`;
                
                const response = await this.$http.get(apiUrl, {
                    headers: {
                        'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                    }
                });
                
                if (response.data && (response.data.code === 0 || response.data.code === '0' || response.data.desc === 'success')) {
                    // 获取组图数据（从 characterGroupImage 模型返回的数据）
                    let groupImagesData = response.data.data || response.data.message || response.data.list || [];
                    
                    // 确保每个组图对象都有 image_urls 数组
                    this.groupImages = groupImagesData.map(group => {
                        // 如果组图对象中已经有 image_urls，直接使用
                        if (group.image_urls && Array.isArray(group.image_urls) && group.image_urls.length > 0) {
                            return {
                                ...group,
                                image_urls: group.image_urls,
                                image_ids: group.image_ids || group.image_ids || []
                            };
                        }
                        
                        // 如果组图对象中有 images 字段，转换为 image_urls
                        if (group.images && Array.isArray(group.images) && group.images.length > 0) {
                            return {
                                ...group,
                                image_urls: group.images,
                                image_ids: group.image_ids || []
                            };
                        }
                        
                        // 如果组图对象中有单个 image_url，转换为数组
                        if (group.image_url) {
                            return {
                                ...group,
                                image_urls: [group.image_url],
                                image_ids: group.image_id ? [group.image_id] : []
                            };
                        }
                        
                        // 如果组图对象中有 content 字段（可能是数组或单个值）
                        if (group.content) {
                            const contentArray = Array.isArray(group.content) ? group.content : [group.content];
                            return {
                                ...group,
                                image_urls: contentArray,
                                image_ids: group.image_ids || []
                            };
                        }
                        
                        // 默认返回空数组
                        return {
                            ...group,
                            image_urls: [],
                            image_ids: []
                        };
                    }).filter(group => group.image_urls.length > 0); // 过滤掉没有图片的组图
                    
                    console.log('获取到的组图数据:', this.groupImages);
                    console.log('原始响应数据:', response.data);
                } else {
                    console.warn('获取组图列表响应格式异常:', response.data);
                    this.groupImages = [];
                }
            } catch (error) {
                console.error('获取组图列表失败:', error);
                console.error('错误详情:', error.response?.data);
                this.$message.error('获取组图列表失败');
                this.groupImages = [];
            }
        },
        
        // 处理图片URL
        getImageUrl(image) {
            if (!image) return '';
            // 如果已经是完整URL，直接返回
            if (image.startsWith('http://') || image.startsWith('https://')) {
                return image;
            }
            // 否则添加前缀
            return `https://static.kidstory.cc/${image}`;
        },
        
        // 删除组图中的单张图片（调用删除插画接口）
        async handleDeleteGroupImage(group, imgIndex) {
            try {
                // 确认删除
                await this.$confirm('确定要删除这张插画吗？', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                
                // 获取插画ID
                // 优先使用 image_ids 数组中的ID，如果没有则尝试从 image_urls 中获取
                let illustrationId = null;
                
                if (group.image_ids && Array.isArray(group.image_ids) && group.image_ids[imgIndex]) {
                    // 如果组图数据中有插画ID数组，直接使用
                    illustrationId = group.image_ids[imgIndex];
                } else if (group.illustration_ids && Array.isArray(group.illustration_ids) && group.illustration_ids[imgIndex]) {
                    // 兼容其他可能的字段名
                    illustrationId = group.illustration_ids[imgIndex];
                } else {
                    // 如果没有插画ID，提示用户
                    this.$message.warning('无法获取插画ID，请通过"我的插画"页面删除');
                    return;
                }
                
                if (!illustrationId) {
                    this.$message.error('无法获取插画ID');
                    return;
                }
                
                // 调用删除插画接口
                const apiUrl = this.apiBaseUrl 
                    ? `${this.apiBaseUrl}/ill/${illustrationId}`
                    : `/ill/${illustrationId}`;
                
                const response = await this.$http.delete(apiUrl, {
                    headers: {
                        'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                    }
                });
                
                if (response.data && (response.data.desc === 'success' || response.data.code === 0 || response.data.code === '0')) {
                    // 从本地数据中删除该图片
                    group.image_urls.splice(imgIndex, 1);
                    
                    // 如果组图数据中有插画ID数组，也删除对应的ID
                    if (group.image_ids && Array.isArray(group.image_ids)) {
                        group.image_ids.splice(imgIndex, 1);
                    }
                    if (group.illustration_ids && Array.isArray(group.illustration_ids)) {
                        group.illustration_ids.splice(imgIndex, 1);
                    }
                    
                    // 如果组图中没有图片了，删除整个组图
                    if (group.image_urls.length === 0) {
                        const groupId = group.id || group._id;
                        const groupIndex = this.groupImages.findIndex(g => (g.id || g._id) === groupId);
                        if (groupIndex !== -1) {
                            this.groupImages.splice(groupIndex, 1);
                        }
                        
                        // 调用后端接口删除整个组图
                        if (groupId) {
                            const groupApiUrl = this.apiBaseUrl 
                                ? `${this.apiBaseUrl}/character/group-image/${groupId}`
                                : `/character/group-image/${groupId}`;
                            
                            await this.$http.delete(groupApiUrl, {
                                headers: {
                                    'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                                }
                            });
                        }
                        
                        this.$message.success('插画已删除，组图已清空');
                    } else {
                        // 更新组图（删除单张图片后更新组图数据）
                        const groupId = group.id || group._id;
                        if (groupId) {
                            const groupApiUrl = this.apiBaseUrl 
                                ? `${this.apiBaseUrl}/character/group-image/${groupId}`
                                : `/character/group-image/${groupId}`;
                            
                            await this.$http.put(groupApiUrl, {
                                image_urls: group.image_urls,
                                image_ids: group.image_ids || undefined
                            }, {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                                }
                            });
                        }
                        
                        this.$message.success('插画已删除');
                    }
                } else {
                    throw new Error(response.data?.message || '删除失败');
                }
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('删除插画失败:', error);
                    this.$message.error('删除失败: ' + (error.response?.data?.message || error.message || '请重试'));
                }
            }
        }
    }
};
</script>

<style scoped>
.container {
    width: 100%;
    height: calc(100vh - 72px - 50px);
    padding: 20px;
    box-sizing: border-box;
    background-color: #f5f7fa;
}

.main-layout {
    display: flex;
    gap: 20px;
    height: 100%;
}

.left-panel {
    flex: 0 0 300px;
    min-width: 0;
}

.right-panel {
    flex: 1;
    min-width: 0;
}

.panel-card,
.result-card {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.panel-card >>> .el-card__body,
.result-card >>> .el-card__body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.card-header {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}

.panel-content,
.result-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px 0;
}

.loading-state,
.result-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #909399;
}

.loading-state i,
.result-loading i {
    font-size: 48px;
    color: #c0c4cc;
    margin-bottom: 16px;
    animation: rotating 2s linear infinite;
}

@keyframes rotating {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.character-info {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.character-image {
    width: 100%;
    text-align: center;
}

.character-img {
    width: 100%;
    max-height: 300px;
    border-radius: 8px;
    overflow: hidden;
}

.character-details {
    margin-top: 20px;
}

.empty-state,
.result-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #909399;
}

.result-placeholder i {
    font-size: 64px;
    color: #c0c4cc;
    margin-bottom: 16px;
}

.group-images-list {
    display: flex;
    flex-direction: column;
    gap: 30px;
}

.group-image-item {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 20px;
    background-color: #fff;
}

.group-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #ebeef5;
}

.group-header h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}

.group-meta {
    font-size: 12px;
    color: #909399;
}

.group-images-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
}

.content-card {
    margin-bottom: 0;
}

.content-card >>> .el-card__body {
    padding: 12px;
}

.card-image {
    width: 100%;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    position: relative;
    width: 100%;
    height: 200px;
    overflow: hidden;
    border-radius: 4px;
    background-color: #fafafa;
    display: flex;
    align-items: center;
    justify-content: center;
}

.cover-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.image-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: #909399;
    font-size: 24px;
}

.card-content {
    margin-top: 12px;
}

.card-title {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    text-align: center;
}

.card-actions {
    display: flex;
    justify-content: center;
    gap: 8px;
}

.group-prompt {
    margin-top: 16px;
    padding: 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
    border-left: 4px solid #409eff;
}

.prompt-label {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
}

.prompt-content {
    font-size: 13px;
    color: #606266;
    line-height: 1.6;
    word-break: break-word;
}

/* 滚动条样式 */
.panel-content::-webkit-scrollbar,
.result-content::-webkit-scrollbar {
    width: 6px;
}

.panel-content::-webkit-scrollbar-track,
.result-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb,
.result-content::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover,
.result-content::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>

