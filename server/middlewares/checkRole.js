const Membre = require("../models/membre.model");
const Role = require("../models/role.model");

// verifier si l'utilisateur est admin du groupe
exports.checkIfAdmin = async (req, res, next) => {
  try {
    const { groupId } = req.params; // ID du groupe dans les paramètres de la route
    const userId = req.userId; // ID de l'utilisateur authentifier

    // trouver le membre dans le groupe
    const membre = await Membre.findOne({
      group_id: groupId,
      user_id: userId,
    }).populate("role_id", "type");

    if (!membre) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non membre de ce groupe",
      });
    }

    // verifie si le role de ce membre est admin
    if (membre.role_id.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Vous devez etre admin pour effectuer cette action",
      });
    }

    // Si tut est OK
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Une erreur interne du serveur est survenue",
      error: error.message,
    });
  }
};
