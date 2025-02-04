const Event = require("../models/event.model");
const User = require("../models/user.model");
const Participant = require("../models/participant.model");

const { isValidObjectId } = require("mongoose");
const { getIO } = require("../socket/socket");

// Socket.io

// Création d'un événement
exports.createEvent = async (req, res) => {
  try {
    const { titre, description, date_debut, date_fin } = req.body;
    const createur_id = req.user?._id || req.user?.id;

    if (!req.user || !req.user._id || !req.user.id) {
      return res.status(401).json({
        message: "Utilisateur non authentifier",
      });
    }

    if (!createur_id) {
      return res.status(401).json({
        message: "ID utilisateur connecter non recuperer",
      });
    }

    if (!titre || !description) {
      return res.status(404).json({
        message: "Le titre et la description sont obligatoire",
      });
    }

    if (!date_debut || !date_fin) {
      return res.status(404).json({
        message: "Les dates sont requis pour l'évènement ",
      });
    }

    // Vérification de l'existence de l'utilisateur créateur
    const user = await User.findById(createur_id);
    if (!user) {
      return res.status(404).json({
        message: "L'utilisateur créateur n'existe pas",
      });
    }

    // verification des dates
    if (new Date(date_debut) > new Date(date_fin)) {
      return res.status(400).json({
        message: "La date de début ne peut pas être après la date de fin",
      });
    }

    // verification que le titre et la description sont unique
    const existingEvent = await Event.findOne({ titre });
    if (existingEvent) {
      return res.status(400).json({
        message: "Un événement avec le même titre existe déjà",
      });
    }

    const event = new Event({
      titre,
      description,
      date_debut,
      date_fin,
      createur_id,
    });

    if (!event) {
      return res.status(404).json({
        message: "Evenement non creer",
      });
    }

    const newEvent = await event.save();

    // Populate after saving

    // diffusion via socket
    const io = getIO();
    if (io) {
      const populatedEvent = await Event.findById(newEvent._id).populate(
        "createur_id",
        "nom prenom pseudo avatar"
      );
      io.emit("eventCreated", {
        event: populatedEvent,
        // message: `Nouvel événement créé: ${newEvent.titre}`,
      });
    } else {
      console.error("Socket.IO non initialisé");
      // return res.status(500).json({
      //   message:
      //     "Erreur serveur interne. Socket.IO non disponible pour la diffusion",
      // });
    }

    res.status(201).json({
      success: true,
      message: "Evenement creer avec succes",
      data: newEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création de l'événement",
      error: error.message,
    });
  }
};

// Récupérer tous les événements
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("createur_id", "nom prenom pseudo avatar")
      .sort({ date_debut: 1 });

    if (events.length === 0 || !events) {
      return res.status(404).json({
        message: "Aucun evenements recuperer dans la Base de Donnees",
      });
    }

    // Ajout nombre de participants pour chaque evenement
    const dataEvent = await Promise.all(
      events.map(async (event) => {
        const participantCount = await Participant.countDocuments({
          event_id: event._id,
        });
        return {
          ...event._doc,
          nombre_participants: participantCount,
          est_passe: new Date(event.date_fin) < new Date(), // BOolean : event passe ou non
        };
      })
    );

    res.status(200).json({
      success: true,
      messages: "Voici la liste de tous les evenements:",
      data: dataEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des événements",
      error: error.message,
    });
  }
};

// Récupérer un événement par ID
exports.getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!isValidObjectId(eventId)) {
      return res.status(401).json({
        message: "ID de l'evenement invalide",
      });
    }

    const event = await Event.findById(eventId).populate(
      "createur_id",
      "nom pseudo prenom avatar"
    );

    if (!event) {
      return res.status(404).json({
        message: "Événement non trouvé",
      });
    }

    const participantCount = await Participant.countDocuments({
      event_id: event._id,
    });

    res.status(200).json({
      success: true,
      message: "Evenement recuperer",
      Event: event,
      data: {
        ...event.toObject(),
        nombre_participants: participantCount,
        est_passe: new Date(event.date_fin) < new Date(), // boolean
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération de l'événement",
      error: error.message,
    });
  }
};

// Evenement d'un utilisateur
exports.getUserEvents = async (req, res) => {
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
        message: "ID de utilisateur connecte non recuperer ou invalide",
      });
    }

    // recuperation des evenement creer par l'utilisateur
    const createdEvents = await Event.find({ createur_id: userId })
      .populate("createur_id", "nom")
      .sort({ date_debut: 1 });

    if (createdEvents.length === 0 || !createdEvents) {
      return res.status(400).json({
        message: "L'utilisateur n'a creer aucun evenement",
      });
    }

    const participatingEvents = await Participant.find({
      user_id: userId,
    }).populate({
      path: "event_id",
      populate: { path: "createur_id", select: "nom" },
    });

    if (!participatingEvents || participatingEvents.length === 0) {
      return res.status(404).json({
        message: "Aucun participant trouvé pour cet evenement",
      });
    }

    res.status(200).json({
      success: true,
      message: "Voici les événements creer par l'utilisateur",
      evenement: createdEvents,
      participants: participatingEvents.map((p) => p.event_id),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Erreur serveur lors de la recuperation des evenement de l'utilisateur",
      error: error.message,
    });
  }
};

