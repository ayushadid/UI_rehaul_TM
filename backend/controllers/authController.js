const User= require("../models/User");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");

//Generate JWT Token
const generateToken=(userId)=>{
    return jwt.sign({id:userId},process.env.JWT_SECRET,{expiresIn:"7d"});
};

//@desc Register a new User
//@route POST /api/auth/register
//@access Public
const registerUser=async(req,res)=>{
    try{
        const{name,email,password,profileImageUrl,adminInviteToken}=
        req.body;

        //check if user already exists
        const userExists=await User.findOne({email});
        if(userExists){
            return res.status(400).json({message:"User already exists"});
        }

        //Determine user role Admin or User
        let role="member";
        if(
            adminInviteToken &&
            adminInviteToken==process.env.ADMIN_INVITE_TOKEN
        ){
            role="admin";
        }

        // Hash password

        const salt=await bcrypt.genSalt(10);
        const HashedPassword=await bcrypt.hash(password,salt);

        //Create a new user
        const user=await User.create(
            {
                name,
                email,
                password: HashedPassword,
                profileImageUrl,
                role,
            }
        );

        //return user data with JWT
        res.status(201).json({
            _id:user.id,
            name:user.name,
            email:user.email,
            role:user.role,
            profileImageUrl:user.profileImageUrl,
            token:generateToken(user._id),
            
        });
    }catch(error){
        res.status(500).json({message:"Server error",error:error.message});
    }
};

//@desc Register a new User
//@route POST /api/auth/login
//@access Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid Email" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid Password" });
        }

        // Return user with valid JWT
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImageUrl: user.profileImageUrl,
            token: generateToken(user._id),
        });

    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

//@desc Register a new User
//@route POST /api/auth/profile
//@access Private (requiresJWT)
const getUserProfile=async(req,res)=>{
    try{
        const user=await User.findById(req.user.id).select("-password");
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        res.json(user);
    }catch(error){
        res.status(500).json({message:"Server error",error:error.message});
    }
};

//@desc Register a new User
//@route POST /api/auth/profile
//@access Private(requires JWT)
// In backend/controllers/authController.js

const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.profileImageUrl = req.body.profileImageUrl || user.profileImageUrl;

        // Secure password change logic
        if (req.body.newPassword) {
            if (!req.body.currentPassword) {
                return res.status(400).json({ message: "Current password is required to change password." });
            }

            const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);

            if (!isMatch) {
                return res.status(401).json({ message: "Incorrect current password." });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.newPassword, salt);
        }

        const updatedUser = await user.save();
        
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            profileImageUrl: updatedUser.profileImageUrl,
            token: generateToken(updatedUser._id),
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports={registerUser,loginUser,getUserProfile,updateUserProfile};
