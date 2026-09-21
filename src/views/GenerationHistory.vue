<template>
  <div class="gen-history-page">
    <header class="gh-header">
      <div>
        <h1>{{ $t('generationHistory.title') }}</h1>
        <p>{{ $t('generationHistory.subtitle') }}</p>
      </div>
      <router-link to="/member/points-history" class="gh-link">
        {{ $t('generationHistory.viewPoints') }} →
      </router-link>
    </header>

    <div v-loading="loading" class="gh-grid-wrap">
      <div v-if="list.length" class="gh-grid">
        <article v-for="item in list" :key="item.id" class="gh-card">
          <button type="button" class="gh-thumb-btn" @click="previewItem(item)">
            <img :src="item.image_url" :alt="item.title" class="gh-thumb" loading="lazy" />
          </button>
          <div class="gh-meta">
            <span class="gh-source">{{ sourceLabel(item.source) }}</span>
            <span class="gh-time">{{ formatTime(item.completed_at || item.created_at) }}</span>
            <p v-if="item.prompt_preview" class="gh-prompt">{{ item.prompt_preview }}</p>
            <div class="gh-actions">
              <el-button size="small" type="primary" :loading="collectingId === item.id" @click="collectItem(item)">
                {{ $t('generationHistory.collect') }}
              </el-button>
              <el-button size="small" @click="downloadItem(item)">
                {{ $t('generationHistory.download') }}
              </el-button>
            </div>
          </div>
        </article>
      </div>
      <el-empty v-else-if="!loading" :description="$t('generationHistory.empty')" />

      <div v-if="total > pageSize" class="gh-pagination">
        <el-pagination
          background
          layout="prev, pager, next"
          :current-page="page"
          :page-size="pageSize"
          :total="total"
          @current-change="onPageChange"
        />
      </div>
    </div>

    <el-dialog v-model="previewVisible" width="90%" class="gh-preview-dialog">
      <img v-if="previewUrl" :src="previewUrl" alt="" class="gh-preview-img" />
    </el-dialog>
  </div>
</template>

<script>
import { fetchGenerationHistory, collectGenerationToIllustration } from '@/utils/generationHistoryApi';

const SOURCE_I18N_KEYS = {
  create_character: 'generationHistory.sourceCreateCharacter',
  ai_picture: 'generationHistory.sourceAiPicture',
  character_studio: 'generationHistory.sourceCharacterStudio',
  mood_diary: 'generationHistory.sourceMoodDiary',
  diary_timeline: 'generationHistory.sourceDiaryTimeline',
  diary_timeline_expand_generate: 'generationHistory.sourceDiaryTimeline',
  xiaohei_expand_generate: 'generationHistory.sourceXiaohei',
  paper_poster_collage: 'generationHistory.sourcePaperPoster',
  paper_poster_redraw: 'generationHistory.sourcePaperPoster',
  photo_editorial_motif: 'generationHistory.sourcePhotoEditorial',
  aibooks: 'generationHistory.sourceAibooks',
};

export default {
  name: 'GenerationHistory',
  data() {
    return {
      loading: false,
      list: [],
      total: 0,
      page: 1,
      pageSize: 20,
      collectingId: '',
      previewVisible: false,
      previewUrl: '',
    };
  },
  mounted() {
    this.loadList();
  },
  methods: {
    sourceLabel(source) {
      const key = SOURCE_I18N_KEYS[source];
      if (key) return this.$t(key);
      if (source && source.startsWith('paper_poster')) {
        return this.$t('generationHistory.sourcePaperPoster');
      }
      return source || this.$t('generationHistory.sourceOther');
    },
    formatTime(iso) {
      if (!iso) return '';
      try {
        const d = new Date(iso);
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } catch {
        return iso;
      }
    },
    async loadList() {
      this.loading = true;
      try {
        const data = await fetchGenerationHistory(this.$http, {
          page: this.page,
          pageSize: this.pageSize,
        });
        this.list = data.list || [];
        this.total = data.total || 0;
      } catch (e) {
        this.$message?.error?.(e?.message || this.$t('generationHistory.loadFailed'));
      } finally {
        this.loading = false;
      }
    },
    onPageChange(p) {
      this.page = p;
      this.loadList();
    },
    previewItem(item) {
      this.previewUrl = item.image_url;
      this.previewVisible = true;
    },
    async collectItem(item) {
      this.collectingId = item.id;
      try {
        await collectGenerationToIllustration(this.$http, {
          imageUrl: item.image_url,
          prompt: item.prompt_preview,
          title: item.title,
        });
        this.$message.success(this.$t('generationHistory.collectSuccess'));
      } catch (e) {
        this.$message.error(e?.message || this.$t('generationHistory.collectFailed'));
      } finally {
        this.collectingId = '';
      }
    },
    downloadItem(item) {
      const url = item.image_url;
      if (!url) return;
      if (url.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `kidstory-${item.task_id || Date.now()}.png`;
        a.click();
        return;
      }
      window.open(url, '_blank', 'noopener');
    },
  },
};
</script>

<style scoped>
.gen-history-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px calc(32px + var(--kid-tabbar-h, 0px));
}

.gh-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.gh-header h1 {
  margin: 0 0 6px;
  font-size: 1.5rem;
  color: #2c3e50;
}

.gh-header p {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.gh-link {
  flex-shrink: 0;
  font-size: 14px;
  color: #6c5ce7;
  text-decoration: none;
}

.gh-link:hover {
  text-decoration: underline;
}

.gh-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.gh-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.gh-thumb-btn {
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: #f5f6fa;
  cursor: pointer;
}

.gh-thumb {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  display: block;
}

.gh-meta {
  padding: 12px 14px 14px;
}

.gh-source {
  display: inline-block;
  font-size: 12px;
  color: #6c5ce7;
  background: #efeaff;
  padding: 2px 8px;
  border-radius: 999px;
  margin-right: 8px;
}

.gh-time {
  font-size: 12px;
  color: #909399;
}

.gh-prompt {
  margin: 8px 0 10px;
  font-size: 13px;
  color: #606266;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.gh-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.gh-pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.gh-preview-img {
  width: 100%;
  max-height: 75vh;
  object-fit: contain;
}

@media (max-width: 768px) {
  .gh-header {
    flex-direction: column;
  }

  .gh-grid {
    grid-template-columns: 1fr;
  }
}
</style>
