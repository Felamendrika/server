const Group = require("../models/group.model");
const Membre = require("../models/membre.model");
const Role = require("../models/role.model");

const { isValidObjectId } = require("mongoose");
const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");
const { getIO } = require("../socket/socket");

// Middleware pour verifier si l'utilisateur est admin
const isAdmin = async (userId, groupId) => {
  const membre = await Membre.findOne({
    user_id: userId,
    group_id: groupId,
  }).populate("role_id");

  return membre && membre.role_id.type === "admin";
};

// inclure le nombre de membre dans les groupes
const countGroupMembres = async (group_id) => {
  return await Membre.countDocuments({ group_id });
};

// creation de groupe et ajouter auto l'user createur
exports.createGroup = async (req, res) => {
  try {
    const { nom, description } = req.body;
    const createur_id = req.user?._id || req.user?.id; // USER CONNECTER req.user?.id

    if (!req.user || !req.user._id || !req.user.id) {
      return res.status(401).json({
        message: "Utilisateur non authentifié",
      });
    }

    if (!nom) {
      return res.status(400).json({
        error: "Nom du groupe requis",
      });
    }

    // verification si le groupe avec un meme nom existe
    const existingGroup = await Group.findOne({ nom });
    if (existingGroup) {
      return res.status(400).json({
        message: "Un groupe avec ce nom existe déjà",
      });
    }

    // creation du groupe
    const group = new Group({
      nom,
      description,
      createur_id,
      date_creation: new Date(),
    });

    const savedGroup = await group.save();
    if (!savedGroup) {
      return res.status(404).json({
        erreur: "Groupe non creer et enregistrer",
      });
    }

    // attribution de l'user createur comme membre avec role
    const adminRole = await Role.findOne({ type: "admin" });

    await Membre.create({
      user_id: createur_id,
      group_id: group._id,
      role_id: adminRole._id,
      date_join: new Date(),
    });

    // creation de conversation de groupe
    const conversation = await Conversation.create({
      type: "group",
      group_id: savedGroup._id,
    });

    const populatedGroup = await Group.findById(savedGroup._id).populate(
      "createur_id",
      "nom pseudo avatar"
    );

    const io = getIO();
    // evenement socket pour notifier la creation du groupe
    if (io) {
      io.emit("newGroup", { group: savedGroup, createur_id: createur_id });
    } else {
      console.error("Socket.IO non initialisé");
      return res.status(500).json({
        message:
          "Erreur serveur interne. Socket.IO non disponible pour la diffusion",
      });
    }

    res.status(201).json({
      success: true,
      message: "Groupe créé et administrateur ajouté",
      data: {
        group: populatedGroup,
        conversation: conversation,
      },
    });
  } catch (error) {
    res.status(500).json({
      succes: false,
      message: "Erreur du serveur lors de la creation du groupe",
      error: error.message,
    });
  }
};

// Modification d'un groupe (seulement par un admin)
exports.updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { nom, description } = req.body;
    const adminId = req.user?._id || req.user?.id; // nosolona le req.user._id req.user?.id

    if (!req.user || !req.user._id || !req.user.id) {
      return res.status(401).json({
        message: "Utilisateur non authentifié",
      });
    }

    if (!isValidObjectId(adminId)) {
      return res.status(400).json({
        message: "ID de l'user admin invalide",
      });
    }
    if (!isValidObjectId(groupId)) {
      return res.status(400).json({
        message: "ID du groupe invalide",
      });
    }
    //declaration adminRole
    const adminRole = await Role.findOne({ type: "admin" }).select("_id");
    if (!adminRole) {
      return res.status(400).json({
        success: false,
        message: "Role admin introuvable",
      });
    }

    const adminMembre = await Membre.findOne({
      user_id: adminId,
      group_id: groupId,
      role_id: adminRole,
    });

    if (!adminMembre) {
      return res.status(403).json({
        success: false,
        message:
          "Seuls les administrateurs du groupe peuvent faire cet actions",
      });
    }

    const isUserAdmin = await isAdmin(adminId, groupId);
    if (!isUserAdmin) {
      return res.status(403).json({
        message: "Vous n'etes pas autorisé à modifier ce groupe",
      });
    }
    // await group.save();

    // Validation des champs
    if (!nom && !description) {
      return res.status(400).json({ message: "Aucune modification fournie" });
    }

    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        message: "Aucune donnée fournie pour la mise à jour",
      });
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { ...(nom && { nom }), ...(description && { description }) },
      //{ nom, description },
      { new: true }
    );

    if (!updatedGroup) {
      return res.status(404).json({
        error: "Groupe introuvable",
      });
    }

    const io = getIO();
    // evenement socket.io pour notifier de la mise a jour du groupe
    if (io) {
      io.to(`group_${groupId}`).emit("groupModified", {
        groupId,
        group: updatedGroup,
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
      message: "Groupe mis à jour avec succès.",
      data: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur du serveur lors de la modification du groupe",
      error: error.message,
    });
  }
};

