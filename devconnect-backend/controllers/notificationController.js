const Notification = require("../models/notificationModel");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    recipient: req.user._id,
  })
    .populate("sender", "username profilePicture")
    .populate("post", "content")
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({
    status: "success",
    data: notifications,
  });
});


const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    throw new AppError("Notification not found", 404);
  }


  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw new AppError("Not authorized", 403);
  }


  notification.isRead = true;

  await notification.save();

  res.json({
    status: "success",
    message: "Notification marked as read",
  });

});
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false
  });

  res.json({
    status: "success",
    unreadCount: count
  });

});

module.exports={getNotifications,markAsRead,getUnreadCount};