/**
 * Project Controller
 * Handles all project-related operations (CRUD, member management)
 */

import { Project, Task, User } from "../models/index.js";

const normalizeProjectId = (value) => String(value || "").trim();

const sanitizeMembers = (members = []) => [
  ...new Set((Array.isArray(members) ? members : []).filter(Boolean)),
];

const validateMembersExist = async (memberIds = []) => {
  if (memberIds.length === 0) {
    return true;
  }

  const existingMembers = await User.find({ firebaseUID: { $in: memberIds } });
  return existingMembers.length === memberIds.length;
};

const buildUserMap = async (userIds = []) => {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const users = await User.find({ firebaseUID: { $in: uniqueIds } });
  return new Map(users.map((user) => [user.firebaseUID, user]));
};

const toUserSummary = (user, fallbackId) =>
  user
    ? {
        firebaseUID: user.firebaseUID,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    : {
        firebaseUID: fallbackId,
        name: fallbackId,
        email: "",
        role: "user",
      };

const enrichProject = (project, userMap, projectTasks = []) => {
  const memberDetails = (project.members || []).map((memberId) =>
    toUserSummary(userMap.get(memberId), memberId),
  );

  const taskStats = projectTasks.reduce(
    (accumulator, task) => {
      accumulator.total += 1;
      if (task.status === "Completed") {
        accumulator.completed += 1;
      } else if (task.status === "In Progress") {
        accumulator.inProgress += 1;
      } else {
        accumulator.pending += 1;
      }
      return accumulator;
    },
    { total: 0, pending: 0, inProgress: 0, completed: 0 },
  );

  return {
    ...project.toObject(),
    memberDetails,
    createdByUser: toUserSummary(
      userMap.get(project.createdBy),
      project.createdBy,
    ),
    projectStats: taskStats,
    tasks: projectTasks.map((task) => ({
      ...task.toObject(),
      assignedToUsers: (task.assignedTo || []).map((memberId) =>
        toUserSummary(userMap.get(memberId), memberId),
      ),
    })),
  };
};

/**
 * Create a new project
 * POST /api/projects
 * Requires: Admin role
 *
 * @param {Object} req - Express request object
 * @param {string} req.body.title - Project title (required)
 * @param {string} req.body.description - Project description (optional)
 * @param {Array} req.body.members - Array of user IDs to add as members (optional)
 * @returns {Object} Created project object
 */
export const createProject = async (req, res) => {
  try {
    const { title, description, members, projectId } = req.body;
    const normalizedProjectId = normalizeProjectId(projectId);

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Project title is required",
      });
    }

    if (!normalizedProjectId) {
      return res.status(400).json({
        status: "error",
        message: "Project ID is required",
      });
    }

    const duplicateProject = await Project.findOne({
      projectId: normalizedProjectId,
    });
    if (duplicateProject) {
      return res.status(409).json({
        status: "error",
        message: "Project ID already exists",
      });
    }

    const memberIds = sanitizeMembers(members);
    const membersExist = await validateMembersExist(memberIds);
    if (!membersExist) {
      return res.status(400).json({
        status: "error",
        message: "One or more selected members are invalid",
      });
    }

    // Create new project
    const newProject = new Project({
      projectId: normalizedProjectId,
      title: title.trim(),
      description: description ? description.trim() : null,
      createdBy: req.user.uid,
      members: [req.user.uid, ...memberIds],
    });

    // Save to database
    await newProject.save();

    res.status(201).json({
      status: "success",
      message: "Project created successfully",
      data: newProject.toObject(),
    });
  } catch (error) {
    console.error("❌ Create project error:", error.message);
    if (error?.code === 11000) {
      return res.status(409).json({
        status: "error",
        message: "Project ID already exists",
      });
    }
    res.status(500).json({
      status: "error",
      message: "Failed to create project",
      error: error.message,
    });
  }
};

/**
 * Get all projects for the authenticated user
 * GET /api/projects
 *
 * Returns projects where user is a member or creator
 *
 * @param {Object} req - Express request object
 * @returns {Array} Array of projects
 */
export const getUserProjects = async (req, res) => {
  try {
    const userId = req.user.uid;
    const currentUser = await User.findOne({ firebaseUID: userId });

    // Find all projects where user is a member, or all projects for admins
    const projects =
      currentUser?.role === "admin"
        ? await Project.find({}).sort({ createdAt: -1 })
        : await Project.find({ members: userId }).sort({ createdAt: -1 });

    const allTasks = await Task.find({});
    const taskMap = new Map();
    for (const task of allTasks) {
      const key = String(task.projectId);
      if (!taskMap.has(key)) {
        taskMap.set(key, []);
      }
      taskMap.get(key).push(task);
    }

    const userIds = [
      ...new Set(
        projects.flatMap((project) => [
          project.createdBy,
          ...(project.members || []),
        ]),
      ),
    ];
    const userMap = await buildUserMap(userIds);
    const data = projects.map((project) =>
      enrichProject(project, userMap, taskMap.get(String(project._id)) || []),
    );

    res.status(200).json({
      status: "success",
      message: "Projects retrieved successfully",
      data,
      count: data.length,
    });
  } catch (error) {
    console.error("❌ Get projects error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve projects",
      error: error.message,
    });
  }
};

/**
 * Get single project by ID
 * GET /api/projects/:projectId
 *
 * Requires user to be member of project
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.projectId - Project ID
 * @returns {Object} Project object
 */
