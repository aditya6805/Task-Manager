// User routes
// Define routes for user management

import express from "express";
import * as userController from "../controllers/userController.js";

const router = express.Router();

// POST sync Firebase user into MongoDB
router.post("/sync", userController.syncUser);

// GET user profile
router.get("/profile", userController.getUserProfile);

// PUT update user profile
router.put("/profile", userController.updateUserProfile);

// GET all users
router.get("/", userController.getAllUsers);

export default router;
