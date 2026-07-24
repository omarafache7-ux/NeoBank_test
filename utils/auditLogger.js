// utils/auditLogger.js
const AuditLog = require('../models/auditLogSchema');

/**
 * Safely records an immutable audit log entry.
 */
exports.recordLog = async ({ actorId, action, entityType, entityId, details }) => {
  try {
    await AuditLog.create({
      actorId,
      action,
      entityType,
      entityId,
      details,
    });
  } catch (err) {
    // Log error internally so an audit failure doesn't crash the core request
    console.error('Failed to create audit log:', err.message);
  }
};