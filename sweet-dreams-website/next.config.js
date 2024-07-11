module.exports = {
    webpack: (config) => {
      config.externals = [...config.externals, { canvas: 'canvas' }];
      return config;
    },
  };