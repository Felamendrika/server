const Membre = require("../models/membre.model");
const Group = require("../models/group.model");
const Role = require("../models/role.model");
const User = require("../models/user.model");

const mongoose = require("mongoose");
//const { isValidObjectId } = require("mongoose")

const { getIO } = require("../socket/socket");

const isAdminOfGroup = async (groupId, userId) => {
  const adminRole = await Role.findOne({ type: "admin" }).select("_id");
  if (!adminRole) {
    return res.status(404).json({
      message: "Role admin non sélectionné",
    });
  }
  return await Membre.findOne({
    group_id: groupId._id,
    user_id: userId._id,
    role_id: adminRole,
  });
};

const checkAdminRights = async (req, groupId) => {
  const userId = req.user?._id || req.user?.id;
  const isAdmin = await isAdminOfGroup(groupId, userId);

  if (!isAdmin) {
    throw {
      status: 403,
      message: "Seuls les administrateurs peuvent effectuer cette action.",
    };
  }
};

// Ajouter un membre a un groupe avec le role membre par defaut
exports.addMembre = async (req, res) => {
  try {
    const { user_id, group_id } = req.body;
    const userId = req.user?._id || req.user?.id; // Id de l'admin connecte

    if (!req.user || !req.user._id || !req.user.id) {
      return res.status(401).json({
        message: "Utilisateur non authentifié",
      });
    }

    // validations des IDs
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({
        message: "ID user invalide",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(group_id)) {
      return res.status(400).json({
        message: "ID group invalide",
      });
    }

    // Verification de l'existance du groupe
    const group = await Group.findById(group_id);
    if (!group) {
      return res.status(404).json({
        error: "Le groupe spécifié n'existe pas ",
        data: null,
      });
    }

    // verification de l'existance de l'utilisateur
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        error: "L'utilisateur spécifié n'existe pas",
        data: null,
      });
    }

    //verifie si l'utilisateur connecte est admin
    // ao @ MODEL ROLE no akana le role admin
    const adminRole = await Role.findOne({ type: "admin" }).select("_id");
    if (!adminRole) {
      return res.status(404).json({
        message: "role admin non sélectionné",
      });
    }

    const adminMembre = await Membre.findOne({
      group_id: group_id,
      user_id: userId,
      role_id: adminRole,
    });

    if (!adminMembre) {
      return res.status(403).json({
        message:
          "Seuls les administrateurs du groupe peuvent ajouter des membres",
      });
    }

    // Verifie si l'utilisateur est deja membre du groupe
    const existingMembre = await Membre.findOne({
      group_id,
      user_id,
    })
      .populate("group_id", "nom")
      .populate("user_id", "nom pseudo avatar")
      .populate("role_id", "type");

    if (existingMembre) {
      return res.status(400).json({
        message: "Cet utilisateur est déjà membre du groupe.",
        groupe: existingMembre,
      });
    }

    // Attribuer le role  par defaut 'membre
    const membreRole = await Role.findOne({ type: "membre" }).select("_id");

    // Creer le membre
    const newMembre = await Membre.create({
      group_id,
      user_id,
      role_id: membreRole,
      date_join: new Date(),
    });

    if (!newMembre) {
      return res.status(404).json({
        message: "Aucun membre ajouter et creer",
      });
    }

    const fullMembre = await Membre.findById(newMembre._id)
      .populate("group_id", "nom description")
      .populate("user_id", "nom prenom pseudo avatar")
      .populate("role_id", "type");

    const io = getIO();
    // emission d'un evenement socket.io
    if (io) {
      io.to(`group_${group_id}`).emit("membreAdded", {
        membre: fullMembre,
        group: group,
        //groupId: group_id,
      });

      io.to(`group_${user_id}`).emit("joinedGroup", {
        group: group,
        // conversation: conversation,
        conversation: group_id.conversation,
      });
    } else {
      console.error("Socket.IO non initialisé");
      return res.status(500).json({
        message:
          "Erreur serveur interne. Socket.IO non disponible pour la diffusion",
      });
    }

    res.status(201).json({
      success: true,
      message: "Membre ajouté au groupe avec succes",
      data: fullMembre,
      // data: newMembre,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'ajout du membre au groupe",
      error: error.message,
    });
  }
};

