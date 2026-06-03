const router = require('express').Router()
const { getAll, getById, create, update, remove } = require('../controllers/requests.controller')

// 1. Importar el middleware de autenticación
const { isAuthenticated } = require('../middleware/auth')

// 2. Aplicar isAuthenticated a cada una de las rutas antes del controlador
router.get('/', isAuthenticated, getAll)
router.get('/:id', isAuthenticated, getById)
router.post('/', isAuthenticated, create)
router.put('/:id', isAuthenticated, update)
router.delete('/:id', isAuthenticated, remove)

module.exports = router
//12.