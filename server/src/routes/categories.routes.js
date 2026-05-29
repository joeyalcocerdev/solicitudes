const router = require('express').Router()
const { isAuthenticated } = require('../middleware/auth')
const { checkRole } = require('../middleware/authorize')
const { getAll, getById, create, update, remove } = require('../controllers/categories.controller')

router.use(isAuthenticated)

router.get('/', getAll)
router.get('/:id', getById)
router.post('/', checkRole('admin'), create)
router.put('/:id', checkRole('admin'), update)
router.delete('/:id', checkRole('admin'), remove)

module.exports = router

//12