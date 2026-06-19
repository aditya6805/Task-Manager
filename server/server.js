import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectDB } from "./config/database.js";
import { initializeFirebase } from "./config/firebase.js";

import { authMiddleware, errorHandler } from "./middleware/auth.js";
import { useInMemoryStore } from "./models/index.js";

import taskRoutes from "./routes/taskRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Load environment variables
dotenv.config();

// Create express app
const app = express();

// Port
const PORT = process.env.PORT || 5000;

// Allowed frontend origins
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Check if an origin is allowed (supports Vercel preview URLs)
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allow requests with no origin (mobile/postman)
  if (allowedOrigins.includes(origin)) return true;
  // Allow any Vercel deployment URL
  if (/\.vercel\.app$/.test(origin)) return true;
  return false;
};

// ============================================
// Middleware
// ============================================

// CORS
app.use(
  cors({
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Initialize Express server
 */
const initializeServer = async () => {
  try {
    // ============================================
    // 1. Connect Database
    // ============================================
    await connectDB();

    // ============================================
    // 2. Initialize Firebase
    // ============================================
    initializeFirebase();

    // ============================================
    // 3. Public Routes
    // ============================================

    app.get("/api/health", (req, res) => {
      res.json({
        status: "success",
        message: "Server is running",
        store: useInMemoryStore ? "in-memory" : "mongodb",
        timestamp: new Date().toISOString(),
      });
    });

    app.get("/", (req, res) => {
      res.json({
        message: "Welcome to Team Task Manager API",
      });
    });

    // ============================================
    // 4. Protected Routes
    // ============================================

    app.use("/api/tasks", authMiddleware);
    app.use("/api/projects", authMiddleware);
    app.use("/api/dashboard", authMiddleware);
    app.use("/api/users", authMiddleware);

    app.use("/api/tasks", taskRoutes);
    app.use("/api/projects", projectRoutes);
    app.use("/api/dashboard", dashboardRoutes);
    app.use("/api/users", userRoutes);

    // ============================================
    // 5. 404 Handler
    // ============================================

    app.use((req, res) => {
      res.status(404).json({
        status: "error",
        message: "Route not found",
      });
    });

    // ============================================
    // 6. Error Handler
    // ============================================

    app.use(errorHandler);

    // ============================================
    // 7. Start Server
    // ============================================

    app.listen(PORT, () => {
      console.log(`\u2705 Server running on port ${PORT}`);
      console.log(`\u2705 Allowed Origins: ${allowedOrigins.join(", ")}`);
      console.log(
        `\u2705 Data store: ${useInMemoryStore ? "\u26a0\ufe0f  IN-MEMORY (data lost on restart)" : "MongoDB (persistent)"}`,
      );
    });
  } catch (error) {
    console.error("❌ Failed to initialize server:", error.message);
    process.exit(1);
  }
};

// ============================================
// Global Error Handling
// ============================================

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
  process.exit(1);
});

// Start server
initializeServer();
