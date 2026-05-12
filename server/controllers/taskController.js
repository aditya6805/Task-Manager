/**
 * Task Controller
 * Handles all task-related operations (CRUD, status updates, filtering)
 */

import { Task, Project, User } from "../models/index.js";

const normalizeAssignees = (assignedTo, creatorId) => {
  const selected = Array.isArray(assignedTo)
    ? assignedTo.filter(Boolean)
    : assignedTo
      ? [assignedTo]
      : [];

  return [...new Set([creatorId, ...selected].filter(Boolean))];
};

const allowedSubmissionStatuses = new Set(["Draft", "Submitted"]);
const allowedReviewStatuses = new Set([
  "Accepted",
  "Rejected",
  "Changes Requested",
  "Info",
]);

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

const taskToResponse = (task, userMap) => {
  const project =
    task.projectId && task.projectId.toObject
      ? task.projectId.toObject()
      : task.projectId;

  const enrichedProject = project
    ? {
        ...project,
        createdByUser: toUserSummary(
          userMap.get(project.createdBy),
          project.createdBy,
        ),
        memberDetails: (project.members || []).map((memberId) =>
          toUserSummary(userMap.get(memberId), memberId),
        ),
      }
    : project;

  return {
    ...task.toObject(),
    project: enrichedProject,
    createdByUser: toUserSummary(userMap.get(task.createdBy), task.createdBy),
    assignedToUsers: (task.assignedTo || []).map((memberId) =>
      toUserSummary(userMap.get(memberId), memberId),
    ),
    submissions: (task.submissions || []).map((submission) => ({
      ...submission,
      submittedByUser: toUserSummary(
        userMap.get(submission.submittedBy),
        submission.submittedBy,
      ),
    })),
    feedback: (task.feedback || []).map((entry) => ({
      ...entry,
      addedByUser: toUserSummary(userMap.get(entry.addedBy), entry.addedBy),
    })),
  };
};

const getCurrentUser = async (uid) => User.findOne({ firebaseUID: uid });

/**
 * Create a new task
 * POST /api/tasks
 * Requires: Admin role
 *
 * @param {Object} req - Express request object
 * @param {string} req.body.title - Task title (required)
 * @param {string} req.body.description - Task description (optional)
 * @param {string} req.body.projectId - Project ID (required)
 * @param {string} req.body.assignedTo - User ID to assign task (required)
 * @param {string} req.body.dueDate - Task due date (optional)
 * @returns {Object} Created task object
 */
export const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, dueDate } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Task title is required",
      });
    }

    if (!projectId) {
      return res.status(400).json({
        status: "error",
        message: "Project ID is required",
      });
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    const currentUser = await getCurrentUser(req.user.uid);

    if (currentUser?.role !== "admin" && project.createdBy !== req.user.uid) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: Only admins can create tasks",
      });
    }

    const assignedIds = normalizeAssignees(assignedTo, req.user.uid);

    // Verify assignees are members of project
    const validMembers = [...new Set(project.members.map(String))];
    const invalidAssignees = assignedIds.filter(
      (memberId) => !validMembers.includes(memberId),
    );

    if (invalidAssignees.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Assignees must be members of the project",
      });
    }

    // Create new task
    const newTask = new Task({
      title: title.trim(),
      description: description ? description.trim() : null,
      projectId,
      assignedTo: assignedIds,
      createdBy: req.user.uid,
      status: "Pending", // Default status
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    // Save to database
    await newTask.save();

    res.status(201).json({
      status: "success",
      message: "Task created successfully",
      data: newTask.toObject(),
    });
  } catch (error) {
    console.error("❌ Create task error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to create task",
      error: error.message,
    });
  }
};

/**
 * Get all tasks for authenticated user
 * GET /api/tasks
 *
 * Returns tasks assigned to the user
 *
 * @param {Object} req - Express request object
 * @returns {Array} Array of tasks
 */
