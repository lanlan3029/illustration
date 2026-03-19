/**
 * Stub for @/language when building core package in isolation.
 * Main app provides real i18n at runtime via workspace.
 */
export default {
  global: {
    t: (key: string) => key,
  },
};
