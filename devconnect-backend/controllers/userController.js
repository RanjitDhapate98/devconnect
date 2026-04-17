const User = require("../models/user");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
// Follow user
const followUser = asyncHandler(async (req, res) => {


  const targetUserId = req.params.id;

  // Prevent self-follow
  if (targetUserId === req.user._id.toString()) {
    throw new AppError("you cannot follow yourself", 400);
  }

  const userToFollow = await User.findById(targetUserId);

  if (!userToFollow) {
    throw new AppError("user not found", 404);
  }

  // Check if already following
  const alreadyFollowing = req.user.following.some(
    (id) => id.toString() === targetUserId
  );

  if (alreadyFollowing) {
    throw new AppError("Already following this user", 400);
  }


  // Add to following and followers
  req.user.following.push(targetUserId);
  userToFollow.followers.push(req.user._id);

  await req.user.save();
  await userToFollow.save();

  res.status(200).json({
    status: "success",
    message: "User followed successfully"
  });


});
const unfollowUser = asyncHandler(async (req, res) => {

  const targetUserId = req.params.id;

  if (targetUserId === req.user._id.toString()) {
    throw new AppError("You cannot unfollow yourself", 400);
  }

  const userToUnfollow = await User.findById(targetUserId);

  if (!userToUnfollow) {
    throw new AppError("User not found", 404);
  }

  // Check if actually following
  const index = req.user.following.findIndex(
    (id) => id.toString() === targetUserId
  );

  if (index === -1) {
    throw new AppError("You are not following this user", 400);
  }

  req.user.following.splice(index, 1);

  userToUnfollow.followers = userToUnfollow.followers.filter(
    (id) => id.toString() !== req.user._id.toString()
  );

  await req.user.save();
  await userToUnfollow.save();

  res.status(200).json({
    status: "success",
    message: "unfollwed successfully"
  });
});
const getFollowers = asyncHandler(async (req, res) => {

  const user = await User.findById(req.params.id)
    .populate("followers", "name email");
  if (!user) {
    throw new AppError("user not found", 404);
  }
  res.status(200).json({
    status: "success",
    followersCount: user.followers.length,
    followers: user.followers
  });



});
const getfollowing = asyncHandler(async (req, res) => {

  const user = await User.findById(req.params.id)
    .populate("following", "name email");
  if (!user) {
    throw new AppError("user not found", 404);
  }
  res.status(200).json({
    status: "success",
    followingCount: user.following.length,
    following: user.following
  });
});

const getbookmark = asyncHandler(async (req, res) => {

  const user = await User.findById(req.user._id)
    .populate({
      path: "bookmarks",
      populate: {
        path: "user",
        select: "name email"
      }
    });
  if (!user) {
  throw new AppError("User not found", 404);
}
  res.status(200).json({
    status: "success",
    data: user.bookmarks
  });


});
const getmypf = asyncHandler(async (req, res) => {

  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("followers", "name email profilePicture")
    .populate("following", "name email profilePicture");


  if (!user) {
    throw new AppError("user not found", 404);
  }
  res.status(200).json({
    status: "success",
    data: user
  });



});
const updateMyProfile = asyncHandler(async (req, res) => {

  const allowedFields = ["name", "bio", "skills", "location", "website", "github"];

  const updates = {};

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    {
      new: true,
      runValidators: true
    }
  ).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({
    status: "success",
    data: user
  });

});


const uploadProfilePicture = asyncHandler(async (req, res) => {

  if (!req.file) {
    throw new AppError("Please upload an image", 400);
  }

  // Convert buffer to stream and upload
  const uploadFromBuffer = () => {
    return new Promise((resolve, reject) => {

      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "devconnect/profile_pictures"
        },
        (error, result) => {

          if (result) resolve(result);
          else reject(error);

        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(stream);

    });
  };

  const result = await uploadFromBuffer();

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      profilePicture: result.secure_url
    },
    { new: true }
  ).select("-password");

  res.status(200).json({
    status: "success",
    data: user
  });

});

const getPublicProfile = asyncHandler(async (req, res) => {

  const userId = req.params.id;

  const user = await User.findById(userId)
    .select("name bio profilePicture followers following skills location website github createdAt");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({
    status: "success",
    data: {
      _id: user._id,
      name: user.name,
      bio: user.bio,
      profilePicture: user.profilePicture,
      skills: user.skills,
      location: user.location,
      website: user.website,
      github: user.github,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      createdAt: user.createdAt
    }
  });

});
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select("name profilePicture")
    .where("_id")
    .ne(req.user._id);

  res.status(200).json({
    status: "success",
    data: users,
  });
});

module.exports = {
  followUser, unfollowUser, getfollowing, getFollowers, getbookmark, getmypf,updateMyProfile,uploadProfilePicture,getPublicProfile,getAllUsers
};