export const getTasks = async (req, res) => {
  try {
    const userId = req.user.uid;
    const currentUser = await getCurrentUser(userId);

    // Find all tasks assigned to user, or all tasks for admins
    const tasks = await Task.find(
      currentUser?.role === "admin" ? {} : { assignedTo: userId },
    )
      .populate("projectId")
      .sort({ createdAt: -1 });

    const userMap = await buildUserMap([
      userId,
      ...tasks.flatMap((task) => task.assignedTo || []),
      ...tasks.map((task) => task.createdBy),
      ...tasks.map((task) => task.projectId?.createdBy).filter(Boolean),
      ...tasks.flatMap((task) => task.projectId?.members || []),
      ...tasks.flatMap((task) =>
        (task.submissions || []).map((item) => item.submittedBy),
      ),
      ...tasks.flatMap((task) =>
        (task.feedback || []).map((item) => item.addedBy),
      ),
    ]);

    const data = tasks.map((task) => taskToResponse(task, userMap));

    res.status(200).json({
      status: "success",
      message: "Tasks retrieved successfully",
      data,
      count: data.length,
    });
  } catch (error) {
    console.error("❌ Get tasks error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve tasks",
      error: error.message,
    });
  }
};

/**
 * Get tasks by project ID
 * GET /api/tasks/project/:projectId
 *
 * Returns all tasks in a project (user must be project member)
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.projectId - Project ID
 * @returns {Array} Array of tasks in project
 */
export const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.uid;
    const currentUser = await getCurrentUser(userId);

    // Verify project exists and user is member
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    if (currentUser?.role !== "admin" && !project.members.includes(userId)) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: You are not a member of this project",
      });
    }

    // Get all tasks in project with optional filtering
    let query = Task.find({ projectId });

    // Optional: Filter by status if provided
    const { status } = req.query;
    if (status) {
      query = query.where("status").equals(status);
    }

    const tasks = await query.sort({ createdAt: -1 });
    const userMap = await buildUserMap([
      userId,
      project.createdBy,
      ...project.members,
      ...tasks.flatMap((task) => task.assignedTo || []),
      ...tasks.flatMap((task) =>
        (task.submissions || []).map((item) => item.submittedBy),
      ),
      ...tasks.flatMap((task) =>
        (task.feedback || []).map((item) => item.addedBy),
      ),
    ]);
    const data = tasks.map((task) => taskToResponse(task, userMap));

    res.status(200).json({
      status: "success",
      message: "Tasks retrieved successfully",
      data,
      count: data.length,
    });
  } catch (error) {
    console.error("❌ Get project tasks error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve tasks",
      error: error.message,
    });
  }
};

/**
 * Get single task by ID
 * GET /api/tasks/:taskId
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.taskId - Task ID
 * @returns {Object} Task object with populated project
 */
export const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId).populate("projectId");
    const currentUser = await getCurrentUser(req.user.uid);

    if (!task) {
      return res.status(404).json({
        status: "error",
        message: "Task not found",
      });
    }

    // Check if user is project member, assignee, or admin
    if (
      currentUser?.role !== "admin" &&
      !task.projectId.members.includes(req.user.uid) &&
      !(task.assignedTo || []).includes(req.user.uid)
    ) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: You are not a member of this project",
      });
    }

    const userMap = await buildUserMap([
      req.user.uid,
      task.createdBy,
      ...task.assignedTo,
      ...task.projectId.members,
      ...(task.submissions || []).map((item) => item.submittedBy),
      ...(task.feedback || []).map((item) => item.addedBy),
    ]);

    res.status(200).json({
      status: "success",
      message: "Task retrieved successfully",
      data: taskToResponse(task, userMap),
    });
  } catch (error) {
    console.error("❌ Get task error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve task",
      error: error.message,
    });
  }
};

/**
 * Update task status
 * PUT /api/tasks/:taskId
 *
 * Only update status field (members can update)
 * Requires: User is assigned to task or is project member
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.taskId - Task ID
 * @param {string} req.body.status - New status ('Pending', 'In Progress', 'Completed')
 * @returns {Object} Updated task object
 */
