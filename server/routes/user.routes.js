const express = require("express");
const router = express.Router();
const userController = require("../controller/user.controller");
const authMiddleware = require("../middlewares/authMiddleware");

const avatarMiddleware = require("../middlewares/avatarMiddleware");

router.get("/userId", authMiddleware, userController.getUserById);

router.get("/", authMiddleware, userController.getUsers);
router.get("/profile", authMiddleware, userController.getUserProfile);
router.put(
  "/update",
  authMiddleware,
  avatarMiddleware,
  userController.updateUser
);
router.delete("/delete", authMiddleware, userController.deleteUser);

router.get("/searchUser", authMiddleware, userController.searchUser);

// Route pour l'inscription
router.post("/signup", avatarMiddleware, userController.signup);

// Route pour la connexion
router.post("/login", userController.login);

// route pour le renouvellement du token
router.post("/refresh-token", authMiddleware, userController.refreshToken);

// route pour recup les users avec leur dernier message
router.get(
  "/user-lastMessage",
  authMiddleware,
  userController.getUsersWithLastMessage
);

module.exports = router;
