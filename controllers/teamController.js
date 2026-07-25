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