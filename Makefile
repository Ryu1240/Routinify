up u:
	docker compose up

up-d ud:
	docker compose up -d

down d:
	docker compose down -v

down-up du:
	docker compose down -v
	docker compose up

build-up bu:
	docker compose build
	docker compose up -d

ps p:
	docker compose ps

logs l:
	docker compose logs -f

build b:
	docker compose build

build-frontend bf:
	docker compose build frontend

build-backend bb:
	docker compose build backend

build-swagger-ui bs:
	docker compose build swagger-ui

restart r:
	docker compose restart

stop s:
	docker compose stop

rm r:
	docker compose rm -f

pull p:
	docker compose pull

exec-backend be:
	docker compose exec backend bash

exec-frontend fe:
	docker compose exec frontend bash

exec-swagger-ui se:
	docker compose exec swagger-ui bash

exec-db db:
	docker compose exec db bash

exec-redis r:
	docker compose exec redis bash

exec-rabbitmq rq:	

ridgepole-apply ra:
	docker compose exec backend bundle exec ridgepole --config ./config/database.yml --file ./db/Schemafile --apply

ridgepole-dry-run rr:
	docker compose exec backend bundle exec ridgepole --config ./config/database.yml --file ./db/Schemafile --apply --dry-run
