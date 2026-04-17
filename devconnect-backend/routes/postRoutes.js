const express = require("express");

const router = express.Router();

const { createPost ,getPosts, getpostbyid ,deletePost,likePost,addComment,unlike,deletecomment,getfeedpost,bookmarksPost,removeBookmark,getPostsByUser,} = require("../controllers/postcontroller");

const { protect } = require("../middleware/authMiddleware");


// Create post route (protected)
router.post("/", protect, createPost);
router.get("/", protect, getPosts);
router.get("/feed",protect,getfeedpost);
router.get("/:id",protect,getpostbyid);
router.delete("/:id",protect,deletePost);
router.put("/:id/like", protect, likePost);
router.put("/:id/unlike",protect,unlike);
router.post("/:id/comment",protect,addComment);
router.delete("/:id/comment",protect,deletecomment);
router.post("/:id/bookmark",protect,bookmarksPost);
router.delete("/:id/bookmark",protect,removeBookmark);
router.get("/user/:userId", protect, getPostsByUser);

module.exports = router;
