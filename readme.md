## Setup the app

Don't forget to add a .env.db and .env.backend (see example .env.db.example and .env.backend.example at the root)

## Create a new app

```
docker-compose run backend python manage.py startapp your_app
```

## Save db in file.json

```
docker-compose run backend python manage.py dumpdata > save_data.json
```

## Load save db file.jon after migration

```
docker-compose run backend python manage.py loaddata save_data.json
```
