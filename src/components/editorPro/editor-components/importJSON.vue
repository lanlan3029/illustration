

<template>
  <div style="display: inline-block">
    <Dropdown @on-click="clickHandler">
      <a href="javascript:void(0)">
        {{ $t('importFiles.file') }}
        <Icon type="ios-arrow-down"></Icon>
      </a>
      <template #list>
        <DropdownMenu>
          <DropdownItem name="createDesign">
            {{ $t('importFiles.createDesign.title') }}
          </DropdownItem>
          <DropdownItem name="importFiles">{{ $t('importFiles.importFiles') }}</DropdownItem>
          <DropdownItem name="psd">PSD</DropdownItem>
        </DropdownMenu>
      </template>
    </Dropdown>

    <!-- 创建设计 -->
    <modalSzie
      :title="$t('importFiles.createDesign.title')"
      ref="modalSizeRef"
      @set="customSizeCreate"
    ></modalSzie>
  </div>
</template>

<script name="ImportJson" setup>
import useSelect from '@/components/editorPro/hooks/select.js';
import useMaterial from '@/components/editorPro/hooks/useMaterial.js';
import { Message } from 'view-ui-plus';
import modalSzie from '@/components/editorPro/editor-components/common/modalSzie.vue';
import { Spin } from 'view-ui-plus';
import { ref } from 'vue';
const { canvasEditor } = useSelect();
const { createTmpl, routerToId } = useMaterial();
const modalSizeRef = ref(null);

const clickHandler = (type) => {
  const handleMap = {
    // 导入文件
    importFiles: canvasEditor.insert,
    // 创建文件
    createDesign,
    // psd
    psd: () => {
      // Spin.show({
      //   render: (h) => h('div', t('alert.loading_data')),
      // });
      canvasEditor.insertPSD().finally(Spin.hide);
    },
  };
  handleMap[type]?.();
};

const createDesign = () => {
  modalSizeRef.value.showSetSize();
};

const customSizeCreate = async (w, h) => {
  const res = await createTmpl(w, h);
  routerToId(res.data.data.id);
  Message.success('创建成功');
};
</script>
<style scoped  >
h3 {
  margin-bottom: 10px;
}
.divider {
  margin-top: 0;
}
</style>
