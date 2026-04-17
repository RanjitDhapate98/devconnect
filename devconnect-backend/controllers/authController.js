const User = require("../models/user");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const asyncHandler=require("../utils/asyncHandler");
const AppError=require("../utils/AppError");

const registerUser = asyncHandler(async (req, res) => {


    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      throw new AppError("User already exists",400);
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (!user) {
      throw new AppError("Invalid user data",400);
    } 

    res.status(201).json({
      status:"success",
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });


  
});

const loginUser = asyncHandler(async (req, res) => {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.status(200).json({
        status:"success",
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      throw new AppError("Invalid credentials",401);
    }
  
});

module.exports = { registerUser, loginUser };
