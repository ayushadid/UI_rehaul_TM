require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const http = require('http');
const { Server } = require("socket.io");

// --- START: 1. Import Models needed for Socket.IO ---
const Project = require("./models/Project");
const Task = require("./models/Task");
// --- END: 1. ---

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
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "https://adidmanager.onrender.com",
      "http://localhost:5173",
      "http://192.168.1.5:5173",
      "https://tmadid.thedevdesigner.site/"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(
  cors({
    origin: [
      "https://adidmanager.onrender.com",
      "http://localhost:5173",   
      "http://192.168.1.5:5173",
      "https://tmadid.thedevdesigner.site/"       
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

connectDB();

app.use(express.json());

// --- START: 2. Modified Socket.IO Connection Logic ---
const userSocketMap = {}; 

io.on('connection', (socket) => {
  console.log('🔌 A user connected:', socket.id);

  // Use the 'setup' event name you already have
  socket.on('setup', async (userId) => {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} is now connected with socket ID ${socket.id}`);

    // --- Add this block to join project rooms ---
    try {
        const [projectsByMembership, projectIdsByTask] = await Promise.all([
            Project.find({ members: userId }).select('_id'),
            Task.distinct('project', { assignedTo: userId })
        ]);
        
        const allProjectIds = [
            ...projectsByMembership.map(p => p._id.toString()),
            ...projectIdsByTask.map(id => id.toString())
        ];
        const uniqueProjectIds = [...new Set(allProjectIds)];

        uniqueProjectIds.forEach(projectId => {
            socket.join(projectId);
            console.log(`Socket ${socket.id} for user ${userId} joined project room ${projectId}`);
        });

    } catch (error) {
        console.error('Error joining project rooms:', error);
    }
    // --- End of new block ---
  });
  
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
// --- END: 2. ---

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

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
});