// Événements à venir
exports.getUpcomingEvents = async (req, res) => {
  try {
    const currentDate = new Date();

    const events = await Event.find({
      date_debut: { $gte: currentDate },
    })
      .populate("createur_id", "nom prenom pseudo avatar")
      .sort({ date_debut: 1 });

    if (events.length === 0 || !events)
      return res.status(404).json({ message: "aucun evenement a venir" });

    res.status(200).json({
      success: true,
      message: "Voici les événements a venir ",
      data: events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la recuperation des evenements a venir",
      error: error.message,
    });
  }
};

// Événements passes
exports.getPastEvents = async (req, res) => {
  try {
    const events = await Event.find({
      date_fin: { $lt: new Date() },
    })
      .populate("createur_id", "nom")
      .sort({ date_debut: -1 }); // Trie decroissante pour les evenement passes

    if (events.length === 0 || !events)
      return res.status(400).json({ message: "aucun evenement passer" });

    res.status(200).json({
      success: true,
      message: "Voici les événements passe ",
      data: events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: " Erreur serveur lors la récupération des événements passés",
      error: error.message,
    });
  }
};

// Mise à jour d'un événement
exports.updateEvent = async (req, res) => {
  try {
    const { titre, description, date_debut, date_fin } = req.body;
    const { eventId } = req.params;
    const userId = req.user?._id || req.user?.id;

    if (!req.user || !req.user._id || !req.user.id) {
      return res.status(400).json({
        message: "Utilisateur non authentifier",
      });
    }

    if (!isValidObjectId(eventId)) {
      return res.status(401).json({
        message: "ID de l'event invalide",
      });
    }

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        message: "ID de l'utilisateur connecter non recuperer",
      });
    }

    const event = await Event.findById(eventId);

    // verifie si l'utilisateur est le createur de l'evenement
    if (event.createur_id.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Seul le createur peut modifier cet evenement,",
      });
    }

    // verification d'unicite si titre et description sont modifier
    if (titre && description) {
      const existingEvent = await Event.findOne({
        _id: { $ne: eventId }, // exclu l'event en cours de modif
        titre,
        description,
      });

      if (existingEvent) {
        return res.status(409).json({
          message:
            "Un autre événement avec le même titre et la même description existe déjà",
        });
      }
    }
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { titre, description, date_debut, date_fin },
      { new: true, runValidators: true } //active les validation de modele
    );

    if (!updatedEvent) {
      return res.status(404).json({
        message: "Événement non trouvé",
      });
    }

    // socket.io
    const io = getIO();
    if (io) {
      const populatedEvent = await Event.findById(updatedEvent._id).populate(
        "createur_id",
        "nom prenom pseudo avatar"
      );

      io.emit("eventUpdated", {
        event: populatedEvent,
        eventId: eventId, //updatedEvent._id
        message: `L'événement "${updatedEvent.titre}" a été mis à jour`,
      });
    } else {
      console.error("Socket.IO non initialisé");
      // return res.status(500).json({
      //   message:
      //     "Erreur serveur interne. Socket.IO non disponible pour la diffusion",
      // });
    }

    res.status(200).json({
      success: true,
      message: "Evenement mis a jour",
      data: updatedEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour de l'événement",
      error: error.message,
    });
  }
};

// Suppression d'un événement
exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?._id || req.user?.id;

    if (!req.user || !req.user._id || !req.user.id) {
      return res.status(400).json({
        message: "Utilisateur non authentifier",
      });
    }

    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({
        message: "ID de l'utilisateur non recuperer",
      });
    }

    if (!isValidObjectId(eventId)) {
      return res.status(403).json({
        message: "ID evenement invalide",
      });
    }
    const event = await Event.findById(eventId);

    // const deleteEvent = await Event.findByIdAndDelete( eventId )
    if (!event) {
      return res.status(404).json({
        message: "Événement non trouvé",
      });
    }

    // verifie si l'utilisateur est le createur de l'event
    if (event.createur_id.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Vous n'etes pas autoriser a supprimer cet evenement",
      });
    }

    // verifie que l'evenement n'est pas deja passe
    // if (new Date(event.date_fin) < new Date()) {
    //   return res.status(400).json({
    //     message: "Vous ne pouvez as supprimer un evenement passé ",
    //   });
    // }

    // supprimer tout les participants associes a l'evenement
    const deleteParticipant = await Participant.deleteMany({
      event_id: eventId,
    });
    if (!deleteParticipant) {
      return res.status(404).json({
        message: "Participant non supprimer",
      });
    }

    const deleteEvent = await Event.findByIdAndDelete(eventId);
    if (!deleteEvent) {
      return res.status(404).json({
        message: "Evenement non supprimer",
      });
    }

    // socket
    const io = getIO();
    if (io) {
      io.emit("eventDeleted", {
        eventId: eventId,
        message: "Événement supprimé",
      });
    } else {
      console.error("Socket.IO non initialisé");
      return res.status(500).json({
        message:
          "Erreur serveur interne. Socket.IO non disponible pour la diffusion",
      });
    }

    res.status(200).json({
      success: true,
      message: "Événement supprimé",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression de l'événement",
      error: error.message,
    });
  }
};

// rechercher un evenement
exports.searchEvents = async (req, res) => {
  try {
    const { titre } = req.query;

    const query = {};
    if (titre) {
      query.titre = { $regex: titre, $options: "i" }; // recherche insensible a la case
    }

    const events = await Event.find(query)
      .populate("createur_id", "nom")
      .sort({ date_debut: 1 });

    res.status(200).json({
      success: true,
      message: "Voici le resultat de recherche",
      evenement: events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: " Erreur lors de la recherche de l'evenement",
      error: error.message,
    });
  }
};
