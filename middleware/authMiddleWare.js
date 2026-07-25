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

// Restrict routes by role or employee job title
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // 1. Get the user's top-level role ('customer' or 'employee')
    const userRole = req.user.role;
    
    // 2. Get the specific job title if they are an employee ('admin', 'branch-manager', etc.)
    const jobTitle = req.employee ? req.employee.jobTitle : null;

    // 3. Check if either match the permitted roles
    const isAuthorized = roles.includes(userRole) || (jobTitle && roles.includes(jobTitle));

    if (!isAuthorized) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to perform this action.",
      });
    }

    next();
  };
};