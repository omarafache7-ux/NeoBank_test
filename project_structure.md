# NeoBank Test Backend Code

This file contains the backend source code from the requested server-side files.

## Models

### 
```javascript
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
```

### 
```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const auditLogSchema = new Schema({
  actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g. "account.freeze", "loan.approve"
  entityType: { type: String, required: true }, // "Account", "Loan", "Transaction", ... â€” polymorphic, not a ref
  entityId: { type: Schema.Types.ObjectId, required: true }, // the target document's _id, whatever collection it's in
  details: { type: Schema.Types.Mixed } // free-form before/after snapshot, shape depends on entityType
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model("AuditLog",auditLogSchema);
```

### 
```javascript
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

```

### 
```javascript
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

```

### 
```javascript
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
        maxlength: 4 }, // never store full PAN/CVV â€” see note below
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
```

### 
```javascript
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const customerSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    nationalId: {
      type: String,
      required: true,
      unique: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      country: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      street: {
        type: String,
      },
    },
    kycStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    kycDocuments: [
        { docType: String, url: String, uploadedAt: Date }
    ],
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Customer", customerSchema);

```

### 
```javascript
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
```

### 
```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fraudAlertSchema = new Schema(
  {
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    riskScore: { type: Number, required: true, min: 0, max: 100 },
    status: {
      type: String,
      enum: ["open", "reviewing", "cleared", "confirmed-fraud"],
      default: "open",
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("FraudAlert",fraudAlertSchema);
```

### 
```javascript
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

```

### 
```javascript
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

```

### 
```javascript
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// SystemSettings singleton: the app only ever reads/writes the one document in this collection
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
```

### 
```javascript
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const teamSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    branch: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    managerId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "Employee" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", teamSchema);
```

### 
```javascript
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema(
  {
    referenceNumber: { type: String, 
        required: true, 
        unique: true },
    type: {
      type: String,
      enum: ["deposit", "withdrawal", "transfer"],
      required: true,
    },
    fromAccountId: { type: Schema.Types.ObjectId, ref: "Account" },
    toAccountId: { type: Schema.Types.ObjectId, ref: "Account" },
    amount: { type: Schema.Types.Decimal128, required: true, min: 0.01 },
    currency: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "requires_approval"],
      default: "pending",
    },
    requiresApproval: { type: Boolean, default: false },
    approvedBy: { type: Schema.Types.ObjectId, ref: "Employee" },
    initiatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

module.exports = mongoose.model("Transaction", transactionSchema);
```

### 
```javascript
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
    },
    status: {
      type: String,
      enum: ["active", "suspended", "locked"],
      default: "active",
    },
    lastLoginAt: Date,
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
```
## Controllers

### 
```javascript
const mongoose = require("mongoose");
const Account = require("../models/accountSchema");
const Transaction = require("../models/transactionSchema");
const Customer = require("../models/customerSchema");
const Branch = require("../models/branchSchema");
const { recordLog } = require("../utils/auditLogger");

const generateReferenceNumber = () => {
  return "TXN-" + Date.now() + "-" + Math.floor(1000 + Math.random() * 9000);
};


exports.getAllAccounts = async (req, res) => {
  try {
    const accounts = await Account.find()
      .populate("customerId", "firstName lastName email phone status -password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: accounts.length,
      data: accounts,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id).populate(
      "customer",
      "firstName lastName email phone status -password"
    );

    if (!account) {
      return res.status(404).json({ status: "fail", message: "Account not found" });
    }

    res.status(200).json({ status: "success", data: account });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
exports.getMyAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({ customer: req.customer._id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ status: 'success', results: accounts.length, data: accounts });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};


exports.createAccount = async (req, res) => {
  try {
    const {
      customer: customerInput, // Can be customer _id, nationalId, or phone
      branch: branchInput,     // Can be branch _id or branch code (e.g., "BR001")
      type,
      currency,
      balance,
    } = req.body;

    // 1. Validate required fields
    if (!customerInput || !branchInput || !type) {
      return res.status(400).json({
        status: "fail",
        message: "Customer, branch, and account type are required.",
      });
    }

    // 2. Resolve Customer (by ObjectId or nationalId/phone)
    let customerDoc;
    if (mongoose.Types.ObjectId.isValid(customerInput)) {
      customerDoc = await Customer.findById(customerInput);
    } else {
      customerDoc = await Customer.findOne({
        $or: [{ nationalId: customerInput }, { phone: customerInput }],
      });
    }

    if (!customerDoc) {
      return res.status(404).json({
        status: "fail",
        message: "Customer does not exist. Cannot create account.",
      });
    }

    // 3. Resolve Branch (by ObjectId or branch code)
    let branchDoc;
    if (mongoose.Types.ObjectId.isValid(branchInput)) {
      branchDoc = await Branch.findById(branchInput);
    } else {
      branchDoc = await Branch.findOne({ code: branchInput });
    }

    if (!branchDoc) {
      return res.status(404).json({
        status: "fail",
        message: "Branch does not exist. Cannot create account.",
      });
    }

    // 4. Check if account already exists for this customer (with same type/currency if needed)
    const existingAccount = await Account.findOne({ customer: customerDoc._id });
    if (existingAccount) {
      return res.status(400).json({
        status: "fail",
        message: "An account already exists for this customer.",
      });
    }

    // 5. Format Balance
    const initialBalance = balance !== undefined ? balance : "0.00";
    const decimalBalance = mongoose.Types.Decimal128.fromString(
      Number(initialBalance).toFixed(2)
    );

    // 6. Create Account Document
    const account = await Account.create({
      accountNumber: generateReferenceNumber(),
      customer: customerDoc._id,
      branch: branchDoc._id,
      type,
      currency: currency || "USD",
      balance: decimalBalance,
    });

    // 7. Audit Logging
    await recordLog({
      actorId: req.user._id,
      action: "account.create",
      entityType: "Account",
      entityId: account._id,
      details: {
        accountNumber: account.accountNumber,
        type: account.type,
        currency: account.currency,
        customer: account.customer,
        branch: account.branch,
      },
    }).catch((err) => console.error("Audit log failed:", err.message));

    // 8. Populate Full Customer & Branch details for Response
    const populatedAccount = await Account.findById(account._id)
      .populate({
        path: "customer",
        populate: { path: "user", select: "firstName lastName email" },
      })
      .populate("branch");

    res.status(201).json({
      status: "success",
      data: { account: populatedAccount },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.updateAccount = async (req, res) => {
  try {
    // Prevent direct balance manipulation through standard update
    if (req.body.balance !== undefined) {
      return res.status(400).json({
        status: "fail",
        message: "Direct balance modification is not allowed via this route. Use /deposit or /withdraw.",
      });
    }

    const account = await Account.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!account) {
      return res.status(404).json({ status: "fail", message: "Account not found" });
    }

    await recordLog({
      actorId: req.user._id,
      action: "account.update",
      entityType: "Account",
      entityId: account._id,
      details: req.body,
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(200).json({ status: "success", data: account });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.deleteAccount = async (req, res) => {
  try {
    const account = await Account.findByIdAndDelete(req.params.id);

    if (!account) {
      return res.status(404).json({ status: "fail", message: "Account not found" });
    }

    await recordLog({
      actorId: req.user._id,
      action: "account.delete",
      entityType: "Account",
      entityId: req.params.id,
      details: { accountNumber: account.accountNumber },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.deposit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, currency } = req.body;
    const accountId = req.params.id;

    const numericAmount = Number(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: "fail",
        message: "Deposit amount is Invalid.",
      });
    }

    const account = await Account.findById(accountId).session(session);
    if (!account) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ status: "fail", message: "Account not found." });
    }

    if (account.status !== "active") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: "fail",
        message: `Cannot deposit to an account with status '${account.status}'.`,
      });
    }

    const newBalance = (Number(account.balance) + numericAmount).toFixed(2);
    account.balance = mongoose.Types.Decimal128.fromString(newBalance);
    await account.save({ session });

    const refNum = generateReferenceNumber();
    const [transaction] = await Transaction.create(
      [
        {
          referenceNumber: refNum,
          type: "deposit",
          toAccountId: account._id,
          amount: mongoose.Types.Decimal128.fromString(numericAmount.toFixed(2)),
          currency: currency || account.currency,
          status: "completed",
          initiatedBy: req.user._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    await recordLog({
      actorId: req.user._id,
      action: "account.deposit",
      entityType: "Account",
      entityId: account._id,
      details: { amount: numericAmount, newBalance, transactionId: transaction._id },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(200).json({
      status: "success",
      message: "Deposit successful.",
      data: {
        account,
        transaction,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.withdraw = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, currency } = req.body;
    const accountId = req.params.id;

    const numericAmount = Number(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: "fail",
        message: "Withdrawal amount must be a positive number.",
      });
    }

    const account = await Account.findById(accountId).session(session);
    if (!account) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ status: "fail", message: "Account not found." });
    }

    if (account.status !== "active") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: "fail",
        message: `Cannot withdraw from an account with status '${account.status}'.`,
      });
    }

    const currentBalance = Number(account.balance);
    if (currentBalance < numericAmount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: "fail",
        message: "Insufficient balance for this withdrawal.",
      });
    }

    const newBalance = (currentBalance - numericAmount).toFixed(2);
    account.balance = mongoose.Types.Decimal128.fromString(newBalance);
    await account.save({ session });

    const refNum = generateReferenceNumber();
    const [transaction] = await Transaction.create(
      [
        {
          referenceNumber: refNum,
          type: "withdrawal",
          fromAccountId: account._id,
          amount: mongoose.Types.Decimal128.fromString(numericAmount.toFixed(2)),
          currency: currency || account.currency,
          status: "completed",
          initiatedBy: req.user._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    await recordLog({
      actorId: req.user._id,
      action: "account.withdraw",
      entityType: "Account",
      entityId: account._id,
      details: { amount: numericAmount, newBalance, transactionId: transaction._id },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(200).json({
      status: "success",
      message: "Withdrawal successful.",
      data: {
        account,
        transaction,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ status: "error", message: err.message });
  }
};
```

