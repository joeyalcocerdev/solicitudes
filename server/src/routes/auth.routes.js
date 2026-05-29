const router = require('express').Router()
const { isAuthenticated } = require('../middleware/auth')
const { login, logout, me } = require('../controllers/auth.controller')

router.post('/login', login)
router.post('/logout', logout)
router.get('/me', isAuthenticated, me)

module.exports = router
