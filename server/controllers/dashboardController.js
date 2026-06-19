/**
 * Dashboard Controller
 * Provides dashboard data for authenticated user
 */

import { Task, Project, User } from "../models/index.js";

/**
 * Build a plain task response object with populated project data.
 * Replaces Mongoose populate + toObject with a direct plain-object build
 * so it works identically for both Mongoose and in-memory models.
 */
const buildTaskResponse = (task) => {
  const projectIdObj = task.projectId;
  const plainProject =
    projectIdObj && typeof projectIdObj.toObject === "function"
      ? projectIdObj.toObject()
      : projectIdObj;

  const plain =
    typeof task.toObject === "function" ? task.toObject() : { ...task };

  return {
    ...plain,
    projectId: plainProject,
    project: plainProject,
  };
};

/**
 * Get dashboard data
 * GET /api/dashboard
 *
 * Returns comprehensive dashboard information.
 * All task statistics are derived from per-project task queries (the reliable
 * query path) rather than top-level Task.find() calls, ensuring consistent
 * results across both MongoDB and in-memory stores.
 *
 * @param {Object} req - Express request object
 * @returns {Object} Dashboard data object
 */
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.uid;
    const now = new Date();

    // Fetch user info
    const user = await User.findOne({ firebaseUID: userId });
    if (!user) {
      // Return empty dashboard instead of 404 for new users
      return res.status(200).json({
        status: "success",
        message: "Dashboard data retrieved successfully",
        data: {
          user: {
            uid: userId,
            name: req.user.displayName || req.user.email || "User",
            email: req.user.email || "",
            role: "user",
            joinedDate: new Date(),
          },
          summary: {
            totalProjects: 0,
            totalTasks: 0,
            taskStats: { total: 0, pending: 0, inProgress: 0, completed: 0 },
            completionRate: "0%",
            overdueTaskCount: 0,
          },
          projects: [],
          tasksByStatus: { Pending: 0, "In Progress": 0, Completed: 0 },
          overdueTasks: [],
          stats: {
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            inProgressTasks: 0,
            overdueTasks: 0,
            completionRate: "0%",
            averageTasksPerProject: 0,
          },
          tasks: { pending: [], inProgress: [], overdue: [], upcoming: [] },
          metrics: {
            averageTasksPerProject: 0,
            completeTasksThisMonth: 0,
            taskCompletionRate: 0,
          },
        },
      });
    }

    // Admin sees ALL data; regular user sees only their own
    const isAdmin = user.role === "admin";
    const projectFilter = isAdmin ? {} : { members: userId };

    // 1. Get user's projects
    const projects = await Project.find(projectFilter).sort({
      createdAt: -1,
    });

    // 2. Aggregate ALL task data from per-project queries (the reliable path)
    //    This avoids separate top-level Task.find() calls that may return
    //    different results on certain MongoDB/hosted environments.
    const projectDetails = [];
    let allUserTasks = []; // tasks visible to this user (scoped)
    const allProjectTasks = []; // every task across fetched projects

    for (const project of projects) {
      const projectTasks = await Task.find({ projectId: project._id });
      allProjectTasks.push(...projectTasks);

      // Scope tasks to the current user (admin sees all; others see assigned)
      const scopedTasks = isAdmin
        ? projectTasks
        : projectTasks.filter(
            (t) => Array.isArray(t.assignedTo) && t.assignedTo.includes(userId),
          );
      allUserTasks.push(...scopedTasks);

      projectDetails.push({
        _id: project._id,
        title: project.title,
        description: project.description,
        createdBy: project.createdBy,
        memberCount: project.members.length,
        taskCount: projectTasks.length,
        taskStats: {
          pending: projectTasks.filter((t) => t.status === "Pending").length,
          inProgress: projectTasks.filter((t) => t.status === "In Progress")
            .length,
          completed: projectTasks.filter((t) => t.status === "Completed")
            .length,
        },
        createdAt: project.createdAt,
      });
    }

    // 3. Compute task statistics from aggregated data
    const taskStats = {
      total: allUserTasks.length,
      pending: allUserTasks.filter((t) => t.status === "Pending").length,
      inProgress: allUserTasks.filter((t) => t.status === "In Progress").length,
      completed: allUserTasks.filter((t) => t.status === "Completed").length,
    };

    // 4. Completion rate
    const completedTasks = taskStats.completed;
    const completionRate =
      allUserTasks.length > 0
        ? Math.round((completedTasks / allUserTasks.length) * 100)
        : 0;

    // 5. Categorize tasks (overdue, pending, in-progress, upcoming)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const overdueTasks = allUserTasks
      .filter(
        (t) =>
          t.status !== "Completed" && t.dueDate && new Date(t.dueDate) < now,
      )
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .map(buildTaskResponse);

    const pendingTasks = allUserTasks
      .filter((t) => t.status === "Pending")
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .map(buildTaskResponse);

    const inProgressTasks = allUserTasks
      .filter((t) => t.status === "In Progress")
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .map(buildTaskResponse);

    const upcomingTasks = allUserTasks
      .filter(
        (t) =>
          t.status !== "Completed" &&
          t.dueDate &&
          new Date(t.dueDate) >= now &&
          new Date(t.dueDate) <= nextWeek,
      )
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .map(buildTaskResponse);

    res.status(200).json({
      status: "success",
      message: "Dashboard data retrieved successfully",
      data: {
        user: {
          uid: user.firebaseUID,
          name: user.name,
          email: user.email,
          role: user.role,
          joinedDate: user.createdAt,
        },
        summary: {
          totalProjects: projects.length,
          totalTasks: taskStats.total,
          taskStats,
          completionRate: `${completionRate}%`,
          overdueTaskCount: overdueTasks.length,
        },
        projects: projectDetails,
        tasksByStatus: {
          Pending: taskStats.pending,
          "In Progress": taskStats.inProgress,
          Completed: taskStats.completed,
        },
        overdueTasks,
        stats: {
          totalTasks: taskStats.total,
          completedTasks: taskStats.completed,
          pendingTasks: taskStats.pending,
          inProgressTasks: taskStats.inProgress,
          overdueTasks: overdueTasks.length,
          completionRate: `${completionRate}%`,
          averageTasksPerProject:
            projectDetails.length > 0
              ? Math.round(
                  projectDetails.reduce((sum, p) => sum + p.taskCount, 0) /
                    projectDetails.length,
                )
              : 0,
        },
        tasks: {
          pending: pendingTasks,
          inProgress: inProgressTasks,
          overdue: overdueTasks,
          upcoming: upcomingTasks,
        },
        metrics: {
          averageTasksPerProject:
            projectDetails.length > 0
              ? Math.round(
                  projectDetails.reduce((sum, p) => sum + p.taskCount, 0) /
                    projectDetails.length,
                )
              : 0,
          completeTasksThisMonth: completedTasks,
          taskCompletionRate: completionRate,
        },
      },
    });
  } catch (error) {
    console.error("\u274c Dashboard error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve dashboard data",
      error: error.message,
    });
  }
};

