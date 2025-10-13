require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const http = require('http'); // 👈 1. Import Node's built-in HTTP module
const { Server } = require("socket.io"); // 👈 2. Import the Server class from socket.io

// Import all your route files
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const reportRoutes = require("./routes/reportRoutes");
const projectRoutes = require("./routes/projectRoutes");
const timelogRoutes = require("./routes/timelogRoutes");
const aiRoutes = require("./routes/aiRoutes");
const performanceRoutes = require("./routes/performanceRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const announcementRoutes = require("./routes/announcementRoutes"); 


const app = express();
const server = http.createServer(app); // 👈 3. Create an HTTP server from your Express app

// 👈 4. Configure Socket.IO to work with the new server
const io = new Server(server, {
  cors: {
    origin: [
      "https://adidmanager.onrender.com",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});


// Middleware to handle CORS
app.use(
  cors({
    origin: [
      "https://adidmanager.onrender.com", // your frontend URL
      "http://localhost:5173",            // local dev (optional)
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true, // important if using cookies or auth tokens
  })
);

// Connect to database
connectDB();

// Middleware
app.use(express.json());

// --- START: Socket.IO Connection Logic ---
const userSocketMap = {}; // This object will map a userId to their unique socket.id

io.on('connection', (socket) => {
  console.log('🔌 A user connected:', socket.id);

  // When a user logs in, the frontend will emit this 'setup' event
  socket.on('setup', (userId) => {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} is now connected with socket ID ${socket.id}`);
  });
  
  // Clean up the map when a user disconnects
  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
    for (const userId in userSocketMap) {
      if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
        break;
      }
    }
  });
});
// --- END: Socket.IO Logic ---


// 👈 5. Add middleware to make 'io' and the user map available in all controllers
app.use((req, res, next) => {
    req.io = io;
    req.userSocketMap = userSocketMap;
    next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/timelogs", timelogRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/push", require("./routes/pushRoutes"));
app.use("/api/announcements", announcementRoutes);

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Start server
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

// 👈 6. Change app.listen to server.listen to start the server with WebSocket capabilities
server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
});
