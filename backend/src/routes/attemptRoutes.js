const express = require('express');
const { getHistory, getAttempt, deleteAttempt } = require('../controllers/attemptController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/history', getHistory);
router.get('/:id', getAttempt);
router.delete('/:id', deleteAttempt);

module.exports = router;