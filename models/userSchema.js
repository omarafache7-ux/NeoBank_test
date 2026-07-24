const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    userName:{
      type:String,
      required:true,
      trim:true,
      unique:true
    },
    email: {
      type: String,
      required: [true, "Email is required!!"],
      unique: true,
      maxLength: 80,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      maxLength: 14,
    },
    //wont be saved in the backend just for checking
    passwordConfirm: {
      type: String,
      required: true,
      trim: true,
      maxLength: 14,
    },
    passwordChangedAt: Date,
    role: {
      type: String,
      required: true,
      enum: [
        "customer",
        "employee",
        
      ],
      status: {
        type: String,
        enum: ["active", "suspended", "locked"],
        default: "active",
      },
      lastLoginAt: Date,
    },
  },
  { timestamps: true },
);

userSchema.methods.checkPassword = async function (canditatePassword,userPassword) {
    return await bcrypt.compare(canditatePassword,userPassword);
    };
    
//Pre hook for the password and hashing
userSchema.pre("save",async function (next) {
    try {
        if(!this.isModified("password")){
            next();
        }
        this.password = await bcrypt.hash(this.password,12);
        this.passwordConfirm=undefined;
    } catch (err) {
        next(err);
    }
});

userSchema.methods.passwordChangedAfterTokenIssued = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        // Convert the date to a timestamp in seconds to match the JWT `iat` format
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        
        // If the token was issued BEFORE the password was changed, return true
        return JWTTimestamp < changedTimestamp; 
    }

    // False means the password was NOT changed after the token was issued
    return false;
};

module.exports = mongoose.model("User",userSchema);