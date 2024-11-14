const Event = require("../models/event.model");
const User = require("../models/user.model");

// Création d'un événement
exports.createEvent = async (req, res) => {
  try {
    const { titre, description, date_debut, date_fin, createur_id } = req.body;

    // Vérification de l'existence de l'utilisateur créateur
    const user = await User.findById(createur_id);
    if (!user) {
      return res.status(400).json({
        message: "L'utilisateur créateur n'existe pas",
      });
    }

    const newEvent = new Event({
      titre,
      description,
      date_debut,
      date_fin,
      createur_id,
    });

    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la création de l'événement",
      error,
    });
  }
};

// Récupérer tous les événements
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("createur_id");

    res.status(200).json(events);
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la récupération des événements",
      error,
    });
  }
};

// Récupérer un événement par ID
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("createur_id");

    if (!event) {
      return res.status(404).json({
        message: "Événement non trouvé",
      });
    }

    res.status(200).json(event);
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la récupération de l'événement",
      error,
    });
  }
};

// Mise à jour d'un événement
exports.updateEvent = async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({
        message: "Événement non trouvé",
      });
    }

    res.status(200).json(updatedEvent);
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la mise à jour de l'événement",
      error,
    });
  }
};

// Suppression d'un événement
exports.deleteEvent = async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);

    if (!deletedEvent) {
      return res.status(404).json({
        message: "Événement non trouvé",
      });
    }
    res.status(200).json({ message: "Événement supprimé" });
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la suppression de l'événement",
      error,
    });
  }
};
