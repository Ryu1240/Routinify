const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  devServer: {
    // Docker環境でのファイル監視を改善
    static: {
      directory: path.join(__dirname, 'public'),
      watch: {
        usePolling: process.env.CHOKIDAR_USEPOLLING === 'true',
        interval: 1000,
      },
    },
    // ホットリロードの設定
    hot: true,
    liveReload: true,
  },
};
