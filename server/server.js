import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import { initializeFirebase } from "./config/firebase.js";
import { authMiddleware, errorHandler } from "./middleware/auth.js";
import taskRoutes from "./routes/taskRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

/**
 * Initialize Express server
 * Setup all middleware and routes
 */
const initializeServer = async () => {
  try {
    // ============================================
    // 1. Connect to Database
    // ============================================
    await connectDB();

    // ============================================
    // 2. Initialize Firebase Admin SDK
    // ============================================
    initializeFirebase();

    // ============================================
    // 3. Middleware Configuration
    // ============================================

    // CORS middleware - Allow requests from frontend
    app.use(
      cors({
        origin: ["http://localhost:5173", "https://team-taskers.vercel.app"],
        credentials: true,
      }),
    );

    // Body parser middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // ============================================
    // 4. Public Routes (No Authentication Required)
    // ============================================

    // Health check endpoint
    app.get("/api/health", (req, res) => {
      res.json({
        status: "success",
        message: "Server is running",
        timestamp: new Date().toISOString(),
      });
    });

    // Welcome route
    app.get("/", (req, res) => {
      res.json({
        message: "Welcome to Team Task Manager API",
        version: "1.0.0",
        documentation: "https://github.com/aditya6805/Task-Manager",
        endpoints: {
          health: "/api/health",
          tasks: "/api/tasks",
          projects: "/api/projects",
          dashboard: "/api/dashboard",
          users: "/api/users",
        },
      });
    });

    // ============================================
    // 5. Protected Routes (Require Authentication)
    // ============================================

    // Apply authentication middleware to all protected routes
    app.use("/api/tasks", authMiddleware);
    app.use("/api/projects", authMiddleware);
    app.use("/api/dashboard", authMiddleware);
    app.use("/api/users", authMiddleware);

    // Mount routes
    app.use("/api/tasks", taskRoutes);
    app.use("/api/projects", projectRoutes);
    app.use("/api/dashboard", dashboardRoutes);
    app.use("/api/users", userRoutes);

    // ============================================
    // 6. 404 Handler
    // ============================================
    app.use((req, res) => {
      res.status(404).json({
        status: "error",
        message: "Route not found",
        path: req.path,
        method: req.method,
      });
    });

    // ============================================
    // 7. Error Handling Middleware (Must be last)
    // ============================================
    app.use(errorHandler);

    // ============================================
    // 8. Start Server
    // ============================================
    app.listen(PORT, () => {
      console.log(`\n✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`✓ CORS Origin(s): ${allowedOrigins.join(", ")}`);
      console.log("\n✓ Endpoints Available:");
      console.log("  • GET  /api/health           - Health check");
      console.log("  • GET  /api/projects         - Get user projects");
      console.log("  • POST /api/projects         - Create project (admin)");
      console.log("  • GET  /api/tasks            - Get user tasks");
      console.log("  • POST /api/tasks            - Create task (admin)");
      console.log("  • GET  /api/tasks/project/:id - Get project tasks");
      console.log("  • PUT  /api/tasks/:id        - Update task status");
      console.log("  • GET  /api/dashboard        - Get dashboard data");
      console.log("\nServer initialized successfully! 🚀\n");
    });
  } catch (error) {
    console.error("❌ Failed to initialize server:", error.message);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Initialize and start the server
initializeServer();
