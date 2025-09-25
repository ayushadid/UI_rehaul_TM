const express=require("express");
const { protect,adminOnly }=require("../middlewares/authMiddleware");
const { exportTasksReport,exportUsersReport }=require("../controllers/reportController");

const router=express.Router();

router.get("/exports/tasks",protect,adminOnly,exportTasksReport); //Export all tasks
router.get("/exports/users",protect,adminOnly,exportUsersReport); //Export user-task report

module.exports=router;