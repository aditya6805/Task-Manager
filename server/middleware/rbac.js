/**
 * Role-Based Access Control Middleware
 * Checks if user has required role to access endpoint
 */

/**
 * Middleware to check if user is admin
 * Must be used after authMiddleware to access req.user
 *
 * @param {Object} req - Express request object (must have req.user from authMiddleware)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const requireAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated (from authMiddleware)
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    // Check if user role is admin
    // Note: We'll get the role from the database
    const { User } = await import("../models/index.js");
    const user = await User.findOne({ firebaseUID: req.user.uid });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: Only admins can access this endpoint",
      });
    }

    // User is admin, continue to next middleware/route
    next();
  } catch (error) {
    console.error("❌ RBAC error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Server error during authorization check",
    });
  }
};

/**
 * Middleware to check if user is member of project
 * Must be used after authMiddleware to access req.user
 *
 * @param {Object} req - Express request object (must have req.user from authMiddleware)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const requireProjectMember = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    const { Project } = await import("../models/index.js");
    const projectId = req.params.projectId || req.body.projectId;

    if (!projectId) {
      return res.status(400).json({
        status: "error",
        message: "Project ID is required",
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    // Check if user is member of project
    if (!project.members.includes(req.user.uid)) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: You are not a member of this project",
      });
    }

    // Attach project to request for use in controller
    req.project = project;
    next();
  } catch (error) {
    console.error("❌ Project membership check error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Server error during access check",
    });
  }
};
