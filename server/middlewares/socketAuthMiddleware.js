const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Token d'authentification manquant"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new Error("Utilisateur non trouvé"));
    }

    // Attacher l'utilisateur au socket
    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Authentification invalide"));
  }
};

module.exports = socketAuthMiddleware;
