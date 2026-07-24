const express = require('express');
const auditLogController = require('../controllers/auditLogController');
const {protect,restrictTo} = require('../middleware/authMiddleWare')
const router = express.Router();

router.use(protect)
router.use(restrictTo('compliance-officer','admin'))
router.get("/", auditLogController.getAllLogs);
router.get("/actor/:actorId", auditLogController.getLogsByActor);
router.get("/entity/:entityType/:entityId", auditLogController.getLogsByEntity);
router.get("/:id", auditLogController.getLogById);

module.exports = router;
