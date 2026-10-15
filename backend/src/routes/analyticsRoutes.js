const express = require('express');
const { getSummary, getTopics, getTimeline } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/summary', getSummary);
router.get('/topics', getTopics);
router.get('/timeline', getTimeline);

module.exports = router;