export const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, title, description, dueDate, assignedTo } = req.body;

    if (!status) {
      return res.status(400).json({
        status: "error",
        message: "Status is required",
      });
    }

    // Validate status value
    const validStatuses = ["Pending", "In Progress", "Completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Find task
    const task = await Task.findById(taskId).populate("projectId");
    const currentUser = await getCurrentUser(req.user.uid);

    if (!task) {
      return res.status(404).json({
        status: "error",
        message: "Task not found",
      });
    }

    const projectMembers = Array.isArray(task.projectId?.members)
      ? task.projectId.members
      : [];
    const isProjectMember = projectMembers.includes(req.user.uid);
    const isAssignedMember = (task.assignedTo || []).includes(req.user.uid);
    const isAdmin = currentUser?.role === "admin";

    if (!isAdmin && !isProjectMember && !isAssignedMember) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: You are not a member of this project",
      });
    }

    if (isAdmin && typeof title === "string") {
      task.title = title.trim();
    }

    if (isAdmin && typeof description === "string") {
      task.description = description.trim();
    }

    if (isAdmin && dueDate !== undefined) {
      task.dueDate = dueDate ? new Date(dueDate) : null;
    }

    if (isAdmin && assignedTo !== undefined) {
      if (!Array.isArray(task.projectId?.members)) {
        return res.status(400).json({
          status: "error",
          message:
            "Cannot update assignees because the linked project is missing",
        });
      }

      const assignedIds = normalizeAssignees(assignedTo, task.createdBy);
      const validMembers = [...new Set(projectMembers.map(String))];
      const invalidAssignees = assignedIds.filter(
        (memberId) => !validMembers.includes(memberId),
      );
      if (invalidAssignees.length > 0) {
        return res.status(400).json({
          status: "error",
          message: "Assignees must be members of the project",
        });
      }

      task.assignedTo = assignedIds;
    }

    // Update status
    if (status) {
      task.status = status;
    }

    await task.save();

    const userMap = await buildUserMap([
      req.user.uid,
      task.createdBy,
      ...task.assignedTo,
      ...projectMembers,
      ...(task.submissions || []).map((item) => item.submittedBy),
      ...(task.feedback || []).map((item) => item.addedBy),
    ]);

    res.status(200).json({
      status: "success",
      message: "Task status updated successfully",
      data: taskToResponse(task, userMap),
    });
  } catch (error) {
    console.error("❌ Update task error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to update task",
      error: error.message,
    });
  }
};

/**
 * Delete task
 * DELETE /api/tasks/:taskId
 * Requires: Admin role
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.taskId - Task ID
 * @returns {Object} Success message
 */
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        status: "error",
        message: "Task not found",
      });
    }

    // Delete task
    await Task.findByIdAndDelete(taskId);

    res.status(200).json({
      status: "success",
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete task error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to delete task",
      error: error.message,
    });
  }
};

/**
 * Get overdue tasks
 * GET /api/tasks/overdue
 *
 * Returns all incomplete tasks with due date in the past
 *
 * @param {Object} req - Express request object
 * @returns {Array} Array of overdue tasks
 */
export const getOverdueTasks = async (req, res) => {
  try {
    const userId = req.user.uid;
    const currentUser = await getCurrentUser(userId);
    const now = new Date();

    // Find overdue incomplete tasks assigned to user
    const tasks = await Task.find(
      currentUser?.role === "admin"
        ? {
            status: { $ne: "Completed" },
            dueDate: { $lt: now, $ne: null },
          }
        : {
            assignedTo: userId,
            status: { $ne: "Completed" },
            dueDate: { $lt: now, $ne: null },
          },
    )
      .populate("projectId")
      .sort({ dueDate: 1 });

    const userMap = await buildUserMap([
      userId,
      ...tasks.flatMap((task) => task.assignedTo || []),
      ...tasks.map((task) => task.createdBy),
      ...tasks.map((task) => task.projectId?.createdBy).filter(Boolean),
      ...tasks.flatMap((task) => task.projectId?.members || []),
    ]);

    const data = tasks.map((task) => taskToResponse(task, userMap));

    res.status(200).json({
      status: "success",
      message: "Overdue tasks retrieved successfully",
      data,
      count: data.length,
    });
  } catch (error) {
    console.error("❌ Get overdue tasks error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve overdue tasks",
      error: error.message,
    });
  }
};

