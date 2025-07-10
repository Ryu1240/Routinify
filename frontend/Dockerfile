FROM node:20

# pnpmをグローバルインストール
RUN npm install -g pnpm

# 作業ディレクトリの作成
WORKDIR /app

# node_modulesと.cacheディレクトリの作成と権限設定
RUN mkdir -p /app/node_modules/.cache && \
    chown -R node:node /app

# 非rootユーザーに切り替え
USER node

# パッケージのインストール
COPY --chown=node:node package.json pnpm-lock.yaml ./
RUN pnpm install

# アプリケーションのコピー
COPY --chown=node:node . .

# .cacheディレクトリの権限を再確認
RUN mkdir -p /app/node_modules/.cache && \
    chmod -R 755 /app/node_modules/.cache

EXPOSE 3000

# デフォルトコマンド
CMD ["pnpm", "start"] 