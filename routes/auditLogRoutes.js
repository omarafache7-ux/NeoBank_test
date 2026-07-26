const express = require("express");
const auditLogController = require("../controllers/auditLogController");
const { protect, restrictTo } = require("../middleware/authMiddleWare");
const router = express.Router();


router.use(protect);

router.get(
  "/",
  restrictTo("compliance-officer", "admin"),
  auditLogController.getAllLogs,
);
router.get(
  "/actor/:actorId",
  restrictTo("compliance-officer", "admin"),
  auditLogController.getLogsByActor,
);
router.get(
  "/entity/:entityType/:entityId",
  restrictTo("compliance-officer", "admin", "customer"),
  auditLogController.getLogsByEntity,
);

router.get(
  "/:id",
  restrictTo("compliance-officer", "admin"),
  auditLogController.getLogById,
);

module.exports = router;
