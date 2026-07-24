const AuditLog = require("../models/auditLogSchema");


exports.getAllLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      entityType,
      actorId,
      entityId,
      startDate,
      endDate,
    } = req.query;

    // Build filter object dynamically
    const filter = {};

    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;
    if (actorId) filter.actorId = actorId;
    if (entityId) filter.entityId = entityId;

    // Date range filtering
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("actorId", "firstName lastName email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      status: "success",
      results: logs.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
      data: logs,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate(
      "actorId",
      "firstName lastName email role"
    );

    if (!log) {
      return res.status(404).json({
        status: "fail",
        message: "Audit log entry not found.",
      });
    }

    res.status(200).json({ status: "success", data: log });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getLogsByActor = async (req, res) => {
  try {
    const { actorId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find({ actorId })
        .populate("actorId", "firstName lastName email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments({ actorId }),
    ]);

    res.status(200).json({
      status: "success",
      results: logs.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
      data: logs,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getLogsByEntity = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const logs = await AuditLog.find({ entityType, entityId })
      .populate("actorId", "firstName lastName email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: logs.length,
      data: logs,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};