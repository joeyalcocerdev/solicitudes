# Práctica 14 — Error handling centralizado

**Objetivo:** Entender el problema de los `try/catch` dispersos y refactorizar el proyecto para que todos los errores pasen por un único middleware de error en Express.

**Archivos a modificar:** `server/src/app.js`, `server/src/middleware/validate.js`, `server/src/controllers/requests.controller.js`  
**Archivos a crear:** `server/src/middleware/errorHandler.js`

---

## Contexto

Abre cualquier controller del proyecto y busca los bloques `catch`. Todos se ven así:

```js
} catch (err) {
  res.status(500).json({ error: 'Error interno del servidor' })
}
```

Hay dos problemas con esto:

1. **Está disperso.** Si quieres cambiar cómo se formatean los errores, o agregar logging, tienes que tocar cada controller.
2. **Pierde información.** El `err` que llega al `catch` se ignora completamente — nunca se loguea, nunca se inspecciona.

Express tiene un mecanismo diseñado exactamente para esto: un middleware de error con cuatro argumentos que captura cualquier error que llegue vía `next(err)`.

---

## Parte 1: Entender cómo funciona `next(err)`

En Express, cuando un middleware llama `next()` sin argumentos, pasa al siguiente middleware normal. Cuando llama `next(err)` con cualquier valor, Express salta todos los middlewares normales y busca el primero que tenga exactamente cuatro parámetros: `(err, req, res, next)`.

Responde antes de continuar:
1. ¿Qué diferencia hay entre `next()` y `next(err)`?
2. ¿Por qué el middleware de error debe estar registrado **después** de todas las rutas en `app.js`?

---

## Parte 2: Crear el middleware de error

Crea el archivo `server/src/middleware/errorHandler.js`:

```js
const { ZodError } = require('zod')

function errorHandler(err, req, res, next) {
  console.error(err)

  if (err instanceof ZodError) {
    return res.status(400).json({ errors: err.flatten().fieldErrors })
  }

  res.status(500).json({ error: 'Error interno del servidor' })
}

module.exports = { errorHandler }
```

Por ahora maneja dos casos: errores de Zod (400) y cualquier otra cosa (500). El `console.error(err)` asegura que todo error quede visible en los logs del servidor.

---

## Parte 3: Registrarlo en `app.js`

Abre `server/src/app.js` e importa y registra el middleware **al final**, después de todas las rutas:

```js
const { errorHandler } = require('./middleware/errorHandler')

// ... rutas existentes ...

app.use(errorHandler)

module.exports = app
```

El orden importa: si lo registras antes de las rutas, nunca recibe nada.

---

## Parte 4: Refactorizar `requests.controller.js`

Ahora los `catch` deben dejar de responder ellos mismos y pasarle el error al handler. Abre `server/src/controllers/requests.controller.js` y cambia cada bloque `catch`:

```js
// Antes
} catch (err) {
  res.status(500).json({ error: 'Error interno del servidor' })
}

// Después
} catch (err) {
  next(err)
}
```

Para que `next` esté disponible en cada función, agrégalo como tercer parámetro:

```js
// Antes
async function getAll(req, res) {

// Después
async function getAll(req, res, next) {
```

Haz el cambio en todas las funciones del controller.

---

## Parte 5: Integrar Zod con el error handler

Ahora que el error handler ya sabe manejar `ZodError`, el middleware `validate` puede simplificarse. En lugar de responder directamente cuando falla, puede pasarle el error a `next`:

Abre `server/src/middleware/validate.js` y cámbialo:

```js
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    return next(result.error)
  }
  req.body = result.data
  next()
}

module.exports = { validate }
```

Ahora `validate` no sabe nada de códigos HTTP — solo valida y delega. El error handler es el único lugar que decide cómo responder a un `ZodError`.

Responde:
1. ¿Qué ventaja tiene que `validate` no responda directamente?
2. ¿Qué pasaría si registras el `errorHandler` antes de las rutas?

---

## Parte 6: Verificar que funciona

Prueba el caso de error de validación desde DevTools → Console:

```js
// Debe devolver 400 con errores por campo (igual que antes)
fetch('http://localhost:3000/api/requests', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: '', description: 'sin área' })
})
.then(r => r.json())
.then(console.log)
```

Verifica también que el servidor imprime el error en consola cuando ocurre un error interno — puedes forzarlo temporalmente lanzando un error en algún controller:

```js
async function getAll(req, res, next) {
  throw new Error('error de prueba')
  // ...
}
```

El cliente debe recibir `{ error: 'Error interno del servidor' }` y la terminal del servidor debe mostrar el stack trace completo.

---

## Parte 7: Aplicar a otro controller (por tu cuenta)

Refactoriza `areas.controller.js` de la misma forma: agrega `next` a cada función y reemplaza los `catch` para que llamen `next(err)`.

---

## Dato extra — Errores con código HTTP propio

Una vez que tienes el error handler centralizado, puedes crear clases de error personalizadas para comunicar códigos HTTP específicos sin tocar el handler cada vez.

Crea `server/src/errors/AppError.js`:

```js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflicto') {
    super(message, 409)
  }
}

class NotFoundError extends AppError {
  constructor(message = 'No encontrado') {
    super(message, 404)
  }
}

module.exports = { AppError, ConflictError, NotFoundError }
```

En el controller lanzas la clase que corresponde y el `catch` lo pasa con `next(err)` como siempre:

```js
const { ConflictError } = require('../errors/AppError')

throw new ConflictError('No se puede aprobar una solicitud cancelada')
```

Y en `errorHandler.js` agregas un caso antes del 500 genérico:

```js
const { AppError } = require('../errors/AppError')

function errorHandler(err, req, res, next) {
  console.error(err)

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message })
  }

  if (err instanceof ZodError) {
    return res.status(400).json({ errors: err.flatten().fieldErrors })
  }

  res.status(500).json({ error: 'Error interno del servidor' })
}
```

---

## Referencias

- [Express: Error handling](https://expressjs.com/en/guide/error-handling.html) — cómo funciona el middleware de error y el pipeline de `next(err)`

---

## Requisitos de entrega

1. Existe `server/src/middleware/errorHandler.js` con el middleware de cuatro argumentos.
2. El `errorHandler` está registrado al final de `app.js`, después de todas las rutas.
3. Todos los `catch` de `requests.controller.js` llaman `next(err)` en lugar de responder directamente.
4. `validate.js` llama `next(result.error)` en lugar de `res.status(400).json(...)`.
5. `POST /api/requests` con body inválido sigue devolviendo `400` con errores por campo.
6. Cuando ocurre un error interno, el stack trace aparece en la consola del servidor.
7. `areas.controller.js` también usa `next(err)` en sus `catch`.
