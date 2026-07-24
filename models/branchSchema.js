const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const branchSchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    address: { street: String, city: String, country: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Branch", branchSchema);
