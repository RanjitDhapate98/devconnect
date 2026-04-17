const express = require("express");
const { followUser, unfollowUser,getfollowing,getFollowers,getbookmark,getmypf,updateMyProfile,getAllUsers,uploadProfilePicture,getPublicProfile } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/",protect,getAllUsers);
router.put("/:id/follow", protect, followUser);
router.put("/:id/unfollow", protect, unfollowUser);
router.get("/:id/getfollowing", protect, getfollowing);
router.get("/:id/getfollowers", protect, getFollowers);
router.get("/bookmarks", protect, getbookmark);
router.get("/me",protect,getmypf);
router.patch("/me",protect,updateMyProfile);
router.patch("/me/profile-picture",protect,upload.single("profilePicture"),uploadProfilePicture);
router.get("/:id",protect,getPublicProfile);



module.exports = router;
