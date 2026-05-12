import mongoose from "mongoose";

/**
 * Task Schema
 * Stores task information with project assignment and status tracking
 */
const taskSchema = new mongoose.Schema(
  {
    // Task title
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    // Task description
    description: {
      type: String,
      default: null,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    // Project this task belongs to
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project ID is required"],
      index: true,
    },

    // User(s) assigned to the task (Firebase UID list)
    assignedTo: {
      type: [String],
      default: [],
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length >= 1;
        },
        message: "At least one assignee is required",
      },
      index: true,
    },

    // User who created the task
    createdBy: {
      type: String,
      required: [true, "Creator UID is required"],
      index: true,
    },

    // Submission history for the task
    submissions: {
      type: [
        new mongoose.Schema(
          {
            submittedBy: { type: String, required: true },
            content: { type: String, default: "" },
            submittedAt: { type: Date, default: Date.now },
            status: {
              type: String,
              enum: [
                "Draft",
                "Submitted",
                "Accepted",
                "Rejected",
                "Changes Requested",
              ],
              default: "Draft",
            },
            adminFeedback: { type: String, default: "" },
          },
          { _id: false },
        ),
      ],
      default: [],
    },

    // Admin review notes and feedback
    feedback: {
      type: [
        new mongoose.Schema(
          {
            addedBy: { type: String, required: true },
            comment: { type: String, default: "" },
            status: {
              type: String,
              enum: ["Accepted", "Rejected", "Changes Requested", "Info"],
              default: "Info",
            },
            createdAt: { type: Date, default: Date.now },
          },
          { _id: false },
        ),
      ],
      default: [],
    },

    // Task status
    status: {
      type: String,
      enum: {
        values: ["Pending", "In Progress", "Completed"],
        message: "Status must be 'Pending', 'In Progress', or 'Completed'",
      },
      default: "Pending",
    },

    // Due date (optional)
    dueDate: {
      type: Date,
      default: null,
    },

    // Track when task was created
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    // Track when task was last updated
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  },
);

// Create indexes for faster queries
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ dueDate: 1 });

// Update the updatedAt field before saving
taskSchema.pre("save", function (next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }

  if (typeof this.assignedTo === "string") {
    this.assignedTo = [this.assignedTo];
  }

  next();
});

// Create and export Task model
const Task = mongoose.model("Task", taskSchema);

export default Task;
