const Notification = require("../models/notificationSchema");
const User = require('../models/userSchema');
const { recordLog } = require("../utils/auditLogger");


exports.createNotification = async (req, res) => {
  try {
    const { userId, message, type, read } = req.body;

    if (!userId || !message || !type) {
      return res.status(400).json({
        status: "fail",
        message: "userId, message, and type are required fields.",
      });
    }

    if (!["transaction", "loan", "security", "system"].includes(type)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid notification type. Allowed values: transaction, loan, security, system.",
      });
    }
    const checkUser = await User.findById(userId);
    if(!checkUser){
      return res.status(404).json({message:`User does not exist`})
    }

    const newNotification = await Notification.create({
      user:checkUser._id,
      message,
      type,
      read: read ?? false,
    });

    await recordLog({
      actorId: req.user._id,
      action: "notification.create",
      entityType: "Notification",
      entityId: newNotification._id,
      details: { userId, type, read: newNotification.read },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(201).json({
      status: "success",
      data: { notification: newNotification },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate({
        path: "userId",
        select: "firstName lastName email role",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: notifications.length,
      data: notifications,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    res.status(200).json({
      status: "success",
      results: notifications.length,
      unreadCount,
      data: notifications,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id).populate({
      path: "userId",
      select: "firstName lastName email role",
    });

    if (!notification) {
      return res.status(404).json({ status: "fail", message: "Notification not found" });
    }

    res.status(200).json({ status: "success", data: notification });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({ status: "fail", message: "Notification not found" });
    }

    res.status(200).json({
      status: "success",
      data: notification,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({
      status: "success",
      message: `${result.modifiedCount} notification(s) marked as read.`,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ status: "fail", message: "Notification not found" });
    }

    await recordLog({
      actorId: req.user._id,
      action: "notification.delete",
      entityType: "Notification",
      entityId: req.params.id,
      details: { userId: notification.userId, type: notification.type },
    }).catch((err) => console.error("Audit log failed:", err.message));

    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};