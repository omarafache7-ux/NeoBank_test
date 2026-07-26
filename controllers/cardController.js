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

// (Staff / Admin Only)
exports.getAllCards = async (req, res) => {
  try {
    const cards = await Card.find()
      .populate("account", "accountNumber currency status") // Fixed field name
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

exports.getCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id)
      .populate("account", "accountNumber currency status") 
      .populate("customerId", "firstName lastName email phone");

    if (!card) {
      return res.status(404).json({ status: "fail", message: "Card not found" });
    }

    const customerId = req.customer?._id || req.user?.customerId;

    if (
      req.user.role === "customer" &&
      card.customerId._id.toString() !== customerId?.toString()
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


exports.getMyCards = async (req, res) => {
  try {
    const customerId = req.customer?._id || req.user?.customerId || req.user?._id;

    if (!customerId) {
      return res.status(400).json({
        status: "fail",
        message: "Customer identification not found on request.",
      });
    }

    const cards = await Card.find({ customerId })
      .populate("account", "accountNumber currency status") 
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: cards.length,
      data: cards,
    });
  } catch (err) {
    console.error("Error in getMyCards:", err);
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