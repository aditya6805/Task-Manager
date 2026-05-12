/**
 * Task Routes
 * All task management endpoints
 */

import express from "express";
import {
  getTasks,
  createTask,
  getTasksByProject,
  getTaskById,
  updateTaskStatus,
  deleteTask,
  getOverdueTasks,
  saveTaskSubmission,
  addTaskFeedback,
} from "../controllers/taskController.js";
import { requireAdmin } from "../middleware/rbac.js";

const router = express.Router();

/**
 * POST /api/tasks
 * Create a new task
 * Requires: Admin role
 */
router.post("/", requireAdmin, createTask);

/**
 * GET /api/tasks
 * Get all tasks for authenticated user
 */
router.get("/", getTasks);

/**
 * GET /api/tasks/overdue
 * Get overdue tasks for authenticated user
 * (Must be before /:taskId route to avoid conflicts)
 */
router.get("/overdue", getOverdueTasks);

/**
 * GET /api/tasks/project/:projectId
 * Get all tasks in a project
 * (Must be before /:taskId route to avoid conflicts)
 */
router.get("/project/:projectId", getTasksByProject);

/**
 * GET /api/tasks/:taskId
 * Get single task by ID
 */
router.get("/:taskId", getTaskById);

/**
 * PUT /api/tasks/:taskId
 * Update task status
 * Requires: User is project member
 */
router.put("/:taskId", updateTaskStatus);

/**
 * POST /api/tasks/:taskId/submissions
 * Save or update work submission
 */
router.post("/:taskId/submissions", saveTaskSubmission);

/**
 * POST /api/tasks/:taskId/feedback
 * Add admin feedback
 */
router.post("/:taskId/feedback", addTaskFeedback);

/**
 * DELETE /api/tasks/:taskId
 * Delete task
 * Requires: Admin role
 */
router.delete("/:taskId", requireAdmin, deleteTask);

export default router;
