const express=require("express");
const { adminOnly, protect }=require("../middlewares/authMiddleware");
const {getUsers, getUserById, deleteUser }=require("../controllers/userController")

const router =express.Router();

//User Management Routes
router.get("/",protect,adminOnly,getUsers); //Get all Users (for admin)
router.get("/:id",protect,getUserById);
// router.delete("/:id",protect,adminOnly,deleteUser);

module.exports=router;