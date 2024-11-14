// Importation du module mongoose
const mongoose = require("mongoose");

// definition schema et configuration
const participantSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
  },
});

const Participant = mongoose.model("Participant", participantSchema);

module.exports = Participant;
