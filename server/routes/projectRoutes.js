/**
 * Project Routes
 * All project management endpoints
 */

import express from "express";
import {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  addProjectMember,
  removeProjectMember,
  deleteProject,
} from "../controllers/projectController.js";
import { requireAdmin } from "../middleware/rbac.js";

const router = express.Router();

/**
 * POST /api/projects
 * Create a new project
 * Requires: Admin role
 */
router.post("/", requireAdmin, createProject);

/**
 * GET /api/projects
 * Get all projects for authenticated user
 */
router.get("/", getUserProjects);

/**
 * GET /api/projects/:projectId
 * Get single project details
 */
router.get("/:projectId", getProjectById);

/**
 * PUT /api/projects/:projectId
 * Update project details
 * Requires: User is project creator
 */
router.put("/:projectId", updateProject);

/**
 * POST /api/projects/:projectId/members
 * Add member to project
 * Requires: User is project creator
 */
router.post("/:projectId/members", addProjectMember);

/**
 * DELETE /api/projects/:projectId/members/:memberId
 * Remove member from project
 * Requires: User is project creator
 */
router.delete("/:projectId/members/:memberId", removeProjectMember);

/**
 * DELETE /api/projects/:projectId
 * Delete project
 * Requires: User is project creator
 */
router.delete("/:projectId", deleteProject);

export default router;
