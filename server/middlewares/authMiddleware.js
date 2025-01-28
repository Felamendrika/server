const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const authMiddleware = async (req, res, next) => {
  try {
    //verification de l'en-tete
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Erreur: Token manquant ou malformé");
      return res.status(401).json({
        message: "Accès non autorisé. Token manquant ou mal formé",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        console.error("Erreur: Token expirer", error.message);
        return res.status(401).json({
          message: "Token expiré. Veuillez vous reconnecter.",
        });
      }
      console.log("Erreur : Token invalide.");
      return res.status(401).json({
        message: "Token invalide. Acces non autorisé",
      });
    }

    // console.log("Decoded Token:", decoded);

    // recherche de l'utilisateur associé au token
    const user = await User.findById(decoded.id);

    if (!user) {
      console.error("Erreur : Utilisateur introuvable.");
      return res.status(401).json({
        message: "Utilisateur introuvable. Accès non autorisé",
      });
    }

    // verifie si le token expire bientot
    const now = Math.floor(Date.now() / 1000); //timestamp actuel en seconde
    const timeRemaining = decoded.exp - now;

    if (timeRemaining < 600) {
      res.setHeader("x-token-expiry", "soon");
    }

    // ajout des informations utilisateur a la requete
    req.user = user;

    next();
  } catch (error) {
    console.error("Erreur dans authMiddleware :", error.message);
    res.status(500).json({
      message: "Erreur serveur lors de l'authentification. Acces non autorise",
      error: error.message,
    });
  }
};

module.exports = authMiddleware;
