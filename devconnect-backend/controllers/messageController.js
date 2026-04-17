const Message = require("../models/message");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const getChatHistory = asyncHandler(async (req, res) => {

  const otherUserId = req.params.userId;
  const currentUserId = req.user._id;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const skip = (page - 1) * limit;

  const messages = await Message.find({
    $or: [
      { sender: currentUserId, receiver: otherUserId },
      { sender: otherUserId, receiver: currentUserId }
    ]
  })
    .sort({ createdAt: -1 }) // newest first
    .skip(skip)
    .limit(limit)
    .populate("sender", "name profilePicture")
    .populate("receiver", "name profilePicture");

  const totalMessages = await Message.countDocuments({
    $or: [
      { sender: currentUserId, receiver: otherUserId },
      { sender: otherUserId, receiver: currentUserId }
    ]
  });

  res.status(200).json({
    status: "success",
    totalMessages,
    currentPage: page,
    totalPages: Math.ceil(totalMessages / limit),
    data: messages.reverse()
  });

});

module.exports = { getChatHistory };
