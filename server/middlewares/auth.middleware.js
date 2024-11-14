// middleware pour verifier la validite du token JWT

const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split("")[1];

  if (!token) {
    return res.status(401).json({
      message: "Acces refuser : Token manquant",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // Ajoute l'ID utilisateur au `req` pour utilisation ultérieure

    next();
  } catch (error) {
    res.status(500).json({
      message: "Token invalide",
      error: error.message,
    });
  }
};

module.exports = authMiddleware;
