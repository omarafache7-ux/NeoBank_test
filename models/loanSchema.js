const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const loanSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 
        "Customer", 
        required: true },
    loanOfficer: { type: Schema.Types.ObjectId, 
        ref: "Employee" },
    principal: { type: Schema.Types.Decimal128, 
        required: true },
    interestRate: { type: Number, 
        required: true },
    termMonths: { type: Number, 
        required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "active",
        "closed",
        "defaulted",
      ],
      default: "pending",
    },
    repaymentSchedule: [
      {
        installmentNumber: Number,
        dueDate: Date,
        amount: Schema.Types.Decimal128,
        status: { type: String, enum: ["due", "paid", "late"] },
      },
    ],
    decidedAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Loan", loanSchema);
