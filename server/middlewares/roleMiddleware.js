// Certification si un utilisateur a un role specifique avant d'effectuer une action

const Role = require("../models/role.model");
const Membre = require("../models/membre.model");

// Middleware pour vérifier le rôle d'un utilisateur
const checkRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      // verifier si user authentifier
      const userId = req.user.Id; // ID de l'user authentifier

      // trouver le membre dans le groupe avec son role
      const membre = await Membre.findOne({ user_id: userId }).populate(
        "role_id"
      );

      if (!membre) {
        return res.status(403).json({
          succes: false,
          message: "Accès refusé. Membre non trouvé.",
        });
      }

      // Verifier si le role de l'utilisateur correspond a celui requis pour l'action
      if (membre.role_id.type !== requiredRole) {
        return res.status(403).json({
          success: false,
          message: `Accès refusé. Rôle ${requiredRole} requis.`,
        });
      }

      next(); // on passe a la suite si l'utilisateur a le bon role
    } catch (error) {
      res.status(500).json({
        succes: false,
        message: "Erreur interne du serveur",
        error,
      });
    }
  };
};

module.exports = { checkRole };
