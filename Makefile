up u:
	docker compose up -d

down d:
	docker compose down

down-up du:
	docker compose down
	docker compose up -d

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

exec e:
	docker compose exec $(service) sh

