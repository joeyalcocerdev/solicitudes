# Práctica 12 — RBAC

**Objetivo:** Entender cómo funciona el middleware en Express y aplicar los middlewares de autenticación y autorización que ya existen en el proyecto para proteger rutas según rol.

**Archivos a revisar:** `server/src/middleware/auth.js`, `server/src/middleware/authorize.js`, `server/src/routes/requests.routes.js`, `server/src/routes/areas.routes.js`

---

## Contexto

El proyecto ya tiene dos middlewares implementados en `server/src/middleware/`. El problema es que ninguna ruta los usa — cualquier persona puede hacer `GET /api/requests` o `DELETE /api/areas/1` sin estar autenticada.

La protección que ves en el browser cuando navegas a `/admin/users` sin sesión la hace React Router en el cliente, no el servidor. Cualquiera con Postman puede saltársela.

Tu tarea es aplicar esos middlewares en las rutas para que la protección viva donde debe: en el servidor.
 
---

## Parte 1 — Leer los middlewares existentes

Abre `server/src/middleware/auth.js` y `server/src/middleware/authorize.js` y responde:

1. ¿Qué condición verifica `isAuthenticated` para dejar pasar la petición? ¿Qué devuelve si no se cumple?
2. `checkRole` no es un middleware,  es una función que *retorna* un middleware. ¿Qué diferencia eso en cómo se usa en la ruta?
3. ¿Qué código HTTP devuelve cada uno cuando rechaza? ¿Por qué son distintos?

---

## Parte 2 — Proteger una ruta con `isAuthenticated`

Abre `server/src/routes/requests.routes.js`. Actualmente se ve así:

```js
const router = require('express').Router()
const { getAll, getById, create, update, remove } = require('../controllers/requests.controller')

router.get('/', getAll)
router.get('/:id', getById)
router.post('/', create)
router.put('/:id', update)
router.delete('/:id', remove)

module.exports = router
```

**Pasos:**

1. Importa `isAuthenticated` desde el archivo de middleware:

```js
const { isAuthenticated } = require('../middleware/auth')
```

2. Agrégalo como argumento en `GET /` antes del controller:

```js
router.get('/', isAuthenticated, getAll)
```

3. Prueba que funciona. Sin cookie de sesión:

```bash
curl http://localhost:3000/api/requests
```

Debes recibir:
```json
{ "error": "No autenticado" }
```

4. Ahora protege el resto de las rutas de `requests` de la misma forma.

---

## Parte 3 — Proteger una ruta con `checkRole` (por tu cuenta)

Abre `server/src/routes/areas.routes.js`. Las rutas de lectura pueden deben ser para todos los usuarios, pero crear, editar y eliminar áreas debe ser exclusivo de administradores.

> Pista: `checkRole` recibe el rol como argumento y devuelve un middleware. En la ruta se usa así:
> ```js
> checkRole('admin')
> ```
>
> Si todas las rutas del archivo necesitan `isAuthenticated`, hay una forma de aplicarlo una sola vez en lugar de repetirlo en cada línea:
> ```js
> router.use(isAuthenticated)
>
> router.get('/', getAll)
> router.post('/', otroMiddleware, create)
> // ...
> ```
> `router.use()` aplica el middleware a todas las rutas que se definan después de esa línea.
> 
> El orden importa: primero verificar que hay sesión, después verificar el rol.

Aplica la protección correcta a `POST /`, `PUT /:id` y `DELETE /:id` en `areas.routes.js`.

Verifica que:
- Un usuario sin sesión recibe `401`
- Un usuario con sesión pero rol `user` recibe `403`
- Un usuario con sesión y rol `admin` puede crear y eliminar áreas

> **Cómo probar desde el browser (funciona en Windows, Mac y Linux)**
>
> Inicia sesión normalmente en `http://localhost:5173`, abre DevTools → Console y pega esto para probar sin sesión (incógnito) y con sesión (ventana normal):
>
> ```js
> // GET — verificar autenticación
> fetch('http://localhost:3000/api/requests', {
>   credentials: 'include'
> })
> .then(r => r.json())
> .then(console.log)
> ```
>
> ```js
> // POST — verificar rol admin
> fetch('http://localhost:3000/api/areas', {
>   method: 'POST',
>   credentials: 'include',
>   headers: { 'Content-Type': 'application/json' },
>   body: JSON.stringify({ name: 'Test', description: 'prueba' })
> })
> .then(r => r.json())
> .then(console.log)
> ```
>
> `credentials: 'include'` le dice al browser que mande la cookie de sesión. Sin eso, fetch no la incluye aunque estés logueado. Para simular una petición sin sesión, abre una ventana de incógnito y repite, la cookie no existe ahí y debes recibir `401`.

---

En una aplicación real todas las rutas estarían protegidas — `categories`, `users`, y cualquier otro recurso. Aquí solo trabajamos dos por simplicidad, pero el patrón es exactamente el mismo para el resto.

---

## Referencias

- [Express: Writing middleware](https://expressjs.com/en/guide/writing-middleware.html) cómo funciona el pipeline de middlewares y qué hace `next()`
- [Express: Using middleware](https://expressjs.com/en/guide/using-middleware.html) diferencia entre middleware de aplicación y de ruta

---

## Requisitos de entrega

1. Todas las rutas de `requests` requieren sesión activa (`isAuthenticated`).
2. Las rutas de escritura de `areas` (`POST`, `PUT`, `DELETE`) requieren rol `admin`.
3. Sin cookie de sesión, cualquier ruta protegida devuelve `401`.
4. Con sesión de usuario normal, las rutas de admin devuelven `403`.
