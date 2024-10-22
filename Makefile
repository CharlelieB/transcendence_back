all: up

run:
	docker-compose run backend django-admin startproject transcendence .

up:
	docker-compose up

back:
	docker-compose up backend db

#nginx:
#	docker-compose build nginx
#	docker-compose up nginx --no-deps

down:
	docker-compose down

.PHONY: run down up front
