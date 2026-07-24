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

    // 4. Business Rule: Beneficiary must be approved — mandatory for every transfer,
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

    // 6. Only touch balances if it doesn't need approval — an approval-pending
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
