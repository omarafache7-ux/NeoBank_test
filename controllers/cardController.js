const Card = require("../models/cardSchema");
const Account = require("../models/accountSchema");
const { recordLog } = require("../utils/auditLogger");


exports.createCard = async (req, res) => {
  try {
    const { accountId, type, last4, status } = req.body;

    // 1. Basic validation
    if (!accountId || !type || !last4) {
      return res.status(400).json({
        status: "fail",
        message: "accountId, type, and last4 are required fields.",
      });
    }

    if (!/^\d{4}$/.test(last4)) {
      return res.status(400).json({
        status: "fail",
        message: "last4 must consist of exactly 4 digits.",
      });
    }

    if (!["debit", "credit", "prepaid"].includes(type)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid card type. Allowed values: debit, credit, prepaid.",
      });
    }

    // 2. Account Existence & Status Check
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({
        status: "fail",
        message: "Account not found.",
      });
    }

    if (account.status !== "active") {
      return res.status(400).json({
        status: "fail",
        message: `Cannot issue a card for an account with status '${account.status}'.`,
      });
    }

    // 3. Derive customerId directly from the verified account
    const derivedCustomerId = account.customerId;

    // 4. Create Card (Fallback to 'requested' if status not provided)
    const initialStatus = status || "requested";

    const card = await Card.create({
      accountId,
      customerId: derivedCustomerId,
      type,
      last4,
      status: initialStatus,
    });

    await recordLog({
      actorId: req.user._id,
      action: "card.create",
      entityType: "Card",
      entityId: card._id,
      details: {
        accountId,
        customerId: derivedCustomerId,
        type,
        last4,
        status: initialStatus,
      },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(201).json({ status: "success", data: card });
  } catch (err) {
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