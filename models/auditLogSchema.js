const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const auditLogSchema = new Schema({
  actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g. "account.freeze", "loan.approve"
  entityType: { type: String, required: true }, // "Account", "Loan", "Transaction", ... — polymorphic, not a ref
  entityId: { type: Schema.Types.ObjectId, required: true }, // the target document's _id, whatever collection it's in
  details: { type: Schema.Types.Mixed } // free-form before/after snapshot, shape depends on entityType
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model("AuditLog",auditLogSchema);