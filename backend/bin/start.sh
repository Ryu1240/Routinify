#!/bin/bash
set -e

# データベースマイグレーション（Ridgepole）
echo "Running database migrations..."
bundle exec ridgepole --config ./config/database.yml --file ./db/Schemafile --apply

# Railsサーバーを起動
echo "Starting Rails server..."
exec bundle exec rails server -p ${PORT:-3000} -b 0.0.0.0

