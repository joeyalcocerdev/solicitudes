# Bloque 1 — Docker
## Infraestructura y Deploy: Docker + GitHub Actions

---

## Antes de empezar

Verifica que Docker esté instalado y funcionando:

```console
docker run hello-world
```

Si ves el mensaje `Hello from Docker!` estás listo.

### Si usas Windows

Docker en Windows requiere **WSL2** (Windows Subsystem for Linux). Sigue estos pasos antes de la clase:

**1. Verificar que WSL2 está instalado**

Abre PowerShell como administrador y ejecuta:

```console
wsl --version
```

Si no está instalado:

```console
wsl --install
```

Reinicia la máquina cuando termine.

**2. Instalar Docker Desktop**

Descárgalo desde [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop). Durante la instalación va a pedir habilitar WSL2 — acepta.

**3. Habilitar la integración con WSL2**

En Docker Desktop: Settings → Resources → WSL Integration → activa tu distribución de Linux (normalmente Ubuntu).

**4. Verificar desde WSL2**

Abre la terminal de Ubuntu (no PowerShell) y corre:

```console
docker run hello-world
```

Si ves `Hello from Docker!` estás listo.

> **Importante:** a partir de aquí, todos los comandos de la clase los corres desde la terminal de WSL2/Ubuntu, no desde PowerShell ni CMD. El comportamiento es idéntico al de Linux y Mac.

---

## 1. ¿Por qué existe Docker?

Imagina esta situación: terminas tu proyecto, funciona perfecto en tu máquina, lo mandas a producción y... no levanta. El servidor tiene una versión distinta de Node, le falta una librería, o el sistema operativo se comporta diferente.

**Docker resuelve esto empaquetando la aplicación junto con todo lo que necesita para correr** — el runtime, las dependencias, la configuración — en una unidad llamada contenedor. Si corre en tu máquina, corre en cualquier lado.

---

## 2. Imagen vs Contenedor

Esta es la distinción más importante de Docker:

- Una **imagen** es el molde — define qué hay dentro del contenedor (sistema operativo base, dependencias, código, configuración). Es inmutable, como una clase en OOP.
- Un **contenedor** es una instancia corriendo de esa imagen. Puedes tener muchos contenedores del mismo molde, cada uno con su propio estado.

```
imagen de MySQL  →  contenedor 1 (base de datos de la app A)
                 →  contenedor 2 (base de datos de la app B)
                 →  contenedor 3 (tu entorno local)
```

Los tres contenedores son independientes. Lo que pasa en uno no afecta a los otros.

---

## 3. Comandos básicos

### Correr un contenedor

```console
docker run alpine sh -c "echo 'hola' && sleep 60"
```

Esto descarga la imagen `alpine` (si no la tienes), crea un contenedor, ejecuta el comando y lo apaga.

> **¿Qué es Alpine?** Es una distribución de Linux ultra liviana (~5MB) muy popular en Docker por su tamaño pequeño. Puedes ver su imagen oficial en [hub.docker.com/_/alpine](https://hub.docker.com/_/alpine). Docker Hub es el registro público donde viven la mayoría de las imágenes base que usarás.

### Ver contenedores corriendo

```console
docker ps
```

Para ver también los que ya terminaron:

```console
docker ps -a
```

### Detener y eliminar

```console
docker stop <id-o-nombre>
docker rm <id-o-nombre>
```

### El flag `--rm`

Cuando solo necesitas correr algo una vez y no te importa el contenedor después:

```console
docker run --rm alpine echo "hola"
```

El contenedor se elimina automáticamente al terminar.

### Entrar a un contenedor

```console
docker run -it alpine sh
```

`-it` abre una terminal interactiva dentro del contenedor. Para salir: `exit`.

Para confirmar que estás dentro de un entorno diferente al de tu máquina:

```console
hostname           # muestra el ID del contenedor, no el nombre de tu computadora
cat /etc/os-release  # muestra "Alpine Linux" aunque tu máquina sea Mac o Windows
```

---

## 4. El "scratch space" — cada contenedor es independiente

Cada contenedor tiene su propio sistema de archivos. Los cambios que haces dentro de uno **no se ven en los demás**, aunque usen la misma imagen.

Pruébalo tú mismo:

```console
# Terminal 1 — crear un archivo en el primer contenedor
docker run -d --name c1 alpine sleep 999
docker exec c1 sh -c "echo 'hola' > /tmp/archivo.txt"
docker exec c1 cat /tmp/archivo.txt   # lo ves

# Terminal 2 — en el segundo contenedor no existe
docker run -d --name c2 alpine sleep 999
docker exec c2 cat /tmp/archivo.txt   # error: no existe
```

Limpieza:

```console
docker stop c1 c2
docker rm c1 c2
```

> **Implicación importante:** si escribes datos dentro de un contenedor (una base de datos, archivos subidos por usuarios) y el contenedor se elimina, esos datos desaparecen. Para persistirlos existen los **volúmenes**, que vemos más adelante.

---

## 5. Dockerfile

Un `Dockerfile` es el archivo que define cómo se construye una imagen. Es una lista de instrucciones que Docker ejecuta en orden.

### El proyecto de ejemplo

Vamos a construir un **contador de visitas**: una app Node.js que guarda el conteo en una base de datos Postgres.

Estructura del proyecto:

```
contador/
├── Dockerfile
├── .dockerignore
├── package.json
└── index.js
```

**`index.js`**

```javascript
const express = require('express')
const { Pool } = require('pg')

const app = express()
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS counter (
      id SERIAL PRIMARY KEY,
      visits INTEGER DEFAULT 0
    )
  `)
  await pool.query(`
    INSERT INTO counter (id, visits)
    VALUES (1, 0)
    ON CONFLICT (id) DO NOTHING
  `)
}

