module.exports = function (api) {
  api.cache(true);
  return {
    // zustand's ESM build reads `import.meta.env`, which a classic <script> web bundle rejects.
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
  };
};