// Modifier le role d'un membre (uniquement par un admin)
exports.updateMembreRole = async (req, res) => {
  try {
    const { role_id } = req.body;
    const adminId = req.user?._id || req.user?.id; // ID de l'admin connecte req.user?._id
    const { membreId } = req.params;

    if (!req.user || !req.user._id || !req.user.id) {
      return res.status(401).json({
        message: "Utilisateur non authentifié",
      });
    }

    // Validation des IDs
    if (!mongoose.Types.ObjectId.isValid(membreId)) {
      return res.status(400).json({ message: "IDs membre invalide" });
    }
    if (!mongoose.Types.ObjectId.isValid(role_id)) {
      return res.status(400).json({ message: "ID role invalide" });
    }

    const membre = await Membre.findById(membreId)
      .populate("user_id", "nom prenom pseudo avatar")
      .populate("group_id", "nom")
      .populate("role_id", "type");
    if (!membre) {
      return res.status(404).json({
        message: "Membre introuvable",
        data: null,
      });
    }

    // verifie si l'utilisateur connecte est admin du groupe

    // const adminMembre = await isAdminOfGroup({
    //   group_id: membre.group_id._id,
    //   user_id: adminId._id,
    // });

    // if (!adminMembre) {
    //   return res.status(403).json({
    //     message:
    //       "Seuls les administrateurs du groupe peuvent modifier le role d'un membre.",
    //   });
    // }

    await checkAdminRights(req, membre.group_id);

    // Verification que le role existe
    const role = await Role.findById(role_id).select("_id").populate("type");
    if (!role) {
      return res.status(404).json({
        message: "Le rôle spécifié n'existe pas",
      });
    }
    // metre a jour le role du membre
    membre.role_id = role._id;

    const updatedmembre = await membre.save();

    const io = getIO();
    //emission d'un evenement socket.io
    // if (io) {
    //   io.to(`group_${membre.group_id}.toString()`).emit("membreRoleChanged", {
    //     membreId,
    //     role,
    //   });
    // } else {
    //   console.error("Socket.IO non initialisé");
    //   return res.status(500).json({
    //     message:
    //       "Erreur serveur interne. Socket.IO non disponible pour la diffusion",
    //   });
    // }

    res.status(200).json({
      success: true,
      message: "Rôle du membre mis à jour avec succès",
      data: {
        membre_id: membre._id,
        user_id: membre.user_id,
        group_id: membre.group_id,
        role_id: role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur du serveur lors de la mise à jour du rôle du membre",
      message: error.message,
    });
  }
};

// Supprimer un membre de groupe seulement par un admin
exports.removeMembreFromGroup = async (req, res) => {
  try {
    const { membreId } = req.params;
    //const { user_id, group_id } = req.params;
    const adminId = req.user?._id || req.user?.id; // Id admin connecte

    if (!req.user || !req.user._id || !req.user.id) {
      return res.status(401).json({
        message: "Utilisateur non authentifié",
      });
    }

    // Validation de l'ID
    if (!mongoose.Types.ObjectId.isValid(membreId)) {
      return res.status(400).json({ message: "ID membre invalide." });
    }

    const membre = await Membre.findById(membreId);
    if (!membre) {
      return res
        .status(404)
        .json({ message: "Le membre spécifié n'existe pas" });
    }

    // const adminMembre = await isAdminOfGroup({
    //   group_id: membre.group_id._id,
    //   user_id: adminId,
    // });

    // if (!adminMembre) {
    //   return res.status(403).json({
    //     message:
    //       "Seuls les administrateurs du groupe peuvent supprimer des membres.",
    //   });
    // }

    await checkAdminRights(req, membre.group_id);

    // Supprimer le membre
    await Membre.findByIdAndDelete(membreId);

    const io = getIO();
    // evenement Socket
    // if (io) {
    //   io.to(`group_${membre.group_id}.toString()`).emit("membreDeleted", {
    //     membreId,
    //   });
    // } else {
    //   console.error("Socket.IO non initialisé");
    //   return res.status(500).json({
    //     message:
    //       "Erreur serveur interne. Socket.IO non disponible pour la diffusion",
    //   });
    // }

    res.status(200).json({
      success: true,
      message: "Membre supprimé du groupe avec succès.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur du serveur lors de la suppression du membre",
      message: error.message,
    });
  }
};

// reccuperation d'un membre par son id
exports.getMembreById = async (req, res) => {
  try {
    const { membreId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(membreId)) {
      return res.status(400).json({
        message: "ID membre invalide",
      });
    }

    // Recherche du membre par ID et récupération des details utilisateur et rôle
    const membre = await Membre.findById(membreId)
      .populate("user_id", "nom prenom pseudo avatar")
      .populate("group_id", "nom description")
      .populate("role_id", "type");

    if (!membre) {
      return res.status(404).json({
        message: "Membre introuvable",
      });
    }

    res.status(200).json({
      success: true,
      message: "Voici le membre",
      data: membre,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur du serveur lors de la récupération du membre",
      error: error.message,
    });
  }
};

// reccuperation de tous les membres
exports.getMembre = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const membres = await Membre.find()
      .populate("user_id", "nom pseudo avatar")
      .populate("group_id", "nom description")
      .populate("role_id", "type")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    if (!membres || membres.length === 0) {
      return res.status(404).json({
        message: "Aucun membre recuperer ",
      });
    }

    const count = await Membre.countDocuments();

    const result = membres.map((membre) => ({
      user_id: membre.user_id.nom,
      group_id: membre.group_id.nom,
      role: membre.role_id.type,
    }));

    res.status(200).json({
      success: true,
      message: "Voici tous les membres",
      membres: membres,
      data: result,
      totalPages: Math.ceil(count / limit),
      currentPages: page,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Erreur du serveur lors de la récupération des membres",
      error: error.message,
    });
  }
};

