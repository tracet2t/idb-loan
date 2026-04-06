// import express from "express";
// const router = express.Router();
// // Import your controller functions (you'll need to create these next)
// // import { getAllUsers, createUser, updateUser, deleteUser, resetPassword } from "../controllers/userController.js";

// // All these routes are prefixed with /api/users in server.js
// router.get("/", (req, res) => res.send("Get all users logic here"));
// router.post("/", (req, res) => res.send("Create user logic here"));
// router.put("/:id", (req, res) => res.send("Update user logic here"));
// router.patch("/reset-password/:id", (req, res) => res.send("Reset password logic here"));
// router.delete("/:id", (req, res) => res.send("Delete user logic here"));

// export default router;

import express from "express";
import { 
    getAllUsers, 
    createUser, 
    updateUser, 
    deleteUser, 
    resetUserPassword 
} from "../controllers/userController.js";

// Optional: Import your auth middleware if you have it
// import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Route: /api/users
 * These routes are handled by the userController
 */

// 1. Get all users & Create a new user
router.route("/")
    .get(getAllUsers)   // Matches GET /api/users
    .post(createUser);  // Matches POST /api/users

// 2. Update and Delete specific users by ID
router.route("/:id")
    .put(updateUser)    // Matches PUT /api/users/:id
    .delete(deleteUser); // Matches DELETE /api/users/:id

// 3. Specialized route for password resets
// Matches PATCH /api/users/reset-password/:id
router.patch("/reset-password/:id", resetUserPassword);

export default router;