# Jenkins - Gestor de operaciones de integración continua

## 1. ¿Qué es Jenkins y para qué sirve en este proyecto?

Jenkins es un servidor de automatización de código abierto (open-source) líder en la industria para integración continua (CI) y entrega/despliegue continuo (CD). Permite definir, ejecutar y monitorizar pipelines que automatizan las tareas repetitivas del ciclo de vida del software: instalación de dependencias, test, análisis de calidad, construcción de imágenes y despliegue.

En este proyecto del **Grupo 14**, Jenkins actúa como el orquestador de la integración continua. Cada vez que se produce un cambio en el repositorio, Jenkins ejecuta automáticamente el pipeline definido en el `Jenkinsfile`:

1. Instala las dependencias del backend con pnpm.
2. Ejecuta el linter (ESLint) para garantizar calidad de código.
3. Ejecuta los tests con `node:test`.
4. Construye la imagen Docker del backend.

Esto asegura que el código que se integra cumple con los estándares mínimos de calidad y que la imagen Docker se construye correctamente antes de cualquier despliegue.

## 2. Requisitos de hardware y software

### Hardware (mínimo recomendado)

- CPU: 2 vCPU
- RAM: 2 GB (4 GB recomendado para ejecutar builds junto con Docker)
- Disco: 10 GB libres (imágenes, workspace de Jenkins, caché)

### Software

- Sistema operativo: Linux, macOS o Windows con Docker Desktop
- Docker Engine v24+ y Docker Compose v2+
- Acceso a internet (descarga de imágenes y plugins)
- Puerto 8080 libre (UI de Jenkins) y 50000 libre (comunicación con agentes)

## 3. Características clave de Jenkins aprovechadas en este proyecto

### Pipeline as Code

El pipeline se define en el archivo `Jenkinsfile` en la raíz del repositorio, usando sintaxis declarativa. Esto significa que la configuración de CI/CD vive junto al código, se versiona con Git y se revisa en pull requests. Cualquiera puede ver y modificar el pipeline sin entrar a la UI de Jenkins.

### Plugins

Jenkins tiene un ecosistema enorme de plugins. Para este proyecto se recomiendan:

- **Git Plugin**: integración con el repositorio Git.
- **Pipeline Plugin**: soporte para pipelines declarativos.
- **Docker Pipeline Plugin**: ejecución de pasos dentro de contenedores Docker.
- **GitHub Integration Plugin**: notificaciones vía webhook desde GitHub.
- **Configuration as Code (JCasC)**: configuración de Jenkins como código (opcional, para futura automatización).

### Agentes (Agents)

Jenkins soporta arquitectura controller-agent. El controller (nodo principal) gestiona la UI y orquesta los jobs; los agentes (nodos) ejecutan los builds. En este proyecto usamos un único nodo (el propio contenedor Jenkins, `agent any`), pero la arquitectura permite escalar añadiendo agentes para paralelizar builds o aislar entornos. El puerto 50000 está expuesto precisamente para la comunicación con agentes remotos.

### Docker-out-of-Docker (DooD)

El contenedor Jenkins monta el socket de Docker del host (`/var/run/docker.sock`) y tiene instalado el cliente Docker (`docker-ce-cli`). Esto permite que Jenkins ejecute comandos `docker build` usando el daemon del host, sin necesidad de un daemon Docker dentro del contenedor. Es el patrón "Docker-out-of-Docker": más seguro y eficiente que Docker-in-Docker.

### Build Triggers

Jenkins puede disparar builds automáticamente mediante:

- **Webhooks**: el repositorio (GitHub/GitLab) notifica a Jenkins en cada push (recomendado).
- **Polling SCM**: Jenkins revisa periódicamente el repositorio.
- **Multibranch Pipeline**: detecta automáticamente nuevas ramas y pull requests.

### Post-build actions

El pipeline define acciones post-build (`post { ... }`) que se ejecutan siempre, en éxito o en fallo, para registrar el resultado del build en los logs.

## 4. Integración de Jenkins con este proyecto

### Repositorio y Jenkinsfile

El pipeline vive en `Jenkinsfile` en la raíz del repositorio. Jenkins lee este archivo al ejecutar el job (modo "Pipeline script from SCM").

### Webhooks (recomendado)

Para que cada push dispare automáticamente el pipeline:

1. Configura el job en Jenkins como **Multibranch Pipeline** o **Pipeline** con origen Git.
2. En GitHub/GitLab, añade un webhook a `http://<host-jenkins>:8080/github-webhook/` (GitHub) o el equivalente de GitLab, disparado en eventos `push`.
3. En Jenkins, marca la opción "Build when a change is pushed to GitHub".

### Polling SCM (alternativa sin webhook)

Si no puedes exponer Jenkins a internet, configura polling con la expresión `H/5 * * * *` (revisa cada 5 minutos) en la configuración del job.

### Credenciales

Las credenciales (tokens de Git, secrets de Docker registry, etc.) se almacenan en **Jenkins Credentials** y se referencian en el pipeline con `credentials('id')` o `withCredentials([...])`.

