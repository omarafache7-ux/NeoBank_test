const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// SystemSettings: the app only ever reads/writes the one document in this collection
const systemSettingsSchema = new Schema(
  {
    defaultInterestRate: { type: Number, required: true, default: 5.0 },
    transactionApprovalThreshold: {
      type: Schema.Types.Decimal128,
      required: true,
      default: 10000,
    },
    supportedCurrencies: { type: [String], default: ["USD"] },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
  },
  { timestamps: true },
);

module.exports= mongoose.model("SystemSetting",systemSettingsSchema);