### 
```javascript
const AuditLog = require("../models/auditLogSchema");


exports.getAllLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      entityType,
      actorId,
      entityId,
      startDate,
      endDate,
    } = req.query;

    // Build filter object dynamically
    const filter = {};

    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;
    if (actorId) filter.actorId = actorId;
    if (entityId) filter.entityId = entityId;

    // Date range filtering
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("actorId", "firstName lastName email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      status: "success",
      results: logs.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
      data: logs,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate(
      "actorId",
      "firstName lastName email role"
    );

    if (!log) {
      return res.status(404).json({
        status: "fail",
        message: "Audit log entry not found.",
      });
    }

    res.status(200).json({ status: "success", data: log });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getLogsByActor = async (req, res) => {
  try {
    const { actorId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find({ actorId })
        .populate("actorId", "firstName lastName email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments({ actorId }),
    ]);

    res.status(200).json({
      status: "success",
      results: logs.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
      data: logs,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getLogsByEntity = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const logs = await AuditLog.find({ entityType, entityId })
      .populate("actorId", "firstName lastName email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: logs.length,
      data: logs,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
```

### 
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');
const Customer = require('../models/customerSchema');
const Employee = require('../models/employeeSchema');
const validator = require('validator');


require('dotenv').config();


const signToken = (user)=>{
  return jwt.sign(
    {
      id:user._id,
      firstName:user.firstName,
      lastName:user.lastName,
      role:user.role,

    },
    process.env.JWT_SECRET,
    {expiresIn:process.env.JWT_EXPIRE || "20m"}
  );
}

const createSendToken = (user,statusCode,message,res)=>{
  const token = signToken(user);

  const sanitizeUser ={
    id:user._id,
    firstName:user.firstName,
    lastName:user.lastName,
    role:user.role,
  };
  res.status(statusCode).json({
    status:"success",
    token,
    message,
    data:{user:sanitizeUser}
  });
}

