module.exports = {
  publicPath: process.env.VUE_APP_PATH,
  outputDir: "dist" + process.env.VUE_APP_PATH,
  transpileDependencies: ["vuetify"],
};
