const express = require("express");
const router = express.Router();

const Notification = require("../models/notificationModel");

router.post("/ct", async (req, res) => {
  const notification = await Notification.create({
    recipient: req.body.recipient,
    sender: req.body.sender,
    type: "FOLLOW",
  });

  res.json(notification);
});

module.exports = router;