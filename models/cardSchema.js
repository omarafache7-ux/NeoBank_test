const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cardSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    account: { type: Schema.Types.ObjectId, 
        ref: "Account", 
        required: true },
    type: { type: String, 
        enum: ["debit", "credit"], 
        required: true },
    last4: { type: String, 
        required: true, 
        minlength: 4, 
        maxlength: 4 }, // never store full PAN/CVV — see note below
    status: {
      type: String,
      enum: ["requested", "active", "blocked", "expired"],
      default: "requested",
    },
    expiryDate: { type: Date, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Card',cardSchema);