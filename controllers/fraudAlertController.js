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