app.get('/', async (req, res) => {
  await pool.query('UPDATE counter SET visits = visits + 1 WHERE id = 1')
  const { rows } = await pool.query('SELECT visits FROM counter WHERE id = 1')
  res.send(`<h1>Visitas: ${rows[0].visits}</h1>`)
})

init().then(() => {
  app.listen(3000, () => console.log('App corriendo en puerto 3000'))
})
```

**`package.json`**

```json
{
  "name": "contador",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "pg": "^8.11.0"
  }
}
```

**`Dockerfile`**

```dockerfile
# Imagen base — Node 20 en Alpine (versión liviana de Linux)
FROM node:24-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar primero los archivos de dependencias
# (Docker cachea esta capa si package.json no cambió)
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Puerto que expone la app
EXPOSE 3000

# Comando que se ejecuta al iniciar el contenedor
CMD ["node", "index.js"]
```

**`.dockerignore`**

```
node_modules
.env
*.log
```

> El `.dockerignore` funciona igual que el `.gitignore` — le dice a Docker qué no copiar al construir la imagen. Sin esto, `node_modules` se copiaría innecesariamente.

### Construir y correr la imagen

```console
# Construir la imagen con el tag "contador"
docker build -t contador .

# Correr el contenedor
docker run -p 3000:3000 contador
```

El flag `-p 3000:3000` mapea el puerto 3000 del contenedor al puerto 3000 de tu máquina.

Si intentas correr la app sola con `docker run` va a fallar — no hay Postgres disponible. Eso lo resolvemos con Compose.

---

## 6. Docker Compose

La app necesita Postgres para funcionar. Compose nos permite definir ambos servicios en un archivo y levantarlos juntos con un solo comando.

### El archivo `compose.yaml`

Crea este archivo en la raíz del proyecto:

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://postgres:secret@db:5432/contador
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: contador
```

Tres conceptos nuevos aquí:

**`depends_on`** — la app no inicia hasta que el contenedor `db` esté corriendo.

**`environment`** — variables de entorno que el contenedor recibe al iniciar. La app las lee con `process.env.DATABASE_URL`.

**Red interna** — los contenedores del mismo Compose se comunican por el nombre del servicio. Por eso la URL usa `@db:5432` — `db` es el nombre del servicio, no un hostname externo.

### Levantar todo

```console
docker compose up -d --build
```

Abre `http://localhost:3000` — ahora sí funciona. Sube el contador algunas veces.

### Comandos útiles

```console
docker compose ps          # ver qué está corriendo
docker compose logs -f app # ver logs en tiempo real
docker compose down        # bajar todo
docker compose restart app # reiniciar un servicio específico
docker compose exec app sh # entrar al contenedor de la app
```

### El problema: los datos no persisten

Detén y vuelve a levantar:

```console
docker compose down
docker compose up -d
```

El contador se resetea a 1. `docker compose down` elimina los contenedores — incluyendo el de Postgres y todos los datos que tenía adentro.

### La solución: volúmenes

Agrega un volumen al servicio `db`:

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://postgres:secret@db:5432/contador
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: contador
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

Vuelve a levantar y prueba:

```console
docker compose down
docker compose up -d
```

Ahora el contador no se resetea. Postgres escribe en `/var/lib/postgresql/data` dentro del contenedor, pero ese directorio está montado en el volumen `db_data` fuera de él.

---

## 7. Agregar servicios al Compose

Agregar un nuevo servicio es tan simple como añadir una entrada al `compose.yaml`. Vamos a agregar Adminer — una interfaz web para inspeccionar la base de datos.

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://postgres:secret@db:5432/contador
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: contador
    volumes:
      - db_data:/var/lib/postgresql/data

  adminer:
    image: adminer
    ports:
      - "8080:8080"

volumes:
  db_data:
```

```console
docker compose up -d
```

Abre `http://localhost:8080` e ingresa:

Descrubre los valores tu mismo, estan en compose.yaml


Desde ahí puedes ver la tabla `counter` y los datos en tiempo real mientras subes el contador en la otra pestaña.

---

## 8. Dev vs Producción — una primera mirada



El compose que escribimos está bien para desarrollo. En producción hay algunas diferencias clave:

| | Desarrollo | Producción |
|---|---|---|
| Contraseñas | Pueden ir en el compose | Siempre en variables de entorno |
| Herramientas de debug | phpMyAdmin, etc. | No van |
| Restart automático | No necesario | `restart: unless-stopped` |
| Build target | Con sourcemaps, hot-reload | Optimizado, sin dev tools |

Las variables de entorno en producción se manejan con un archivo `.env` en el servidor — nunca commiteado al repositorio:

```yaml
# compose.yaml en producción
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - app_data:/app/data
    restart: unless-stopped

volumes:
  app_data:
```

El detalle completo de producción lo vemos en el Bloque 2.

---

## Resumen del Bloque 1

- **Imagen** = molde inmutable. **Contenedor** = instancia corriendo.
- Cada contenedor tiene su propio filesystem — los cambios no se comparten.
- El `Dockerfile` define cómo construir una imagen.
- `docker compose` orquesta múltiples contenedores con un solo comando.
- Los **volúmenes** persisten datos fuera del ciclo de vida del contenedor.
- El compose de desarrollo y el de producción son diferentes — principalmente en cómo se manejan las credenciales y las herramientas de debug.

---

*Bloque 2: GitHub Actions + Deploy →*
