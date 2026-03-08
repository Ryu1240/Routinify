#!/bin/bash
set -e

export RAILS_ENV=${RAILS_ENV:-production}

# データベースマイグレーション（Ridgepole）
bundle exec ridgepole --config ./config/database.yml --env ${RAILS_ENV} --file ./db/Schemafile --apply

# 達成状況統計の移行バックフィル（achievement_statistics テーブル作成後の初回デプロイ用）
bundle exec rails runner "AchievementStatisticsBackfillJob.perform_now"

# Railsサーバーを起動
exec bundle exec rails server -p ${PORT:-3000} -b 0.0.0.0

