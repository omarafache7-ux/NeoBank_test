const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const beneficiarySchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    beneficiaryAccountNumber: { type: String, 
        required: true },
    beneficiaryName: { type: String, 
        required: true },
    bankName: String,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: { type: Schema.Types.ObjectId, 
        ref: "Employee" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Beneficiary", beneficiarySchema);
