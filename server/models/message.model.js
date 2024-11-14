// importation mongoose
const mongoose = require("mongoose");

// Definition et configuration Schema
const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: function () {
      return !this.fichier; // Si pas de fichier, contenu requis
    },
    trim: true,
    index: true,
  },
  status: {
    type: String,
    enum: ["envoye", "distribue", "lu"],
    default: "envoye",
  },
  date_envoi: {
    type: Date,
    default: Date.now,
    required: true,
    index: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  conversation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
    index: true,
  },
  fichier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Fichier",
    required: false, // fichier facu;tatif
  },
});

// Idexations
messageSchema.index({ conversation_id: 1 });
messageSchema.index({ user_id: 1 });
messageSchema.index({ date_envoi: 1 });
messageSchema.index({ contenu: "text" }); // Recherche full-text

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
