const express = require('express')
const verifyToken = require('../middleware/verifyToken')
const userController = require('../app/controllers/userController')
const router = express.Router()

router.get('/', verifyToken, userController.index)

router.get('/:id', verifyToken, userController.show)

router.post('/', verifyToken, userController.create)

router.put('/:id', verifyToken, userController.update)

router.patch('/:id', verifyToken, userController.update)

router.delete('/:id', verifyToken, userController.destroy)

module.exports = router
