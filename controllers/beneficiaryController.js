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