// Suppression d'un groupe (seulement par un admin)
exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params; // req.params.id
    const adminId = req.user?._id || req.user?.id; // req.user?.id

    if (!req.user || !req.user._id || !req.user.id) {
      return res.status(401).json({
        message: "Utilisateur non authentifié",
      });
    }

    if (!adminId) {
      return res.status(404).json({
        erreur: "Utilisateur non recuperer",
      });
    }

    if (!isValidObjectId(groupId)) {
      return res.status(400).json({
        message: "ID du group invalide ",
      });
    }
    if (!isValidObjectId(adminId)) {
      return res.status(400).json({
        message: "ID user admin invalide ",
      });
    }

    // Verifie si l'utilisateur est admin du group
    const adminRole = await Role.findOne({ type: "admin" });

    if (!adminRole)
      return res
        .status(400)
        .json({ success: false, message: "Rôle admin introuvable" });

    const adminMembre = await Membre.findOne({
      group_id: groupId,
      user_id: adminId,
      role_id: adminRole._id,
    });

    if (!adminMembre) {
      return res.status(403).json({
        success: false,
        message:
          "Seuls les administrateurs du groupe peuvent supprimer ce groupe.",
      });
    }

    if (!(await isAdmin(adminId, groupId))) {
      return res.status(403).json({
        message: "Vous n'etes pas autorisé à modifier ce groupe",
      });
    }

    // supprimer le groupe
    const deletedGroup = await Group.findByIdAndDelete(groupId);
    if (!deletedGroup) {
      return res.status(404).json({
        success: false,
        error: "groupe introuvable",
      });
    }
    //supprime tous les membres
    await Membre.deleteMany({ group_id: groupId }); // Supprimer tous les membres du groupe

    const io = getIO();
    if (io) {
      io.emit("groupRemoved", { groupId, message: "Groupe supprimer" });
    } else {
      console.error("Socket.IO non initialisé");
      return res.status(500).json({
        message:
          "Erreur serveur interne. Socket.IO non disponible pour la diffusion",
      });
    }

    res.status(200).json({
      succes: true,
      message: "Groupe supprimé avec succès.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur du serveur lors de la suppression du groupe.",
      error: error.message,
    });
  }
};

// reccuperation de tous les groupes avec comptage dynamique de membres
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find().populate("createur_id", "nom");

    if (groups.length === 0 || !groups) {
      return res.status(404).json({
        message: "Aucun groupe recuperer",
      });
    }

    //Ajout d'un champ membreCount pour chaque groupe
    // Promise.all: permet de traiter chaque groupe de maniere asynchrone
    const groupWithMembreCount = await Promise.all(
      groups.map(async (group) => {
        const membreCount = await Membre.countDocuments({
          group_id: group._id,
        });
        return {
          ...group._doc, // inclure tous les champs existant du group
          TotalMembre: membreCount, // ajouter le champ membreCount
        };
      })
    );

    const count = await Membre.countDocuments(groups);
    res.status(200).json({
      success: true,
      message: "Voici la liste de tous les groupes",
      //data: groups,
      groupes: groupWithMembreCount,
      total: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des groupes",
      error: error.message,
    });
  }
};

// reccuperation de groupes par ID
exports.getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!isValidObjectId(groupId)) {
      return res.status(400).json({
        message: "ID du group invalide ",
      });
    }

    const group = await Group.findById(groupId).populate(
      "createur_id",
      "nom pseudo avatar"
    );

    if (!group) {
      return res.status(404).json({
        message: "Groupe introuvable",
      });
    }

    const membreCount = await countGroupMembres(groupId);

    res.status(200).json({
      success: true,
      message: "Voici le groupe recuperer",
      data: group,
      membre: membreCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur du serveur lors de la récupération du groupe",
      error: error.message,
    });
  }
};

//recuperer tout les membres d'un groupe OKEY TSY MILA KITINA
exports.getGroupMembres = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!isValidObjectId(groupId)) {
      return res.status(400).json({
        message: "ID du group invalide ",
      });
    }
    const membres = await Membre.find({ group_id: groupId })
      .populate("user_id", "nom prenom pseudo avatar")
      .populate("role_id", "type")
      .populate("group_id", "nom");

    if (!membres || membres.length === 0) {
      return res.status(404).json({
        error: "Aucun membre trouvé pour ce groupe",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: `Liste des membres du groupe récupérée avec succès`,
      data: membres,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Erreur du serveur lors de la récupération des membres du groupe",
      error: error.message,
    });
  }
};

// recuperer les groupes auquel l'user connecter est membre
exports.getUsersGroups = async (req, res) => {
  try {
    const userId = req.user || req.user?.id || req.user?._id;

    if (!req.user || !req.user.id || !req.user._id) {
      return res.status(401).json({
        message: "Utilisateur non authentifié ",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        message: "ID de l'user invalide ",
      });
    }
    const groups = await Membre.find({ user_id: userId })
      .distinct("group_id")
      .populate("group_id", "nom description")
      .populate("role_id", "type")
      .populate("user_id", "nom avatar pseudo");

    if (!groups || groups.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur n'est membre d'aucun groupe",
      });
    }

    const groupConversations = await Conversation.find({
      type: "group",
      group_id: {
        $in: groups,
      },
    })
      .populate("group_id", "nom description")
      .lean();

    for (const conversation of groupConversations) {
      const lastMessage = await Message.findOne({
        conversation_id: conversation._id,
      })
        .sort({ createdAt: -1 })
        .select("contenu date_envoi user_id conversation_id")
        .populate("conversation_id", "type")
        .populate("user_id", "nom pseudo avatar");

      conversation.dernierMessage = lastMessage || null;
    }

    if (!groupConversations || groupConversations.length === 0) {
      return res.status(404).json({
        message: "Aucune conversation de groupe concernant cet utilisateur",
      });
    }

    const io = getIO();
    if (io) {
      groupConversations.forEach((group) => {
        io.to(`user_${userId}`).emit("joinGroup", { groupId: group._id });
      });
    }

    res.status(200).json({
      success: true,
      message: `Voici tous les groupes auquel l'utilisateur est membre`,
      data: groupConversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Erreur du serveur lors de la récupération des groupes de l'utilisateur",
      error: error.message,
    });
  }
};
