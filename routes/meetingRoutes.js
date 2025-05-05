const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/create', isAuthenticated, meetingController.renderCreateForm);
router.post('/create', isAuthenticated, meetingController.createMeeting);

router.get('/', isAuthenticated, meetingController.listMeetings);
router.get('/:id', isAuthenticated, meetingController.viewMeeting);

router.post('/:id/read', isAuthenticated, meetingController.markRead);
router.post('/:id/joining', isAuthenticated, meetingController.updateJoiningStatus);
router.post('/:id/attendance', isAuthenticated, meetingController.markAttendance);
router.post('/:id/minutes', isAuthenticated, meetingController.updateMinutes);

module.exports = router;
