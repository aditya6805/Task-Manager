// User controllers
// Implement user authentication and profile management

import { User } from "../models/index.js";

export const syncUser = async (req, res) => {
  try {
    const firebaseUID = req.user?.uid;
    const email = (req.user?.email || req.body?.email || "").toLowerCase();
    const name =
      req.body?.name || req.user?.displayName || email.split("@")[0] || "User";

    if (!firebaseUID || !email) {
      return res.status(400).json({
        status: "error",
        message: "firebaseUID and email are required for sync",
      });
    }

    let user = await User.findOne({ firebaseUID });

    if (!user) {
      user = await User.findOne({ email });
    }

    if (!user) {
      user = new User({
        firebaseUID,
        name,
        email,
        role: "user",
      });
      await user.save();

      return res.status(201).json({
        status: "success",
        message: "User synced successfully",
        data: user,
      });
    }

    const updates = {
      firebaseUID,
      name: name || user.name,
      email,
    };

    if (user.role === "admin") {
      updates.role = "admin";
    }

    Object.assign(user, updates);
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "User already exists and was updated",
      data: user,
    });
  } catch (error) {
    console.error("❌ Sync user error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to sync user",
      error: error.message,
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.json({
      status: "success",
      message: "Fetch user profile",
      data: user,
    });
  } catch (error) {
    console.error("❌ Get user profile error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch user profile",
      error: error.message,
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    if (req.body.name) {
      user.name = req.body.name;
    }

    await user.save();

    res.json({
      status: "success",
      message: "Update user profile",
      data: user,
    });
  } catch (error) {
    console.error("❌ Update user profile error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to update user profile",
      error: error.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });

    res.json({
      status: "success",
      message: "Fetch all users",
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error("❌ Get all users error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};
