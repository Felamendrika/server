const Participant = require("../models/participant.model");
const Event = require("../models/event.model");
const User = require("../models/user.model");

const { isValidObjectId } = require("mongoose");

const io = require("../server");

// Ajouter un ou plusieurs participant à un événement
exports.addParticipant = async (req, res) => {
  try {
    const { user_ids, event_id } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!req.user || !req.user._id || !req.user.id) {
      return (
        res.status(401),
        json({
          message: "Utilisateur non authentifier",
        })
      );
    }

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        message: "ID de l'utilisateur connecter non recuperer",
      });
    }

    if (!user_ids.every((id) => isValidObjectId(id))) {
      return res.status(400).json({
        message: "ID des utilisateurs invalides",
      });
    }
    if (!isValidObjectId(event_id)) {
      return res.status(400).json({
        message: "ID de l'evenement invalide",
      });
    }

    // verification si l'evenement existe
    const event = await Event.findById(event_id);
    if (!event) {
      return res.status(404).json({
        message: "Evenement introuvable",
      });
    }

    if (event.type === "public") {
      return res.status(400).json({
        message:
          "L'evenement est public, vous ne pouvez pas ajouter des participants",
      });
    }

    // Filter les utilisateurs deja participants
    const existingParticipants = await Participant.find({ event_id });
    const existingUserIds = existingParticipants.map((p) =>
      p.user_id.toString()
    );

    const newUserIds = user_ids.filter((id) => !existingUserIds.includes(id));
    if (newUserIds.length === 0) {
      return res.status(400).json({
        message: "Tous les utilisateurs sont deja participants",
      });
    }

    // creer de nouveaux participants
    //const newParticipant = new Participant({ user_ids, event_id });
    const newParticipants = newUserIds.map((user_id) => {
      return user_id, event_id; // s'assurer que l'objet et bien retourne
    });

    if (newParticipants.length === 0 || !newParticipants) {
      return res.status(404).json({
        message: "Aucun participant ",
      });
    }

    //await newParticipants.save();
    const savedParticipants = await Participant.insertMany(newParticipants, {
      ordered: false,
    });
    if (!savedParticipants) {
      return res.status(404).json({
        message: "Aucun participant ajouter",
      });
    }

    /*
    const participants = user_ids.map(user_id => ({ user_id, event_id }))
    await Participant.insertMany(participants, { ordered: false });
    */

    // if (io) {
    //   io.emit("participantAdded", {
    //     eventId: event_id,
    //     participants: savedParticipants,
    //   });
    // } else {
    //   console.error("Socket.IO non initialisé");
    //   //return res.status(500).json({ message: "Erreur serveur interne. Socket.IO non disponible pour la diffusion" });
    // }

    res.status(201).json({
      success: true,
      message: "Participants ajouter avec succes",
      data: savedParticipants,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Erreur serveur lors de l'ajout du participant",
      error: error.message,
    });
  }
};

// Récupérer les participants d'un événement
exports.getEventsParticipant = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({
        message: "ID de l'evenement invalide pour getEventsParticipant",
      });
    }

    // verifier si l'evenement existe
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        message: "Événement introuvable",
      });
    }

    const participants = await Participant.find({
      event_id: eventId,
    })
      .populate("user_id", "nom")
      .populate("event_id", "titre date_debut date_fin type");

    if (!participants || participants.length === 0) {
      return (
        res.status(404),
        json({
          message: `Aucun participant trouvé pour l'evenement ${event.titre}`,
        })
      );
    }

    res.status(200).json({
      success: true,
      message: `Voici les participants de l'evenement "${event.titre}"`,
      event: {
        titre: event.titre,
        date_debut: event.date_debut,
        date_fin: event.date_fin,
      },
      data: participants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des participants",
      error: error.message,
    });
  }
};

// Récupérer tous les événements auxquels un utilisateur connecter participe
exports.getParticipantEvents = async (req, res) => {
  try {
    //const { userId } = req.params;
    const userId = req.user?._id || req.user?.id;

    if (!req.user || !req.user._id || !req.user.id) {
      return res.status(401).json({
        message: "Utilisateur non authentifié",
      });
    }

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        message: "ID de l'utilisateur connecter non recuperer",
      });
    }

    const events = await Participant.find({ user_id: userId }).populate({
      path: "event_id",
      select: "titre description date_debut date_fin createur_id",
      populate: { path: "createur_id", select: "nom" },
    });

    if (events.length === 0 || !events) {
      return res.status(404).json({
        message: "Aucun événement trouvé pour cet utilisateur.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Voici les evenement auquel l'utilisateur participe",
      data: events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des événements.",
      error: error.message,
    });
  }
};

// Récupérer tous les participants de la plateforme (optionnel)
exports.getAllParticipants = async (req, res) => {
  try {
    const participants = await Participant.find()
      .populate("user_id", "nom email")
      .populate("event_id", "titre description date_debut date_fin");

    if (!participants || participants.length === 0) {
      return res.status(404).json({
        message: "Aucun participant recuperer",
      });
    }

    res.status(200).json({
      success: true,
      message: "Voici la liste de tout les participants",
      Participants: participants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des participants.",
      error: error.message,
    });
  }
};

// Suppression d'un participant
exports.removeParticipant = async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    // const { userId } = req.body;

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({
        message: "ID de l'evenement invalide",
      });
    }
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        message: "ID utilisateur invalide",
      });
    }

    // verification si l'event existe
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        message: " Evenement non existant",
      });
    }

    // verification si l'utilisteur est bien un participant
    const participant = await Participant.findOne({
      event_id: eventId,
      user_id: userId,
    });

    if (!participant) {
      return res.status(404).json({
        message: "Participant non trouvé dans cet événement.",
      });
    }

    const deleteParticipant = await Participant.findOneAndDelete(
      participant?.id || { event_id: eventId, user_id: userId }
    );
    if (!deleteParticipant) {
      return res.status(404).json({
        message: "Participant non supprimer",
      });
    }

    // // socket.io
    // if (io) {
    //   io.emit("participantRemoved", {
    //     eventId,
    //     userId,
    //   });
    // } else {
    //   console.error("Socket.IO non initialisé");
    //   //return res.status(500).json({ message: "Erreur serveur interne. Socket.IO non disponible pour la diffusion" });
    // }

    res.status(200).json({
      succes: true,
      message: "Participant supprimé avec succès.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur lors de la suppression du participant.",
      error: error.message,
    });
  }
};
