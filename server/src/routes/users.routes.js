const router = require('express').Router()
const { isAuthenticated } = require('../middleware/auth')
const { checkRole } = require('../middleware/authorize')
const { getAll, getById, create, update, remove, getUserAreas, assignArea, removeArea } = require('../controllers/users.controller')

router.use(isAuthenticated)

router.get('/', getAll)
router.get('/:id', getById)
router.post('/', checkRole('admin'), create)
router.put('/:id', checkRole('admin'), update)
router.delete('/:id', checkRole('admin'), remove)

router.get('/:id/areas', getUserAreas)
router.post('/:id/areas', checkRole('admin'), assignArea)
router.delete('/:id/areas/:areaId', checkRole('admin'), removeArea)

module.exports = router
