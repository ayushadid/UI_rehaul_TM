const express = require("express");
const router = express.Router();
const { createAnnouncement,getAnnouncementById } = require("../controllers/announcementController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");

// Route to create a new announcement
router.post("/", protect, adminOnly, createAnnouncement);
router.get("/:id", protect, getAnnouncementById); // 👈 ADD THIS

module.exports = router;