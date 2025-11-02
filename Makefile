# 基本コマンド
.PHONY: build b build-frontend bf build-backend bb build-swagger-ui bs \
        up u up-d ud down d down-up du clean \
        ps p logs l restart r stop s rm rmf \
        exec-backend be exec-frontend fe exec-swagger-ui se exec-db db \
        ridgepole-apply ra ridgepole-dry-run rr help

# ビルド関連
build b: ## 全サービスを並列ビルド
	docker compose build --parallel

build-no-cache bnc: ## 全サービスを並列ビルド
	docker compose build --parallel --no-cache

build-frontend bf: ## フロントエンドのみビルド
	docker compose build frontend

build-backend bb: ## バックエンドのみビルド
	docker compose build backend

build-swagger-ui bs: ## Swagger UIのみビルド
	docker compose build swagger-ui

# 起動・停止関連
up u: ## 全サービスを並列ビルドして起動
	docker compose up --build

up-d ud: ## 全サービスをバックグラウンドで起動
	docker compose up -d

down d: ## 全サービスを停止
	docker compose down

down-up du: ## 全サービスを再起動
	docker compose down -v
	docker compose up

# コンテナ操作
ps p: ## コンテナの状態確認
	docker compose ps

logs l: ## ログの表示
	docker compose logs -f

restart r: ## 全サービスを再起動
	docker compose restart

stop s: ## 全サービスを停止
	docker compose stop

rm rmf: ## 全コンテナを削除
	docker compose rm -f

# クリーンアップ
clean: ## キャッシュを含めた完全なクリーンアップ
	docker compose down -v
	docker system prune -f

# コンテナ内での操作
exec-backend be: ## バックエンドコンテナに入る
	docker compose exec backend bash

exec-frontend fe: ## フロントエンドコンテナに入る
	docker compose exec frontend bash

exec-swagger-ui se: ## Swagger UIコンテナに入る
	docker compose exec swagger-ui bash

exec-db db: ## データベースコンテナに入る
	docker compose exec db bash

# データベース操作
ridgepole-apply ra: ## データベーススキーマを適用（開発環境）
	docker compose exec backend bundle exec ridgepole --config ./config/database.yml --file ./db/Schemafile --apply
	docker compose exec backend bundle exec rails db:schema:dump

ridgepole-dry-run rr: ## データベーススキーマの変更を確認
	docker compose exec backend bundle exec ridgepole --config ./config/database.yml --file ./db/Schemafile --apply --dry-run

ridgepole-test-apply rta: ## テスト環境のデータベーススキーマを適用
	RAILS_ENV=test docker compose exec backend sh -c 'cd /app && bundle exec ridgepole --config ./config/database.yml --file ./db/Schemafile --apply'
	RAILS_ENV=development docker compose exec backend bundle exec rails db:schema:dump

test-db-cleanup: ## テストデータベースをクリーンアップ（スキーマ再構築）
	RAILS_ENV=test docker compose exec backend sh -c 'cd /app && bundle exec ridgepole --config ./config/database.yml --file ./db/Schemafile --apply'
	RAILS_ENV=development docker compose exec backend bundle exec rails db:schema:dump

test-db-reset: ## テストデータベースを完全にリセット（データベース削除→作成→スキーマ適用）
	RAILS_ENV=test docker compose exec backend bundle exec rails db:reset || true
	RAILS_ENV=test docker compose exec backend sh -c 'cd /app && bundle exec ridgepole --config ./config/database.yml --file ./db/Schemafile --apply'
	RAILS_ENV=development docker compose exec backend bundle exec rails db:schema:dump

seed: ## シードデータを生成
	docker compose exec backend bundle exec rails db:seed

seed-reset: ## 既存データを削除してからシードデータを生成（開発環境・テスト環境のみ）
	docker compose exec backend bundle exec rails db:seed:reset

seed-cleanup: ## シードデータを削除（開発環境・テスト環境のみ）
	docker compose exec backend bundle exec rails db:seed:cleanup

seed-batch-generation: ## バッチタスク生成テスト用の大量データを作成
	docker compose exec backend bundle exec rails db:seed:batch_generation

# ヘルプ表示
help: ## このヘルプを表示
	@echo "使用可能なコマンド:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

	@echo "使用可能なコマンド:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Testing commands
test-backend:
	docker-compose exec backend bundle exec rspec

test-frontend:
	docker-compose exec frontend pnpm test:run

test-all: test-backend test-frontend

# Test with coverage
test-backend-coverage:
	docker-compose exec backend bundle exec rspec --format documentation

test-frontend-coverage:
	docker-compose exec frontend pnpm test:run --coverage

# Linting and security checks
lint-backend:
	docker-compose exec backend bundle exec rubocop

lint-backend-fix:
	docker-compose exec backend bundle exec rubocop --auto-correct

lint-backend-check:
	docker-compose exec backend bundle exec rubocop --format progress --format offenses

lint-frontend:
	docker-compose exec frontend pnpm format:check

lint-frontend-fix:
	docker-compose exec frontend pnpm format

lint-frontend-check:
	docker-compose exec frontend pnpm format:check

security-check:
	docker-compose exec backend bundle exec brakeman

# Type checking
type-check:
	docker-compose exec frontend pnpm tsc --noEmit

# Code formatting
format-backend:
	docker-compose exec backend bundle exec rubocop --autocorrect-all

format-frontend: lint-frontend-fix
format-all: format-backend format-frontend

# CI/CD compatible commands (same as GitHub Actions)
ci-backend-test:
	docker-compose exec backend bundle exec rspec --format progress --format documentation

ci-backend-lint:
	docker-compose exec backend bundle exec rubocop --format progress --format offenses

ci-backend-security:
	docker-compose exec backend bundle exec brakeman --no-progress --format text --format json -o backend/brakeman-report.json

ci-frontend-test:
	docker-compose exec frontend pnpm test:run

ci-frontend-type-check:
	docker-compose exec frontend pnpm tsc --noEmit

ci-frontend-format:
	docker-compose exec frontend pnpm format:check
	docker-compose exec frontend pnpm format

# Run all CI checks
ci-all: ci-backend-test ci-backend-lint ci-backend-security ci-frontend-test ci-frontend-type-check ci-frontend-format