export const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Find project
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    const currentUser = await User.findOne({ firebaseUID: req.user.uid });
    if (
      currentUser?.role !== "admin" &&
      !project.members.includes(req.user.uid)
    ) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: You are not a member of this project",
      });
    }

    const tasks = await Task.find({ projectId: project._id }).sort({
      createdAt: -1,
    });
    const userMap = await buildUserMap([
      project.createdBy,
      ...(project.members || []),
      ...tasks.flatMap((task) => task.assignedTo || []),
    ]);
    const enrichedProject = enrichProject(project, userMap, tasks);

    res.status(200).json({
      status: "success",
      message: "Project retrieved successfully",
      data: enrichedProject,
    });
  } catch (error) {
    console.error("❌ Get project error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve project",
      error: error.message,
    });
  }
};

/**
 * Add member to project
 * POST /api/projects/:projectId/members
 * Requires: User is project creator or admin
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.projectId - Project ID
 * @param {string} req.body.memberId - Member Firebase UID to add
 * @returns {Object} Updated project object
 */
export const addProjectMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({
        status: "error",
        message: "Member ID is required",
      });
    }

    // Find project
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    const currentUser = await User.findOne({ firebaseUID: req.user.uid });

    // Check if user is creator or admin
    if (project.createdBy !== req.user.uid && currentUser?.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: Only project creator can add members",
      });
    }

    // Check if member already exists
    if (project.members.includes(memberId)) {
      return res.status(400).json({
        status: "error",
        message: "Member already exists in project",
      });
    }

    // Verify member exists in system
    const memberExists = await User.findOne({ firebaseUID: memberId });
    if (!memberExists) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Add member
    project.members.push(memberId);
    await project.save();

    res.status(200).json({
      status: "success",
      message: "Member added successfully",
      data: project.toObject(),
    });
  } catch (error) {
    console.error("❌ Add member error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to add member",
      error: error.message,
    });
  }
};

/**
 * Remove member from project
 * DELETE /api/projects/:projectId/members/:memberId
 * Requires: User is project creator or admin
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.projectId - Project ID
 * @param {string} req.params.memberId - Member Firebase UID to remove
 * @returns {Object} Updated project object
 */
export const removeProjectMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;

    // Find project
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    const currentUser = await User.findOne({ firebaseUID: req.user.uid });

    // Check if user is creator or admin
    if (project.createdBy !== req.user.uid && currentUser?.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: Only project creator can remove members",
      });
    }

    // Cannot remove creator
    if (memberId === project.createdBy) {
      return res.status(400).json({
        status: "error",
        message: "Cannot remove project creator",
      });
    }

    // Check if member exists
    if (!project.members.includes(memberId)) {
      return res.status(404).json({
        status: "error",
        message: "Member not found in project",
      });
    }

    // Remove member
    project.members = project.members.filter((id) => id !== memberId);
    await project.save();

    res.status(200).json({
      status: "success",
      message: "Member removed successfully",
      data: project.toObject(),
    });
  } catch (error) {
    console.error("❌ Remove member error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to remove member",
      error: error.message,
    });
  }
};

/**
 * Update project
 * PUT /api/projects/:projectId
 * Requires: User is project creator or admin
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.projectId - Project ID
 * @param {string} req.body.title - New project title (optional)
 * @param {string} req.body.description - New project description (optional)
 * @returns {Object} Updated project object
 */
export const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, members, projectId: nextProjectId } = req.body;

    // Find project
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    const currentUser = await User.findOne({ firebaseUID: req.user.uid });

    // Check if user is creator or admin
    if (project.createdBy !== req.user.uid && currentUser?.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: Only project creator can update",
      });
    }

    // Update fields if provided
    if (title && title.trim()) {
      project.title = title.trim();
    }

    if (description !== undefined) {
      project.description = description ? description.trim() : null;
    }

    if (nextProjectId !== undefined) {
      const normalizedProjectId = normalizeProjectId(nextProjectId);
      if (!normalizedProjectId) {
        return res.status(400).json({
          status: "error",
          message: "Project ID is required",
        });
      }

      const duplicateProject = await Project.findOne({
        projectId: normalizedProjectId,
        _id: { $ne: project._id },
      });

      if (duplicateProject) {
        return res.status(409).json({
          status: "error",
          message: "Project ID already exists",
        });
      }

      project.projectId = normalizedProjectId;
    }

    if (Array.isArray(members)) {
      const memberIds = sanitizeMembers(members);
      const membersExist = await validateMembersExist(memberIds);
      if (!membersExist) {
        return res.status(400).json({
          status: "error",
          message: "One or more selected members are invalid",
        });
      }

      project.members = [...new Set([project.createdBy, ...memberIds])];
    }

    await project.save();

    res.status(200).json({
      status: "success",
      message: "Project updated successfully",
      data: project.toObject(),
    });
  } catch (error) {
    console.error("❌ Update project error:", error.message);
    if (error?.code === 11000) {
      return res.status(409).json({
        status: "error",
        message: "Project ID already exists",
      });
    }
    res.status(500).json({
      status: "error",
      message: "Failed to update project",
      error: error.message,
    });
  }
};

/**
 * Delete project
 * DELETE /api/projects/:projectId
 * Requires: User is project creator or admin
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.projectId - Project ID
 * @returns {Object} Success message
 */
export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Find project
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    const currentUser = await User.findOne({ firebaseUID: req.user.uid });

    // Check if user is creator or admin
    if (project.createdBy !== req.user.uid && currentUser?.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: Only project creator can delete",
      });
    }

    // Delete project
    await Project.findByIdAndDelete(projectId);

    res.status(200).json({
      status: "success",
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete project error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to delete project",
      error: error.message,
    });
  }
};
