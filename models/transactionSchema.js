const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema(
  {
    referenceNumber: { type: String, 
        required: true, 
        unique: true },
    type: {
      type: String,
      enum: ["deposit", "withdrawal", "transfer"],
      required: true,
    },
    fromAccountId: { type: Schema.Types.ObjectId, ref: "Account" },
    toAccountId: { type: Schema.Types.ObjectId, ref: "Account" },
    //best used for currency and for preventing floating points
    amount: { type: Schema.Types.Decimal128, required: true, min: 0.01 },
    currency: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "requires_approval"],
      default: "pending",
    },
    requiresApproval: { type: Boolean, default: false },
    approvedBy: { type: Schema.Types.ObjectId, ref: "Employee" },
    initiatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

module.exports = mongoose.model("Transaction", transactionSchema);