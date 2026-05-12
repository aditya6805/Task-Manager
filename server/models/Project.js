import mongoose from "mongoose";

/**
 * Project Schema
 * Stores project information with members and creator tracking
 */
const projectSchema = new mongoose.Schema(
  {
    // Human-readable project ID shown in the UI
    projectId: {
      type: String,
      unique: true,
      index: true,
      trim: true,
    },

    // Project title
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    // Project description
    description: {
      type: String,
      default: null,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    // User who created the project (Firebase UID)
    createdBy: {
      type: String,
      required: [true, "Creator UID is required"],
      index: true,
    },

    // Array of project members (Firebase UIDs)
    members: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length >= 1;
        },
        message: "Project must have at least one member (the creator)",
      },
    },

    // Track when project was created
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    // Track when project was last updated
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  },
);

// Create index for faster queries
projectSchema.index({ createdBy: 1 });
projectSchema.index({ members: 1 });
projectSchema.index({ createdAt: -1 });

// Update the updatedAt field before saving
projectSchema.pre("save", function (next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Ensure creator is in members list
projectSchema.pre("save", function (next) {
  if (!this.members.includes(this.createdBy)) {
    this.members.unshift(this.createdBy);
  }

  if (!this.projectId) {
    const base = this.title
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 10);
    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    this.projectId = `${base || "PRJ"}-${suffix}`;
  }

  next();
});

// Create and export Project model
const Project = mongoose.model("Project", projectSchema);

export default Project;
