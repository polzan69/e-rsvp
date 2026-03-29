const express = require('express');
const router = express.Router();

const { createUser, login, getAllUsers, updateUser, deleteUser } = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.post('/create', createUser);
router.post('/login', login);

// Protected route example: only admin and super_admin can access
router.get('/profile', authenticate, (req, res) => {
  res.status(200).json({
    message: 'Your profile',
    user: req.user
  });
});

// Get all users - Admins can view invitees, Super Admin can view all
router.get('/all', authenticate, authorize('admin', 'super_admin'), getAllUsers);

// Update user by ID - Admins have limited access, Super Admin full access
router.put('/:id', authenticate, authorize('admin', 'super_admin'), updateUser);

// Delete user by ID - Super Admin only
router.delete('/:id', authenticate, authorize('super_admin'), deleteUser);

// Super admin only route example
router.get('/admin-panel', authenticate, authorize('super_admin'), (req, res) => {
  res.status(200).json({
    message: 'Welcome to admin panel - Super Admin Only',
    user: req.user
  });
});

module.exports = router;