const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');
const Customer = require('../models/customerSchema');
const Employee = require('../models/employeeSchema');
const validator = require('validator');


require('dotenv').config();


const signToken = (user)=>{
  return jwt.sign(
    {
      id:user._id,
      firstName:user.firstName,
      lastName:user.lastName,
      role:user.role,

    },
    process.env.JWT_SECRET,
    {expiresIn:process.env.JWT_EXPIRE || "20m"}
  );
}

const createSendToken = (user,statusCode,message,res)=>{
  const token = signToken(user);

  const sanitizeUser ={
    id:user._id,
    firstName:user.firstName,
    lastName:user.lastName,
    role:user.role,
  };
  res.status(statusCode).json({
    status:"success",
    token,
    message,
    data:{user:sanitizeUser}
  });
}

exports.signUp = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      userName,
      email,
      password,
      passwordConfirm,
      role,
    } = req.body;

    if (!['customer', 'employee'].includes(role)) {
      return res.status(403).json({
        message: 'Forbidden: Only customers or employees can perform this action.',
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address!' });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ message: 'Please enter matching passwords!' });
    }

    const finalRole = role === 'employee' ? 'employee' : 'customer';

    const existingUser = await User.findOne({ $or: [{ email }, { userName }] });
    if (existingUser) {
      return res.status(409).json({ message: `An account with that email or username already exists.` });
    }

    const { employeeId, jobTitle, branchId, teamId, staffAccessCode } = req.body;
    if (finalRole === 'employee') {
      if (!employeeId || !jobTitle) {
        return res.status(400).json({ message: 'Employee ID and job title are required for employee accounts.' });
      }
      if (!staffAccessCode) {
        return res.status(400).json({ message: 'A staff access code is required for employee accounts.' });
      }
      const allowedStaffCode = process.env.STAFF_ACCESS_CODE || 'NEOBANK-STAFF';
      if (staffAccessCode !== allowedStaffCode) {
        return res.status(403).json({ message: 'Invalid staff access code.' });
      }
    }

    const { nationalId, dateOfBirth, phone, address } = req.body;
    if (finalRole === 'customer') {
      if (!nationalId || !dateOfBirth || !phone || !address?.country || !address?.city) {
        return res.status(400).json({
          message: 'National ID, Date of Birth, Phone, Country, and City are required.',
        });
      }
    }

    const newUser = await User.create({
      firstName,
      lastName,
      userName,
      email,
      password,
      role: finalRole,
    });

    if (finalRole === 'employee') {
      await Employee.create({
        user: newUser._id,
        employeeId,
        jobTitle,
        branchId: branchId || null,
        teamId: teamId || null,
      });
    } else {
      await Customer.create({
        user: newUser._id,
        nationalId,
        dateOfBirth,
        phone,
        address,
      });
    }

    return createSendToken(newUser, 201, `User ${newUser.firstName} has been created successfully`, res);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req,res)=>{
    try {
        const {email,password}=req.body;
        const user = await User.findOne({ email });
        if(!user || !(await user.checkPassword(password,user.password))){
            return res.status(401).json({message:"Wrong User Credentials"});
        }
        createSendToken(user,200,"You are logged in successfully!!",res);
    } catch (err) {
        console.log(err);
        return res.status(500).json({message:err.message});
    }
}


exports.getAllUser = async (req, res) => {
  try {
    // Select all user fields EXCLUDING password and passwordConfirm
    const users = await User.find().select("-password -passwordConfirm");

    res.status(200).json({
      status: "success",
      results: users.length,
      data: users,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};