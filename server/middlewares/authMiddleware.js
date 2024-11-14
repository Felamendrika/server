const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
//const { JWT_SECRET_KEY} = process.env;

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    if (!token) {
      return (
        res.status(401),
        json({
          message: "Accès non autorisé. Token requis.",
        })
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "Utilisateur introuvable",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Acces non autorise",
      error: error.message,
    });
  }
};

modules.exports = authMiddleware;
