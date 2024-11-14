const Membre = require("../models/membre.model");
const Group = require("../models/group.model");
const Role = require("../models/role.model");
const User = require("../models/user.model");

// Ajouter un membre a un groupe avec le role membre par defaut
exports.addMembre = async (req, res) => {
  try {
    const { group_id, user_id } = req.body;
    const adminId = req.user._id; // Id de l'admin connecte

    // verifie si l'utilisateur connecte est admin
    const adminRole = await Group.findOne({ type: "admin" });
    const adminMembre = await Membre.findOne({
      group_id,
      user_id: adminId,
      role_id: adminRole._id,
    });

    if (!adminMembre) {
      return res.status(403).json({
        message:
          "Seuls les administrateurs du groupe peuvent ajouter des membres.",
      });
    }

    // Verifie si l'utilisateur est deja membre du groupe
    const existingMembre = await Membre.findOne({
      group_id,
      user_id,
    });
    if (existingMembre) {
      return res.status(400).json({
        message: "Cet utilisateur est déjà membre du groupe.",
      });
    }

    // Attribuer le role (admin ou membre) en fonction du role_type. par defaut 'membre
    const membreRole = await Role.findOne({ type: "membre" });

    // Creer le membre
    const newMembre = await Membre.create({
      group_id,
      user_id,
      role_id: membreRole._id,
      date_join: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Membre ajouté au groupe avec succes",
      membre: newMembre,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout du membre au groupe",
      error: error.message,
    });
  }
};

// Modifier le role d'un membre (uniquement par un admin)
exports.updateMembreRole = async (req, res) => {
  try {
    const { role_id } = req.body;
    const adminId = req.user._id; // ID de l'admin connecte
    const { id } = req.params;

    const membre = await Membre.findById(id).populate("group_id", "nom");
    if (!membre) {
      return res.status(404).json({
        message: "Membre introuvable",
      });
    }

    // verifie si l'utilisateur connecte est admin du groupe
    const adminRole = await Role.findOne({ type: "admin" });

    const adminMembre = await Membre.findOne({
      group_id: membre.group_id._id,
      user_id: adminId,
      role_id: adminRole._id,
    });

    if (!adminMembre) {
      return res.status(403).json({
        message:
          "Seuls les administrateurs du groupe peuvent modifier le role d'un membre.",
      });
    }

    // metre a jour le role du membre
    membre.role_id = role_id;

    await membre.save();
    res.status(200).json({
      success: true,
      message: "Rôle du membre mis à jour avec succès",
      membre,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du rôle du membre",
      error: error.message,
    });
  }
};

// Supprimer un membre de groupe seulement par un admin
exports.removeMembreFromGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id; // Id admin connecte

    const membre = await Membre.findById(id).populate("group_id", "nom");
    if (!membre) {
      return res.status(404).json({ message: "Membre non trouvé." });
    }

    // Verifie si l'utilisateur connecte est admin du groupe
    const adminRole = await Role.findOne({ type: "admin" });
    const adminMembre = await Membre.findOne({
      group_id: membre.group_id._id,
      user_id: adminId,
      role_id: adminRole._id,
    });

    if (!adminMembre) {
      return res.status(403).json({
        message:
          "Seuls les administrateurs du groupe peuvent supprimer des membres.",
      });
    }

    // Supprimer le membre
    await Membre.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Membre supprimé du groupe avec succès.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du membre",
      error: error.message,
    });
  }
};

// reccuperation d'un membre par son id
exports.getMembreById = async (req, res) => {
  try {
    const { membreId } = req.params;

    // Recherche du membre par ID et récupération des détails utilisateur et rôle
    const membre = await Membre.findById(membreId)
      .populate("user_id", "nom")
      .populate("group_id", "nom")
      .populate("role_id", "type");

    if (!membre) {
      return res.status(404).json({
        message: "Membre introuvable",
      });
    }

    res.status(200).json({
      success: true,
      data: membre,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du membre",
      error: error.message,
    });
  }
};

// Creation d'un membre
exports.createMembre = async (req, res) => {
  try {
    const { user_id, role_id, group_id } = req.body;
    const newMembre = new Membre({
      date_join: Date.now(),
      user_id,
      role_id,
      group_id,
    });

    await newMembre.save();
    res.status(201).json(newMembre);
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la creation du membre",
      error,
    });
  }
};

