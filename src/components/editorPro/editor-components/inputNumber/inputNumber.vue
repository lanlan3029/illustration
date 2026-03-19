<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0,
  },
  append: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'on-change', 'on-focus', 'on-blur', 'on-input']);

const innerValue = ref(props.modelValue);

watch(
  () => props.modelValue,
  (val) => {
    innerValue.value = val;
  }
);

const handleChange = (value) => {
  emit('update:modelValue', value);
  emit('on-change', value);
};

const handleInput = (value) => {
  emit('on-input', value);
};
</script>

<template>
  <div class="custom-input-number">
    <InputNumber
      v-bind="$attrs"
      v-model="innerValue"
      @on-change="handleChange"
      @on-focus="$emit('on-focus', $event)"
      @on-blur="$emit('on-blur', $event)"
      @on-input="handleInput"
    />
    <span v-if="append" class="append">{{ append }}</span>
  </div>
</template>

<style scoped>
.custom-input-number {
  display: flex;
  align-items: center;
}

.append {
  margin-left: 4px;
  font-size: 12px;
  color: #606266;
}
</style>

