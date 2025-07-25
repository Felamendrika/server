// /models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // destinataire
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  }, // émetteur
  type: { type: String, required: true }, // message, event, group, etc.
  message: { type: String, required: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId, required: false }, // id de l'élément concerné (message, event, group...)
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
