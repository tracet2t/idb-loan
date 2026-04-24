import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const protect = async (req, res, next) => {
  let token;

  // 1. Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 2. Extract token from "Bearer <token>"
      token = req.headers.authorization.split(" ")[1];

      // 3. Verify token using your JWT_SECRET from .env
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Get user from the token (excluding password for security)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User no longer exists." });
      }

      next(); // Move to the next function (the controller)
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      res.status(401).json({ message: "Not authorized, token failed." });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token found." });
  }
};

// Optional: Role-based access (e.g., only Super Admins can delete loans)
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};