/**
 * Get dashboard statistics (simplified version)
 * GET /api/dashboard/stats
 *
 * Returns only statistical data
 *
 * @param {Object} req - Express request object
 * @returns {Object} Statistics object
 */
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.uid;
    const now = new Date();

    // Admin sees all tasks; regular user sees only assigned
    const user = await User.findOne({ firebaseUID: userId });
    const isAdmin = user?.role === "admin";
    const projectFilter = isAdmin ? {} : { members: userId };

    // Aggregate tasks from per-project queries (the reliable path)
    const projects = await Project.find(projectFilter);
    let allUserTasks = [];

    for (const project of projects) {
      const projectTasks = await Task.find({ projectId: project._id });
      if (isAdmin) {
        allUserTasks.push(...projectTasks);
      } else {
        allUserTasks.push(
          ...projectTasks.filter(
            (t) => Array.isArray(t.assignedTo) && t.assignedTo.includes(userId),
          ),
        );
      }
    }

    const overdueTasks = allUserTasks.filter(
      (t) => t.status !== "Completed" && t.dueDate && new Date(t.dueDate) < now,
    );

    const completedTasks = allUserTasks.filter(
      (t) => t.status === "Completed",
    ).length;
    const completionRate =
      allUserTasks.length > 0
        ? Math.round((completedTasks / allUserTasks.length) * 100)
        : 0;

    const projectCount = projects.length;

    res.status(200).json({
      status: "success",
      message: "Dashboard statistics retrieved successfully",
      data: {
        projectCount,
        totalTasks: allUserTasks.length,
        completedTasks,
        pendingTasks: allUserTasks.filter((t) => t.status === "Pending").length,
        inProgressTasks: allUserTasks.filter((t) => t.status === "In Progress")
          .length,
        overdueTasks: overdueTasks.length,
        completionRate: `${completionRate}%`,
      },
    });
  } catch (error) {
    console.error("\u274c Dashboard stats error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve dashboard statistics",
      error: error.message,
    });
  }
};
