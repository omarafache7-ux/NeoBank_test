const Branch = require('../models/branchSchema');
const { recordLog } = require('../utils/auditLogger');


exports.createBranch = async (req, res) => {
  try {
    const { name,code,address} =
      req.body;
    if(!name||!code||!address){
        return res.status(404).json({message:"Invalid inputs!!"});
    }
    const existingBranch = await Branch.findOne({ name });

    if (existingBranch) {
      return res.status(400).json({
        status: "failed",
        message: "A Branch already exists.",
      });
    }

    const newBranch = await Branch.create({
      name,code,address
    });
    await recordLog({
      actorId: req.user._id,
      action: "branch.create",
      entityType: "Branch",
      entityId: newBranch._id,
      details: { name, code, address },
    });

    res.status(201).json({
      status: "success",
      data: {
        branch: newBranch,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find();
     

    res.status(200).json({
      status: "success",
      results: branches.length,
      data: branches,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
exports.getBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
    
    if (!branch) {
      return res
        .status(404)
        .json({ status: "fail", message: "Branch not found" });
    }
    res.status(200).json({ status: "success", data: branch });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
exports.updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!branch) {
      return res
        .status(404)
        .json({ status: "fail", message: "Branch not found" });
    }
    await recordLog({
      actorId: req.user._id,
      action: "branch.update",
      entityType: "Branch",
      entityId: branch._id,
      details: req.body,
    });
    res.status(200).json({ status: "success", data: branch });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) {
      return res
        .status(404)
        .json({ status: "fail", message: "Branch not found" });
    }
    await recordLog({
      actorId: req.user._id,
      action: "branch.delete",
      entityType: "Branch",
      entityId: req.params.id,
      details: { deletedBranchName: branch.name, code: branch.code },
    });
    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};