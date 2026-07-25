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