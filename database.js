const mongoose = require("mongoose");
require("dotenv").config();
exports.connectDB = async () => {
  try {
    await mongoose.connect(process.env.Mongodb_URL);
    console.log("MongoDB Connected!!");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
