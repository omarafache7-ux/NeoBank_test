const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleWare');
const teamController = require('../controllers/teamController');

router.use(protect);
router.use(restrictTo('admin', 'branch-manager'));

router.get('/teams', teamController.getAllTeams);
router.get('/teams/:id', teamController.getTeam);
router.post('/teams', teamController.createTeam);
router.put('/teams/:id', teamController.updateTeam);
router.delete('/teams/:id', teamController.deleteTeam);
router.put('/teams/:id/add-member', teamController.addMember);
router.put('/teams/:id/remove-member', teamController.removeMember);

module.exports = router;
