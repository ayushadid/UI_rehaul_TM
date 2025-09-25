import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../utils/axiosinstance';
import { API_PATHS } from '../utils/apiPaths';
import { FaRobot, FaPaperPlane } from 'react-icons/fa';
import { IoClose } from "react-icons/io5";
import { useNavigate } from 'react-router-dom'; // 👈 1. Import useNavigate
import toast from 'react-hot-toast'; // 👈 Import toast for better feedback

const AiCommandInterface = () => { // 👈 2. Remove onTaskCreated from props
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate(); // 👈 3. Initialize navigate

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ id: Date.now(), text: "Hello! How can I help you create a task today? (e.g., 'Create a task to design the new logo by next Friday')", sender: 'bot' }]);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = { id: Date.now(), text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await axiosInstance.post(API_PATHS.AI.CREATE_TASK, { text: userMessage.text });
      
      // Use toast for the main success message
      toast.success("Task created successfully!");

      // Optional: Add a confirmation message in the chat
      const successMessage = { id: Date.now() + 1, text: `✅ Task created! Navigating you to the task list...`, sender: 'bot' };
      setMessages(prev => [...prev, successMessage]);
      
      // 4. Navigate to the tasks page on success
      setTimeout(() => {
        navigate('/admin/tasks');
        setIsOpen(false); // Close the chat window after navigating
      }, 1500); // Wait a moment so the user can read the message

    } catch (error) {
      const errorMessageText = error.response?.data?.message || "An unexpected error occurred.";
      const errorMessage = { id: Date.now() + 1, text: `⚠️ ${errorMessageText}`, sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-80 h-96 flex flex-col transition-all duration-300">
          <div className="bg-primary text-white p-3 flex justify-between items-center rounded-t-lg">
            <h3 className="font-bold text-sm">Task Assigner</h3>
            <button onClick={() => setIsOpen(false)} className="text-xl hover:text-gray-200">
              <IoClose />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {messages.map(msg => (
              <div key={msg.id} className={`my-2 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p className={`max-w-xs px-3 py-2 rounded-lg text-sm ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  {msg.text}
                </p>
              </div>
            ))}
            {isLoading && (
                 <div className="my-2 flex justify-start">
                   <p className="max-w-xs px-3 py-2 rounded-lg text-sm bg-gray-200 text-gray-800">
                        Thinking...
                   </p>
                 </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-2 border-t border-gray-200">
            <div className="flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Assign..."
                className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-primary focus:border-primary"
                disabled={isLoading}
              />
              <button type="submit" className="bg-primary text-white p-3 rounded-r-md hover:bg-primary-dark" disabled={isLoading}>
                <FaPaperPlane />
              </button>
            </div>
          </form>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-primary-dark transition-transform duration-200 hover:scale-110"
        >
          <FaRobot />
        </button>
      )}
    </div>
  );
};

export default AiCommandInterface;