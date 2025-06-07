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
    apt-get install -y build-essential libpq-dev

WORKDIR /app

# GemfileとGemfile.lockだけを先にコピーしてbundle install
COPY Gemfile Gemfile.lock ./
RUN bundle install

# アプリケーションの全ファイルをコピー
COPY . .

# tmp/pidsディレクトリの作成
RUN mkdir -p /app/tmp/pids

# USER切り替え（必要なら）
# USER app

CMD ["bundle", "exec", "rails", "s", "-p", "3000", "-b", "0.0.0.0"]
