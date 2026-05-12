import mongoose from "mongoose";

/**
 * User Schema
 * Stores user information with Firebase UID as primary identifier
 */
const userSchema = new mongoose.Schema(
  {
    // Firebase UID - unique identifier from Firebase Auth
    firebaseUID: {
      type: String,
      required: [true, "Firebase UID is required"],
      unique: true,
      index: true,
    },

    // User's full name
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    // Email address
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },

    // User role for authorization
    role: {
      type: String,
      enum: {
        values: ["user", "admin"],
        message: "Role must be either 'user' or 'admin'",
      },
      default: "user",
    },

    // Track when user was created
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    // Track when user was last updated
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  },
);

// Index for faster queries by email
userSchema.index({ email: 1 });

// Update the updatedAt field before saving
userSchema.pre("save", function (next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Create and export User model
const User = mongoose.model("User", userSchema);

export default User;
