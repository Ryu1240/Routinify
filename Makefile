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
ridgepole-apply ra: ## データベーススキーマを適用
	docker compose exec backend bundle exec ridgepole --config ./config/database.yml --file ./db/Schemafile --apply

ridgepole-dry-run rr: ## データベーススキーマの変更を確認
	docker compose exec backend bundle exec ridgepole --config ./config/database.yml --file ./db/Schemafile --apply --dry-run

# ヘルプ表示
help: ## このヘルプを表示
	@echo "使用可能なコマンド:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

	@echo "使用可能なコマンド:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