/**
 * Save or update a task submission
 * POST /api/tasks/:taskId/submissions
 */
export const saveTaskSubmission = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content = "", status = "Draft" } = req.body;

    const task = await Task.findById(taskId).populate("projectId");
    const currentUser = await getCurrentUser(req.user.uid);

    if (!task) {
      return res
        .status(404)
        .json({ status: "error", message: "Task not found" });
    }

    if (
      currentUser?.role !== "admin" &&
      !task.projectId.members.includes(req.user.uid) &&
      !(task.assignedTo || []).includes(req.user.uid)
    ) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: You are not allowed to update this task",
      });
    }

    if (!allowedSubmissionStatuses.has(status)) {
      return res.status(400).json({
        status: "error",
        message: "Submission status must be Draft or Submitted",
      });
    }
    const existingIndex = task.submissions.findIndex(
      (submission) => submission.submittedBy === req.user.uid,
    );

    const submission = {
      submittedBy: req.user.uid,
      content: String(content),
      submittedAt: new Date(),
      status,
      adminFeedback:
        existingIndex >= 0
          ? task.submissions[existingIndex].adminFeedback || ""
          : "",
    };

    if (existingIndex >= 0) {
      task.submissions[existingIndex] = submission;
    } else {
      task.submissions.push(submission);
    }

    if (status === "Submitted") {
      task.status = "In Progress";
    }

    await task.save();

    const userMap = await buildUserMap([
      req.user.uid,
      task.createdBy,
      ...task.assignedTo,
      ...task.projectId.members,
      ...(task.submissions || []).map((item) => item.submittedBy),
      ...(task.feedback || []).map((item) => item.addedBy),
    ]);

    return res.status(200).json({
      status: "success",
      message: "Submission saved successfully",
      data: taskToResponse(task, userMap),
    });
  } catch (error) {
    console.error("❌ Save submission error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to save submission",
      error: error.message,
    });
  }
};

/**
 * Add admin feedback to a task
 * POST /api/tasks/:taskId/feedback
 */
export const addTaskFeedback = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { comment = "", status = "Info", submittedBy } = req.body;

    const currentUser = await getCurrentUser(req.user.uid);
    if (currentUser?.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: Only admins can add feedback",
      });
    }

    const task = await Task.findById(taskId).populate("projectId");
    if (!task) {
      return res
        .status(404)
        .json({ status: "error", message: "Task not found" });
    }

    if (!allowedReviewStatuses.has(status)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid review status",
      });
    }

    task.feedback.push({
      addedBy: req.user.uid,
      comment: String(comment),
      status,
      createdAt: new Date(),
    });

    const targetSubmissionId =
      submittedBy || task.submissions[task.submissions.length - 1]?.submittedBy;
    if (targetSubmissionId) {
      const targetSubmission = task.submissions.find(
        (submission) => submission.submittedBy === targetSubmissionId,
      );

      if (targetSubmission) {
        targetSubmission.adminFeedback = String(comment);
        targetSubmission.status = status;
      }
    }

    if (status === "Accepted") {
      task.status = "Completed";
    } else if (status === "Rejected" || status === "Changes Requested") {
      task.status = "In Progress";
    }

    await task.save();

    const userMap = await buildUserMap([
      req.user.uid,
      task.createdBy,
      ...task.assignedTo,
      ...task.projectId.members,
      ...(task.submissions || []).map((item) => item.submittedBy),
      ...(task.feedback || []).map((item) => item.addedBy),
    ]);

    return res.status(200).json({
      status: "success",
      message: "Feedback added successfully",
      data: taskToResponse(task, userMap),
    });
  } catch (error) {
    console.error("❌ Add feedback error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to add feedback",
      error: error.message,
    });
  }
};
