const Loan = require("../models/loanSchema");
const Customer = require("../models/customerSchema");
const { recordLog } = require("../utils/auditLogger");
const { generateAmortizationSchedule } = require("../utils/loanService");


exports.createLoan = async (req, res) => {
  try {
    const { amount, principal, interestRate, termMonths, purpose } = req.body;
    const loanPrincipal = amount || principal;
    const defaultInterestRate = interestRate || 10.5;

    if (!loanPrincipal || !termMonths) {
      return res.status(400).json({
        status: "fail",
        message: "Loan amount and term months are required.",
      });
    }

    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) {
      return res.status(404).json({
        status: "fail",
        message: "Customer profile not found for this user account.",
      });
    }

    const loan = await Loan.create({
      customerId: customer._id,
      principal: loanPrincipal,
      interestRate: defaultInterestRate,
      termMonths,
      purpose,
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
        customerId: customer._id,
        principal: loanPrincipal,
        interestRate: defaultInterestRate,
        termMonths,
        purpose,
        status: "pending",
      },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(201).json({ status: "success", data: loan });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getMyLoans = async (req, res) => {
  try {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) {
      return res.status(404).json({ status: "fail", message: "Customer profile not found." });
    }

    const loans = await Loan.find({ customerId: customer._id }).sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: loans.length,
      data: loans,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


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


exports.updateLoan = async (req, res) => {
  try {
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

    if (status === "approved") {
      loan.decidedAt = new Date();
      loan.loanOfficerId = req.employee?._id || req.user._id;
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