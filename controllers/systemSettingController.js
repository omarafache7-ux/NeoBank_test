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