# integracion-continua

Proyecto de integración continua del **Grupo 14** - Politécnico Grancolombiano.

Backend Node.js (Express 5 + PostgreSQL 16) dockerizado con Docker Compose, con pipeline CI/CD gestionado por Jenkins.

## Integrantes

- Orjuela Bonilla Camilo Esteban
- Nicolas Felipe Quevedo Montaño
- Juan Diego Arenas Cuellar
- Joan Villamarin Urrutia
- Ronald Charari Parra

## Descripción del proyecto

API REST construida con **Node 24**, **Express 5** y **PostgreSQL 16**. Expone un endpoint de verificación de salud (`GET /api/health`) y se conecta a PostgreSQL. El proyecto está completamente dockerizado y orquestado con Docker Compose, e incluye **Jenkins** como servidor de integración continua que ejecuta un pipeline declarativo (lint, test, build) sobre cada cambio del repositorio.

Stack:

- Node.js 24 + pnpm (ESM)
- Express 5
- PostgreSQL 16
- Docker + Docker Compose
- Jenkins LTS (JDK 17)

## Prerrequisitos

- Docker Desktop (o Docker Engine + Docker Compose) v24+
- Git
- (Opcional, para desarrollo local) Node.js 24 y pnpm vía corepack

## Cómo ejecutar con docker-compose

1. Copia el archivo de variables de entorno del backend:

   ```bash
   cp backend/example.env.docker backend/.env.docker
   ```

2. Levanta los servicios (backend + postgres):

   ```bash
   docker compose up -d --build
   ```

3. Verifica el endpoint de salud:

   ```bash
   curl http://localhost:3000/api/health
   ```

4. Detén los servicios:

   ```bash
   docker compose down
   ```

## Cómo levantar Jenkins

Jenkins se incluye como un servicio más en `docker-compose.yml`. Para levantarlo junto al resto:

```bash
docker compose up -d --build
```

Jenkins queda disponible en `http://localhost:8080`. La guía completa de configuración (primer login, plugins, credenciales, creación del job y explicación del pipeline) está en [docs/JENKINS.md](docs/JENKINS.md).

## Estructura del proyecto

```
integracion-continua/
├── backend/
│   ├── Dockerfile
│   ├── eslint.config.js
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── example.env
│   ├── example.env.docker
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   └── health.controller.js
│   │   └── routes/
│   │       └── index.routes.js
│   └── tests/
│       └── health.test.js
├── docs/
│   └── JENKINS.md
├── jenkins/
│   └── Dockerfile
├── docker-compose.yml
├── Jenkinsfile
├── README.md
└── .dockerignore
```

## Scripts del backend

| Script        | Descripción                                              |
| ------------- | -------------------------------------------------------- |
| `pnpm dev`    | Inicia el servidor con nodemon (recarga en caliente)     |
| `pnpm start`  | Inicia el servidor en modo producción                    |
| `pnpm lint`   | Ejecuta ESLint sobre el código                           |
| `pnpm test`   | Ejecuta los tests con `node:test`                        |
