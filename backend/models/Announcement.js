const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "An announcement must have a title"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "An announcement must have content"],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // To whom the announcement is sent
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    // A flag to easily identify announcements sent to everyone
    isBroadcast: {
        type: Boolean,
        default: false,
    },
    // To track read receipts in the future
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Announcement", announcementSchema);