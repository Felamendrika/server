const Event = require("../models/event.model");
const User = require("../models/user.model");
const Participant = require("../models/participant.model");
const Group = require("../models/group.model");
const Membre = require("../models/membre.model");
const { notifyCalendarEvent } = require("../utils/notification");

const { isValidObjectId } = require("mongoose");
const { getIO } = require("../socket/socket");

// Socket.io

// Création d'un événement
exports.createEvent = async (req, res) => {
  try {
    const { titre, description, date_debut, date_fin, type, group_id } =
      req.body;
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

    // verification validiter du type
    if (!["public", "private", "group"].includes(type)) {
      return res.status(400).json({
        message: "Type d'événement invalide",
      });
    }

    // verification de la cohernece des events de groupe
    if (type === "group") {
      if (!group_id) {
        return res.status(400).json({
          message: "ID du groupe est obligatoire pour un événement de groupe",
        });
      }
      const group = await Group.findById(group_id);
      if (!group) {
        return res.status(404).json({
          message: "Groupe non trouvé",
        });
      }
    }

    // Vérification de l'existence de l'utilisateur créateur
    const user = await User.findById(createur_id);
    if (!user) {
      return res.status(404).json({
        message: "L'utilisateur créateur n'existe pas",
      });
    }

    // verification des dates
    if (new Date(date_debut) >= new Date(date_fin)) {
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
      type,
      group_id,
    });

    if (!event) {
      return res.status(404).json({
        message: "Evenement non creer",
      });
    }

    const newEvent = await event.save();
    await newEvent.populate([
      { path: "createur_id", select: " _id nom prenom pseudo avatar" },
      { path: "group_id", select: "nom" },
    ]);

    // Populate after saving

    // diffusion via socket
    const io = getIO();
    if (io) {
      // const populatedEvent = await Event.findById(newEvent._id).populate(
      //   "createur_id",
      //   "nom prenom pseudo avatar"
      // );
      const eventPayload = {
        ...newEvent.toObject(),
        createur_id: {
          _id: newEvent.createur_id._id,
          nom: newEvent.createur_id.nom,
          prenom: newEvent.createur_id.prenom,
          pseudo: newEvent.createur_id.pseudo,
          avatar: newEvent.createur_id.avatar,
        },
      };
      io.emit("newEvent", {
        event: eventPayload,
      });
    } else {
      console.error("Socket.IO non initialisé");
      return res.status(500).json({
        message:
          "Erreur serveur interne. Socket.IO non disponible pour la diffusion",
      });
    }

    // Après la création de l'événement public (dans createEvent) :
    if (type === "public") {
      // Notifier tous les utilisateurs sauf le créateur
      const allUsers = await User.find({ _id: { $ne: createur_id } });
      for (const user of allUsers) {
        await notifyCalendarEvent({
          userId: user._id,
          fromUserId: createur_id,
          message: `Nouvel événement public : ${titre}`,
          eventId: newEvent._id,
        });
      }
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

// creation d'evenement avec participant en une seule transaction si type == private
exports.createEventWithParticipants = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      titre,
      description,
      date_debut,
      date_fin,
      type,
      group_id,
      user_ids,
    } = req.body;
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

    // verification validiter du type
    if (!["public", "private", "group"].includes(type)) {
      return res.status(400).json({
        message: "Type d'événement invalide",
      });
    }

    // verification pour les evenement de groupe
    if (type === "group") {
      if (!group_id) {
        return res.status(400).json({
          message: "ID du groupe est obligatoire pour un événement de groupe",
        });
      }

      const group = await Group.findById(group_id);
      if (!group) {
        return res.status(404).json({
          message: "Groupe non trouvé",
        });
      }

      //verifier si l'utilisteur est membre du groupe
      const isMembre = await Membre.findOne({
        group_id: group_id,
        user_id: createur_id,
      });

      if (!isMembre) {
        return res.status(403).json({
          message: "Vous n'êtes pas membre de ce groupe",
        });
      }
    }

    // Vérification de l'existence de l'utilisateur créateur
    const createur = await User.findById(createur_id);
    if (!createur) {
      return res.status(404).json({
        message: "L'utilisateur créateur n'existe pas",
      });
    }

    // verification des dates
    if (new Date(date_debut) >= new date(date_fin)) {
      return res.status(400).json({
        message: "La date de début ne peut pas être après la date de fin",
      });
    }

    //verification de l'unicité du titre
    const existingEvent = await Event.findOne({ titre });
    if (existingEvent) {
      return res.status(400).json({
        message: "Un événement avec le même titre existe déjà",
      });
    }

    // creation de l'evenement
    const createdEvent = new Event({
      titre,
      description,
      date_debut,
      date_fin,
      createur_id,
      type,
      group_id: type === "group" ? group_id : null,
    });

    //sauvergarde de l'event
    const savedEvent = await createdEvent.save({ session });
    if (!savedEvent) {
      return res.status(404).json({
        message: "Evenement non creer",
      });
    }

    //si le type est private + participant
    let eventParticipants = [];
    if (type === "private") {
      // s'assurer que le createur est participant
      let participantIds = Array.isArray(user_ids) ? [...user_ids] : [];

      //ajouter le createur si il n'es pas dans a liste
      if (
        !participantIds.some((id) => id.toString() === createur_id.toString())
      ) {
        participantIds.push(createur_id);
      }
      if (participantIds.length > 0) {
        // Validation des IDs utilisateurs
        if (!participantIds.every((id) => mongoose.isValidObjectId(id))) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            message: "ID des utilisateurs invalides",
          });
        }
      }

      // dans le cas d'un event PRIVATE avec ajout participant
      /*if (type === "private" && Array.isArray(user_ids) && user_ids.length > 0) {
      // validation des IDs des utilisateurs
      if (!user_ids.every((id) => mongoose.isValidObjectId(id))) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: "ID des utilisateurs invalides ",
        });
      } */

      // creation des objets participants
      const participants = participantIds.map((user_id) => ({
        //user_ids solony participantIds
        user_id,
        event_id: savedEvent._id,
      }));

      //ajout des participants dans la transaction
      await Participant.insertMany(participants, {
        session,
        ordered: false, // permet de continuer meme si certains insert echoue
      });

      //recup des participants pour la reponse
      eventParticipants = await Participant.find({
        event_id: savedEvent._id,
      }).populate("user_id", "_id nom pseudo avatar");
    }

    // validation de la transaction
    await session.commitTransaction();
    session.endSession();

    //recup de l'event avec les relations peuplees
    const populatedEvent = await Event.findById(savedEvent._id)
      .populate("createur_id", "_id nom pseudo avatar")
      .populate("group_id", "nom");

    // Préparation des données supplémentaires selon le type
    let additionalData = {};

    if (type === "private") {
      additionalData.participants = eventParticipants;
    } else if (type === "group") {
      // Récupérer le nombre de membres du groupe pour information
      const memberCount = await Membre.countDocuments({ group_id });
      additionalData.group = {
        _id: populatedEvent.group_id._id,
        nom: populatedEvent.group_id.nom,
        memberCount,
      };
    }

    /*
        // Notification via Socket.IO
    const io = getIO();
    if (io) {
      const eventPayload = {
        ...populatedEvent.toObject(),
        createur_id: {
          _id: populatedEvent.createur_id._id,
          nom: populatedEvent.createur_id.nom,
          prenom: populatedEvent.createur_id.prenom,
          pseudo: populatedEvent.createur_id.pseudo,
          avatar: populatedEvent.createur_id.avatar,
        },
      };
      io.emit("newEvent", {
        event: eventPayload,
      });
    } else {
      console.error("Socket.IO non initialisé");
    }
    */

    /*
          const io = getIO();
    if (io) {
      const eventPayload = {
        ...populatedEvent.toObject(),
        type,
        additionalData
      };
      
      io.emit("newEvent", { event: eventPayload });
      
      // Si c'est un événement de groupe, notifier les membres du groupe
      if (type === "group") {
        const groupMembers = await Membre.find({ group_id });
        groupMembers.forEach(member => {
          io.to(`user_${member.user_id}`).emit("newGroupEvent", {
            event: eventPayload,
            groupId: group_id
          });
        });
      }
    } else {
      console.error("Socket.IO non initialisé");
    }
    */
    res.status(201).json({
      success: true,
      message:
        // "Evenement ${type}  creer avec succes" +
        // (eventParticipants.length > 0
        //   ? "avec" + eventParticipants.length + "participants"
        //   : ""),
        `Événement ${type} créé avec succès` +
        (type === "private" && eventParticipants.length > 0
          ? ` avec ${eventParticipants.length} participants`
          : type === "group"
          ? ` associé au groupe ${populatedEvent.group_id.nom}`
          : ""),
      data: {
        event: populatedEvent,
        participants: eventParticipants,
      },
    });
  } catch (error) {
    // annulation transaction en cas d'erreur
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      message: "Erreur interne lors de la creation de l'event",
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

// Récupérer les événements filtrer (public, private, group)
exports.getFilteredEvents = async (req, res) => {
  try {
    const { type } = req.query;
    const createur_id = req.user || req.user?.id || req.user?._id;

    if (!["public", "private", "group"].includes(type)) {
      return res.status(400).json({
        message: "Type d''événement invalide",
      });
    }

    let events;
    if (type === "public") {
      events = await Event.find({ type: "public" });
    } else if (type === "private") {
      events = await Event.find({ type: "private", createur_id: createur_id });
    } else {
      events = await Event.find({ type: "group" }).populate("group_id", "nom");
    }

    res.status(200).json({
      success: true,
      message: "Voici les evenements recuperer selon le filtre :",
      data: events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des événements filterer",
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

// Recuperation des evenements d'un groupe
exports.getGroupEvents = async (req, res) => {
  try {
    const { group_id } = req.params;
    const group = await Group.findById(group_id);

    if (!group || !isValidObjectId(group_id)) {
      return re.status(404).json({
        message: "Groupe non trouvé ou ID invalide",
      });
    }

    const events = await Event.find({ type: "group", group_id: group_id });
    if (!events || events.length === 0) {
      return res.status(404).json({
        message: "Aucun evenement trouvé pour ce groupe",
      });
    }

    res.status(200).json({
      success: true,
      message: "Voici les evenements de ce groupe",
      data: events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Erreur serveur lors de la recuperation des evenements du groupe",
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
    const { titre, description, date_debut, date_fin, type } = req.body;
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

    // verifier si le type de l'event a ete modifier
    if (type && type !== event.type) {
      // Passer de PUBLIC -> PRIVATE
      if (event.type === "public" && type === "private") {
        await Participant.create({ user_id: userId, event_id: eventId });
      }

      // Passer de PRIVATE -> PUBLIC
      if (event.type === "private" && type === "public") {
        await Participant.deleteMany({ event_id: eventId });
      }

      // Passer de GROUP a PUBLIC ou PRIVATE
      if (event.type === "group" && (type === "public" || type === "private")) {
        event.group_id = null;
      }

      // Passer de PUBLIC ou PRIVATE -> GROUP
      if (
        (event.type === "public" || event.type === "private") &&
        type === "group"
      ) {
        return res.status(400).json({
          message:
            "Impossible de passer d'un event public ou private a un event groupe",
        });
      }

      // appliquer le noueau type
      event.type = type;
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { titre, description, date_debut, date_fin, type },
      { new: true, runValidators: true } //active les validation de modele
    ).populate("createur_id", "nom prenom pseudo avatar");

    if (!updatedEvent) {
      return res.status(404).json({
        message: "Événement non trouvé",
      });
    }

    // socket.io
    const io = getIO();
    if (io) {
      // const populatedEvent = await Event.findById(updatedEvent._id).populate(
      //   "createur_id",
      //   "nom prenom pseudo avatar"
      // );

      const eventPayload = {
        ...updatedEvent.toObject(),
        createur_id: {
          _id: updatedEvent.createur_id._id,
          nom: updatedEvent.createur_id.nom,
          prenom: updatedEvent.createur_id.prenom,
          pseudo: updatedEvent.createur_id.pseudo,
          avatar: updatedEvent.createur_id.avatar,
        },
      };

      io.emit("eventModified", { event: eventPayload });
      // eventId: eventId, //updatedEvent._id
    } else {
      console.error("Socket.IO non initialisé");
      return res.status(500).json({
        message:
          "Erreur serveur interne. Socket.IO non disponible pour la diffusion",
      });
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
      io.emit("eventRemoved", { eventId, message: "Événement supprimé" });
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

/*/ rechercher un evenement
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
*/
