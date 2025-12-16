import Vue from 'vue';
import { INITIAL_CATEGORIES } from '@/prompt-core/constants';
import { deepClone, mergeTemplatesWithSystem, mergeBanksWithSystem } from '@/prompt-core/utils';

const LS_KEY = 'prompt-fill-v1';

// 加载持久化数据
const loadPersisted = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {};
  } catch (e) {
    return {};
  }
};

// 持久化数据
const persist = (state) => {
  localStorage.setItem(LS_KEY, JSON.stringify({
    templates: state.templates,
    banks: state.banks,
    defaults: state.defaults,
    categories: state.categories,
    selections: state.selections
  }));
};

// 初始化状态
const initState = () => {
  const persisted = loadPersisted();
  const { templates } = mergeTemplatesWithSystem(persisted.templates || []);
  const { banks, defaults } = mergeBanksWithSystem(persisted.banks || {}, persisted.defaults || {});
  
  return {
    templates,
    banks,
    defaults,
    categories: persisted.categories || deepClone(INITIAL_CATEGORIES),
    selections: persisted.selections || {} // { varKey: value }
  };
};

export default {
  namespaced: true,
  state: initState(),
  getters: {
    templateById: (s) => (id) => s.templates.find(t => t.id === id),
    bankById: (s) => (id) => s.banks[id],
    selection: (s) => (key) => s.selections[key]
  },
  mutations: {
    setTemplates(state, payload) {
      state.templates = payload;
      persist(state);
    },
    updateTemplateContent(state, { id, content }) {
      const t = state.templates.find(t => t.id === id);
      if (t) {
        t.content = content;
        persist(state);
      }
    },
    addTemplate(state, tpl) {
      state.templates.push(tpl);
      persist(state);
    },
    removeTemplate(state, id) {
      state.templates = state.templates.filter(t => t.id !== id);
      persist(state);
    },
    setBanks(state, banks) {
      state.banks = banks;
      persist(state);
    },
    upsertBank(state, { id, bank }) {
      Vue.set(state.banks, id, bank);
      persist(state);
    },
    deleteBank(state, id) {
      Vue.delete(state.banks, id);
      persist(state);
    },
    setSelections(state, selections) {
      state.selections = selections;
      persist(state);
    },
    setSelection(state, { key, value }) {
      Vue.set(state.selections, key, value);
      persist(state);
    },
    addCustomOption(state, { bankId, option }) {
      if (!state.banks[bankId]) {
        Vue.set(state.banks, bankId, { name: bankId, category: 'other', options: [] });
      }
      if (!state.banks[bankId].options.includes(option)) {
        state.banks[bankId].options.push(option);
      }
      persist(state);
    },
    setCategories(state, cats) {
      state.categories = cats;
      persist(state);
    }
  },
  actions: {
    refreshFromSystem({ state, commit }) {
      const { templates } = mergeTemplatesWithSystem(state.templates);
      const { banks, defaults } = mergeBanksWithSystem(state.banks, state.defaults);
      commit('setTemplates', templates);
      commit('setBanks', banks);
      commit('setSelections', state.selections); // keep selections
      state.defaults = defaults; // not reactive critical; adjust if needed
    },
    selectValue({ commit }, { varKey, value, bankId, createOption }) {
      if (createOption) {
        commit('addCustomOption', { bankId, option: value });
      }
      commit('setSelection', { key: varKey, value });
    }
  }
};
