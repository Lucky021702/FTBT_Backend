const express = require("express");
const router = express.Router();
const userSchema = require("../models/Schema");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

router.post("/addUser", async (req, res) => {
  try {
    const { email, password, department, name, userId } = req.body;
    if (!email || !password || !department || !name || !userId) {
      return res.status(400).json({
        message: "Email, password, department, name, UserId are required",
      });
    }
    const existingUser = await userSchema.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists" });
    }
    const existingUserName = await userSchema.findOne({ name });
    if (existingUserName) {
      return res
        .status(409)
        .json({ message: "User with this name already exists" });
    }
    const existingUserUserId = await userSchema.findOne({ userId });
    if (existingUserUserId) {
      return res
        .status(409)
        .json({ message: "User with this userId already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userSchema({
      email,
      password: hashedPassword,
      department,
      name,
      userId
    });
    await newUser.save();
    res.status(201).json({ message: "User added successfuly" });
  } catch (error) {
    console.log("Error adding data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// router.post("/authenticate", async (req, res) => {
//     try {
//       const { email, password, department } = req.body;
//       const user = await userSchema.findOne({ email, department });
//       if (!user) {
//         return res.status(400).json({ message: "User Not Found" });
//       }
//       if (password !== user.password) {
//         return res.status(400).json({ message: "Invalid Password" });
//       }
//       const token = jwt.sign(
//         { userId: user._id, department: user.department },
//         process.env.JWT_SECRET
//       );
//       return res.status(200).json({ token,email: user.email });
//     } catch (error) {
//       console.log("Error authenticating user:", error);
//       return res.status(500).json({ message: "Internal Server Error" });
//     }
//   });

//hashed password

router.post("/authenticate", async (req, res) => {
  try {
    const { email, password, department } = req.body;
    const user = await userSchema.findOne({ email, department });
    if (!user) {
      return res.status(400).json({ message: "User Not Found" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid Password" });
    }
    const token = jwt.sign(
      { userId: user._id, department: user.department },
      process.env.JWT_SECRET
    );
    return res.status(200).json({
      token,
      email: user.email,
      _id: user._id,
      department: user.department,
    });
  } catch (error) {
    console.log("Error authenticating user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await userSchema.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// router.post("/projects", async (req, res) => {
//   try {
//     const { name, userId } = req.body;
//     const project = await Project.create({ name, userId });
//     res.status(201).json(project);
//   } catch (error) {
//     console.error("Error creating project:", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// });

module.exports = router;
