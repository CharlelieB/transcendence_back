all: up

run:
	docker compose run backend django-admin startproject transcendence .

up:
	docker compose up

down:
	docker compose down

.PHONY: run down up