## 5. Explicación del pipeline definido

El `Jenkinsfile` define un pipeline declarativo con las siguientes etapas:

| Etapa                   | Qué hace                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Checkout**            | Obtiene el código del repositorio (`checkout scm`). En jobs "Pipeline from SCM" es automático, pero se incluye de forma explícita para robustez.                                |
| **Install dependencies**| Entra a `backend/` y ejecuta `pnpm install --frozen-lockfile`, instalando dependencias exactas según el lockfile.                                                                |
| **Lint**                | Ejecuta `pnpm lint` (ESLint) para validar estilo y detectar errores de código.                                                                                                  |
| **Test**                | Ejecuta `pnpm test` (`node --test`) para correr los tests unitarios del backend.                                                                                                |
| **Build Docker image**  | Construye la imagen Docker del backend con `docker build -t grupo14/backend:$BUILD_NUMBER ./backend`, usando el socket Docker del host.                                         |
| **SAST (comentado)**    | Stage de análisis de seguridad estático (SAST), dejado comentado para integrar futuramente SonarQube o Semgrep.                                                                 |

El bloque `post` muestra el estado final del build (éxito/fallo) en los logs de Jenkins.

## 6. Comandos para levantar Jenkins con docker-compose

Jenkins está definido como servicio en `docker-compose.yml`:

```bash
# Levantar todos los servicios (backend, postgres, jenkins)
docker compose up -d --build

# Levantar solo Jenkins
docker compose up -d --build jenkins

# Ver logs de Jenkins
docker compose logs -f jenkins

# Detener Jenkins
docker compose stop jenkins

# Detener todo
docker compose down
```

Puertos expuestos:

- `8080`: interfaz web de Jenkins
- `50000`: comunicación con agentes

Volúmenes:

- `jenkins_data`: persiste la configuración, jobs, plugins y credenciales de Jenkins.
- `/var/run/docker.sock`: socket Docker del host para que Jenkins ejecute `docker build`.

## 7. Configuración de Jenkins después de levantarlo

### Primer login

1. Abre `http://localhost:8080` en el navegador.
2. Jenkins muestra la pantalla de desbloqueo. Obtén la contraseña inicial ejecutando:

   ```bash
   docker compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
   ```

3. Pega la contraseña y continúa.

### Plugins

- Selecciona **Install suggested plugins** (recomendado para empezar).
- Verifica que estén instalados: **Git**, **Pipeline**, **Docker Pipeline**, **GitHub Integration**.
- Puedes instalar plugins adicionales desde *Manage Jenkins > Plugins*.

### Crear usuario administrador

- Crea el primer usuario administrador (usuario, contraseña, nombre completo, email).

### Configurar credenciales (opcional)

- *Manage Jenkins > Credentials > System > Global credentials > Add*.
- Añade credenciales de Git (username/password o SSH key) si el repositorio es privado.
- Añade credenciales de Docker registry si vas a pushear imágenes.

### Crear el job (Pipeline)

1. *New Item* > nombra el job (ej. `grupo14-pipeline`) > selecciona **Pipeline** > OK.
2. En la sección **Pipeline**:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/JuanDiego-Arenas/integracion-continua.git` (o tu fork)
   - Branch: `*/main` (o la rama principal del proyecto)
   - Script Path: `Jenkinsfile`
3. Guarda y haz clic en **Build Now**.
4. Revisa la salida en **Console Output**.

Alternativa recomendada: crea un **Multibranch Pipeline** para que Jenkins detecte automáticamente todas las ramas y pull requests.

### Verificar que Docker funciona dentro de Jenkins

```bash
docker compose exec jenkins docker version
```

Si devuelve la versión del cliente y del servidor (host), el socket Docker está correctamente montado y Jenkins puede construir imágenes.

## 8. Consideraciones de seguridad

- **Cambiar la contraseña inicial**: nunca dejes la contraseña autogenerada como única credencial.
- **No ejecutar Jenkins como root en producción**: esta imagen usa el usuario `jenkins`. El socket Docker se monta con permisos limitados.
- **Gestionar credenciales con Jenkins Credentials**: nunca hardcodees secrets en el `Jenkinsfile` ni en el repositorio. Usa `withCredentials([...])`.
- **Restringir acceso a la UI**: en producción, coloca Jenkins detrás de un reverse proxy con HTTPS y autenticación (nginx + Let's Encrypt).
- **Permisos del socket Docker**: montar `/var/run/docker.sock` da a Jenkins acceso equivalente a root sobre el host. En producción, considera aislar el daemon o usar un agente dedicado.
- **Actualizar Jenkins y plugins**: aplica actualizaciones de seguridad con regularidad.
- **Backup del volumen `jenkins_data`**: haz copias periódicas para no perder jobs, credenciales e historial.
- **Variables de entorno**: el backend usa `.env.docker` con credenciales de PostgreSQL. En producción, usa secretos gestionados (Docker secrets, Vault, Jenkins Credentials) en lugar de archivos planos.
- **Network isolation**: los servicios están en la red `mi-red`. No expongas más puertos de los necesarios.
