# Publicar tu imagen en GitHub Container Registry

En esta actividad vas a empaquetar tu app en una imagen Docker y publicarla en GitHub Container Registry (ghcr.io) para que pueda correr en cualquier servidor.

---

## Paso 1 — Crear un Personal Access Token en GitHub

1. Ve a https://github.com/settings/tokens/new
2. Dale un nombre: `docker-class`
3. En **Expiration** selecciona **Custom** y pon la fecha de mañana — el token solo lo necesitas hoy
4. Selecciona los scopes: `write:packages`, `read:packages`
5. Click en **Generate token**
6. **Copia el token ahora** — no lo podrás ver de nuevo

---

## Paso 2 — Login a ghcr.io

```console
docker login ghcr.io -u TU_USUARIO_GITHUB
```

Te pedirá el password — pega el token que copiaste. Si ves `Login Succeeded`, continúa.

---

## Paso 3 — Construir y subir la imagen

Desde la carpeta `contador/` donde tienes el `Dockerfile`:

**Mac (chip M1/M2/M3)**

```console
docker buildx build --platform linux/amd64 -t ghcr.io/TU_USUARIO_GITHUB/contador:latest .
docker push ghcr.io/TU_USUARIO_GITHUB/contador:latest
```

El flag `--platform linux/amd64` es necesario porque tu Mac usa arquitectura ARM y los servidores en la nube son Intel/AMD. Sin este flag la imagen no correría en el servidor.

**Windows (desde la terminal de WSL2/Ubuntu, no desde PowerShell)**

```console
docker buildx build --platform linux/amd64 -t ghcr.io/TU_USUARIO_GITHUB/contador:latest .
docker push ghcr.io/TU_USUARIO_GITHUB/contador:latest
```

Asegúrate de correr los comandos desde la terminal de Ubuntu, no desde PowerShell ni CMD.

**Linux**

```console
docker build -t ghcr.io/TU_USUARIO_GITHUB/contador:latest .
docker push ghcr.io/TU_USUARIO_GITHUB/contador:latest
```

En Linux nativo el build ya produce una imagen AMD64, no necesitas el flag de plataforma.

Verás las capas subiendo. Al terminar aparece el digest de la imagen.

---

## Paso 4 — Verificar

Ve a `github.com/TU_USUARIO_GITHUB` → pestaña **Packages** y confirma que aparece `contador`.

---

## Información extra — Si quisieras repetirlo en tu propio servidor

Para correr esta imagen en un VPS necesitas:

- Un servidor Linux con Docker instalado (Ubuntu + Docker CE desde el marketplace de Hetzner, DigitalOcean, etc.)
- Puerto 80 abierto en el firewall del proveedor
- El siguiente `compose.yaml` en el servidor:

```yaml
services:
  app:
    image: ghcr.io/TU_USUARIO_GITHUB/contador:latest
    ports:
      - "80:3000"
    environment:
      - DATABASE_URL=postgres://postgres:secret@db:5432/contador
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: contador
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 15s
      timeout: 10s
      retries: 5
    volumes:
      - db_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  db_data:
```

El `healthcheck` hace que la app espere a que Postgres esté listo antes de iniciar — sin esto la app puede arrancar antes que la base de datos y fallar.

Para que el servidor pueda jalar tu imagen, esta debe ser pública. Puedes cambiar la visibilidad en **github.com/TU_USUARIO_GITHUB → Packages → contador → Package settings → Change visibility → Public**.

Levantar la app:

```console
docker compose up -d
```

Tu app estará disponible en `http://IP_DEL_SERVIDOR`.
