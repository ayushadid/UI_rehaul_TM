import React,{ useContext, useState } from 'react'
import AuthLayout from '../../components/layouts/AuthLayout';
import { validateEmail } from '../../utils/helper';
import ProfilePhotoSelector from '../../components/layouts/Inputs/ProfilePhotoSelector';
import Input from '../../components/layouts/Inputs/Input'
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import uploadImage from '../../utils/uploadImage';
import { UserContext } from '../../context/userContext';

const Signup = () => { 
  const [profilePic,setProfilePic]=useState(null);
  const [fullName,setFullName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [adminInviteToken,setAdminInviteToken]=useState('');

    const { updateUser }= useContext(UserContext);
  
    const navigate=useNavigate();
  
  const [error,setError]=useState(null);

    const handleSignUp=async(e)=>{
      e.preventDefault();
      
      let profileImageUrl=''

      if(!fullName){
        setError("Please enter full name");
        return;
      }

      if(!validateEmail(email)){
        setError("Please enter a vlid email address");
        return;
      }
  
      if(!password){
        setError("Please enter the password");
        return;
      }
  
      setError("");
  
      //Signup API Call

      try{

        //Upload image
        if(profilePic){
          const imgUploadRes=await uploadImage(profilePic);
          profileImageUrl=imgUploadRes.imageUrl||"";
        }
        const response=await axiosInstance.post(API_PATHS.AUTH.REGISTER,{
          name:fullName,
          email,
          password,
          profileImageUrl,
          adminInviteToken
        });

        const{token,role}=response.data;

        if(token){
          localStorage.setItem("token",token);
          updateUser(response.data);

          //Redirect based on user
          if(role==="admin"){
            navigate("/admin/dashboard");
          }else{
            navigate("/user/dashboard");
          }
        }

      }catch(error){
      if(error.message && error.response.data.message){
        setError(error.response.data.message);
      }
      else{
        setError("Something went wrong")
      }
    }
  
    }

  return (
    <AuthLayout>
      <div className='lg:w-[100%] h-auto md:h-full mt-10 md:mt-0 flex flex-col justify-center'> 
        <h3 className='text-xl font-semibold text-black'>Create an Account</h3>
        <p className='text-xs text-slate-700 mt-[5px] mb-6'>
          Enter your details
        </p>

        <form onSubmit={handleSignUp}> 
          <ProfilePhotoSelector image={profilePic} setImage={setProfilePic} />
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Input 
              value={fullName}
              onChange={({ target })=>setFullName(target.value)}
              label="Full Name"
              placeholder="John"
              type="text"
            />

            <Input 
            value={email}
            onChange={({ target })=> setEmail(target.value)}
            label="Email Address"
            placeholder='devangi@devangi.com'
            type='text'
          />

           <Input 
            value={password}
            onChange={({ target })=> setPassword(target.value)}
            label="Password"
            placeholder='Minimum of 8 characters'
            type='password'
          />

          <Input 
            value={adminInviteToken}
            onChange={({ target })=> setAdminInviteToken(target.value)}
            label="Admin Invite Token"
            placeholder='6 Digit Code'
            type='text'
          />          </div>


          {error && <p className='text-red-500 text-xs pb-2.5'>{error}</p>}

          <button type='submit' className='btn-primary'>
            Sign UP
          </button>

          <p className='text-[13px] text-slate-800 mt-3'>
            Already have an Account? {" "}
            <Link className='font-medium text-primary underline' to='/login'>
              Login
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  )
}

export default Signup