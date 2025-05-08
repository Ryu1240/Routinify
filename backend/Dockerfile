# syntax=docker/dockerfile:1
# check=error=true

# This Dockerfile is designed for production, not development. Use with Kamal or build'n'run by hand:
# docker build -t app .
# docker run -d -p 80:80 -e RAILS_MASTER_KEY=<value from config/master.key> --name app app

# For a containerized dev environment, see Dev Containers: https://guides.rubyonrails.org/getting_started_with_devcontainer.html

# Make sure RUBY_VERSION matches the Ruby version in .ruby-version
FROM ruby:3.4.2

# 必要なパッケージのインストール
RUN apt-get update -qq && \
    apt-get install -y build-essential libpq-dev nodejs npm

# アプリケーションユーザーの作成
RUN groupadd -r -g 1000 app && \
    useradd -r -u 1000 -g app app && \
    mkdir -p /home/app && \
    chown -R app:app /home/app

WORKDIR /app

# Gemfileのコピーとインストール
COPY Gemfile* ./
RUN bundle install

# アプリケーションのコピー
COPY . .

# 権限の設定
RUN chown -R app:app /app && \
    mkdir -p /app/tmp/pids && \
    chown -R app:app /app/tmp

# アプリケーションユーザーに切り替え
USER app

# サーバーの起動
CMD ["bundle", "exec", "rails", "s", "-p", "3000", "-b", "0.0.0.0"]
