const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Route for listing all users
router.get('/', userController.index);

// Route for listing one user
router.get('/:id', userController.show);

// Route for creating a new user
router.post('/', userController.create);

// Route for updating a user
router.put('/:id', userController.update);
router.patch('/:id', userController.update)

// Route for deleting a user
router.delete('/:id', userController.destroy);

module.exports = router;
