// Utilitaire pour generer et verfier le JWT
const jwt = require("jsonwebtoken");

// FOnction pour generer le JWT pour un utilisateur
// prend un user et creer un token avec l'ID en charge utils, utilise JWT_SECRET pour signer le jeton
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id }, // payload : l'id
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "30d" }
  );
};

// Middleware pour verifier un token JWT
// Verifie le token en utilisant la cle , retourne null si le token invalide
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = { generateToken, verifyToken };
