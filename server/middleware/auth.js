import { verifyIdToken } from "../config/firebase.js";

/**
 * Firebase Authentication Middleware
 * Verifies Firebase ID token from Authorization header
 * Extracts user information and attaches to req.user
 *
 * Expected header format: Authorization: Bearer <token>
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Missing or invalid authorization header",
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token
    const decodedToken = await verifyIdToken(token);

    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified || false,
      displayName: decodedToken.name || null,
      photoURL: decodedToken.picture || null,
      issuer: decodedToken.iss,
    };

    next();
  } catch (error) {
    console.error("❌ Authentication error:", error.message);
    res.status(401).json({
      status: "error",
      message: "Unauthorized: Invalid or expired token",
    });
  }
};

/**
 * Error Handling Middleware
 * Catches and formats errors from async route handlers
 *
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err.message);

  // Default error response
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    status: "error",
    message: message,
    ...(process.env.NODE_ENV === "development" && { error: err.stack }),
  });
};
