// Importation du module mongoose
const mongoose = require("mongoose");

// definition schema et configuration
const participantSchema = new mongoose.Schema({
  user_id: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
});

// index unique pour eviter un meme participant a un meme evenement
participantSchema.index({ user_id: 1, event_id: 1 }, { unique: 1 });

const Participant = mongoose.model("Participant", participantSchema);

module.exports = Participant;
