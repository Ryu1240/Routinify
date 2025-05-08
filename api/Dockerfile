FROM node:18-alpine

WORKDIR /app

# package.jsonをコピーして依存関係をインストール
COPY package*.json ./
RUN npm install

# アプリケーションのソースコードをコピー
COPY . .

# 開発環境用の依存関係をインストール
RUN npm install

EXPOSE 8080

# 開発環境ではnodemonを使用
CMD ["npm", "run", "dev"] 