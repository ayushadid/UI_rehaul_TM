const express=require("express");
const { adminOnly, protect }=require("../middlewares/authMiddleware");
const {getUsers, getUserById, deleteUser, getManageUsers,updateUserRole,deleteUserById,getUserProjects }=require("../controllers/userController")

const router =express.Router();

//User Management Routes
router.get("/", protect, adminOnly, getUsers); // Matches exactly "/api/users"
router.get("/manage", protect, adminOnly, getManageUsers); // Matches "/api/users/manage"

// 2. Dynamic, parameterized routes last
router.get("/:id", protect, adminOnly, getUserById); // Matches "/api/users/some-id"
router.put("/:id/role", protect, adminOnly, updateUserRole); // Matches "/api/users/some-id/role"
router.delete("/:id", protect, adminOnly, deleteUserById); // Matches "/api/users/some-id" with DELETE method
router.get("/:userId/projects", protect, adminOnly, getUserProjects);
module.exports=router;