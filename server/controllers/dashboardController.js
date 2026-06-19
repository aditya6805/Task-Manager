/**
 * Dashboard Controller
 * Provides dashboard data for authenticated user
 */

import { Task, Project, User } from "../models/index.js";

/**
 * Get dashboard data
 * GET /api/dashboard
 *
 * Returns comprehensive dashboard information:
 * - User's projects
 * - User's tasks by status
 * - Overdue tasks
 * - Recent activity
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
    const taskFilter = isAdmin ? {} : { assignedTo: userId };
    const projectFilter = isAdmin ? {} : { members: userId };

    // 1. Get user's projects
    const projects = await Project.find(projectFilter).sort({
      createdAt: -1,
    });

    // 2. Get task statistics
    const allTasks = await Task.find(taskFilter);

    const taskStats = {
      total: allTasks.length,
      pending: allTasks.filter((t) => t.status === "Pending").length,
      inProgress: allTasks.filter((t) => t.status === "In Progress").length,
      completed: allTasks.filter((t) => t.status === "Completed").length,
    };

    // 3. Get overdue tasks
    const overdueTasks = await Task.find({
      ...taskFilter,
      status: { $ne: "Completed" },
      dueDate: { $lt: now, $ne: null },
    })
      .populate("projectId")
      .sort({ dueDate: 1 });

    // 4. Get pending tasks in detail
    const pendingTasks = await Task.find({
      ...taskFilter,
      status: "Pending",
    })
      .populate("projectId")
      .sort({ createdAt: -1 });

    // 5. Get in-progress tasks in detail
    const inProgressTasks = await Task.find({
      ...taskFilter,
      status: "In Progress",
    })
      .populate("projectId")
      .sort({ createdAt: -1 });

    // 6. Get project details with task counts
    const projectDetails = await Promise.all(
      projects.map(async (project) => {
        const projectTasks = await Task.find({ projectId: project._id });
        return {
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
        };
      }),
    );

    // 7. Get completion rate
    const completedTasks = allTasks.filter(
      (t) => t.status === "Completed",
    ).length;
    const completionRate =
      allTasks.length > 0
        ? Math.round((completedTasks / allTasks.length) * 100)
        : 0;

    // 8. Get upcoming tasks (due in next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingTasks = await Task.find({
      ...taskFilter,
      status: { $ne: "Completed" },
      dueDate: { $gte: now, $lte: nextWeek },
    })
      .populate("projectId")
      .sort({ dueDate: 1 });

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
    console.error("❌ Dashboard error:", error.message);
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
    const taskFilter = isAdmin ? {} : { assignedTo: userId };

    // Get task statistics
    const allTasks = await Task.find(taskFilter);
    const overdueTasks = await Task.find({
      ...taskFilter,
      status: { $ne: "Completed" },
      dueDate: { $lt: now, $ne: null },
    });

    const completedTasks = allTasks.filter(
      (t) => t.status === "Completed",
    ).length;
    const completionRate =
      allTasks.length > 0
        ? Math.round((completedTasks / allTasks.length) * 100)
        : 0;

    const projectCount = await Project.countDocuments(
      isAdmin ? {} : { members: userId },
    );

    res.status(200).json({
      status: "success",
      message: "Dashboard statistics retrieved successfully",
      data: {
        projectCount,
        totalTasks: allTasks.length,
        completedTasks,
        pendingTasks: allTasks.filter((t) => t.status === "Pending").length,
        inProgressTasks: allTasks.filter((t) => t.status === "In Progress")
          .length,
        overdueTasks: overdueTasks.length,
        completionRate: `${completionRate}%`,
      },
    });
  } catch (error) {
    console.error("❌ Dashboard stats error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve dashboard statistics",
      error: error.message,
    });
  }
};
