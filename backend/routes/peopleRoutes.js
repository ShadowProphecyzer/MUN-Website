// routes/peopleRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true }); // to access conferenceId from parent routes
const { protect } = require('../middleware/authMiddleware');
const { canManageUsers } = require('../middleware/roleMiddleware');
const {
  getPeopleByConference,
  addOrUpdateUserRole,
  removeUserFromConference,
} = require('../controllers/peopleController');

// GET /api/conferences/:conferenceId/people
// Any logged-in user can see the people in a conference
router.get('/', protect, getPeopleByConference);

// POST /api/conferences/:conferenceId/people
// Only owners and admins can add or update users' roles
router.post('/', protect, canManageUsers, addOrUpdateUserRole);

// DELETE /api/conferences/:conferenceId/people/:userId
// Only owners and admins can remove a user from conference
router.delete('/:userId', protect, canManageUsers, removeUserFromConference);

module.exports = router;
