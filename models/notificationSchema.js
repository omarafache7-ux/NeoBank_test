const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true },
    message: { type: String, 
        required: true },
    type: {
      type: String,
      enum: ["transaction", "loan", "security", "system"],
      required: true,
    },
    read: { type: Boolean, 
        default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

module.exports = mongoose.model("Notification", notificationSchema);
