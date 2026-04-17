const express = require("express");
const { getChatHistory } = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:userId", protect, getChatHistory);

module.exports = router;