// reccuperation de tous les membres
exports.getMembre = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const membres = await Membre.find()
      .populate("user_id", "nom")
      .populate("group_id", "nom")
      .populate("role_id", "type")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Membre.countDocuments();

    res.status(200).json({
      success: true,
      membres: membres,
      totalPages: Math.ceil(count / limit),
      currentPages: page,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Erreur lors de la récupération des membres",
      error: error.message,
    });
  }
};

// Récupération des membres par groupe
exports.getMembresByGroup = async (req, res) => {
  try {
    const { group_id } = req.params; //  req.params
    const { page = 1, limit = 10, role_type } = req.query;

    // Recherche l'ID du rôle si un filtrage par rôle est demandé
    let roleFilter = {};
    if (role_type) {
      const role = await Role.findOne({ type: role_type });
      if (!role) {
        return res.status(400).json({ message: "Type de rôle invalide." });
      }
      roleFilter = { role_id: role._id };
    }

    const membres = await Membre.find({ group_id })
      .populate("user_id", "nom ")
      .populate("role_id", "type")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    if (membres.length === 0) {
      return res.status(404).json({
        message: "Aucun membre trouvé dans ce groupe",
      });
    }

    const count = await Membre.countDocuments({ group_id, ...roleFilter });

    res.status(200).json({
      success: true,
      membres: membres,
      totalPages: Math.ceil(count / limit),
      currentPages: page,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des membres du groupe",
      error: error.message,
    });
  }
};

// Récupérer un membre par ID
exports.getMembreById = async (req, res) => {
  try {
    const membre = await Membre.findById(req.params.id)
      .populate("user_id", "nom prenom")
      .populate("role_id", "type");
    if (!membre) {
      return res.status(404).json({
        message: "Membre non trouvé.",
      });
    }
    res.status(200).json({ membre });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération du membre.",
      error: error.message,
    });
  }
};

// Modification d'un membre

// Suppression d'un membre

/* 

// supression de mebre si l;utilisateur est admin
exports.deleteMembre = async (req, res) => {
  try {
    const { membre_id, user_id } = req.body;

    // verification du role
    const membreRequesting = await Membre.findOne({
      user_id,
      group_id: req.params.groupId,
    }).populate("role_id");

    if (!membreRequesting || membreRequesting.role_id.type !== "admin") {
      return res.status(403).json({
        message: "Vous n'avez pas les droits pour supprimer ce membre",
      });
    }

    // Supprimer le membre
    const deleteMembre = await Membre.findBuIdAndDelete(membre_id);

    if (!deleteMembre) {
      return res.status(404).json({ message: "Membre introuvable" });
    }

    res.status(200).json({ message: "Membre supprimé" });
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la suppression du membre",
      error,
    });
  }
};


// Recuperer un membre par Id
exports.getMembreById = async (req, res) => {
  try {
    const membre = await Membre.findById(req.params.id)
      .populate("user_id role_id")
      .populate("group_id");
    if (!membre) {
      return res.status(404).json({
        message: "Membre introuvable",
      });
    }

    res.status(200).json({ membre });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la recuperation du membre",
      error: error.message,
    });
  }
};

// Modification du role d'un membre
exports.updateMembreRole = async (req, res) => {
  try {
    const { membreId } = req.params;
    const { roleId } = req.body;
    const userId = req.user._id;

    // Verifie si l'utilisateur set admin
    const membre = await Membre.findOne({
      user_id: userId,
      group_id: req.body.group_id,
    });

    const adminRole = await Role.findOne({ type: "admin" });

    if (!membre || membre.role_id.toString() !== adminRole._id.toString()) {
      return res.status(403).json({
        error: "Vous n'êtes pas autorisé à modifier ce membre",
      });
    }

    // Modifier le rôle du membre
    const updatedMembre = await Membre.findByIdAndUpdate(
      membreId,
      { role_id: roleId },
      { new: true }
    );
    res.status(200).json(updatedMembre);
  } catch (error) {}
};

// Suppression d'un membre (seul un admin peut supprimer)
exports.deleteMembre = async (req, res) => {
  try {
    const { membreId } = req.params;
    const userId = req.user._id;

    const membre = await Membre.findOne({
      user_id: userId,
      group_id: req.body.group_id,
    });

    const adminRole = await Role.findOne({ type: "admin" });

    if (!membre || membre.role_id.toString() !== adminRole._id.toString()) {
      return res.status(403).json({
        error: "Vous n'êtes pas autorisé à supprimer ce membre",
      });
    }

    await Membre.findByIdAndDelete(membreId);
    res.status(200).json({ message: "Membre supprimé" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression du membre" });
  }
};


*/
