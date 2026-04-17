const cloudinary = require("cloudinary").v2;

// Configure cloudinary immediately when this file loads
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

// Debug log to confirm config loaded
console.log("Cloudinary initialized with cloud:", process.env.CLOUDINARY_CLOUD_NAME);

module.exports = cloudinary;    