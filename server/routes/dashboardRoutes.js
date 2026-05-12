/**
 * Dashboard Routes
 * Dashboard and analytics endpoints
 */

import express from "express";
import {
  getDashboard,
  getDashboardStats,
} from "../controllers/dashboardController.js";

const router = express.Router();

/**
 * GET /api/dashboard
 * Get comprehensive dashboard data
 */
router.get("/", getDashboard);

/**
 * GET /api/dashboard/stats
 * Get simplified dashboard statistics
 * (Must be before other parameterized routes to avoid conflicts)
 */
router.get("/stats", getDashboardStats);

export default router;
