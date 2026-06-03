const router = require('express').Router()
const { getAll, getById, create, update, remove } = require('../controllers/areas.controller')

// 1. Importar ambos middlewares
const { isAuthenticated } = require('../middleware/auth')
const { checkRole } = require('../middleware/authorize')

// 2. Aplicar autenticación global para TODO este archivo de rutas
// A partir de esta línea, cualquiera que intente entrar a una ruta de áreas debe estar logueado.
router.use(isAuthenticated)

// Rutas de lectura (Cualquier usuario logueado puede entrar)
router.get('/', getAll)
router.get('/:id', getById)

// Rutas de escritura (Solo usuarios logueados que ADEMÁS sean 'admin') 12.
router.post('/', checkRole('admin'), create)
router.put('/:id', checkRole('admin'), update)
router.delete('/:id', checkRole('admin'), remove)

module.exports = router