const Post = require("../models/post");
const User = require("../models/user");
const mongoose = require("mongoose");
const asyncHandler=require("../utils/asyncHandler");
const AppError=require("../utils/AppError");
const post = require("../models/post");

//post creation
const createPost = asyncHandler(async (req, res) => {

    const { content } = req.body;


    if (!content) {
      throw new AppError("Post content is required",400);
    }

    const post = await Post.create({
      user: req.user._id, // comes from auth middleware
      content,
    });

    res.status(201).json({
      status:"success",
      data:post
    });

  
});


// Get all posts
const getPosts = asyncHandler(async (req, res) => {
 

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    if(page<1 || limit<1){
      throw new AppError("invalid pagination parameters",400);
    }
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments();

    res.status(200).json({
      status:"success",
      totalPosts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      data: posts
    });


  
});
//get post by id

const getpostbyid = asyncHandler(async (req, res) => {
  
    const post = await Post.findById(req.params.id)
      .populate("user", "name email");

    if (!post) {
      throw new AppError("post not found",404);
    }
    res.status(200).json({
      status:"success",
      data:post
    });

});

//delete post

const deletePost = asyncHandler(async (req, res) => {
 

    const post = await Post.findById(req.params.id);

    if (!post) {
      throw new AppError("post not found",404);
    }

    // check owner or admin
    if (
      post.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      throw new AppError("Not authorized to delete this post",403);
    }

    await post.deleteOne();

    res.status(200).json({
      status:"success",
      message:"post deleted successfully"
    });

  
});


const likePost = asyncHandler(async (req, res) => {


    const post = await Post.findById(req.params.id);

    if (!post) {
     throw new AppError("post not found",404);
    }
    
    const alreadyLiked = post.likes.some(
       (id) => id.toString() === req.user._id.toString()
       );

    if (alreadyLiked) {
      throw new AppError("post alredy liked",400);
    }

    post.likes.push(req.user._id);

    await post.save();

    await createNotification({
  recipient: post.author,
  sender: req.user._id,
  type: "LIKE",
  post: post._id,
  io,
});

    res.status(200).json({
      status:"success",
      message:"post liked successfully"
    });

  
});

const unlike = asyncHandler(async (req, res) => {

    const post = await Post.findById(req.params.id);
    if (!post) {
      throw new AppError("post not found",404);
    }
    
    //currunt user chya like ch index
    const index = post.likes.findIndex(
      (userId) => userId.toString() === req.user._id.toString()
    );

    //jrr user ne like el nasel
    if (index === -1) {
      throw new AppError("you not liked this post",400);
    }
    // romoval step
    post.likes.splice(index, 1);

    await post.save();

    res.status(200).json({
      status:"success",
      message:"post unliked successfully"
    })
  
});
const addComment = asyncHandler(async (req, res) => {

    const { text } = req.body;
    if (!text) {
      throw new AppError("comment text is required",400);
    }
    const post = await Post.findById(req.params.id);
    if (!post) {
      throw new AppError("Page not found",404);
    }
    const comment = {
      text,
      user: req.user._id
    };
    post.comments.push(comment);
    await post.save();
    res.status(200).json({
      status:"success",
      message:"comment added successfully"
    });
  
});

const deletecomment = asyncHandler(async (req, res) => {
 
    const { postID, commentID } = req.params;
    const post = await Post.findById(postID);
    if (!post) {
      throw new AppError("post not found",404);
    }

    const comment =  post.comments.id(commentID);
    if (!comment) {
       throw new AppError("comment not found",404);
    }

    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      throw new AppError("you cannot delet this comment",403);
    }
    comment.deleteOne();
    await post.save();
    res.status(200).json({
      status:"success",
      message: "comment deleted successfully"
    });
  
});
const getfeedpost = asyncHandler(async (req, res) => {
 
    
    const limit = parseInt(req.query.limit) || 10;
    const lastCreatedAt =req.query.lastCreatedAt;

    if(limit<1){
      throw new AppError("enter valid  limit",400);
    }


    const user = await User.findById(req.user._id).select("following");

    if (!user) {
      throw new AppError("User not found",404);
    }

    const followingIds = [...user.following, req.user._id];

    let query={
      user:{$in: followingIds}
    };

    if(lastCreatedAt){
       query.createdAt = { $lt: new Date(lastCreatedAt) };
    }
     const posts = await Post.find(query)
    .select("content createdAt user likes comments")
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(limit+1)
    .lean();


   let hasMore=false;
   if(post.length>limit){
    hasMore=true;
    posts.pop();
   }

    const nextCursor = posts.length > 0
    ? posts[posts.length - 1].createdAt
    : null;
  res.status(200).json({
    status: "success",
    count: posts.length,
    hasMore,
    nextCursor,
    data: posts
  });
  
});  
   
const bookmarksPost =asyncHandler(async (req, res) => {

    const postId = req.params.id;

    const user = await User.findById(req.user._id);

    // Check if already bookmarked
    const alreadyBookmarked = user.bookmarks.some(
      (id) => id.toString() === postId
    );

    if (alreadyBookmarked) {
      throw new AppError("Post already bookmarked",400);
    }

    user.bookmarks.push(postId);
    await user.save();



    res.status(200).json({
      status:"success",
      message: "Post bookmarked successfully"
    });

    
  
});
const removeBookmark =asyncHandler(async (req, res) => {

    const postId = req.params.id;
    await User.findByIdAndUpdate(
      req.user._id, {
      $pull: {
        bookmarks: postId
      }
    });
    res.status(200).json({
      status:"success",
      message: "bookmark removed successfully"
    });
  
});
const getPostsByUser = asyncHandler(async (req, res) => {

    const userId = req.params.userId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    if (page < 1 || limit < 1) {
        throw new AppError("Invalid pagination parameters", 400);
    }

    const skip = (page - 1) * limit;

    const posts = await Post.find({ user: userId })
        .select("content createdAt user likes comments")
        .populate("user", "name profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalPosts = await Post.countDocuments({ user: userId });

    res.status(200).json({
        status: "success",
        totalPosts,
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        count: posts.length,
        data: posts
    });

});


module.exports = { createPost, getPosts, getpostbyid, deletePost, likePost, addComment, unlike, deletecomment, getfeedpost, bookmarksPost, removeBookmark,getPostsByUser };
