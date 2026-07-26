const Employee = require("../models/employeeSchema");
const Branch = require("../models/branchSchema")
const User = require("../models/userSchema")


exports.createEmployee = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      userName,
      email,
      password,
      employeeId,
      jobTitle,
      branchCode,
      teamId,
    } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { userName }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "A user with this email or username already exists.",
      });
    }

    const existingEmployee = await Employee.findOne({ employeeId });

    if (existingEmployee) {
      return res.status(400).json({
        message: "An employee with this Employee ID already exists.",
      });
    }


    let branch = null;
    if (branchCode) {
      branch = await Branch.findOne({ code: branchCode });
      if (!branch) {
        return res.status(400).json({
          message: `No branch found with code "${branchCode}".`,
        });
      }
    }

    const newUser = await User.create({
      firstName,
      lastName,
      userName,
      email,
      password,
      role: "employee",
    });


    const newEmployee = await Employee.create({
      user: newUser._id,
      employeeId,
      jobTitle,
      branchId: branch ? branch._id : null,   
      teamId: teamId || null,
    });

    res.status(201).json({
      status: "success",
      data: {
        user: {
          _id: newUser._id,
          firstName: newUser.firstName,
          email: newUser.email,
          role: newUser.role,
        },
        employee: newEmployee,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate({
        path: "user",
        select: "firstName lastName userName email role", 
      })
      .populate({
        path: "branchId",
        select: "name code address",
      })
      .populate({
        path: "teamId",
        select: "name branch managerId",
      });

    res.status(200).json({
      status: "success",
      results: employees.length,
      data: employees,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate({
        path: "user",
        select: "firstName lastName userName email role", 
      })
      .populate({
        path: "branchId",
        select: "name code address",
      })
      .populate({
        path: "teamId",
        select: "name branch managerId",
      });

    if (!employee) {
      return res
        .status(404)
        .json({ status: "fail", message: "Employee not found" });
    }
    res.status(200).json({ status: "success", data: employee });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!employee) {
      return res
        .status(404)
        .json({ status: "fail", message: "Employee not found" });
    }
    res.status(200).json({ status: "success", data: employee });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res
        .status(404)
        .json({ status: "fail", message: "Employee not found" });
    }
    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
