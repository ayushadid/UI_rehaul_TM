import axios from 'axios';
import { BASE_URL } from './apiPaths';

const axiosInstance=axios.create({
    baseURL:BASE_URL,
    timeout:10000,
    headers:{
        "Content-Type":"application/json",
        Accept:"application/json",
    },
});

//Request Interceptor
axiosInstance.interceptors.request.use(
    (config)=>{
        const accessToken=localStorage.getItem("token");
        if(accessToken){
            config.headers.Authorization=`Bearer ${accessToken}`;
        }
        return config;
    },
    (error)=>{
        return Promise.reject(error);
    }
);

//Response Interceptor
axiosInstance.interceptors.response.use(
    (response)=>{
        return response;
    },
    (error)=>{
        if(error.message){
            if(error.message.status===401){
                window.location.href="/login";
            }else if(error.response.status===500){
                console.error("Server error.")
            }
        }else if (error.code==="ECONNABORTED"){
            console.error("Request timeout")
        }
        return Promise.reject(error);
    }
);

export const blogApi = axios.create({
    baseURL: "http://localhost:5000", // Your CMS Backend
    timeout: 10000,
    headers:{
        "Content-Type":"application/json",
        Accept:"application/json",
    },
});

export default axiosInstance;