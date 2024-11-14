const mongoose = require("mongoose");

const fichierSchema = mongoose.Schema({
  nom: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ["pdf", "image", "document"],
    required: true,
  },
  taille: {
    type: Number,
    required: true,
  },
  URL: {
    type: String,
    required: true,
  },
  message_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    required: true,
  },
});

fichierSchema.index({ message_id: 1 });
fichierSchema.index({ type: 1 });
fichierSchema.index({ nom: "text" });

const Fichier = mongoose.model("Fichier", fichierSchema);

module.exports = Fichier;