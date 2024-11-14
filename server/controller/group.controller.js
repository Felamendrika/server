const Group = require("../models/group.model");
const Membre = require("../models/membre.model");
const Role = require("../models/role.model");

// Middleware pour verifier si l'utilisateur est admin
const isAdmin = async (userId, groupId) => {
  const membre = await Membre.findOne({
    user_id: userId,
    group_id: groupId,
  }).populate("role_id");

  return membre && membre.role_id.type === "admin";
};

// creation de groupe et ajouter auto l'user createur
exports.createGroup = async (req, res) => {
  try {
    const { nom, description } = req.body;
    const createur_id = req.user._id; // USER CONNECTER

    // creation du groupe
    const group = new Group({
      nom,
      description,
      createur_id,
      date_creation: new Date(),
    });

    await group.save();

    // attribution de l'user createur comme membre avec role
    const adminRole = await Role.findOne({ type: "admin" });

    await Membre.create({
      user_id: createur_id,
      group_id: group._id,
      role_id: adminRole._id,
      date_join: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Groupe créé et administrateur ajouté",
      data: group,
    });
  } catch (error) {
    res.status(500).json({
      succes: false,
      message: "Erreur lors de la creation du groupe",
      error: error.message,
    });
  }
};

// Modification d'un groupe (seulement par un admin)
exports.updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { nom, description } = req.body;
    const adminId = req.user._id;

    //declaration adminRole
    /*const adminRole = await Role.findOne({ type: "admin" });
    if (!adminRole) {
      return res.status(400).json({
        success: false,
        message: "Role admin introuvable",
      });
    }

    const adminMembre = await Membre.findOne({
      user_id: adminId,
      group_id: groupId,
      role_id: adminRole._id,
    });

    if (!adminMembre) {
      return res.status(403).json({
        success: false,
        error: "Vous n'êtes pas autorisé à modifier ce groupe",
      });
    } */

    if (!(await isAdmin(adminId, groupId))) {
      return res.status(403).json({
        error: "Vous n'etes pas autorisé à modifier ce groupe",
      });
    }
    // await group.save();
    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { nom, description },
      { new: true }
    );

    if (!updatedGroup) {
      return res.status(404).json({
        error: "Groupe introuvable",
      });
    }

    res.status(200).json({
      success: true,
      message: "Groupe mis à jour avec succès.",
      group: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la modification du groupe",
      error: error.message,
    });
  }
};

// Suppression d'un groupe (seulement par un admin)
exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params; // req.params.id
    const adminId = req.user._id; // req.user.id

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

    res.status(200).json({
      succes: true,
      message: "Groupe supprimé avec succès.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du groupe.",
      error: error.message,
    });
  }
};

// reccuperation de tous les groupes
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find();
    res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des groupes",
      error,
    });
  }
};

// reccuperation de groupes par ID
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate(
      "createur_id",
      "nom"
    );

    if (!group) {
      return res.status(404).json({
        message: "Groupe introuvable",
      });
    }

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du groupe",
      error: error.message,
    });
  }
};

//recuperer tout les membres d'un groupe
exports.getGroupMembres = async (req, res) => {
  try {
    const { groupId } = req.params;
    const membres = await Membre.find({ group_id: groupId })
      .populate("user_id", "nom")
      .populate("role_id", "type");

    if (!membres) {
      return res.status(404).json({
        error: "Membres introuvable",
      });
    }
    res.status(200).json({
      success: true,
      data: membres,
      membres: membres.map((m) => m.user_id),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des membres du groupe",
      error: error.message,
    });
  }
};

// recuperer les groupes d'un utilisateur
exports.getUsersGroups = async (req, res) => {
  try {
    const { userId } = req.params;
    const groups = await Membre.find({ user_id: userId }).populate("group_id");

    if (!groups) {
      return res.status(404).json({
        success: false,
        message: "Groupe(s) introuvable",
      });
    }

    res.status(200).json({
      success: true,
      groups: groups.map((g) => g.group_id),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des groupes de l'utilisateur",
      error: error.message,
    });
  }
};

// recherche de groupe
exports.searchGroup = async (req, res) => {
  const { query, page = 1, limit = 10, userId } = req.query; // parametre de recherche
  const skip = (page - 1) * limit; // nombre de resultat a ignorer pour la page actuelle

  const filters = {};
  if (userId) filters.createur_id = userId; // Filtre par utilisateur createur de groupe

  try {
    const groups = await Group.find({
      $text: { $search: query }, // Recherche full-text sur le nom et la description
      ...filters, // Applique le filtres
    })
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    const totalGroups = await Group.countDocuments({
      $text: { $search: query },
      ...filters,
    });

    res.json({
      total: totalGroups,
      page,
      totalPages: Math.ceil(totalGroups / limit),
      groups,
    });
  } catch (error) {
    res.status(500).json({
      succes: false,
      message: "Erreur serveur lors de la recherche de groupes",
      error: error.message,
    });
  }
};

/*
// creer un groupe
exports.createGroup = async (req, res) => {
  try {
    const { nom, description, createur_id } = req.body;

    const newGroup = new Group({
      nom,
      description,
      date_creation: Date.now(),
      createur_id,
    });
    await newGroup.save();

    // Reccuperer le role admin
    const adminRole = await Role.findOne({ type: "admin" });

    if (!adminRole) {
      return res.status(400).json({
        message: "Role admin introuvable",
      });
    }

    // ajout du createur comme membre avec role admin
    const newMember = new Member({
      user_id: createur_id,
      group_id: newGroup._id,
      role_id: adminRole._id,
    });
    await newMember.save();

    res.status(201).json(newGroup);
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la creation de l'utilisateur",
      error,
    });
  }
};


// Mise a jour du groupe
exports.updateGroup = async (req, res) => {
  try {
    const updateGroup = await Group.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updateGroup) {
      return res.status(404).json({
        message: "Groupe introuvable",
      });
    }

    res.status(200).json(updateGroup);
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la mise à jour du groupe",
      error,
    });
  }
};

// Suppression d'un groupe
exports.deleteGroup = async (req, res) => {
  try {
    const deleteGroup = await group.findByIdAndDelete(req.params.id);

    if (!deleteGroup) {
      return res.status(404).json({
        message: "Groupe introuvable",
      });
    }

    res.status(200).json({ message: "Groupe supprimé" });
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la suppression du groupe",
      error,
    });
  }
};


 Ajouter un membre a un groupe
exports.addMembre = async (req, res) => {
  const { user_id, group_id, role_id } = req.body;
  try {
    const newMembre = newMembre({
      date_join: Date.now(),
      user_id,
      group_id,
      role_id,
    });

    await newMembre.save();
    res.status(201).json(newMembre);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de l'ajout du membre",
      error: error.message,
    });
  }
};

 Supprimer un membre d'un groupe
exports.removeMembre = async (req, res) => {
  try {
    const deletedMembre = await Membre.findByIdAndDelete(req.params.membreId);
    if (!deletedMembre)
      return res.status(404).json({ message: "Membre non trouvé" });
    res.status(200).json({
      message: "Membre supprimé avec succès",
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la suppression du membre",
      error: error.message,
    });
  }
};
*/
