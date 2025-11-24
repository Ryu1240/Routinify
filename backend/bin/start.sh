#!/bin/bash
set -e

# 環境変数の確認（デバッグ用）
echo "Environment check:"
echo "RAILS_ENV: ${RAILS_ENV}"
echo "DATABASE_URL: ${DATABASE_URL:0:50}..." # 最初の50文字のみ表示（セキュリティのため）
echo "DATABASE_USERNAME: ${DATABASE_USERNAME}"
echo "PORT: ${PORT}"

# RAILS_ENVが設定されていない場合はproductionに設定
export RAILS_ENV=${RAILS_ENV:-production}

# データベースマイグレーション（Ridgepole）
echo "Running database migrations..."
echo "RAILS_ENV for Ridgepole: ${RAILS_ENV}"
echo "DATABASE_URL check: ${DATABASE_URL:+SET}" # SET または空文字列を表示

# Ridgepoleを実行（環境を明示的に指定）
# -E オプションでproduction環境を明示的に指定
bundle exec ridgepole --config ./config/database.yml -E production --file ./db/Schemafile --apply

# Railsサーバーを起動
echo "Starting Rails server..."
exec bundle exec rails server -p ${PORT:-3000} -b 0.0.0.0

