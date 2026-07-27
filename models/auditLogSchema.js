const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const auditLogSchema = new Schema({
  actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, 
  entityType: { type: String, required: true }, 
  entityId: { type: Schema.Types.ObjectId, required: true }, 
  details: { type: Schema.Types.Mixed } 
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model("AuditLog",auditLogSchema);