// Récupération des membres par groupe
exports.getMembresByGroup = async (req, res) => {
  try {
    const { groupId } = req.params; //  req.params
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        message: "ID user invalide",
      });
    }

    // Verifier si le groupe existe
    const groupExist = await Group.findById(groupId);
    if (!groupExist) {
      return res.status(404).json({
        message: "Groupe non trouvé",
      });
    }

    // Recherche l'ID du rôle si un filtrage par rôle est demander

    const membres = await Membre.find({ group_id: groupId })
      .populate("user_id", "nom prenom pseudo avatar")
      .populate("role_id", "type")
      .populate("group_id", "nom")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    if (membres.length === 0 || !membres) {
      return res.status(404).json({
        message: "Aucun membre trouvé dans ce groupe",
      });
    }

    // Mapping des resultat
    const result = membres.map((membre) => ({
      user_id: membre.user_id.nom,
      role: membre.role_id.type,
    }));

    const count = await Membre.countDocuments({ groupId });

    res.status(200).json({
      success: true,
      message: "Voici les membres par groupes",
      membres: membres,
      data: result,
      totalPages: Math.ceil(count / limit),
      currentPages: page,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des membres par groupe",
      error: error.message,
    });
  }
};

// Quitter un groupe
exports.leaveGroup = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { groupId } = req.params;

    // verification que le mebre existe
    const membre = await Membre.findOne({ user_id: userId, group_id: groupId });
    if (!membre) {
      return res
        .status(404)
        .json({ message: "Membre introuvable dans le groupe" });
    }

    const adminRole = await Role.findOne({ type: "admin" }).select("_id");
    if (!adminRole) {
      return res.status(404).json({
        message: "role admin non sélectionné",
      });
    }

    const adminMembre = await Membre.findOne({
      group_id: groupId,
      user_id: userId,
      role_id: adminRole,
    });

    if (adminMembre) {
      return res.status(403).json({
        message: "Les administrateurs ne peuvent pas quitter le groupe",
      });
    }
    //supprimer le membre
    const deletedMembre = await Membre.deleteOne({ _id: membre._id });

    if (!deletedMembre) {
      return res.status(404).json({
        message: "Membre non supprimer",
      });
    }

    const io = getIO();
    // Notifier via socket
    // if (io) {
    //   io.to(`group_${group_id}`).emit("membreLeftGroup", {
    //     groupId,
    //     userId,
    //     message: "Un membre a quitté le groupe",
    //   });
    // }

    return res.status(200).json({
      succes: true,
      message: "Vous avez quitter le groupe",
    });
  } catch (error) {
    console.error("Erreur pour quitter le groupe:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur pour quitter le groupe",
      error: error.message,
    });
  }
};
