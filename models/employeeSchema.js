const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const employeeSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    employeeId: { type: String, 
        required: true, 
        unique: true 
    },
    jobTitle: {
      type: String,
      required: true,
      enum: [
        "teller",
        "loan-officer",
        "compliance-officer",
        "branch-manager",
        "admin",
      ],
    },
    branchId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Branch", 
        default: null },
    teamId: {
         type: Schema.Types.ObjectId, 
         ref: "Team", 
         default: null },
    hireDate: { type: Date, 
        default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Employee",employeeSchema);