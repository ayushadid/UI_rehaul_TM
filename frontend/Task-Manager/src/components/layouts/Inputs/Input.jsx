import React, { useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";

const Input = ({ value, onChange, label, placeholder, type }) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const inputType = type === "password" ? (showPassword ? "text" : "password") : type;

  return (
    <div className="mb-4">
      <label className='text-[13px] text-slate-800 block mb-1'>{label}</label>
      
      <div className='relative flex items-center border border-slate-300 px-3 py-2 rounded-md'>
        <input
          type={inputType}
          placeholder={placeholder}
          className='w-full bg-transparent outline-none text-sm pr-8'
          value={value}
          onChange={onChange}
        />

        {type === "password" && (
          <div className="absolute right-3 cursor-pointer text-slate-500" onClick={toggleShowPassword}>
            {showPassword ? <FaRegEye size={20} /> : <FaRegEyeSlash size={20} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default Input;
