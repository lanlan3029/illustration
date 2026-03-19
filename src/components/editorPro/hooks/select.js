/*
 * @Description: 通用属性 hook（纯 JS，不依赖 @kuaitu-core/core）
 */
import { inject, computed, reactive, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

// 与 src/kuaitu-core/core/eventType.ts 保持一致
const SelectMode = { EMPTY: '', ONE: 'one', MULTI: 'multiple' };
const SelectEvent = {
  ONE: 'selectOne',
  MULTI: 'selectMultiple',
  CANCEL: 'selectCancel',
};

// 对同一个 canvasEditor 只注册一次监听，避免右侧大量组件重复监听导致内存/性能问题
const editorStateMap = new WeakMap();

export default function useSelect(matchType) {
  const { t } = useI18n();
  const fabric = inject('fabric');
  const canvasEditor = inject('canvasEditor');
  // 给 canvas 注入提供一个默认值，避免某些使用场景下未 provide 时出现警告
  const canvas = inject('canvas', null);

  const shared =
    canvasEditor && editorStateMap.get(canvasEditor)
      ? editorStateMap.get(canvasEditor)
      : null;

  const state =
    shared?.state ||
    reactive({
      mSelectMode: SelectMode.EMPTY,
      mSelectOneType: '',
      mSelectId: '',
      mSelectIds: [],
      mSelectActive: [],
    });

  let callBack = function () {};

  function selectOne(arr) {
    state.mSelectMode = SelectMode.ONE;
    var item = arr && arr[0];
    if (item) {
      state.mSelectActive = [item];
      state.mSelectId = item.id != null ? item.id : '';
      state.mSelectOneType = item.type || '';
      state.mSelectIds = [state.mSelectId];
    }
    callBack();
  }

  function selectMulti(arr) {
    state.mSelectMode = SelectMode.MULTI;
    state.mSelectId = '';
    state.mSelectIds = (arr || []).map(function (item) {
      return item.id != null ? item.id : '';
    });
    state.mSelectActive = arr || [];
    callBack();
  }

  function selectCancel() {
    state.mSelectId = '';
    state.mSelectIds = [];
    state.mSelectMode = SelectMode.EMPTY;
    state.mSelectOneType = '';
    state.mSelectActive = [];
    callBack();
  }

  function getObjectAttr(cb) {
    callBack = cb || function () {};
  }

  function syncFromCanvas() {
    if (!canvas) return;
    var active = canvas.getActiveObjects();
    if (!active || active.length === 0) {
      selectCancel();
      return;
    }
    if (active.length === 1) selectOne(active);
    else selectMulti(active);
  }

  onMounted(function () {
    if (canvasEditor && typeof canvasEditor.on === 'function') {
      // 首次：注册监听并放入 WeakMap
      if (!editorStateMap.get(canvasEditor)) {
        canvasEditor.on(SelectEvent.ONE, selectOne);
        canvasEditor.on(SelectEvent.MULTI, selectMulti);
        canvasEditor.on(SelectEvent.CANCEL, selectCancel);
        editorStateMap.set(canvasEditor, { state, selectOne, selectMulti, selectCancel });
      }
    } else if (canvas && typeof canvas.on === 'function') {
      // 兜底：直接监听 fabric canvas（避免未注入 canvasEditor 时失效）
      canvas.on('selection:created', syncFromCanvas);
      canvas.on('selection:updated', syncFromCanvas);
      canvas.on('selection:cleared', selectCancel);
      syncFromCanvas();
    }
  });

  onBeforeUnmount(function () {
    // 注意：这里不 off canvasEditor 事件（共享监听），否则会影响仍挂载的其他面板组件
    // 对于 fabric canvas 的兜底监听，仍然正常卸载
    if (canvas && typeof canvas.off === 'function') {
      canvas.off('selection:created', syncFromCanvas);
      canvas.off('selection:updated', syncFromCanvas);
      canvas.off('selection:cleared', selectCancel);
    }
  });

  var isOne = computed(function () {
    return state.mSelectMode === SelectMode.ONE;
  });
  var isMultiple = computed(function () {
    return state.mSelectMode === SelectMode.MULTI;
  });
  var isGroup = computed(function () {
    return state.mSelectMode === SelectMode.ONE && state.mSelectOneType === 'group';
  });
  var isSelect = computed(function () {
    return state.mSelectMode;
  });
  var selectType = computed(function () {
    return state.mSelectOneType;
  });
  var isMatchType = matchType
    ? computed(function () {
        return matchType.includes(state.mSelectOneType);
      })
    : undefined;
  function matchTypeHander(types) {
    return computed(function () {
      return types.includes(state.mSelectOneType);
    });
  }

  return {
    fabric,
    canvasEditor: canvasEditor || (canvas ? { canvas } : null),
    mixinState: state,
    selectType,
    isSelect,
    isGroup,
    isOne,
    isMultiple,
    isMatchType,
    matchTypeHander,
    getObjectAttr,
    t,
  };
}
