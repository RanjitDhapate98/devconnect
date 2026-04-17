const Notification = require("../models/notificationModel");

const createNotification = async ({
  recipient,
  sender,
  type,
  post = null,
  io,
}) => {
  if (recipient.toString() === sender.toString()) return;

  const notification = await Notification.create({
    recipient,
    sender,
    type,
    post,
  });

 
  io.to(recipient.toString()).emit("newNotification", notification);

  return notification;
};

module.exports = {
  createNotification

};