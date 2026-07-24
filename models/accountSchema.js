const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const accountSchema = new Schema(
  {
    accountNumber: { type: String, required: true, unique: true },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    branch: { type: Schema.Types.ObjectId, 
        ref: "Branch", 
        required: true },
    type: { type: String, 
        enum: ["checking", "savings"], 
        required: true },
    currency: { type: String, 
        required: true, 
        default: "USD" },
    balance: {
      type: Schema.Types.Decimal128,
      required: true,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "frozen", "closed"],
      default: "active",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Account",accountSchema);