const Participant = require("../models/participant.model");

// Ajouter un participant à un événement
exports.addParticipant = async (req, res) => {
  try {
    const { user_id, event_id } = req.body;
    const newParticipant = new Participant({ user_id, event_id });
    await newParticipant.save();
    res.status(201).json(newParticipant);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Erreur lors de l'ajout du participant", error });
  }
};

// Récupérer les participants d'un événement
exports.getParticipantsByEvent = async (req, res) => {
  try {
    const participants = await Participant.find({
      event_id: req.params.eventId,
    }).populate("user_id");
    res.status(200).json(participants);
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la récupération des participants",
      error,
    });
  }
};

// Suppression d'un participant
