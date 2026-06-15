# homieGo-api

Backend de HomieGo (plataforma tipo Airbnb). API REST con Node.js, Express y PostgreSQL.

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Git

No es necesario instalar Node.js ni PostgreSQL en tu máquina si usas Docker.

## Configuración inicial

1. Clona el repositorio:

```bash
git clone https://github.com/Joseph321123/homieGo-api.git
cd homieGo-api
```

2. Crea tu archivo de entorno a partir de la plantilla:

```bash
copy .env.example .env
```

En macOS o Linux:

```bash
cp .env.example .env
```

3. Comparte el contenido de `.env` con tu compañera de forma privada (no subas `.env` a GitHub).

## Levantar el proyecto con Docker

```bash
docker compose up --build
```

Para ejecutarlo en segundo plano:

```bash
docker compose up --build -d
```

Servicios disponibles:

| Servicio   | URL                              |
|------------|----------------------------------|
| API        | http://localhost:3000            |
| Health     | http://localhost:3000/health     |
| PostgreSQL | localhost:5433 (usuario: homiego_user, BD: homiego_db) |

## Detener los contenedores

```bash
docker compose down
```

Para eliminar también los datos de la base de datos:

```bash
docker compose down -v
```

## Scripts npm (opcional, sin Docker)

Si prefieres correr la API directamente en tu máquina:

```bash
npm install
npm run dev
```

En ese caso necesitas Node.js 20+ y una base de datos PostgreSQL accesible. Puedes levantar solo la BD con Docker:

```bash
docker compose up -d postgres
```

Ajusta `.env` con `DB_HOST=localhost` y `DB_PORT=5433`.

## Base de datos

El esquema y los datos iniciales están en `database/`:

- `schema.sql` — tablas, relaciones e índices
- `seed.sql` — roles del sistema (huesped, anfitrion, admin)

Se aplican automáticamente la primera vez que se crea el contenedor de PostgreSQL.

Para reaplicar el esquema manualmente (por ejemplo, tras un `git pull` con cambios en la BD):

```bash
npm run db:init
```

## Trabajo en equipo

1. Los cambios de base de datos se versionan en `database/schema.sql` y `database/seed.sql`.
2. Haz commit y push de esos archivos a GitHub.
3. Tu compañera hace `git pull` y, si la estructura cambió, recrea la BD:

```bash
docker compose down -v
docker compose up --build
```

4. El frontend (`homieGo-web`) es un repositorio aparte. Debe estar corriendo la API antes de usar la aplicación web.

## Estructura del proyecto

```
homieGo-api/
├── database/          # Esquema y seeds de PostgreSQL
├── src/
│   ├── config/        # Conexión a la base de datos
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   └── services/
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

## Variables de entorno

| Variable      | Descripción                          |
|---------------|--------------------------------------|
| PORT          | Puerto de la API (default: 3000)     |
| DB_HOST       | Host de PostgreSQL                   |
| DB_PORT       | Puerto de PostgreSQL                 |
| DB_NAME       | Nombre de la base de datos           |
| DB_USER       | Usuario de PostgreSQL                |
| DB_PASSWORD   | Contraseña de PostgreSQL             |
