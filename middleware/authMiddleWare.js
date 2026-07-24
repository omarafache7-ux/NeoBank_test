const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");
const Customer = require("../models/customerSchema");
const Employee = require("../models/employeeSchema");

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in. Please log in to get access.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "The user belonging to this token no longer exists.",
      });
    }

    // Grant access to protected route
    req.user = currentUser;

    if (currentUser.role === "customer") {
      req.customer = await Customer.findOne({ user: currentUser._id });
    } else {
      req.employee = await Employee.findOne({ user: currentUser._id });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      status: "fail",
      message: "Invalid token or session expired.",
    });
  }
};

// Restrict routes by role
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check against req.user.role instead of req.user.userType
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to perform this action.",
      });
    }
    next();
  };
};