<template>
  <main class="main-content">
    <!-- Hero 区域（可按需扩展） -->

    <!-- 五个核心应用场景 -->
    <section class="scenarios" id="scenarios">
      <div class="scenarios-container">
        <el-tabs v-model="activeTab" class="scenario-tabs">
          <el-tab-pane
            v-for="scenario in scenarios"
            :key="scenario.name"
            :label="scenario.label"
            :name="scenario.name"
          >
            <div class="scenario-content">
              <p class="scenario-intro">
                {{ scenario.intro }}
              </p>
              <el-table :data="scenario.products" style="width: 100%" stripe border>
                <el-table-column prop="rank" label="排名" width="80" align="center" class-name="el-table-column--80">
                  <template #default="scope">
                    {{ scope.row.rank }}
                  </template>
                </el-table-column>
                <el-table-column prop="name" label="名称" width="180" align="left" class-name="el-table-column--180" />
                <el-table-column label="Logo" width="120" align="center" class-name="el-table-column--120">
                  <template #default="scope">
                    <a :href="scope.row.url" target="_blank" rel="noopener" class="logo-link">
                      <img :src="scope.row.logo" :alt="scope.row.name" class="product-logo" @error="handleLogoError($event, scope.row.name)" />
                    </a>
                  </template>
                </el-table-column>
                <el-table-column prop="category" label="分类" width="150" align="center" class-name="el-table-column--150" />
                <el-table-column prop="purpose" label="用途" align="left" />
              </el-table>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </section>
  </main>
</template>

<script>
import { scenarios } from '@/data/scenario1Data'

export default {
  name: 'Home',
  data(){
    return{
      scenarios,
      activeTab: scenarios[0]?.name || 'scenario1'
    }
  },
  methods:{
    handleLogoError(e, name){
      // 回退到简单的文字占位或默认图标
      e.target.outerHTML = `<span class="logo-fallback" title="${name}">N/A</span>`
    }
  }
}
</script>
<style scoped>
.main-content{
  width:100vw;
  min-height: calc(100vh - 72px);
  background: #f7f8fa;
 
}

.scenarios{
  padding: 24px 32px;
}

.scenarios-container{
  max-width: 1200px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.06);
  padding: 24px;max-height: calc(100vh - 160px); overflow-y: auto; -webkit-overflow-scrolling: touch; 
}

.scenario-tabs ::v-deep .el-tabs__item{
  font-size: 14px;
  padding: 0 16px;
}

.scenario-content{
  margin-top: 8px;
}

.scenario-intro{
  margin: 8px 0 16px;
  color:#606266;
  line-height: 1.6;
}

.product-logo{
  width: 56px;
  height: 56px;
  object-fit: contain;
  border-radius: 8px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
}

.logo-link{
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 列宽辅助类，避免表格内容抖动 */
.el-table-column--80{ width:80px; }
.el-table-column--120{ width:120px; }
.el-table-column--150{ width:150px; }
.el-table-column--180{ width:180px; }
</style>