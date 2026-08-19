<template>
  <Header>
    <div class="top-inner" :class="{ 'top-inner--mobile': isMobileEditor }">
      <div class="left">
        <import-file></import-file>
        <Divider type="vertical" />
        <history></history>

        <template v-if="!isMobileEditor">
          <Divider type="vertical" />
          <span class="grid-label">{{ $t('grid') }}</span>
          <Tooltip :content="$t('grid')">
            <iSwitch v-model="toggleModel" size="small" class="switch"></iSwitch>
          </Tooltip>
        </template>
      </div>

      <div class="right">
        <template v-if="!isMobileEditor">
          <stash />
          <clearBtn />
          <previewCurrent />
          <waterMark />
          <styleTransferBtn />
          <save></save>
        </template>
        <template v-else>
          <previewCurrent />
          <save></save>
          <Dropdown trigger="click" placement="bottom-end">
            <Button type="text" class="more-btn">更多</Button>
            <template #list>
              <DropdownMenu>
                <DropdownItem>
                  <div class="more-row" @click.stop>
                    <span>{{ $t('grid') }}</span>
                    <iSwitch v-model="toggleModel" size="small"></iSwitch>
                  </div>
                </DropdownItem>
                <DropdownItem divided>
                  <stash />
                </DropdownItem>
                <DropdownItem>
                  <clearBtn />
                </DropdownItem>
                <DropdownItem>
                  <waterMark />
                </DropdownItem>
                <DropdownItem>
                  <styleTransferBtn />
                </DropdownItem>
              </DropdownMenu>
            </template>
          </Dropdown>
        </template>
      </div>
    </div>
  </Header>
</template>

<script name="Top" setup>
import { computed } from 'vue';
import importFile from '@/components/editorPro/editor-components/importFile.vue';
import previewCurrent from '@/components/editorPro/editor-components/previewCurrent.vue';
import save from '@/components/editorPro/editor-components/save.vue';
import waterMark from '@/components/editorPro/editor-components/waterMark.vue';
import history from '@/components/editorPro/editor-components/history.vue';
import stash from '@/components/editorPro/editor-components/stash.vue';
import styleTransferBtn from '@/components/editorPro/editor-components/styleTransferBtn.vue';
import clearBtn from '@/components/editorPro/editor-components/clear.vue';
import { useEditorMobile } from '@/composables/useEditorMobile';

const { isMobileEditor } = useEditorMobile();

const props = defineProps(['ruler']);
const emit = defineEmits(['update:ruler']);

const toggleModel = computed({
  get() {
    return props.ruler;
  },
  set(value) {
    emit('update:ruler', value);
  },
});
</script>

<style scoped>
.top-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 45px;
  gap: 8px;
  box-sizing: border-box;
}

.left {
  margin-left: 80px;
  flex: 1;
  min-width: 0;
}

.top-inner--mobile .left {
  margin-left: 0;
  min-width: 0;
}

.right {
  flex-shrink: 0;
}

.left,
.right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.left img,
.right img {
  display: block;
  margin-right: 10px;
}

.grid-label {
  font-size: 12px;
  color: #333;
  margin-right: 6px;
  user-select: none;
}

.more-btn {
  padding: 0 8px;
  font-weight: 600;
}

.more-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 140px;
}
</style>
