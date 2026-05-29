# Práctica 13 — Validación con Zod

**Objetivo:** Entender por qué la validación debe vivir en el servidor, agregar Zod al proyecto y usarlo para validar el cuerpo de las rutas de solicitudes a través de un middleware reutilizable.

**Archivos a modificar:** `server/src/controllers/requests.controller.js`, `server/src/routes/requests.routes.js`  
**Archivos a crear:** `server/src/schemas/requests.schema.js`, `server/src/middleware/validate.js`

---

## Contexto

El controller `requests.controller.js` tiene esta línea en `create`:

```js
if (!title || !area_id) return res.status(400).json({ error: 'Título y área son requeridos' })
```

Y `update` no tiene ninguna validación. El problema no es solo que es incompleto — es que la validación está mezclada con la lógica del controller. Si mañana agregas un campo obligatorio, tienes que recordar actualizar esa condición manual.

Zod separa la responsabilidad: el schema declara qué forma debe tener el body, y un middleware se encarga de rechazar lo que no cumple antes de que el controller siquiera se ejecute.

> El middleware `validate` resuelve los errores de validación, pero los `catch` en los controllers siguen respondiendo cada uno por su cuenta con `res.status(500)`. Eso lo resolvemos en la próxima práctica con un middleware de error centralizado en Express.

---

## Parte 1 — Instalar Zod

```bash
cd server
npm install zod
```

Verifica que aparece en `dependencies` de `server/package.json`.

---

## Parte 2 — Entender `parse` vs `safeParse`

Antes de escribir código, abre una terminal y prueba Zod directamente con Node:

```bash
node
```

```js
const { z } = require('zod')

const schema = z.object({
  title: z.string().min(1),
  area_id: z.number().int(),
})

// parse lanza una excepción si falla
schema.parse({ title: '', area_id: 2 })

// safeParse nunca lanza — devuelve { success, data } o { success, error }
const result = schema.safeParse({ title: 'Mi solicitud', area_id: 'abc' })
console.log(result.success)
console.log(result.error.flatten().fieldErrors)
```

Responde:
1. ¿Qué devuelve `result.error.flatten().fieldErrors`? ¿Cómo está estructurado?
2. ¿Por qué en un middleware de Express conviene usar `safeParse` en lugar de `parse`?

---

## Parte 3 — Crear el schema

Crea el archivo `server/src/schemas/requests.schema.js`:

```js
const { z } = require('zod')

const createRequestSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  area_id: z.number().int(),
  category_id: z.number().int().optional(),
})

const updateRequestSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  area_id: z.number().int().optional(),
  category_id: z.number().int().optional(),
})

module.exports = { createRequestSchema, updateRequestSchema }
```

Fíjate que `updateRequestSchema` tiene todos los campos como `optional()` — en un `PUT` el cliente puede enviar solo los campos que quiere cambiar.

---

## Parte 4 — Crear el middleware `validate`

Crea el archivo `server/src/middleware/validate.js`:

```js
const { ZodError } = require('zod')

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors })
  }
  req.body = result.data
  next()
}

module.exports = { validate }
```

`validate` es una función que recibe un schema y devuelve un middleware — el mismo patrón que `checkRole` de la práctica anterior. Se usa en la ruta así:

```js
router.post('/', isAuthenticated, validate(createRequestSchema), create)
```

Responde:
1. ¿Por qué la función hace `req.body = result.data` antes de llamar a `next()`?
2. ¿Qué pasa si el body tiene un campo extra que no está en el schema, como `{ title: 'x', area_id: 1, hack: true }`?

> Pista para la segunda: prueba `schema.parse({ title: 'x', area_id: 1, hack: true })` en Node y observa qué devuelve `result`.

---

## Parte 5 — Conectar todo en la ruta

Abre `server/src/routes/requests.routes.js` y agrega el middleware a `POST` y `PUT`:

```js
const { validate } = require('../middleware/validate')
const { createRequestSchema, updateRequestSchema } = require('../schemas/requests.schema')

router.post('/', isAuthenticated, validate(createRequestSchema), create)
router.put('/:id', isAuthenticated, validate(updateRequestSchema), update)
```

Luego abre `server/src/controllers/requests.controller.js` y elimina la validación manual de `create` — ya no es necesaria:

```js
// Eliminar esta línea:
if (!title || !area_id) return res.status(400).json({ error: 'Título y área son requeridos' })
```

---

## Parte 6 — Verificar que funciona

Prueba desde el browser con DevTools → Console:

```js
// Debe devolver 400 con errores por campo
fetch('http://localhost:3000/api/requests', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: '', description: 'sin área' })
})
.then(r => r.json())
.then(console.log)
```

Debes recibir algo como:

```json
{
  "errors": {
    "title": ["El título es requerido"],
    "area_id": ["Invalid input"]
  }
}
```

```js
// Debe crear la solicitud correctamente
fetch('http://localhost:3000/api/requests', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Mi solicitud', area_id: 1 })
})
.then(r => r.json())
.then(console.log)
```

---

## Parte 7 — Aplicar a otra ruta (por tu cuenta)

Repite el mismo patrón para `areas.routes.js`: crea un schema en `server/src/schemas/areas.schema.js` que valide el campo `name` en `POST` y `PUT`, y aplícalo en la ruta.

Además, agrega `priority` al `createRequestSchema` en `requests.schema.js`. El campo debe:
- Ser obligatorio
- Aceptar solo los valores `'low'`, `'medium'` o `'high'`
- Tener `'normal'` como valor por defecto si no se envía

> Pista: Zod tiene `z.enum([...])`  y `.default(...)`.

---

## Referencias

- [Zod Básico](https://zod.dev/?id=basic-usage) `z.object`, tipos, validaciones integradas
- [Zod safeParse](https://zod.dev/?id=safeparse) cómo usar el resultado sin excepciones

---

## Requisitos de entrega

1. Zod está instalado en `server/package.json`.
2. Existe `server/src/schemas/requests.schema.js` con `createRequestSchema` y `updateRequestSchema`.
3. Existe `server/src/middleware/validate.js` con la función `validate`.
4. `POST /api/requests` sin `area_id` devuelve `400` con errores por campo.
5. `POST /api/requests` con datos válidos crea la solicitud normalmente.
6. La validación manual `if (!title || !area_id)` fue eliminada del controller.
7. `areas.routes.js` tiene validación aplicada en `POST` y `PUT`.
8. `createRequestSchema` incluye `priority` como un valor entre `'low', 'normal', 'high'` con default `'normal'`. Enviar `priority: 'urgent'` devuelve `400`.
