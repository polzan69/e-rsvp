const express = require('express');
const router = express.Router();

const { createUser, login } = require('../controllers/userController');
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

// Super admin only route example
router.get('/admin-panel', authenticate, authorize('super_admin'), (req, res) => {
  res.status(200).json({
    message: 'Welcome to admin panel - Super Admin Only',
    user: req.user
  });
});

module.exports = router;