const Task=require("../models/Task");
const User=require("../models/User");
const bcrypt=require("bcryptjs");

//@desc Get All Users (admin)
//@route GET /api/users/
//@access Private (admin)

const getUsers = async (req, res) => {
  try {
    // ✅ Change this line to find ALL users
    const users = await User.find({}).select("-password");

    const usersWithTaskCounts = await Promise.all(users.map(async (user) => {
      const pendingTasks = await Task.countDocuments({ assignedTo: user._id, status: "Pending" });
      const inProgressTasks = await Task.countDocuments({ assignedTo: user._id, status: "In Progress" });
      const completedTasks = await Task.countDocuments({ assignedTo: user._id, status: "Completed" });

      return {
        ...user._doc,
        pendingTasks,
        inProgressTasks,
        completedTasks,
      };
    }));

    res.status(200).json(usersWithTaskCounts);
    
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}


//@desc Get by Id 
//@route GET /api/users/:id
//@access Private

const getUserById=async(req,res)=>{
    try{
        const user=await User.findById(req.params.id).select("-password");
            if(!user) return res.status(404).json({message:"User not found"});
            res.json(user);
    }catch(error){
        res.status(500).json({message:"Server error",error:error.message});
    }
};

//@desc DElete A Users (admin)
//@route DELETE /api/users/:id
//@access Private (admin)

// const deleteUser= async(req,res)=>{};

module.exports={getUsers,getUserById};