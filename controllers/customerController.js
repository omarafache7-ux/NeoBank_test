const User = require("../models/userSchema");
const Customer = require("../models/customerSchema");


exports.createCustomer = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      userName,
      email,
      password,
      nationalId,
      dateOfBirth,
      phone,
      address,
    } = req.body;
    const existingUser = await User.findOne({
      $or: [{ email }, { userName }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "A user with this email or username already exists.",
      });
    }

    const existingCustomer = await Customer.findOne({ nationalId });

    if (existingCustomer) {
      return res.status(400).json({
        message: "An Customer already exists.",
      });
    }

    const newUser = await User.create({
      firstName,
      lastName,
      userName,
      email,
      password,
      role: "customer",
    });

    
    const newCustomer = await Customer.create({
      user: newUser._id,
      nationalId,
      dateOfBirth,
      phone,
      address,
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
        customer: newCustomer,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find()
      .populate({
        path: "user",
        select: "firstName lastName userName email role", // exclude password
      })
      .populate({
        path: "branchId",
        select: "name code address",
      });

    res.status(200).json({
      status: "success",
      results: customers.length,
      data: customers,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate({
        path: "user",
        select: "firstName lastName userName email role", // Exclude password
      })
      .populate({
        path: "branchId",
        select: "name code address",
      });

    if (!customer) {
      return res
        .status(404)
        .json({ status: "fail", message: "Customer not found" });
    }
    res.status(200).json({ status: "success", data: customer });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
exports.updateCustomer = async (req, res) => {
  try {
    // If param ID is missing (like in /me), fallback to req.customer or find by user ID
    let targetId = req.params.id;

    if (!targetId) {
      const customer = await Customer.findOne({ user: req.user._id });
      if (!customer) {
        return res.status(404).json({ status: "fail", message: "Customer profile not found" });
      }
      targetId = customer._id;
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(targetId, req.body, {
      new: true,
      runValidators: true,
    }).populate("user", "firstName lastName userName email role");

    res.status(200).json({ status: "success", data: updatedCustomer });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
exports.getMyProfile = async (req, res) => {
  try {
    const customer = await Customer.findOne({ user: req.user._id })
      .populate({
        path: "user",
        select: "firstName lastName userName email role",
      })
      .populate({
        path: "branchId",
        select: "name code address",
      });

    if (!customer) {
      return res.status(404).json({
        status: "fail",
        message: "Customer profile not found for this user.",
      });
    }

    res.status(200).json({ status: "success", data: customer });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res
        .status(404)
        .json({ status: "fail", message: "Customer not found" });
    }
    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
