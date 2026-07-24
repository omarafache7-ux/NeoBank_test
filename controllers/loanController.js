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

    // Force strict defaults — ignore any status, repaymentSchedule, or loanOfficerId sent by client
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