exports.signUp = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      userName,
      email,
      password,
      passwordConfirm,
      role,
    } = req.body;

    if (!['customer', 'employee'].includes(role)) {
      return res.status(403).json({
        message: 'Forbidden: Only customers or employees can perform this action.',
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address!' });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ message: 'Please enter matching passwords!' });
    }

    const finalRole = role === 'employee' ? 'employee' : 'customer';

    const existingUser = await User.findOne({ $or: [{ email }, { userName }] });
    if (existingUser) {
      return res.status(409).json({ message: `An account with that email or username already exists.` });
    }

    const { employeeId, jobTitle, branchId, teamId, staffAccessCode } = req.body;
    if (finalRole === 'employee') {
      if (!employeeId || !jobTitle) {
        return res.status(400).json({ message: 'Employee ID and job title are required for employee accounts.' });
      }
      if (!staffAccessCode) {
        return res.status(400).json({ message: 'A staff access code is required for employee accounts.' });
      }
      const allowedStaffCode = process.env.STAFF_ACCESS_CODE || 'NEOBANK-STAFF';
      if (staffAccessCode !== allowedStaffCode) {
        return res.status(403).json({ message: 'Invalid staff access code.' });
      }
    }

    const { nationalId, dateOfBirth, phone, address } = req.body;
    if (finalRole === 'customer') {
      if (!nationalId || !dateOfBirth || !phone || !address?.country || !address?.city) {
        return res.status(400).json({
          message: 'National ID, Date of Birth, Phone, Country, and City are required.',
        });
      }
    }

    const newUser = await User.create({
      firstName,
      lastName,
      userName,
      email,
      password,
      role: finalRole,
    });

    // FIX: this was two separate "if"s before, so a customer signup fell through into
    // Employee.create's if (skipped, fine) and then hit an UNGUARDED Customer.create â€”
    // which also ran on every employee signup, with every field undefined. Now it's one
    // if/else, so exactly one of the two ever runs, matching finalRole.
    if (finalRole === 'employee') {
      await Employee.create({
        user: newUser._id,
        employeeId,
        jobTitle,
        branchId: branchId || null,
        teamId: teamId || null,
      });
    } else {
      await Customer.create({
        user: newUser._id,
        nationalId,
        dateOfBirth,
        phone,
        address,
      });
    }

    return createSendToken(newUser, 201, `User ${newUser.firstName} has been created successfully`, res);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req,res)=>{
    try {
        const {email,password}=req.body;
        const user = await User.findOne({ email });
        if(!user || !(await user.checkPassword(password,user.password))){
            return res.status(401).json({message:"Wrong User Credentials"});
        }
        createSendToken(user,200,"You are logged in successfully!!",res);
    } catch (err) {
        console.log(err);
        return res.status(500).json({message:err.message});
    }
}



```

### 
```javascript
const Beneficiary = require("../models/beneficiarySchema");
const { recordLog } = require("../utils/auditLogger");


exports.createBeneficiary = async (req, res) => {
  try {
    const { customerId, beneficiaryAccountNumber, beneficiaryName, bankName, status } = req.body;

    if (!customerId || !beneficiaryAccountNumber || !beneficiaryName) {
      return res.status(400).json({
        status: "fail",
        message: "customerId, beneficiaryAccountNumber, and beneficiaryName are required.",
      });
    }

    if (status && !["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid status. Allowed values: pending, approved, rejected.",
      });
    }

    const newBeneficiary = await Beneficiary.create({
      customerId,
      beneficiaryAccountNumber,
      beneficiaryName,
      bankName,
      status: status || "pending",
      approvedBy: status === "approved" ? req.user._id : undefined,
    });

    await recordLog({
      actorId: req.user._id,
      action: "beneficiary.create",
      entityType: "Beneficiary",
      entityId: newBeneficiary._id,
      details: {
        customerId,
        beneficiaryAccountNumber,
        beneficiaryName,
        bankName,
        status: newBeneficiary.status,
      },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(201).json({
      status: "success",
      data: { beneficiary: newBeneficiary },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getAllBeneficiaries = async (req, res) => {
  try {
    const beneficiaries = await Beneficiary.find()
      .populate({
        path: "customerId",
        select: "user nationalId dateOfBirth phone address",
        populate: {
          path: "user",
          select: "-password -__v",
        },
      })
      .populate({
        path: "approvedBy",
        select: "user employeeId department position",
        populate: {
          path: "user",
          select: "firstName lastName email",
        },
      });

    res.status(200).json({
      status: "success",
      results: beneficiaries.length,
      data: beneficiaries,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getBeneficiary = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findById(req.params.id)
      .populate({
        path: "customerId",
        select: "user nationalId dateOfBirth phone address",
        populate: {
          path: "user",
          select: "-password -__v",
        },
      })
      .populate({
        path: "approvedBy",
        select: "user employeeId department position",
        populate: {
          path: "user",
          select: "firstName lastName email",
        },
      });

    if (!beneficiary) {
      return res.status(404).json({ status: "fail", message: "Beneficiary not found" });
    }

    res.status(200).json({ status: "success", data: beneficiary });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.updateBeneficiary = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!beneficiary) {
      return res.status(404).json({ status: "fail", message: "Beneficiary not found" });
    }

    await recordLog({
      actorId: req.user._id,
      action: "beneficiary.update",
      entityType: "Beneficiary",
      entityId: beneficiary._id,
      details: req.body,
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(200).json({ status: "success", data: beneficiary });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.deleteBeneficiary = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findByIdAndDelete(req.params.id);

    if (!beneficiary) {
      return res.status(404).json({ status: "fail", message: "Beneficiary not found" });
    }

    await recordLog({
      actorId: req.user._id,
      action: "beneficiary.delete",
      entityType: "Beneficiary",
      entityId: req.params.id,
      details: {
        customerId: beneficiary.customerId,
        beneficiaryAccountNumber: beneficiary.beneficiaryAccountNumber,
      },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid status value provided. Must be pending, approved, or rejected.",
      });
    }

    const beneficiary = await Beneficiary.findById(req.params.id);
    if (!beneficiary) {
      return res.status(404).json({ status: "fail", message: "Beneficiary not found" });
    }

    const previousStatus = beneficiary.status;
    beneficiary.status = status;

    // Automatically set approvedBy if approving
    if (status === "approved") {
      beneficiary.approvedBy = req.user._id;
    }

    await beneficiary.save();

    await recordLog({
      actorId: req.user._id,
      action: "beneficiary.status_update",
      entityType: "Beneficiary",
      entityId: beneficiary._id,
      details: { previousStatus, newStatus: status, approvedBy: beneficiary.approvedBy },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(200).json({
      status: "success",
      message: `Beneficiary status set to ${status}`,
      data: beneficiary,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
```

### 
```javascript
const Branch = require('../models/branchSchema');
const { recordLog } = require('../utils/auditLogger');


exports.createBranch = async (req, res) => {
  try {
    const { name,code,address} =
      req.body;
    if(!name||!code||!address){
        return res.status(404).json({message:"Invalid inputs!!"});
    }
    const existingBranch = await Branch.findOne({ name });

    if (existingBranch) {
      return res.status(400).json({
        status: "failed",
        message: "A Branch already exists.",
      });
    }

    const newBranch = await Branch.create({
      name,code,address
    });
    await recordLog({
      actorId: req.user._id,
      action: "branch.create",
      entityType: "Branch",
      entityId: newBranch._id,
      details: { name, code, address },
    });

    res.status(201).json({
      status: "success",
      data: {
        branch: newBranch,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find();
     

    res.status(200).json({
      status: "success",
      results: branches.length,
      data: branches,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
exports.getBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
    
    if (!branch) {
      return res
        .status(404)
        .json({ status: "fail", message: "Branch not found" });
    }
    res.status(200).json({ status: "success", data: branch });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
exports.updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!branch) {
      return res
        .status(404)
        .json({ status: "fail", message: "Branch not found" });
    }
    await recordLog({
      actorId: req.user._id,
      action: "branch.update",
      entityType: "Branch",
      entityId: branch._id,
      details: req.body,
    });
    res.status(200).json({ status: "success", data: branch });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) {
      return res
        .status(404)
        .json({ status: "fail", message: "Branch not found" });
    }
    await recordLog({
      actorId: req.user._id,
      action: "branch.delete",
      entityType: "Branch",
      entityId: req.params.id,
      details: { deletedBranchName: branch.name, code: branch.code },
    });
    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
```

### 
```javascript
const mongoose = require("mongoose");
const Card = require("../models/cardSchema");
const Account = require("../models/accountSchema");
const { recordLog } = require("../utils/auditLogger");


exports.createCard = async (req, res) => {
  try {
    // 1. Support flexible input keys (account, accountId, or accountNumber)
    const accountInput = req.body.account || req.body.accountId || req.body.accountNumber;
    const { type, last4, status, expiryDate } = req.body;

    // 2. Basic validation
    if (!accountInput || !type || !last4) {
      return res.status(400).json({
        status: "fail",
        message: "account (or accountId/accountNumber), type, and last4 are required.",
      });
    }

    if (!/^\d{4}$/.test(last4)) {
      return res.status(400).json({
        status: "fail",
        message: "last4 must consist of exactly 4 digits.",
      });
    }

    // Matches cardSchema enum ["debit", "credit"]
    if (!["debit", "credit"].includes(type)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid card type. Allowed values: debit, credit.",
      });
    }

    // 3. Resolve Account (by ObjectId or accountNumber)
    let accountDoc;
    if (mongoose.Types.ObjectId.isValid(accountInput)) {
      accountDoc = await Account.findById(accountInput);
    } else {
      accountDoc = await Account.findOne({ accountNumber: accountInput });
    }

    if (!accountDoc) {
      return res.status(404).json({
        status: "fail",
        message: "Account not found.",
      });
    }

    if (accountDoc.status !== "active") {
      return res.status(400).json({
        status: "fail",
        message: `Cannot issue a card for an account with status '${accountDoc.status}'.`,
      });
    }

    // 4. Derive customerId directly from account.customer (matches accountSchema)
    const derivedCustomerId = accountDoc.customer;

    // 5. Calculate expiryDate (Default to 3 years from today if not provided)
    const calculatedExpiry = expiryDate
      ? new Date(expiryDate)
      : new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000);

    // 6. Create Card matching cardSchema field names
    const initialStatus = status || "requested";

    const card = await Card.create({
      customerId: derivedCustomerId,
      account: accountDoc._id,
      type,
      last4,
      status: initialStatus,
      expiryDate: calculatedExpiry,
    });

    // 7. Audit Logging
    await recordLog({
      actorId: req.user._id,
      action: "card.create",
      entityType: "Card",
      entityId: card._id,
      details: {
        accountId: accountDoc._id,
        customerId: derivedCustomerId,
        type,
        last4,
        status: initialStatus,
        expiryDate: calculatedExpiry,
      },
    }).catch((err) => console.error("Audit log failed:", err.message));

    // 8. Populate response
    const populatedCard = await Card.findById(card._id)
      .populate({
        path: "customerId",
        populate: { path: "user", select: "firstName lastName email" },
      })
      .populate("account", "accountNumber type status currency");

    res.status(201).json({
      status: "success",
      data: { card: populatedCard },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

//(Staff / Admin Only) ---
exports.getAllCards = async (req, res) => {
  try {
    const cards = await Card.find()
      .populate("accountId", "accountNumber currency status")
      .populate("customerId", "firstName lastName email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: cards.length,
      data: cards,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getMyCards = async (req, res) => {
  try {
    const cards = await Card.find({ customerId: req.customer._id })
      .populate("accountId", "accountNumber currency status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: cards.length,
      data: cards,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id)
      .populate("accountId", "accountNumber currency status")
      .populate("customerId", "firstName lastName email phone");

    if (!card) {
      return res.status(404).json({ status: "fail", message: "Card not found" });
    }

    if (
      req.user.role === "customer" &&
      card.customerId._id.toString() !== req.customer._id.toString()
    ) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to view this card.",
      });
    }

    res.status(200).json({ status: "success", data: card });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["requested", "active", "blocked", "expired", "cancelled"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: "fail",
        message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
      });
    }

    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ status: "fail", message: "Card not found" });
    }

    const previousStatus = card.status;
    card.status = status;
    await card.save();

    await recordLog({
      actorId: req.user._id,
      action: "card.update_status",
      entityType: "Card",
      entityId: card._id,
      details: { previousStatus, newStatus: status },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(200).json({
      status: "success",
      message: `Card status updated to '${status}'.`,
      data: card,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.cancelCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({ status: "fail", message: "Card not found" });
    }

    if (card.status === "cancelled") {
      return res.status(400).json({
        status: "fail",
        message: "Card is already cancelled.",
      });
    }

    const previousStatus = card.status;
    card.status = "cancelled";
    await card.save();

    await recordLog({
      actorId: req.user._id,
      action: "card.cancel",
      entityType: "Card",
      entityId: card._id,
      details: { previousStatus, newStatus: "cancelled", last4: card.last4 },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(200).json({
      status: "success",
      message: "Card cancelled successfully.",
      data: card,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
```

### 
```javascript
const User = require("../models/userSchema");
const Customer = require("../models/customerSchema");

// restricted to admin and teller
exports.createCustomer = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      userName,
      email,
      password,
      nationalId,
      dateOfBirth,
      phone,
      address,
    } = req.body;
    const existingUser = await User.findOne({
      $or: [{ email }, { userName }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "A user with this email or username already exists.",
      });
    }

    const existingCustomer = await Customer.findOne({ nationalId });

    if (existingCustomer) {
      return res.status(400).json({
        message: "An Customer already exists.",
      });
    }
    // 1. Create base User document
    const newUser = await User.create({
      firstName,
      lastName,
      userName,
      email,
      password,
      role: "customer",
    });

    // 2. Create Customer
    const newCustomer = await Customer.create({
      user: newUser._id,
      nationalId,
      dateOfBirth,
      phone,
      address,
    });

    res.status(201).json({
      status: "success",
      data: {
        user: {
          _id: newUser._id,
          firstName: newUser.firstName,
          email: newUser.email,
          role: newUser.role,
        },
        customer: newCustomer,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find()
      .populate({
        path: "user",
        select: "firstName lastName userName email role", // Exclude password!
      })
      .populate({
        path: "branchId",
        select: "name code address",
      });

    res.status(200).json({
      status: "success",
      results: customers.length,
      data: customers,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate({
        path: "user",
        select: "firstName lastName userName email role", // Exclude password!
      })
      .populate({
        path: "branchId",
        select: "name code address",
      });

    if (!customer) {
      return res
        .status(404)
        .json({ status: "fail", message: "Customer not found" });
    }
    res.status(200).json({ status: "success", data: customer });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!customer) {
      return res
        .status(404)
        .json({ status: "fail", message: "Customer not found" });
    }
    res.status(200).json({ status: "success", data: customer });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res
        .status(404)
        .json({ status: "fail", message: "Customer not found" });
    }
    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

```

### 
```javascript
const Employee = require("../models/employeeSchema");
const Branch = require("../models/branchSchema")
const User = require("../models/userSchema")

// createEmployee can done by the admin and the branch manager
exports.createEmployee = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      userName,
      email,
      password,
      employeeId,
      jobTitle,
      branchCode,
      teamId,
    } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { userName }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "A user with this email or username already exists.",
      });
    }

    const existingEmployee = await Employee.findOne({ employeeId });

    if (existingEmployee) {
      return res.status(400).json({
        message: "An employee with this Employee ID already exists.",
      });
    }

    // NEW: resolve the branch by its human-readable code instead of trusting
    // a raw ObjectId from the client â€” this also doubles as validating the
    // branch actually exists before you ever create the User/Employee.
    let branch = null;
    if (branchCode) {
      branch = await Branch.findOne({ code: branchCode });
      if (!branch) {
        return res.status(400).json({
          message: `No branch found with code "${branchCode}".`,
        });
      }
    }

    // 1. Create base User document
    const newUser = await User.create({
      firstName,
      lastName,
      userName,
      email,
      password,
      role: "employee",
    });

    // 2. Create Employee profile linked to the newly created User ID
    const newEmployee = await Employee.create({
      user: newUser._id,
      employeeId,
      jobTitle,
      branchId: branch ? branch._id : null,   // store the real _id, resolved above
      teamId: teamId || null,
    });

    res.status(201).json({
      status: "success",
      data: {
        user: {
          _id: newUser._id,
          firstName: newUser.firstName,
          email: newUser.email,
          role: newUser.role,
        },
        employee: newEmployee,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate({
        path: "user",
        select: "firstName lastName userName email role", // Exclude password!
      })
      .populate({
        path: "branchId",
        select: "name code address",
      })
      .populate({
        path: "teamId",
        select: "name branch managerId",
      });

    res.status(200).json({
      status: "success",
      results: employees.length,
      data: employees,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate({
        path: "user",
        select: "firstName lastName userName email role", // Exclude password!
      })
      .populate({
        path: "branchId",
        select: "name code address",
      })
      .populate({
        path: "teamId",
        select: "name branch managerId",
      });

    if (!employee) {
      return res
        .status(404)
        .json({ status: "fail", message: "Employee not found" });
    }
    res.status(200).json({ status: "success", data: employee });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!employee) {
      return res
        .status(404)
        .json({ status: "fail", message: "Employee not found" });
    }
    res.status(200).json({ status: "success", data: employee });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res
        .status(404)
        .json({ status: "fail", message: "Employee not found" });
    }
    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

```

### 
```javascript
const FraudAlert = require("../models/fraudAlertSchema");
const { recordLog } = require("../utils/auditLogger");


exports.createFraudAlert = async (req, res) => {
  try {
    const { transactionId, accountId, riskScore, status, reviewedBy } = req.body;

    if (!transactionId || !accountId || riskScore === undefined) {
      return res.status(400).json({
        status: "fail",
        message: "transactionId, accountId, and riskScore are required fields.",
      });
    }

    if (typeof riskScore !== "number" || riskScore < 0 || riskScore > 100) {
      return res.status(400).json({
        status: "fail",
        message: "riskScore must be a number between 0 and 100.",
      });
    }

    const validStatuses = ["open", "reviewing", "cleared", "confirmed-fraud"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        status: "fail",
        message: `Invalid status. Allowed values: ${validStatuses.join(", ")}`,
      });
    }

    const newAlert = await FraudAlert.create({
      transactionId,
      accountId,
      riskScore,
      status: status || "open",
      reviewedBy: reviewedBy || null,
    });

    await recordLog({
      actorId: req.user._id,
      action: "fraud_alert.create",
      entityType: "FraudAlert",
      entityId: newAlert._id,
      details: {
        transactionId,
        accountId,
        riskScore,
        status: newAlert.status,
      },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(201).json({
      status: "success",
      data: { fraudAlert: newAlert },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getAllFraudAlerts = async (req, res) => {
  try {
    const alerts = await FraudAlert.find()
      .populate({
        path: "transactionId",
        select: "referenceNumber type amount currency status initiatedBy",
      })
      .populate({
        path: "accountId",
        select: "accountNumber currency balance status customerId",
      })
      .populate({
        path: "reviewedBy",
        select: "user employeeId department position",
        populate: {
          path: "user",
          select: "firstName lastName email",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: alerts.length,
      data: alerts,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getFraudAlert = async (req, res) => {
  try {
    const alert = await FraudAlert.findById(req.params.id)
      .populate({
        path: "transactionId",
        select: "referenceNumber type amount currency status initiatedBy",
      })
      .populate({
        path: "accountId",
        select: "accountNumber currency balance status customerId",
      })
      .populate({
        path: "reviewedBy",
        select: "user employeeId department position",
        populate: {
          path: "user",
          select: "firstName lastName email",
        },
      });

    if (!alert) {
      return res.status(404).json({ status: "fail", message: "Fraud alert not found" });
    }

    res.status(200).json({ status: "success", data: alert });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.updateFraudAlert = async (req, res) => {
  try {
    const alert = await FraudAlert.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!alert) {
      return res.status(404).json({ status: "fail", message: "Fraud alert not found" });
    }

    await recordLog({
      actorId: req.user._id,
      action: "fraud_alert.update",
      entityType: "FraudAlert",
      entityId: alert._id,
      details: req.body,
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(200).json({ status: "success", data: alert });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.deleteFraudAlert = async (req, res) => {
  try {
    const alert = await FraudAlert.findByIdAndDelete(req.params.id);

    if (!alert) {
      return res.status(404).json({ status: "fail", message: "Fraud alert not found" });
    }

    await recordLog({
      actorId: req.user._id,
      action: "fraud_alert.delete",
      entityType: "FraudAlert",
      entityId: req.params.id,
      details: {
        transactionId: alert.transactionId,
        riskScore: alert.riskScore,
      },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["open", "reviewing", "cleared", "confirmed-fraud"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        status: "fail",
        message: `Invalid status provided. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const alert = await FraudAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ status: "fail", message: "Fraud alert not found" });
    }

    const previousStatus = alert.status;
    alert.status = status;

    // Automatically set the reviewer to the logged-in user when transitioning out of "open"
    if (status !== "open" && !alert.reviewedBy) {
      alert.reviewedBy = req.user._id;
    }

    await alert.save();

    await recordLog({
      actorId: req.user._id,
      action: "fraud_alert.status_update",
      entityType: "FraudAlert",
      entityId: alert._id,
      details: { previousStatus, newStatus: status, reviewedBy: alert.reviewedBy },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(200).json({
      status: "success",
      message: `Fraud alert status updated to ${status}`,
      data: alert,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
```

### 
```javascript
const Loan = require("../models/loanSchema");
const Customer = require("../models/customerSchema");
const { recordLog } = require("../utils/auditLogger");
const { generateAmortizationSchedule } = require("../utils/loanService");

// --- CREATE LOAN APPLICATION ---
exports.createLoan = async (req, res) => {
  try {
    const { customerId, principal, interestRate, termMonths } = req.body;

    if (!customerId || !principal || !interestRate || !termMonths) {
      return res.status(400).json({
        status: "fail",
        message: "customerId, principal, interestRate, and termMonths are required.",
      });
    }

    const customerExists = await Customer.exists({ _id: customerId });
    if (!customerExists) {
      return res.status(404).json({
        status: "fail",
        message: "Customer not found.",
      });
    }

    // Force strict defaults â€” ignore any status, repaymentSchedule, or loanOfficerId sent by client
    const loan = await Loan.create({
      customerId,
      principal,
      interestRate,
      termMonths,
      status: "pending",
      repaymentSchedule: [],
      loanOfficerId: undefined,
    });

    await recordLog({
      actorId: req.user._id,
      action: "loan.apply",
      entityType: "Loan",
      entityId: loan._id,
      details: {
        customerId,
        principal,
        interestRate,
        termMonths,
        status: "pending",
      },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(201).json({ status: "success", data: loan });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// --- GET ALL LOANS ---
exports.getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find()
      .populate({
        path: "customerId",
        select: "firstName lastName email phone",
      })
      .populate({
        path: "loanOfficerId",
        select: "employeeId department position",
        populate: { path: "user", select: "firstName lastName email" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: loans.length,
      data: loans,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// --- GET SINGLE LOAN ---
exports.getLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate({
        path: "customerId",
        select: "firstName lastName email phone",
      })
      .populate({
        path: "loanOfficerId",
        select: "employeeId department position",
        populate: { path: "user", select: "firstName lastName email" },
      });

    if (!loan) {
      return res.status(404).json({ status: "fail", message: "Loan not found" });
    }

    res.status(200).json({ status: "success", data: loan });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// --- UPDATE LOAN (Metadata/Terms only) ---
exports.updateLoan = async (req, res) => {
  try {
    // Prevent client from mutating status, repaymentSchedule, or officer via general update
    delete req.body.status;
    delete req.body.repaymentSchedule;
    delete req.body.loanOfficerId;

    const loan = await Loan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!loan) {
      return res.status(404).json({ status: "fail", message: "Loan not found" });
    }

    await recordLog({
      actorId: req.user._id,
      action: "loan.update",
      entityType: "Loan",
      entityId: loan._id,
      details: req.body,
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(200).json({ status: "success", data: loan });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// --- DELETE LOAN ---
exports.deleteLoan = async (req, res) => {
  try {
    const loan = await Loan.findByIdAndDelete(req.params.id);

    if (!loan) {
      return res.status(404).json({ status: "fail", message: "Loan not found" });
    }

    await recordLog({
      actorId: req.user._id,
      action: "loan.delete",
      entityType: "Loan",
      entityId: req.params.id,
      details: { customerId: loan.customerId, principal: loan.principal },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// --- UPDATE STATUS & SERVER-SIDE AMORTIZATION ---
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["pending", "approved", "rejected", "active", "closed", "defaulted"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: "fail",
        message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
      });
    }

    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ status: "fail", message: "Loan not found" });
    }

    const previousStatus = loan.status;
    loan.status = status;

    // Delegate math calculation to loanService when approved
    if (status === "approved") {
      loan.decidedAt = new Date();
      loan.loanOfficerId = req.employee._id;
      loan.repaymentSchedule = generateAmortizationSchedule(
        Number(loan.principal),
        Number(loan.interestRate),
        Number(loan.termMonths)
      );
    }

    await loan.save();

    await recordLog({
      actorId: req.user._id,
      action: "loan.update_status",
      entityType: "Loan",
      entityId: loan._id,
      details: {
        previousStatus,
        newStatus: status,
        decidedAt: loan.decidedAt,
        loanOfficerId: loan.loanOfficerId,
        installmentsCount: loan.repaymentSchedule.length,
      },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(200).json({
      status: "success",
      message: `Loan status successfully updated to '${status}'.`,
      data: loan,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
```

### 
```javascript
const Notification = require("../models/notificationSchema");
const { recordLog } = require("../utils/auditLogger");


exports.createNotification = async (req, res) => {
  try {
    const { userId, message, type, read } = req.body;

    if (!userId || !message || !type) {
      return res.status(400).json({
        status: "fail",
        message: "userId, message, and type are required fields.",
      });
    }

    if (!["transaction", "loan", "security", "system"].includes(type)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid notification type. Allowed values: transaction, loan, security, system.",
      });
    }

    const newNotification = await Notification.create({
      userId,
      message,
      type,
      read: read ?? false,
    });

    await recordLog({
      actorId: req.user._id,
      action: "notification.create",
      entityType: "Notification",
      entityId: newNotification._id,
      details: { userId, type, read: newNotification.read },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(201).json({
      status: "success",
      data: { notification: newNotification },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate({
        path: "userId",
        select: "firstName lastName email role",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: notifications.length,
      data: notifications,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    res.status(200).json({
      status: "success",
      results: notifications.length,
      unreadCount,
      data: notifications,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id).populate({
      path: "userId",
      select: "firstName lastName email role",
    });

    if (!notification) {
      return res.status(404).json({ status: "fail", message: "Notification not found" });
    }

    res.status(200).json({ status: "success", data: notification });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({ status: "fail", message: "Notification not found" });
    }

    res.status(200).json({
      status: "success",
      data: notification,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({
      status: "success",
      message: `${result.modifiedCount} notification(s) marked as read.`,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ status: "fail", message: "Notification not found" });
    }

    await recordLog({
      actorId: req.user._id,
      action: "notification.delete",
      entityType: "Notification",
      entityId: req.params.id,
      details: { userId: notification.userId, type: notification.type },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
```

### 
```javascript
const SystemSetting = require("../models/systemSettingSchema");
const { recordLog } = require("../utils/auditLogger");


exports.getSystemSettings = async (req, res) => {
  try {
    // Retrieve the single settings document (or create standard defaults if none exists)
    let settings = await SystemSetting.findOne().populate({
      path: "updatedBy",
      select: "user employeeId department position",
      populate: {
        path: "user",
        select: "firstName lastName email",
      },
    });

    if (!settings) {
      settings = await SystemSetting.create({});
    }

    res.status(200).json({
      status: "success",
      data: { settings },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.updateSystemSettings = async (req, res) => {
  try {
    const { defaultInterestRate, transactionApprovalThreshold, supportedCurrencies } = req.body;

    // 1. Validations
    if (defaultInterestRate !== undefined && typeof defaultInterestRate !== "number") {
      return res.status(400).json({
        status: "fail",
        message: "defaultInterestRate must be a number.",
      });
    }

    if (
      transactionApprovalThreshold !== undefined &&
      Number(transactionApprovalThreshold) < 0
    ) {
      return res.status(400).json({
        status: "fail",
        message: "transactionApprovalThreshold must be non-negative.",
      });
    }

    if (supportedCurrencies !== undefined && !Array.isArray(supportedCurrencies)) {
      return res.status(400).json({
        status: "fail",
        message: "supportedCurrencies must be an array of strings.",
      });
    }

    // 2. Fetch existing settings to keep track of previous values for audit logging
    const existingSettings = await SystemSetting.findOne();

    // 3. Upsert (update the existing singleton or create it if missing)
    const updatedSettings = await SystemSetting.findOneAndUpdate(
      {},
      {
        $set: {
          ...(defaultInterestRate !== undefined && { defaultInterestRate }),
          ...(transactionApprovalThreshold !== undefined && { transactionApprovalThreshold }),
          ...(supportedCurrencies !== undefined && { supportedCurrencies }),
          updatedBy: req.user._id,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    ).populate({
      path: "updatedBy",
      select: "user employeeId department",
      populate: {
        path: "user",
        select: "firstName lastName email",
      },
    });

    
    await recordLog({
      actorId: req.user._id,
      action: "system_settings.update",
      entityType: "SystemSetting",
      entityId: updatedSettings._id,
      details: {
        previous: existingSettings || {},
        updated: req.body,
      },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(200).json({
      status: "success",
      message: "System settings updated successfully.",
      data: { settings: updatedSettings },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
```

### 
```javascript
const Team = require("../models/teamSchema");
const Employee = require("../models/employeeSchema");
const Branch = require('../models/branchSchema');
const { recordLog } = require("../utils/auditLogger");

// --- CREATE TEAM ---
exports.createTeam = async (req, res) => {
  try {
    // Destructure using key names matching your Postman body
    const { name, branch: branchCode, managerId: managerEmpId, members: memberEmpIds } = req.body;

    if (!name || !branchCode || !managerEmpId) {
      return res.status(400).json({
        status: "fail",
        message: "Team name, branch code, and manager employee ID are required.",
      });
    }

    // 1. Resolve Branch Code -> ObjectId
    const branchDoc = await Branch.findOne({ code: branchCode });
    if (!branchDoc) {
      return res.status(404).json({ status: "fail", message: `Branch '${branchCode}' not found.` });
    }

    // 2. Resolve Manager Employee ID -> ObjectId
    const managerDoc = await Employee.findOne({ employeeId: managerEmpId });
    if (!managerDoc) {
      return res.status(404).json({ status: "fail", message: `Manager '${managerEmpId}' not found.` });
    }

    // 3. Resolve Members Employee IDs -> ObjectIds
    let memberObjectIds = [];
    if (Array.isArray(memberEmpIds) && memberEmpIds.length > 0) {
      const memberDocs = await Employee.find({ employeeId: { $in: memberEmpIds } });
      memberObjectIds = memberDocs.map((doc) => doc);
    }

    // 4. Save to DB using the mapped ObjectIds (NOT req.body!)
    const newTeam = await Team.create({
      name,
      branch: branchDoc,       // Valid ObjectId
      managerId: managerDoc,   // Valid ObjectId
      members: memberObjectIds,    // Array of Valid ObjectIds
    });

    return res.status(201).json({
      status: "success",
      data: { team: newTeam },
    });
  } catch (err) {
    return res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

// --- GET ALL TEAMS ---
exports.getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("branch", "name code location")
      .populate({
        path: "managerId",
        select: "employeeId department position",
        populate: { path: "user", select: "firstName lastName email" },
      })
      .populate({
        path: "members",
        select: "employeeId department position",
        populate: { path: "user", select: "firstName lastName email" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: teams.length,
      data: teams,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// --- GET SINGLE TEAM ---
exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("branch", "name code location")
      .populate({
        path: "managerId",
        select: "employeeId department position",
        populate: { path: "user", select: "firstName lastName email" },
      })
      .populate({
        path: "members",
        select: "employeeId department position",
        populate: { path: "user", select: "firstName lastName email" },
      });

    if (!team) {
      return res.status(404).json({ status: "fail", message: "Team not found" });
    }

    res.status(200).json({ status: "success", data: team });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// --- UPDATE TEAM ---
exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!team) {
      return res.status(404).json({ status: "fail", message: "Team not found" });
    }

    await recordLog({
      actorId: req.user._id,
      action: "team.update",
      entityType: "Team",
      entityId: team._id,
      details: req.body,
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(200).json({ status: "success", data: team });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// --- DELETE TEAM ---
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);

    if (!team) {
      return res.status(404).json({ status: "fail", message: "Team not found" });
    }

    await recordLog({
      actorId: req.user._id,
      action: "team.delete",
      entityType: "Team",
      entityId: req.params.id,
      details: { name: team.name },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// --- ADD MEMBER TO TEAM ---
exports.addMember = async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        status: "fail",
        message: "employeeId is required.",
      });
    }

    const employeeExists = await Employee.exists({ _id: employeeId });
    if (!employeeExists) {
      return res.status(404).json({
        status: "fail",
        message: "Employee not found.",
      });
    }

    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: employeeId } },
      { new: true, runValidators: true }
    )
      .populate("branch", "name code")
      .populate({
        path: "members",
        select: "employeeId department position",
        populate: { path: "user", select: "firstName lastName email" },
      });

    if (!team) {
      return res.status(404).json({ status: "fail", message: "Team not found." });
    }

    await recordLog({
      actorId: req.user._id,
      action: "team.add_member",
      entityType: "Team",
      entityId: team._id,
      details: { addedEmployeeId: employeeId },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(200).json({
      status: "success",
      message: "Employee successfully added to team.",
      data: team,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// --- REMOVE MEMBER FROM TEAM ---
exports.removeMember = async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        status: "fail",
        message: "employeeId is required.",
      });
    }

    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { $pull: { members: employeeId } },
      { new: true, runValidators: true }
    )
      .populate("branch", "name code")
      .populate({
        path: "members",
        select: "employeeId department position",
        populate: { path: "user", select: "firstName lastName email" },
      });

    if (!team) {
      return res.status(404).json({ status: "fail", message: "Team not found." });
    }

    await recordLog({
      actorId: req.user._id,
      action: "team.remove_member",
      entityType: "Team",
      entityId: team._id,
      details: { removedEmployeeId: employeeId },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(200).json({
      status: "success",
      message: "Employee successfully removed from team.",
      data: team,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
```

### 
```javascript
const mongoose = require("mongoose");
const Transaction = require("../models/transactionSchema");
const Account = require("../models/accountSchema");
const Beneficiary = require("../models/beneficiarySchema");
const SystemSettings = require("../models/systemSettingSchema");
const { recordLog } = require("../utils/auditLogger");

const generateReferenceNumber = () => {
  return "TXN-" + Date.now() + "-" + Math.floor(1000 + Math.random() * 9000);
};

// --- CREATE TRANSACTION (ATOMIC BALANCE ADJUSTMENT & BUSINESS RULES) ---
exports.createTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { referenceNumber, type, fromAccountId, toAccountId, amount, currency } = req.body;

    // 1. Basic validation
    if (!type || amount === undefined || !currency) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: "fail",
        message: "type, amount, and currency are required fields.",
      });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount < 0.01) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: "fail",
        message: "Amount must be a number greater than or equal to 0.01.",
      });
    }

    if (!["deposit", "withdrawal", "transfer"].includes(type)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: "fail",
        message: "Invalid transaction type. Must be deposit, withdrawal, or transfer.",
      });
    }

    let sourceAccount = null;
    let targetAccount = null;

    // 2. Validate Source Account (Withdrawals & Transfers)
    if (type === "withdrawal" || type === "transfer") {
      if (!fromAccountId) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          status: "fail",
          message: `fromAccountId is required for ${type}.`,
        });
      }

      sourceAccount = await Account.findById(fromAccountId).session(session);
      if (!sourceAccount) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ status: "fail", message: "Source account not found." });
      }

      // Business Rule: Frozen/Inactive accounts cannot transact
      if (sourceAccount.status !== "active") {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          status: "fail",
          message: `Source account is ${sourceAccount.status}. Transactions are not allowed.`,
        });
      }

      // Business Rule: Customers cannot transfer/withdraw more than their balance
      const currentBalance = Number(sourceAccount.balance);
      if (currentBalance < numericAmount) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          status: "fail",
          message: "Insufficient funds in source account.",
        });
      }
    }

    // 3. Validate Target Account (Deposits & Transfers)
    if (type === "deposit" || type === "transfer") {
      if (!toAccountId) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          status: "fail",
          message: `toAccountId is required for ${type}.`,
        });
      }

      targetAccount = await Account.findById(toAccountId).session(session);
      if (!targetAccount) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ status: "fail", message: "Target account not found." });
      }

      // Business Rule: Cannot deposit into a frozen or closed account
      if (targetAccount.status !== "active") {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          status: "fail",
          message: `Target account is ${targetAccount.status}. Transactions are not allowed.`,
        });
      }
    }

    // 4. Business Rule: Beneficiary must be approved â€” mandatory for every transfer,
    //    not just ones that happen to include beneficiaryAccountNumber
    if (type === 'transfer') {
      const { beneficiaryAccountNumber } = req.body;
      if (!beneficiaryAccountNumber) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ status: 'fail', message: 'beneficiaryAccountNumber is required for a transfer.' });
      }
      const beneficiary = await Beneficiary.findOne({
        customerId: sourceAccount.customer,
        beneficiaryAccountNumber,
        status: 'approved',
      }).session(session);
      if (!beneficiary) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ status: 'fail', message: 'Transfer failed: beneficiary is either unapproved or does not exist.' });
      }
    }

    // 5. Business Rule: high-value transfers need a second approval before completing
    const settings = await SystemSettings.findOne().session(session);
    const needsApproval = type === 'transfer' && numericAmount > (settings ? Number(settings.transactionApprovalThreshold) : Infinity);

    // 6. Only touch balances if it doesn't need approval â€” an approval-pending
    //    transaction shouldn't move money until someone signs off on it
    if (!needsApproval) {
      if (sourceAccount) {
        sourceAccount.balance = mongoose.Types.Decimal128.fromString(
          (Number(sourceAccount.balance) - numericAmount).toFixed(2)
        );
        await sourceAccount.save({ session });
      }
      if (targetAccount) {
        targetAccount.balance = mongoose.Types.Decimal128.fromString(
          (Number(targetAccount.balance) + numericAmount).toFixed(2)
        );
        await targetAccount.save({ session });
      }
    }

    // 7. Create Transaction Record
    const refNum = referenceNumber || generateReferenceNumber();
    const [newTransaction] = await Transaction.create(
      [
        {
          referenceNumber: refNum,
          type,
          fromAccountId: fromAccountId || undefined,
          toAccountId: toAccountId || undefined,
          amount: mongoose.Types.Decimal128.fromString(numericAmount.toFixed(2)),
          currency,
          status: needsApproval ? 'requires_approval' : 'completed',
          requiresApproval: needsApproval,
          initiatedBy: req.user._id,
        },
      ],
      { session }
    );

    // Commit all changes atomically
    await session.commitTransaction();
    session.endSession();

    // 7. Record Audit Log
    await recordLog({
      actorId: req.user._id,
      action: "transaction.create",
      entityType: "Transaction",
      entityId: newTransaction._id,
      details: {
        referenceNumber: refNum,
        type,
        amount: numericAmount,
        fromAccountId,
        toAccountId,
      },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(201).json({
      status: "success",
      data: { transaction: newTransaction },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    if (err.code === 11000) {
      return res.status(400).json({
        status: "fail",
        message: "Reference number already exists.",
      });
    }

    res.status(500).json({ status: "error", message: err.message });
  }
};

// --- GET ALL TRANSACTIONS ---
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate({
        path: "fromAccountId",
        select: "accountNumber currency balance status",
      })
      .populate({
        path: "toAccountId",
        select: "accountNumber currency balance status",
      })
      .populate({
        path: "initiatedBy",
        select: "firstName lastName email role",
      })
      .populate({
        path: "approvedBy",
        select: "user employeeId department",
        populate: {
          path: "user",
          select: "firstName lastName email",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: transactions.length,
      data: transactions,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// --- GET SINGLE TRANSACTION ---
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate({
        path: "fromAccountId",
        select: "accountNumber currency balance status",
      })
      .populate({
        path: "toAccountId",
        select: "accountNumber currency balance status",
      })
      .populate({
        path: "initiatedBy",
        select: "firstName lastName email role",
      })
      .populate({
        path: "approvedBy",
        select: "user employeeId department",
        populate: {
          path: "user",
          select: "firstName lastName email",
        },
      });

    if (!transaction) {
      return res.status(404).json({ status: "fail", message: "Transaction not found" });
    }

    res.status(200).json({ status: "success", data: transaction });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.approve = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const txn = await Transaction.findById(req.params.id).session(session);
    if (!txn || txn.status !== 'requires_approval') {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ status: 'fail', message: 'Nothing pending approval for this id.' });
    }

    const [source, target] = await Promise.all([
      txn.fromAccountId ? Account.findById(txn.fromAccountId).session(session) : null,
      txn.toAccountId ? Account.findById(txn.toAccountId).session(session) : null,
    ]);
    if (source && Number(source.balance) < Number(txn.amount)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ status: 'fail', message: 'Insufficient funds at approval time.' });
    }

    if (source) {
      source.balance = mongoose.Types.Decimal128.fromString((Number(source.balance) - Number(txn.amount)).toFixed(2));
      await source.save({ session });
    }
    if (target) {
      target.balance = mongoose.Types.Decimal128.fromString((Number(target.balance) + Number(txn.amount)).toFixed(2));
      await target.save({ session });
    }

    txn.status = 'completed';
    txn.approvedBy = req.employee._id;
    await txn.save({ session });

    await session.commitTransaction();
    session.endSession();

    await recordLog({
      actorId: req.user._id,
      action: 'transaction.approve',
      entityType: 'Transaction',
      entityId: txn._id,
      details: { approvedBy: txn.approvedBy },
    }).catch((err) => console.error('Audit log failed:', err.message));

    res.status(200).json({ status: 'success', data: txn });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ status: 'error', message: err.message });
  }
};

```
## Routes

### 
```javascript
const express = require('express');
const accountController = require('../controllers/accountController');
const { protect, restrictTo } = require('../middleware/authMiddleWare');
const router = express.Router();

router.use(protect);

router.post('/accounts', restrictTo('teller', 'admin'), accountController.createAccount);
router.get('/mine', restrictTo('customer'), accountController.getMyAccounts);
router.get('/accounts', restrictTo('teller', 'branch-manager', 'admin'), accountController.getAllAccounts);
router.get('/accounts/:id', restrictTo('customer', 'teller', 'branch-manager', 'admin'), accountController.getAccount);
router.put('/accounts/:id', restrictTo('teller', 'branch-manager', 'admin'), accountController.updateAccount);
router.delete('/accounts/:id', restrictTo('admin'), accountController.deleteAccount);
router.post('/accounts/:id/deposit', restrictTo('customer', 'teller', 'admin'), accountController.deposit);
router.post('/accounts/:id/withdraw', restrictTo('customer', 'teller', 'admin'), accountController.withdraw);

module.exports = router;

```

### 
```javascript
const express = require('express');
const auditLogController = require('../controllers/auditLogController');
const {protect,restrictTo} = require('../middleware/authMiddleWare')
const router = express.Router();

router.use(protect)
router.use(restrictTo('compliance-officer','admin'))
router.get("/", auditLogController.getAllLogs);
router.get("/actor/:actorId", auditLogController.getLogsByActor);
router.get("/entity/:entityType/:entityId", auditLogController.getLogsByEntity);
router.get("/:id", auditLogController.getLogById);

module.exports = router;

```

### 
```javascript
const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/users/signup', authController.signUp);
router.post('/users/login', authController.login);


module.exports = router;

```

### 
```javascript
const express = require('express');
const beneficiaryController = require('../controllers/beneficiaryController');
const {protect,restrictTo} = require('../middleware/authMiddleWare')
const router = express.Router();

router.use(protect);
router.post('/beneficiaries',restrictTo('customer'),beneficiaryController.createBeneficiary);
router.get('/beneficiaries', restrictTo('customer', 'teller', 'compliance_officer', 'admin'), beneficiaryController.getAllBeneficiaries);
router.get('/beneficiaries/:id', restrictTo('customer', 'teller', 'compliance_officer', 'admin'), beneficiaryController.getBeneficiary);
router.put('/beneficiaries/:id', restrictTo('customer'), beneficiaryController.updateBeneficiary);
router.put('/beneficiaries/:id/status', restrictTo('teller', 'compliance_officer'), beneficiaryController.updateStatus);
router.delete('/beneficiaries/:id', restrictTo('customer', 'admin'), beneficiaryController.deleteBeneficiary);

module.exports = router;

```

### 
```javascript
const express = require('express');
const branchController = require('../controllers/branchController');
const { protect, restrictTo } = require('../middleware/authMiddleWare');

const router = express.Router();

router.use(protect);

router.get('/branches', restrictTo('teller', 'loan_officer', 'compliance_officer', 'branch-manager', 'admin'), branchController.getAllBranches);
router.get('/branches/:id', restrictTo('teller', 'loan_officer', 'compliance_officer', 'branch-manager', 'admin'), branchController.getBranch);
router.post('/branches', restrictTo('admin'), branchController.createBranch);
router.put('/branches/:id', restrictTo('admin'), branchController.updateBranch);
router.delete('/branches/:id', restrictTo('admin'), branchController.deleteBranch);
module.exports = router;

```

### 
```javascript
const express = require('express');
const cardController = require('../controllers/cardController');
const {protect,restrictTo}=require('../middleware/authMiddleWare')
const router = express.Router();

router.use(protect);

router.get('/cards/mine', restrictTo('customer'), cardController.getMyCards);
router.get('/cards', restrictTo('teller', 'branch-manager', 'admin'), cardController.getAllCards);
router.get('/cards/:id', restrictTo('customer', 'teller', 'branch-manager', 'admin'), cardController.getCard);
router.post('/cards/', restrictTo('customer', 'teller'), cardController.createCard);
router.put('/cards/:id/status', restrictTo('teller', 'compliance_officer', 'admin'), cardController.updateStatus);
router.put('/cards/:id/cancel', restrictTo('customer', 'teller', 'admin'), cardController.cancelCard);
module.exports = router;

```

### 
```javascript
const express = require('express');
const customerController = require('../controllers/customerController');
const {protect,restrictTo} = require('../middleware/authMiddleWare')
const router = express.Router();

// staff-only: browsing/managing every customer
router.post('/customers',restrictTo('teller', 'branch-manager', 'admin','customer'),customerController.createCustomer)
router.get('/customers', restrictTo('teller', 'branch-manager', 'admin'), customerController.getAllCustomers);
router.get('/customers/:id', restrictTo('teller', 'branch-manager', 'admin'), customerController.getCustomer);
router.put('/customers/:id', restrictTo('teller', 'branch-manager', 'admin'), customerController.updateCustomer);

// a customer updating their own contact info â€” no restrictTo, since anyone
router.put('/me', restrictTo('customer'), customerController.updateCustomer);

module.exports = router;

```

### 
```javascript
const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleWare');
const employeeController = require('../controllers/employeeController');
const router = express.Router();

router.use(protect);
router.use(restrictTo('admin', 'branch-manager')); // every route here is staff-management only

router.get('/employees', employeeController.getAllEmployees);
router.get('/employees/:id', employeeController.getEmployee);
router.post('/employees', employeeController.createEmployee);
router.put('/employees/:id', employeeController.updateEmployee);
router.delete('/employees/:id', employeeController.deleteEmployee);
module.exports = router;

```

### 
```javascript
const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleWare');
const fraudAlertController = require('../controllers/fraudAlertController');
const router = express.Router();

router.use(protect);
router.use(restrictTo('compliance_officer', 'admin')); // every route here is compliance-only

router.get('/fraudAlerts', fraudAlertController.getAllFraudAlerts);
router.get('/fraudAlerts/:id', fraudAlertController.getFraudAlert);
router.post('/fraudAlerts', fraudAlertController.createFraudAlert);
router.delete('/fraudAlerts',fraudAlertController.deleteFraudAlert)
router.put('/fraudAlerts/:id',fraudAlertController.updateFraudAlert)
router.put('/fraudAlerts/:id/status', fraudAlertController.updateStatus);
module.exports = router;

```

### 
```javascript
const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleWare');
const loanController = require('../controllers/loanController');
const router = express.Router();

router.use(protect);

router.post('/loans', restrictTo('customer'), loanController.createLoan);
router.get('/loans', restrictTo('loan_officer', 'branch-manager', 'admin'), loanController.getAllLoans);
router.get('/loans/:id', restrictTo('customer', 'loan_officer', 'branch-manager', 'admin'), loanController.getLoan);
router.put('/loans/:id', restrictTo('loan_officer'), loanController.updateLoan);
router.put('/loans/:id/status', restrictTo('loan_officer', 'branch-manager'), loanController.updateStatus);
router.delete('/loans/:id', restrictTo('admin'), loanController.deleteLoan);
module.exports = router;

```

### 
```javascript
const express = require('express');
const notificationController = require('../controllers/notificationController');
const {protect,restrictTo} = require('../middleware/authMiddleWare')
const router = express.Router();

router.use(protect);

router.post('/notifications',restrictTo('teller','branch-manager','admin'),notificationController.createNotification)
router.get('/notifications/:id',notificationController.getNotification)
router.get('/notifications/mine', notificationController.getMyNotifications); // any logged-in role
router.get('/notifications/admin', restrictTo('admin'), notificationController.getAllNotifications);
router.put('/notifications/:id/read', notificationController.markAsRead);
router.put('/notifications/read-all', notificationController.markAllAsRead);
router.delete('/notifications/:id', notificationController.deleteNotification);

module.exports = router;

```

### 
```javascript
const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleWare');
const systemSettingsController = require('../controllers/systemSettingController');
const router = express.Router();
router.use(protect);
router.use(restrictTo('admin'));

router.get('/systemSettings', systemSettingsController.getSystemSettings);
router.put('/systemSettings', systemSettingsController.updateSystemSettings);


module.exports = router;

```

### 
```javascript
const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleWare');
const teamController = require('../controllers/teamController');
const router = express.Router();
router.use(protect);
router.use(restrictTo('admin', 'branch-manager'));

router.get('/teams', teamController.getAllTeams);
router.get('/teams/:id', teamController.getTeam);
router.post('/teams', teamController.createTeam);
router.put('/teams/:id', teamController.updateTeam);
router.delete('/teams/:id', teamController.deleteTeam);
router.put('/teams/:id/add-member', teamController.addMember);
router.put('/teams/:id/remove-member', teamController.removeMember);

module.exports = router;

```

### 
```javascript
const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleWare');
const transactionController = require('../controllers/transactionController');
const router = express.Router();
router.use(protect);

router.post('/transactions', restrictTo('customer', 'teller'), transactionController.createTransaction);
router.get('/transactions', restrictTo('teller', 'compliance_officer', 'branch-manager', 'admin'), transactionController.getAllTransactions);
router.get('/transactions/:id', restrictTo('customer', 'teller', 'compliance_officer', 'branch-manager', 'admin'), transactionController.getTransaction);
router.put('/transactions/:id/approve', restrictTo('branch-manager'), transactionController.approve);

module.exports = router;

```
## Utils

### 
```javascript
// utils/auditLogger.js
const AuditLog = require('../models/auditLogSchema');

/**
 * Safely records an immutable audit log entry.
 */
exports.recordLog = async ({ actorId, action, entityType, entityId, details }) => {
  try {
    await AuditLog.create({
      actorId,
      action,
      entityType,
      entityId,
      details,
    });
  } catch (err) {
    // Log error internally so an audit failure doesn't crash the core request
    console.error('Failed to create audit log:', err.message);
  }
};
```

### 
```javascript
const aws = require('aws-sdk');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
require('dotenv').config();

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const uploadToS3 = async (file, folder = 'uploads') => {
  if (!file) {
    throw new Error('No file provided');
  }

  const resizedBuffer = await sharp(file.buffer)
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  const fileExt = '.jpg';
  const key = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: resizedBuffer,
    ContentType: 'image/jpeg',
    ACL: 'public-read',
  };

  const result = await s3.upload(params).promise();
  return result.Location;
};

module.exports = {
  upload,
  uploadToS3,
};

```

### 
```javascript

exports.generateAmortizationSchedule = (
  principal,
  annualInterestRate,
  termMonths,
  startDate = new Date()
) => {
  const schedule = [];
  const monthlyRate = annualInterestRate / 100 / 12;

  let monthlyPayment;
  if (monthlyRate === 0) {
    monthlyPayment = principal / termMonths;
  } else {
    monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);
  }

  for (let i = 1; i <= termMonths; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      installmentNumber: i,
      dueDate,
      amount: Number(monthlyPayment.toFixed(2)),
      status: "due",
    });
  }

  return schedule;
};
```
## index.js
```javascript
const express = require('express');
const app = express();
const cors = require('cors');
const { connectDB } = require('./database');

const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const branchRoutes = require('./routes/branchRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const loanRoutes = require('./routes/loanRoutes');
const beneficiaryRoutes = require('./routes/beneficiaryRoutes');
const cardRoutes = require('./routes/cardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const teamRoutes = require('./routes/teamRoutes');
const systemSettingRoutes = require('./routes/systemSettingRoutes');
const fraudAlertRoutes = require('./routes/fraudAlertRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');

app.use(express.json());
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/system-settings', systemSettingRoutes);
app.use('/api/fraud-alerts', fraudAlertRoutes);
app.use('/api/audit-logs', auditLogRoutes);


connectDB();

app.listen(4000, () => {
  console.log('server is running on port 4000');
});

```
