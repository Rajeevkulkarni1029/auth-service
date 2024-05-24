const express = require('express')
const router = express.Router()
const authController = require('../app/controllers/authController')
const verifyToken = require('../middleware/verifyToken')

router.post('/login/', authController.login)

router.post('/change-password/', authController.changePassword)

router.post('/setup-two-factor/', verifyToken, authController.setupTwoFactor)

router.post('/verify-two-factor/', verifyToken, authController.verifyTwoFactor)

module.exports = router
