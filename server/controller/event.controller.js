const Event = require("../models/event.model");
const User = require("../models/user.model");
const Participant = require("../models/participant.model");
const Group = require("../models/group.model");
const Membre = require("../models/membre.model");
const { notifyCalendarEvent } = require("../utils/notification");

const mongoose = require("mongoose");
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
      return res.status(400).json({
        success: false,
        message: "Le titre et la description sont obligatoires",
      });
    }

    if (!date_debut || !date_fin) {
      return res.status(400).json({
        success: false,
        message: "Les dates sont requises pour l'évènement",
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

    // Vérification d'unicité du titre selon le type (aligné avec les index partiels)
    let duplicateQuery = { titre, type };
    if (type === "group" && group_id) {
      duplicateQuery.group_id = group_id;
    }
    if (type === "private" && createur_id) {
      duplicateQuery.createur_id = createur_id;
    }
    const existingEvent = await Event.findOne(duplicateQuery);
    if (existingEvent) {
      return res.status(409).json({
        success: false,
        message: "Un événement avec le même titre existe déjà pour ce contexte",
      });
    }

    const event = new Event({
      titre,
      description,
      date_debut,
      date_fin,
      createur_id,
      type,
      group_id: type === "group" ? group_id : null, // Explicitement null pour public/private
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

    // diffusion via socket (non bloquant si Socket.IO indisponible)
    try {
      const io = getIO();
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
      io.emit("newEvent", { event: eventPayload });
    } catch (e) {
      console.warn(
        "Socket.IO non initialisé - création d'événement sans diffusion"
      );
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
      message: "Evenement créer avec succès",
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
    if (new Date(date_debut) >= new Date(date_fin)) {
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
    const savedEvent = await createdEvent.save();
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
          return res.status(400).json({
            message: "ID des utilisateurs invalides",
          });
        }
      }

      // creation des objets participants
      const participants = participantIds.map((user_id) => ({
        user_id,
        event_id: savedEvent._id,
      }));

      //ajout des participants
      await Participant.insertMany(participants, {
        ordered: false, // permet de continuer meme si certains insert echoue
      });

      //recup des participants pour la reponse
      eventParticipants = await Participant.find({
        event_id: savedEvent._id,
      }).populate("user_id", "_id nom pseudo avatar");
    }

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

    res.status(201).json({
      success: true,
      message:
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
    const userId = req.user?._id || req.user?.id;

    // Vérification du type demandé
    if (!["public", "private", "group"].includes(type)) {
      return res.status(400).json({
        message: "Type d''événement invalide",
      });
    }

    let events = [];
    if (type === "public") {
      // Tous les événements publics
      events = await Event.find({ type: "public" });
    } else if (type === "private") {
      // Événements privés créés par l'utilisateur
      const created = await Event.find({
        type: "private",
        createur_id: userId,
      });
      // Événements privés où l'utilisateur est participant
      const participatingIds = await Participant.find({
        user_id: userId,
      }).distinct("event_id");
      const participating = await Event.find({
        _id: { $in: participatingIds },
        type: "private",
      });
      // Fusionner sans doublons
      const map = new Map();
      [...created, ...participating].forEach((evt) =>
        map.set(String(evt._id), evt)
      );
      events = Array.from(map.values());
    } else if (type === "group") {
      // Événements de groupes dont l'utilisateur est membre
      const groupIds = await Membre.find({ user_id: userId }).distinct(
        "group_id"
      );
      events = await Event.find({
        type: "group",
        group_id: { $in: groupIds },
      }).populate("group_id", "nom");
    }

    return res.status(200).json({
      success: true,
      message: "Voici les evenements recuperer selon le filtre :",
      data: events,
    });
  } catch (error) {
    return res.status(500).json({
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
      return res.status(404).json({
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

// Récupérer tous les événements visibles par l'utilisateur connecté
exports.getVisibleEvents = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!req.user || !userId || !isValidObjectId(userId)) {
      return res
        .status(401)
        .json({ success: false, message: "Utilisateur non authentifié" });
    }

    // Public
    const publicEventsPromise = Event.find({ type: "public" })
      .populate("createur_id", "nom prenom pseudo avatar")
      .populate("group_id", "nom");

    // Privé: créés par l'utilisateur OU où il est participant
    const privateCreatedPromise = Event.find({
      type: "private",
      createur_id: userId,
    }).populate("createur_id", "nom prenom pseudo avatar");
    const privateParticipatingPromise = Participant.find({
      user_id: userId,
    }).distinct("event_id");

    // Groupe: événements des groupes dont il est membre
    const memberGroupsPromise = Membre.find({ user_id: userId }).distinct(
      "group_id"
    );

    const [publicEvents, privateCreated, privateEventIds, memberGroupIds] =
      await Promise.all([
        publicEventsPromise,
        privateCreatedPromise,
        privateParticipatingPromise,
        memberGroupsPromise,
      ]);

    const privateParticipatingEvents = await Event.find({
      _id: { $in: privateEventIds },
      type: "private",
    }).populate("createur_id", "nom prenom pseudo avatar");

    const groupEvents = await Event.find({
      type: "group",
      group_id: { $in: memberGroupIds },
    })
      .populate("createur_id", "nom prenom pseudo avatar")
      .populate("group_id", "nom");

    // Fusion sans doublons
    const map = new Map();
    [
      ...publicEvents,
      ...privateCreated,
      ...privateParticipatingEvents,
      ...groupEvents,
    ].forEach((evt) => {
      map.set(String(evt._id), evt);
    });
    const data = Array.from(map.values()).sort(
      (a, b) => new Date(a.date_debut) - new Date(b.date_debut)
    );

    return res
      .status(200)
      .json({ success: true, message: "Événements visibles", data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des événements visibles",
      error: error.message,
    });
  }
};

// Mise à jour d'un événement
exports.updateEvent = async (req, res) => {
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
    const { eventId } = req.params;
    const userId = req.user?._id || req.user?.id;

    if (!req.user || !req.user._id || !req.user.id) {
      return res
        .status(401)
        .json({ success: false, message: "Utilisateur non authentifié" });
    }

    if (!isValidObjectId(eventId)) {
      return res
        .status(400)
        .json({ success: false, message: "ID de l'événement invalide" });
    }

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "ID de l'utilisateur connecté non récupéré",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Événement non trouvé" });
    }

    // Seul le créateur peut modifier
    if (String(event.createur_id) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Seul le créateur peut modifier cet événement",
      });
    }

    // Valider la cohérence des dates si modifiées
    const newStart = date_debut
      ? new Date(date_debut)
      : new Date(event.date_debut);
    const newEnd = date_fin ? new Date(date_fin) : new Date(event.date_fin);
    if (newStart >= newEnd) {
      return res.status(400).json({
        success: false,
        message: "La date de début doit être avant la date de fin",
      });
    }

    // Gérer les transitions de type
    let newType = type || event.type;
    if (type && type !== event.type) {
      // public -> private : ajouter le créateur comme participant + les participants sélectionnés
      if (event.type === "public" && type === "private") {
        try {
          // Ajouter le créateur comme participant
          await Participant.create({ user_id: userId, event_id: eventId });

          // Ajouter les autres participants sélectionnés
          if (Array.isArray(user_ids) && user_ids.length > 0) {
            const participantIds = user_ids.filter(
              (id) => id.toString() !== userId.toString()
            );
            if (participantIds.length > 0) {
              const participants = participantIds.map((user_id) => ({
                user_id,
                event_id: eventId,
              }));
              await Participant.insertMany(participants, { ordered: false });
            }
          }
        } catch (e) {
          // ignorer duplication participant
          if (e?.code !== 11000) throw e;
        }
      }

      // private -> public : supprimer tous les participants
      if (event.type === "private" && type === "public") {
        await Participant.deleteMany({ event_id: eventId });
      }

      // group -> public|private : supprimer ref groupe et tout participant
      if (event.type === "group" && (type === "public" || type === "private")) {
        event.group_id = null;
        await Participant.deleteMany({ event_id: eventId });
      }

      // public -> group : non autorisé (par règle métier)
      if (event.type === "public" && type === "group") {
        return res.status(400).json({
          success: false,
          message:
            "Impossible de passer d'un événement public à un événement de groupe",
        });
      }

      // private -> group : autorisé si group_id valide et créateur est membre
      if (event.type === "private" && type === "group") {
        if (!group_id || !isValidObjectId(group_id)) {
          return res.status(400).json({
            success: false,
            message:
              "group_id est requis et doit être valide pour passer en groupe",
          });
        }
        const group = await Group.findById(group_id);
        if (!group) {
          return res
            .status(404)
            .json({ success: false, message: "Groupe non trouvé" });
        }
        const isMembre = await Membre.findOne({ group_id, user_id: userId });
        if (!isMembre) {
          return res.status(403).json({
            success: false,
            message: "Vous n'êtes pas membre de ce groupe",
          });
        }
        event.group_id = group_id;
        await Participant.deleteMany({ event_id: eventId });
      }

      event.type = type; // appliquer le nouveau type
      newType = type;
    }

    // Gérer les participants pour les événements privés existants
    if (newType === "private" && Array.isArray(user_ids)) {
      // Récupérer les participants actuels
      const currentParticipants = await Participant.find({ event_id: eventId });
      const currentParticipantIds = currentParticipants.map((p) =>
        p.user_id.toString()
      );

      // Ajouter les nouveaux participants
      const newParticipantIds = user_ids.filter(
        (id) =>
          !currentParticipantIds.includes(id.toString()) &&
          id.toString() !== userId.toString()
      );

      if (newParticipantIds.length > 0) {
        const newParticipants = newParticipantIds.map((user_id) => ({
          user_id,
          event_id: eventId,
        }));
        await Participant.insertMany(newParticipants, { ordered: false });
      }
    }

    // Validation d'unicité selon le contexte si le titre ou le type/groupe change
    const candidateTitre = titre || event.titre;
    const candidateType = newType;
    const candidateGroupId =
      candidateType === "group" ? group_id || event.group_id : null;
    const duplicateQuery = {
      _id: { $ne: eventId },
      titre: candidateTitre,
      type: candidateType,
    };
    if (candidateType === "group") duplicateQuery.group_id = candidateGroupId;
    if (candidateType === "private") duplicateQuery.createur_id = userId;
    const duplicate = await Event.findOne(duplicateQuery);
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Un événement avec le même titre existe déjà pour ce contexte",
      });
    }

    // Appliquer les champs modifiés
    if (typeof titre !== "undefined") event.titre = titre;
    if (typeof description !== "undefined") event.description = description;
    if (typeof date_debut !== "undefined") event.date_debut = newStart;
    if (typeof date_fin !== "undefined") event.date_fin = newEnd;
    // group_id ne s'applique que pour type=group
    if (newType === "group" && typeof group_id !== "undefined")
      event.group_id = group_id;

    const saved = await event.save();
    const updatedEvent = await Event.findById(saved._id)
      .populate("createur_id", "nom prenom pseudo avatar")
      .populate("group_id", "nom");

    // socket.io (non bloquant)
    try {
      const io = getIO();
      const payload = {
        ...updatedEvent.toObject(),
        createur_id: {
          _id: updatedEvent.createur_id._id,
          nom: updatedEvent.createur_id.nom,
          prenom: updatedEvent.createur_id.prenom,
          pseudo: updatedEvent.createur_id.pseudo,
          avatar: updatedEvent.createur_id.avatar,
        },
      };
      io.emit("eventModified", { event: payload });
    } catch (e) {
      console.warn("Socket.IO non initialisé - mise à jour sans diffusion");
    }

    return res.status(200).json({
      success: true,
      message: "Événement mis à jour",
      data: updatedEvent,
    });
  } catch (error) {
    return res.status(500).json({
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
