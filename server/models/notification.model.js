const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["message", "event", "conversation"],
      required: true,
    },
    contenu: {
      type: String,
      required: true,
    },
    destinataire_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    emeteur_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reference_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "onModel",
    },
    onModel: {
      type: String,
      required: true,
      enum: ["Message", "Event", "Conversation"],
    },
    lu: {
      type: Boolean,
      default: false,
    },
    date_creation: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ destinataire_id: 1, lu: 1 });
notificationSchema.index({ date_creation: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
