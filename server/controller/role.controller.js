const Role = require("../models/role.model");

exports.createRole = async (req, res) => {
  try {
    const { type } = req.body;

    // verification du role existant
    const existingRole = await Role.findOne({ type });

    if (existingRole) {
      return res.status(400).json({
        message: "Role deja existant",
      });
    }

    const newRole = new Role({ type });

    await newRole.save();
    res.status(201).json({
      success: true,
      message: "Role cree avec succes",
      newRole,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Erreur lors de la creation du role",
      error,
    });
  }
};

// Récupération de tous les rôles
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Erreur lors de la récupération des rôles",
      error,
    });
  }
};

// Récupération d'un rôle par ID
exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ message: "Rôle non trouvé" });
    }

    res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Erreur lors de la récupération du rôle",
      error,
    });
  }
};
// Mise à jour d'un rôle
exports.updateRole = async (req, res) => {
  try {
    const updatedRole = await Role.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updatedRole) {
      return res.status(404).json({ message: "Rôle non trouvé" });
    }
    res.status(200).json(updatedRole);
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la mise à jour du rôle",
      error,
    });
  }
};

// Suppression d'un rôle
exports.deleteRole = async (req, res) => {
  try {
    const deletedRole = await Role.findByIdAndDelete(req.params.id);

    if (!deletedRole) {
      return res.status(404).json({
        success: false,
        message: "Rôle non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      message: "Role supprimé",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Erreur lors de la suppression du rôle",
      error,
    });
  }
};
