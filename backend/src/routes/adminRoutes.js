const express = require('express');
const { getStats, getUsers, updateUser, getSettings, updateSettings } = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');
const { requireJsonBody } = require('../middleware/validation');

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/users/:id', requireJsonBody, updateUser);
router.get('/settings', getSettings);
router.patch('/settings', requireJsonBody, updateSettings);

module.exports = router;