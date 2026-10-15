const express = require('express');
const { register, login, getMe, updateProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { requireFields, requireJsonBody } = require('../middleware/validation');

const router = express.Router();

router.post('/register', authLimiter, requireJsonBody, requireFields(['name', 'email', 'password']), register);
router.post('/login', authLimiter, requireJsonBody, requireFields(['email', 'password']), login);

router.use(protect);
router.get('/me', getMe);
router.patch('/profile', requireJsonBody, updateProfile);
router.patch('/password', requireJsonBody, requireFields(['currentPassword', 'newPassword']), changePassword);

module.exports = router;