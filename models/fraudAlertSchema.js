const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fraudAlertSchema = new Schema(
  {
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    riskScore: { type: Number, required: true, min: 0, max: 100 },
    status: {
      type: String,
      enum: ["open", "reviewing", "cleared", "confirmed-fraud"],
      default: "open",
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("FraudAlert",fraudAlertSchema);