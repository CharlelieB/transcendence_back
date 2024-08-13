all: up

run:
	docker compose run backend django-admin startproject transcendence .

up:
	docker compose up

back:
	docker compose up backend db

front:
	docker-compose build frontend
	docker-compose up frontend --no-deps

down:
	docker compose down

.PHONY: run down up front
